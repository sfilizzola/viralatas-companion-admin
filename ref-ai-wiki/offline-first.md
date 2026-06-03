# Offline-First Pattern

## Purpose

Document the guarantees, tradeoffs, and mechanics of the offline-first architecture. This is the core philosophy of the system.

---

## Relevant Source Files

- `src/lib/db/` — IndexedDB domain modules (barrel at `index.ts`; public shim `src/lib/db.ts`), stores, event emission
- `src/repositories/bands.ts` — Band fetch on login (`sync()`), cache version wipe + full re-sync (Phase 27.H)
- `src/repositories/picks.ts`, `announcements.ts`, `presence.ts`, `missed.ts`, `duck.ts` — Offline queue logic + `flushOfflineQueue()`
- `src/repositories/users.ts` — `syncCrew()` crew profile cache incl. `special_badges` (Phase 31)
- `src/repositories/badgeHistoryRepository.ts` — Badge archive IDB read + Supabase pull (no offline queue; Phase 29)
- `src/lib/syncCoordinator.ts` — Single reconnect contract (Phase 27.C)
- `src/components/sync/` — `BandSync`, `ReconnectSync`, `RealtimeSync`, `CacheVersionCheck` (Phase 26.G + 27.C/D/H)
- `vite.config.ts` — PWA / Service Worker caching strategy
- `src/components/OfflineBanner.tsx` — Offline status UI
- `src/components/SyncToast.tsx` — Sync completion feedback

---

## High-Level Explanation

### The Golden Rule

**IndexedDB is the primary store. Supabase is the sync target.**

All UI reads come from IndexedDB. Writes go to IndexedDB immediately (optimistic), then Supabase asynchronously. If the Supabase write fails, the operation is queued for later.

```
User Action
    │
    ▼
┌──────────────┐
│  IndexedDB   │ ← Immediate (optimistic)
│  (primary)   │   UI re-renders now
└──────┬───────┘
       │
       ├─ emit window event
       │
       └─ async: try Supabase
               if fail → queue for retry
```

### Why Offline-First?

Wacken Open Air has terrible cellular signal. Users will lose connectivity:
- During the festival (metal site, crowds, rain)
- While traveling to/from the event
- In the campground (rural)

The app **must** remain fully functional offline:
- ✅ View band schedule (cached on first load)
- ✅ Browse crew attendance (cached last sync)
- ✅ Pick/unpick bands (queued for sync)
- ✅ Post announcements (queued for sync)
- ✅ Update presence (queued for sync)
- ✅ Mark bands as seen (queued for sync)
- ✅ View live vest assigned badges (from `crew_users.special_badges` after last `syncCrew()`)
- ✅ `/now` and live vest crew counts aligned offline (shared `buildSocialSnapshot()`)
- ❌ Run badge year consolidation (godlike; requires network)
- ❌ Receive LLM alerts (requires network call)
- ❌ See brand-new announcements (requires Realtime)

---

## Data Flow Layers

```
┌────────────────────────────────────────────────────────┐
│                 Layer 1: Components                     │
│         (React pages, modals, UI interactions)          │
└────────┬─────────────────────────────────────────────┘
         │ read via hooks, dispatch actions
         ▼
┌────────────────────────────────────────────────────────┐
│                  Layer 2: Hooks                         │
│     (useMyPicks, usePickCounts, useAuth, etc.)         │
│     Subscribe to IDB events, Realtime, localStorage    │
└────────┬─────────────────────────────────────────────┘
         │ call repositories, listen to events
         ▼
┌────────────────────────────────────────────────────────┐
│               Layer 3: Repositories                     │
│      (picksRepository, announcementsRepository, etc.)   │
│      Implement optimistic writes, offline queue logic  │
└────────┬─────────────────────────────────────────────┘
         │
         ├─→ saveUserPick() → IndexedDB      [immediate]
         │   emitPicksChanged()
         │
         └─→ if online:
               supabase.from('user_picks').upsert(pick)
               if error → enqueueOfflinePick()
```

---

## Offline Queue Design

### Problem

User toggles a band 5 times offline:
1. Pick
2. Unpick
3. Pick
4. Unpick
5. Pick

Storing all 5 operations means 5 Supabase calls on reconnect. But the final state is just "pick", so 4 calls are wasted.

### Solution: Deduplication

Group operations by `(user_id, band_id)`, keep only the last action.

```typescript
// In picksRepository.flushOfflineQueue()
const groups = new Map<string, { all: Op[]; last: Op }>();

for (const op of queue) {
  const key = `${op.user_id}:${op.band_id}`;
  const g = groups.get(key);
  if (g) {
    g.all.push(op);     // Keep all for deletion
    g.last = op;        // Update final action
  } else {
    groups.set(key, { all: [op], last: op });
  }
}

// Sync only last action
for (const { all, last } of groups.values()) {
  const { error } = last.action === 'add'
    ? await supabase.from('user_picks').upsert({...})
    : await supabase.from('user_picks').delete().where(...);

  if (!error) {
    // Only delete from queue if sync succeeded
    await Promise.all(all.map(op => removeFromOfflineQueue(op.id)));
  }
}
```

**Result**: 5 operations → 1 Supabase call, 5 queue entries removed on success.

---

## Queue Stores

IndexedDB has separate stores for online data and offline queues:

| Data Store | Queue Store | Purpose |
|------------|------------|---------|
| `user_picks` | `offline_picks` | Picks made while offline |
| `announcements` | `pending_announcements` | Posts made while offline |
| `user_presence` | `offline_presence` | Presence changes while offline |
| `user_missed_bands` | `offline_missed_bands` | Missed band marks while offline |

Each queue entry has:
```typescript
type OfflinePickOp = {
  id: string;           // uuid, for deletion from queue
  user_id: string;
  band_id: string;
  action: 'add' | 'remove';
  created_at: string;   // For ordering
};
```

---

## Sync Mechanics

### Phase 1: Immediate Optimistic Write

```typescript
// Inside picksRepository.toggle()
const pick: UserPick = { user_id, band_id, created_at: now };
await saveUserPick(pick);        // ← IndexedDB write happens NOW
emitPicksChanged();              // ← Components re-render NOW
```

User sees the change immediately. UI is responsive.

### Phase 2: Async Supabase Write (Online Only)

```typescript
if (!navigator.onLine) {
  await queuePick(userId, bandId, 'add', now);  // Queue for later
  return;  // Exit early
}

const { error } = await supabase.from('user_picks').upsert(pick);
if (error) {
  await queuePick(userId, bandId, 'add', now);  // Queue on failure
}
```

If online:
- Try to sync to Supabase (fire-and-forget)
- If it fails (network error, validation error, etc.), queue the operation
- User doesn't wait (no await); sync happens in background

If offline:
- Skip Supabase call entirely
- Queue the operation immediately
- User doesn't experience delay

### Phase 3: Realtime Update (From Other Users)

```typescript
// In usePickCounts hook
supabase.channel('pick_counts')
  .on('postgres_changes', { event: 'INSERT', table: 'user_picks' },
    async (payload) => {
      const pick = payload.new as UserPick;
      await saveUserPick(pick);       // ← Update IndexedDB
      // Components already listening to PICKS_CHANGED_EVENT re-render
    })
  .subscribe();
```

When another crew member's pick arrives via Realtime:
- IndexedDB is updated
- Window event is emitted
- Components re-render with new data

### Phase 4: Queue Flush (On Reconnect)

```typescript
// In App.tsx PickSync
window.addEventListener('online', () => {
  picksRepository.flushOfflineQueue();  // Process all queued picks
});
```

When the app detects the `'online'` event:
1. Load all items from offline queue
2. Group by `(user_id, band_id)`, keep last action
3. For each group, make one Supabase call
4. If successful, delete from queue
5. If any fail, keep in queue for next retry

---

## Example: Full Lifecycle of an Offline Pick

### Scenario: User picks a band, loses connectivity, then regains it.

**T=0:00 User at festival, picks "Slipknot"**
```
User taps pick button
→ saveUserPick({user_id: 'alice', band_id: 'slipknot', created_at: '2026-07-29T18:45:00'})
→ await db.put('user_picks', pick)  [IndexedDB write succeeds]
→ emitPicksChanged()
→ Components subscribed to event re-render with new attendance count
→ UI shows Slipknot is picked ✓

Navigator.onLine = true, so:
→ await supabase.from('user_picks').upsert(pick)
→ [Network OK, upsert succeeds]
→ [No queue entry created]
```

**T=0:05 Network goes down (user enters tent)**
```
Network unreachable
Navigator.onLine = false
```

**T=0:10 User picks "Metallica" while offline**
```
User taps pick button
→ saveUserPick({user_id: 'alice', band_id: 'metallica', created_at: '2026-07-29T18:50:00'})
→ await db.put('user_picks', pick)  [IndexedDB write succeeds]
→ emitPicksChanged()
→ UI shows Metallica is picked ✓

Navigator.onLine = false, so:
→ Skip Supabase call
→ await queuePick('alice', 'metallica', 'add', created_at)
→ await db.put('offline_picks', {
      id: 'alice:metallica:123abc...',
      user_id: 'alice',
      band_id: 'metallica',
      action: 'add',
      created_at: '2026-07-29T18:50:00'
    })
→ Return (no error to user)
```

**T=0:20 User unpicks "Metallica" (still offline, changed mind)**
```
User taps unpick button
→ removeUserPick('alice', 'metallica')
→ await db.delete('user_picks', ['alice', 'metallica'])  [IndexedDB]
→ emitPicksChanged()
→ UI shows Metallica is unpicked ✓

Navigator.onLine = false, so:
→ Skip Supabase call
→ await queuePick('alice', 'metallica', 'remove', created_at)
→ await db.put('offline_picks', {
      id: 'alice:metallica:456def...',
      user_id: 'alice',
      band_id: 'metallica',
      action: 'remove',
      created_at: '2026-07-29T18:55:00'  [Note: different timestamp]
    })
→ [Now offline_picks has 2 entries for the same user:band pair]
```

**T=1:00 Network comes back (user leaves tent)**
```
Browser detects online
→ 'online' event fires
→ App.tsx PickSync handler:
    await picksRepository.flushOfflineQueue()
```

**Inside flushOfflineQueue():**
```
Load all offline_picks:
[
  {id: 'alice:metallica:123abc...', action: 'add',    created_at: '18:50'},
  {id: 'alice:metallica:456def...', action: 'remove', created_at: '18:55'},
]

Group by (user_id, band_id):
groups.get('alice:metallica') = {
  all: [entry1, entry2],
  last: entry2  [action='remove' because it has later timestamp]
}

Sync only last action:
last.action === 'remove', so:
→ await supabase.from('user_picks')
    .delete()
    .eq('user_id', 'alice')
    .eq('band_id', 'metallica')
→ [Supabase succeeds]

Delete from offline queue:
→ await removeFromOfflineQueue('alice:metallica:123abc...')
→ await removeFromOfflineQueue('alice:metallica:456def...')
→ offline_picks store is now empty for Metallica
```

**Final state:**
- IndexedDB: Metallica is unpicked (matches final action)
- Supabase: Metallica is unpicked (matches final action)
- Offline queue: Empty
- ✅ Consistency maintained

---

## Offline Guarantees by Data Type

### Picks

| Scenario | Guarantee |
|----------|-----------|
| Pick offline, reconnect | Synced to Supabase ✓ |
| Pick offline, toggle offline | Deduped, synced last action ✓ |
| Pick offline, delete band on server | Upsert recreates band... ⚠️ (rare edge case) |
| Pick online, lose network | Retry on reconnect ✓ |
| Sync fails (validation error) | Stays in queue, retried ✓ |

### Announcements

| Scenario | Guarantee |
|----------|-----------|
| Post offline, reconnect | Synced to Supabase ✓ |
| Post offline, connectivity returns, post again | Both pending entries flushed ✓ |
| Post online, network error | Queued, retried ✓ |
| Post deleted while queued | Queue still flushed (orphaned post) ⚠️ |

### Presence

| Scenario | Guarantee |
|----------|-----------|
| Check in offline | Queued, synced on reconnect ✓ |
| Check in, toggle, reconnect | Last toggle synced ✓ |

### Badge history (Phase 29)

| Scenario | Guarantee |
|----------|-----------|
| View archive offline | Served from IndexedDB after first profile sync ✓ |
| Consolidate year offline | Not available — Edge Function requires network ✓ |
| `festival:reset` | Archive rows untouched in Supabase and IDB ✓ |
| Re-consolidate same year | Idempotent upsert (`UNIQUE user_id, festival_year, slug`) ✓ |

---

## Realtime vs. Offline Cache

**Online**: Crew attendance counts update within ~3 seconds via Realtime.

**Offline**: Crew attendance counts are stale (from last sync).

```
User A offline sees:
- Slipknot: 3 picks (from IndexedDB, synced 1 hour ago)

Reality (online crew see):
- Slipknot: 5 picks (User B and C just picked while A was offline)

A reconnects:
- Realtime subscription receives INSERT events for B and C
- IndexedDB is updated
- usePickCounts() re-renders with count=5
```

---

## Service Worker & Asset Caching

**Managed by**: vite-plugin-pwa + Workbox

**Strategy**:
```javascript
// src/vite.config.ts
workbox: {
  globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json}'],
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
      handler: 'NetworkFirst',  // Try network first, fall back to cache
      options: {
        cacheName: 'supabase-cache',
        expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 }
      }
    },
    {
      urlPattern: /^https:\/\/www\.wacken\.com\/fileadmin\//i,
      handler: 'CacheFirst',    // Use cache first, fall back to network
      options: {
        cacheName: 'band-images',
        expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 }
      }
    }
  ]
}
```

**Assets cached**:
- ✅ JS/CSS/HTML (app shell)
- ✅ Wacken band images (30-day TTL)
- ✅ User avatars
- ✅ Fonts
- ❌ API responses (handled by IndexedDB, not HTTP cache)

**Update strategy**:
- `registerType: 'autoUpdate'` — New version detected, user is prompted to refresh

---

## Offline UX

### OfflineBanner (src/components/OfflineBanner.tsx)

Shown on:
- `/now`
- `/schedule`
- `/my-picks`

Text: "🚫 Offline — Changes will sync when back online"

### PendingChip on BandCard

Shows on:
- Picks made offline (not yet synced)
- Announcements posted offline

Visual: Small "⏳" chip indicating pending status

### SyncToast (src/components/SyncToast.tsx)

Appears when:
- 'online' event fires AND offline queue was flushed
- Shows: "✓ Synced N items"

---

## Reliability & Failure Modes

### Guaranteed to Recover

1. **Offline queue corrupted?** → Cleared on cache version bump
2. **User deletes IndexedDB?** → Re-fetches on app reload
3. **Auth session expires?** → User redirected to login
4. **Supabase down (temporarily)?** → Queue retried, user alerted

### Known Issues (Accepted Risks)

1. **Conflict on deleted band**: User offline, band deleted on server, user's offline pick is orphaned but upserts succeed.
   - **Mitigation**: Rare (bands don't change), acceptable for small group

2. **Queue size unbounded**: User makes 1000 picks offline, queue grows.
   - **Mitigation**: Cache version bump clears all, users rarely that offline

3. **Realtime fallback**: If Realtime is down, attendance counts are stale.
   - **Mitigation**: App still fully functional; data is eventual consistent

---

## Open Questions

- Should offline queue have size limits or TTL?
- Should we implement optimistic conflict resolution for deleted bands?
- Should announcement posts be compressed (deduplicated)?
- How to handle queue entries for deleted users (e.g., godlike purges test user)?

---

**Last updated:** 2026-05-28 — Phase 31 crew profile cache; vest display from IDB after sync.
