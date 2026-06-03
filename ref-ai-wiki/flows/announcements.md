# Flow: Posting an Announcement

## Purpose

Document the complete lifecycle of posting an announcement, including optimistic UI updates, offline queuing, realtime propagation, soft-delete, and moderation (manager/godlike blocking).

---

## Trigger

User taps the "post" button in `/announcements` page after typing a message.

---

## Happy Path (Online, Connected)

```
User at /announcements page, typed message
                    │
                    ▼
        User taps "Post" button
                    │
                    ▼
   AnnouncementsPage form → useAnnouncements().post(
     userId: 'alice-uuid',
     content: 'Metalheads, meet at the Faster stage! 🤘'
   )
                    │
                    ▼
   ┌──────────────────────────────────────┐
   │ Inside announcementsRepository.post()│
   └──────────────────────────────────────┘
                    │
        ┌───────────┴──────────────┐
        ▼                          ▼
   Create draft ID         Navigator.onLine?
   (crypto.randomUUID)        true ✓
        │                         │
        ▼                         ▼
   const draft = {           await supabase
     id: 'draft-123',          .from('announcements')
     author_id: 'alice',       .insert({
     content: '...',             author_id: 'alice',
     created_at: now,            content: '...'
     deleted_at: null          })
   }                          .select()
        │                     .single()
        ▼                         │
   await saveAnnouncement(      ▼
     draft               No error ✓
   )                   [INSERT returns
        │              generated ID & timestamp]
        │  [IndexedDB write]      │
        │  succeeds               ▼
        │                  const data = {
        ├─ User sees         id: 'real-uuid',
        │  draft in UI       author_id: 'alice',
        │  immediately       content: '...',
        │  (< 50ms)          created_at: server-time,
        │                    deleted_at: null
        ▼                    }
   return success              │
                              ▼
                     await removeAnnouncementFromCache(
                       draft.id
                     )
                              │
                        [Delete draft from IDB]
                              │
                              ▼
                     await saveAnnouncement(data)
                              │
                        [Save real record]
                              │
                              ▼
                   ┌──────────────────────┐
                   │ Return success       │
                   │ UI removes draft     │
                   │ Shows real post      │
                   │ (~100ms)             │
                   └──────────────────────┘
                              │
                              ▼
   Meanwhile (async, user doesn't wait):
                    │
        ┌───────────┴──────────────┐
        ▼                          ▼
   Supabase Realtime    Other users' subscriptions
   broadcasts INSERT    on announcements table
   event to all         detect change
   connected clients    │
        │               ▼
        │           announcementsRepository.sync()
        │           fires from useAnnouncements hook
        │                │
        │                ▼
        │           await supabase
        │             .from('announcements')
        │             .select('*')
        │             .order('created_at', asc: false)
        │                │
        │                ▼
        │           [Get all non-deleted announcements]
        │                │
        │                ▼
        │           await saveAnnouncements(data)
        │                │
        │        [IndexedDB bulk insert]
        │                │
        │                ▼
        │           emitAnnouncementsChanged()
        │                │
        │                └─ All AnnouncementsPage instances
        │                   re-render with new post
        │                   (visible within 3s)
        │
        └─ [Realtime latency: ~1-3s]
```

**Timeline**:
- T=0ms: User taps post button
- T=20ms: Draft saved to IndexedDB, UI shows draft (with pending visual indicator)
- T=50ms: Supabase insert sent
- T=100ms: Server responds with generated ID & timestamp
- T=120ms: Draft removed from IDB, replaced with real post
- T=150ms: UI re-renders with real post (no visual change, but now persistent on server)
- T=3000ms: Realtime event reaches other users
- T=3100ms: Other users' UIs update

---

## Offline Behavior (Disconnected)

```
User at /announcements, offline (no signal)
                    │
                    ▼
   User types message & taps "Post"
                    │
                    ▼
   announcementsRepository.post(
     userId: 'alice',
     content: '...'
   )
                    │
        ┌───────────┴──────────────┐
        ▼                          ▼
   Create draft:          Navigator.onLine?
   id = uuid()             false ✗
   author_id = 'alice'        │
   content = '...'            ▼
   created_at = now      Skip Supabase
   deleted_at = null     call entirely
        │                    │
        ▼                    ▼
   await saveAnnouncement  await enqueueOfflineAnnouncement(
     (draft)               draft
   )                        )
        │                    │
        ├─ [IDB write]      [Add to pending_announcements store]
        │  succeeds          │
        │                    ▼
        ├─ User sees draft   return success
        │  in UI with
        │  "pending" badge
        │  (syncing 🔄)
        │
        ▼
   [User continues offline,
    browsing other posts
    from cache]


   === Later: User reconnects (network available) ===
                    │
        Navigator.onLine: true
                    │
        ▼
   App detects reconnect
   (via window 'online' event)
                    │
        ▼
   syncEngine calls
   flushOfflineQueue()
                    │
        ▼
   announcementsRepository
   .flushPending()
                    │
        ┌────────────────────────┐
        ▼                        ▼
   Load all pending      for each item:
   announcements from      │
   pending_announcements   ▼
   store                 await supabase
        │                  .from('announcements')
        │                  .insert({
        │                    author_id: item.author_id,
        │                    content: item.content
        │                  })
        │                  .select()
        │                  .single()
        │                   │
        │                   ▼
        │                 Success?
        │                   │
        │         ┌─────────┴──────────┐
        │         ▼ YES               ▼ NO
        │   Remove from queue   Skip (maybe
        │   [IDB delete]        retry later)
        │        │
        │        ▼
        │   Remove draft from
        │   announcements store
        │        │
        │        ▼
        │   Save real post
        │   (with server ID
        │    & timestamp)
        │
        ▼
   All pending flushed
        │
        ▼
   Sync event fires
   to show count
```

**Key Guarantee**: Every offline post is either:
1. Successfully flushed to Supabase on reconnect, OR
2. Remains in `pending_announcements` queue for retry

Never silently dropped.

---

## Sync Behavior (Reconnect)

**Flush mechanics:**

1. **Load queue**: `loadOfflineAnnouncementsQueue()` → fetch all from `pending_announcements`
2. **For each item**:
   - Insert to Supabase (RLS checks `auth.uid() = author_id`)
   - If success: remove draft from `announcements` store, save real post, remove from queue
   - If failure: leave in queue for next reconnect attempt
3. **Realtime subscriptions**: Once inserted, Realtime event broadcasts to all users
4. **Deduplication**: Queue uses announcement `id` (uuid) as key; cannot naturally create duplicates since each offline post gets a unique client-generated ID before insert

**Deduplication Worked Example**:

User offline, posts 3 times, sees 3 drafts in UI. Reconnects:

```
T=0s: User types msg 1, taps post
  → draft A created (id: draft-a), enqueued
  → UI shows draft A (pending)
  
T=10s: User types msg 2, taps post
  → draft B created (id: draft-b), enqueued
  → UI shows draft A + draft B (both pending)

T=30s: User types msg 3, taps post
  → draft C created (id: draft-c), enqueued
  → UI shows draft A + B + C (all pending)

T=60s: Network reconnects
  → flushPending() loads [draft A, draft B, draft C]
  → Sends 3 separate INSERT calls to Supabase
  → Server returns 3 real post IDs:
       draft A → real-uuid-1 (created_at: server-time-1)
       draft B → real-uuid-2 (created_at: server-time-2)
       draft C → real-uuid-3 (created_at: server-time-3)
  → Each real post replaces its draft in IDB
  → All 3 removed from pending_announcements queue
  → UI updates: shows 3 real posts (in order of created_at)
```

---

## Realtime Updates (Other Users)

When a user posts online:

```
Alice posts "See you at the Faster stage!" online
                    │
                    ▼
        ┌───────────────────────────────────────┐
        │ Supabase Realtime broadcasts INSERT   │
        │ event to all subscriptions on         │
        │ "announcements" table                 │
        └───────────────────────────────────────┘
                    │
        ┌───────────┴──────────────┐
        ▼                          ▼
   Alice's client              Bob's client
   (already has newest)        (subscribed via
                               useAnnouncements)
        │                         │
        ▼                         ▼
   Realtime event              event payload:
   (own post)                  {
   [suppress or ignore]          "type": "INSERT",
                                 "new": {
                                   id: 'real-uuid',
                                   author_id: 'alice-id',
                                   content: '...',
                                   created_at: now,
                                   deleted_at: null
                                 }
                                }
                                │
                                ▼
                        announcementsRepository.sync()
                        fires
                                │
                                ▼
                        fetch all announcements
                        (select * where deleted_at IS NULL)
                                │
                                ▼
                        saveAnnouncements(data)
                        [IndexedDB bulk upsert]
                                │
                                ▼
                        emitAnnouncementsChanged()
                                │
                                ▼
                        Bob's AnnouncementsPage
                        re-renders with
                        Alice's post visible
                        (within 3s)
```

**Soft-Delete Timing**:

When a manager or godlike user deletes an announcement:

```
Manager opens profile admin panel
                    │
                    ▼
   Calls blockUser(userId) or
   deleteAnnouncement(id)
                    │
        ┌───────────┴──────────────┐
        ▼                          ▼
   Online?                  Offline?
   true ✓                    false ✗
        │                         │
        ▼                         ▼
   await supabase        Remove from local
   .from('announcements') announcements cache
   .update({             [IDB delete]
     deleted_at: now     │
   })                    ▼
   .eq('id', id)         (No Supabase call)
        │                (Can't enforce delete
        │                 without network)
        ▼                    │
   Success?               ▼
        │              return
        ▼
   Remove from
   announcements cache
   [IDB delete]
        │
        ▼
   emitAnnouncementsChanged()
        │
        ▼
   All clients (realtime): see post gone
   (RLS filters out deleted_at IS NOT NULL)
```

**RLS Enforcement**:

```
SELECT on announcements:
  WHERE deleted_at IS NULL
  
  → All users see only non-deleted posts
  → Soft-deleted posts hidden automatically

UPDATE announcements (set deleted_at):
  WHERE (
    auth.uid() = author_id  -- Author can soft-delete own
    OR
    role IN ('manager', 'godlike')  -- Mods can delete any
  )
  
  → Only author + managers/godlike can delete
  → Normal user cannot delete others' posts
  → RLS prevents client bypass
```

---

## Edge Cases

### 1. **Post While Offline, Delete While Offline**

```
T=0s: User posts draft A while offline
  → [saved to pending_announcements]

T=10s: User taps delete on draft A (before flushed)
  → deleteAnnouncement(draft-a.id)
  → [removed from announcements store]
  → [removed from pending_announcements store]
  
T=30s: Network reconnects
  → flushPending() loads queue
  → Queue is now empty (draft was deleted)
  → No action taken
  
Result: Post never sent to Supabase. ✓
```

### 2. **Realtime Delete Race: Delete Before Other User Receives INSERT**

```
Alice posts online
Server sends Realtime INSERT event to all

Race condition:
  [Event A] INSERT received by Bob in 1.5s
  [Event B] Manager deletes post in 1s
           Realtime DELETE event sent
           
  Case 1: Bob receives DELETE before INSERT
    → Realtime event updates IDB (deleted_at set)
    → sync() fetches (WHERE deleted_at IS NULL)
    → Bob never sees the post ✓
  
  Case 2: Bob receives INSERT before DELETE  
    → Realtime event updates IDB
    → sync() fetches (includes post, no deleted_at yet)
    → Bob's UI shows post
    → Manager's DELETE event arrives
    → sync() refetches
    → Post has deleted_at now
    → Bob's UI removes post (~3s after delete)
    → Acceptable (brief visibility, then gone) ✓
```

### 3. **Blocked Poster Attempts to Post**

```
User is in blocked_posters table
                    │
                    ▼
   User attempts: announcementsRepository.post()
                    │
        ┌───────────┴──────────────┐
        ▼                          ▼
   Online?                    Offline?
   true ✓                     false ✗
        │                         │
        ▼                         ▼
   Supabase INSERT        Save to pending_announcements
   RLS policy:             (no check; app logic layer)
   auth.uid() = author_id  │
   + NO check for          ▼
     blocked status        [Will fail on reconnect
   (app-layer check        when Supabase
    missing!)              validates]
   
   Result: BUG
   (Blocked users CAN post if online,
    manager enforcement is not backend)
   
   Workaround: Manager manually deletes
   posts via soft-delete (fast, visible).
   
   Future: Add RLS check for blocked_posters.
```

### 4. **Network Unstable: Multiple Offline/Online Cycles**

```
User offline, posts draft A, gets enqueued
Network back: flushPending() partial success (draft A sent, B still queued)
Network down: User posts draft B while offline, enqueued
Network back: flushPending() sends B, removes both from queue

Timeline:
T=0s:  offline, post A → pending_announcements: [A]
T=10s: online, flush A → Supabase OK, removed from queue
       pending_announcements: []
T=15s: offline, post B → pending_announcements: [B]
T=30s: online, flush B → Supabase OK, removed from queue
       pending_announcements: []

Result: Both posts sent. ✓
```

### 5. **Flaky Supabase: Insertion Fails, Retry**

```
User reconnects, flushPending() called
                    │
                    ▼
   Load [draft A, draft B] from queue
                    │
        ┌───────────┴────────────────┐
        ▼                            ▼
   Insert A:                    Insert B:
   timeout/error                success
   (Supabase down)              │
        │                       ▼
        ▼                  Remove B from queue
   [No removal              [IDB delete]
    from queue]             │
                            ▼
   Result:              pending_announcements: [A]
   pending_announcements:
   [A, B]
        │
        ▼
   User offline again
   User back online later
        │
        ▼
   flushPending() tries again
        │
        ▼
   Both A & B re-attempted
        │
        ▼
   Both succeed (Supabase recovered)
   [Removed from queue]
```

**No deduplication issue**: Each flush attempt uses same IDs, but Supabase generates new server IDs. If somehow reinserted, causes duplicate posts. Solution: RLS should enforce unique constraint or app should track (id, author_id) with UNIQUE constraint.

---

## Moderation (Manager/Godlike Powers)

### Block a User

```
Godlike user opens Profile admin panel
                    │
                    ▼
   Views "Blocked Posters" section
                    │
                    ▼
   Selects user to block (e.g., "Bob")
                    │
                    ▼
   Calls: usersRepository.blockUser(
     userId: 'bob-uuid',
     blockedBy: 'godlike-uuid'
   )
                    │
                    ▼
   await supabase
   .from('blocked_posters')
   .upsert({
     user_id: 'bob-uuid',
     blocked_by: 'godlike-uuid'
   })
                    │
                    ▼
   [Inserted into blocked_posters table]
                    │
                    ▼
   [No Realtime event on blocked_posters
    (not configured); app doesn't auto-hide]
```

**Current Behavior**: Blocking is registered in DB, but app doesn't hide posts. Manager must manually soft-delete posts.

### Soft-Delete (Hide) a Post

```
Godlike views /announcements
                    │
                    ▼
   Sees "Vulgar post from Bob"
                    │
                    ▼
   Clicks delete icon next to post
                    │
                    ▼
   announcementsRepository.delete(id)
                    │
        ┌───────────┴──────────────┐
        ▼                          ▼
   Online?                    Offline?
   true ✓                     false ✗
        │                         │
        ▼                         ▼
   await supabase            Remove from IDB
   .from('announcements')    announcements store
   .update({                 (local only)
     deleted_at: now()
   })
   .eq('id', id)
        │
        ▼
   Success?
        │
        ▼
   Remove from local
   announcements store
   [IDB delete]
        │
        ▼
   emitAnnouncementsChanged()
        │
        ▼
   All connected clients see
   post disappear from
   /announcements within 3s
   (via Realtime + sync)
```

---

## Summary

**Guarantees:**

1. ✅ **No lost posts**: Offline posts queued, flushed on reconnect
2. ✅ **Soft-delete hidden**: RLS enforces `deleted_at IS NULL` filter
3. ✅ **Realtime propagation**: ~3s latency to other users
4. ✅ **Moderation**: Manager/godlike can delete any post; author can delete own
5. ✅ **Offline browsing**: All announcements cached on first load

**Known Issues:**

1. ⚠️ **Blocked poster bypass**: Blocked users can still post online (RLS missing check)
2. ⚠️ **No dedup on retry**: Flaky network could theoretically create duplicate posts if `flushPending` retries same draft twice (needs unique constraint at DB level)

**Future Improvements:**

- Add `blocked_posters` RLS check to `announcements` INSERT
- Add UNIQUE constraint `(id, author_id)` to prevent double-inserts
- Emit Realtime event on `blocked_posters` changes
- Add "blocked status" indicator in Profile admin panel

---

## Relevant Source Files

| File | Role |
|------|------|
| `src/hooks/useAnnouncements.ts` | IDB read, Realtime subscription, pagination, moderation state, mural actions |
| `src/pages/AnnouncementsPage.tsx` | Layout, post form, feed rendering (consumes hook) |
| `src/services/announcementsDisplay.ts` | `applyPinSort`, `relativeTime` pure helpers |
| `src/repositories/announcements.ts` | Post, sync, delete, pin/unpin, flush pending |
| `src/repositories/users.ts` | Role map, block list, `blockUser()` |
| `src/lib/realtimeSync.ts` | `subscribePostgresChanges()` helper (26.H) |
| `src/lib/db.ts` | `announcements` + `pending_announcements` stores, `ANNOUNCEMENTS_CHANGED_EVENT` |
| `src/components/sync/AnnouncementSync.tsx` | App-level pending flush on reconnect |
