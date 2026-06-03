# Flow: Picking a Band

## Purpose

Document the complete lifecycle of a user picking (or unpicking) a band, including optimistic UI updates, offline queuing, sync, and realtime propagation.

---

## Trigger

User taps a band card's pick/unpick button on any view (/schedule, /popular, via BandDetailModal).

---

## Happy Path (Online, Connected)

```
User at /schedule, sees "Slipknot" band card
                    │
                    ▼
        User taps pick button
                    │
                    ▼
   BandCard.onClick → picksRepository.toggle(
     userId: 'alice-uuid',
     bandId: 'slipknot-uuid',
     currentlyPicked: false  // User hasn't picked yet
   )
                    │
                    ▼
   ┌─────────────────────────────────────┐
   │ Inside picksRepository.toggle()     │
   └─────────────────────────────────────┘
                    │
        ┌───────────┴──────────────┐
        ▼                          ▼
   Not picked yet,          Navigator.onLine?
   so ADD                    true ✓
        │                         │
        ▼                         ▼
   const pick = {            await supabase
     user_id: 'alice',         .from('user_picks')
     band_id: 'slipknot',      .upsert(pick)
     created_at: '2026-05-11T14:30:00Z'
   }
        │                         │
        ▼                         ▼
   await saveUserPick(pick)   No error ✓
        │                         │
        │  [IndexedDB write       └────────┐
        │   succeeds]                      │
        │                                  ▼
        ▼                         return [success]
   emitPicksChanged()
        │
        ├─ window.dispatchEvent(
        │   new Event('viralatas:picks-changed')
        │ )
        │
        └─ All listening components re-render:
           • BandCard.usePickStatus → shows ✓ picked
           • usePickCounts() → updates count
           • MyPicksPage → adds to timeline
           • PopularPage → updates rank
                    │
                    ▼
   ┌─────────────────────────────────────┐
   │ User sees pick reflected in UI      │
   │ immediately (< 50ms)                │
   └─────────────────────────────────────┘
                    │
                    ▼
   Meanwhile (async, user doesn't wait):
                    │
        ┌───────────┴──────────────┐
        ▼                          ▼
   Supabase INSERT       Realtime channel
   succeeds              'pick_counts'
        │                detects INSERT
        │                event
        ▼                │
   [No error,            ▼
    pick stored on   All other users'
    server]          hooks fire:
        │                │
        ▼                ├─ usePickCounts()
   Realtime event       │  .on('postgres_changes',
   broadcasts to        │    { event: 'INSERT' },
   all connected        │    (payload) => {
   clients                 │      saveUserPick(payload.new)
        │                 │      [IndexedDB update]
        ▼                 │    })
   Other users'         │
   subscriptions        ├─ emitPicksChanged()
   receive event        │
        │               └─ Their UIs update
        ├─ Other user's   with new count
        │  usePickCounts  (~3s latency)
        │  hook updates
        │  count
        │
        └─ Other user's
           UI shows
           Slipknot
           now has
           2 picks
           (1 from Alice,
            1 from others)
```

**Timeline**:
- T=0ms: User taps button
- T=10ms: IndexedDB write completes, UI updates, event emitted
- T=20ms: Components re-render (local event listeners)
- T=50ms: Supabase upsert sent (async)
- T=100ms: Supabase confirms success
- T=3000ms: Realtime propagates to other users
- T=3100ms: Other users' UIs update

---

## Offline Behavior (Disconnected)

```
User at /schedule, offline
                    │
                    ▼
   User taps pick button
                    │
                    ▼
   picksRepository.toggle(
     userId: 'alice',
     bandId: 'slipknot',
     currentlyPicked: false
   )
                    │
        ┌───────────┴──────────────┐
        ▼                          ▼
   const pick = {...}      Navigator.onLine?
        │                  false ✗
        ▼                         │
   await saveUserPick()           ▼
   [IndexedDB write]         Skip Supabase call
        │                    entirely
        ├─ emitPicksChanged()       │
        │                           ▼
        │                    await queuePick(
        │                      userId: 'alice',
        │                      bandId: 'slipknot',
        │                      action: 'add',
        │                      created_at: timestamp
        │                    )
        │                           │
        ▼                           ▼
   All components           const offlineOp = {
   re-render via            id: 'alice:slipknot:uuid-123',
   PICKS_CHANGED_EVENT      user_id: 'alice',
        │                   band_id: 'slipknot',
        ▼                   action: 'add',
   BandCard shows:          created_at: timestamp
   ✓ Picked                 }
        │                        │
        │                        ▼
        │                   await db.put('offline_picks', offlineOp)
        │                   [IndexedDB write]
        │                        │
        │                        ▼
        │                   PendingChip appears
        │                   on BandCard:
        │                   "⏳ Pending"
        │                        │
        └────────────────────────┴─────────┐
                                 │
                                 ▼
                    User sees pick as pending
                    (synced eventually)
                              │
                              ▼
                    ┌──────────────────────┐
                    │ Browser detects      │
                    │ network is back      │
                    │ 'online' event fires │
                    └──────────────────────┘
                              │
                              ▼
                    App.tsx PickSync
                    component handler:
                              │
        ┌─────────────────────┴─────────────┐
        ▼                                   ▼
   flushOfflineQueue()          syncCrewFromRemote()
        │                                   │
        ├─ Load offline_picks               ├─ Fetch all user_picks
        │  from IndexedDB                   │  from Supabase
        │                                   │
        ├─ Sort by created_at               ├─ Overwrite IndexedDB
        │                                   │
        ├─ Group by                        │
        │  (user_id, band_id)              │
        │                                   │
        ├─ For 'alice:slipknot':           │
        │  last action = 'add'             │
        │                                   │
        ├─ await supabase                  │
        │  .from('user_picks')             │
        │  .upsert({                       │
        │    user_id: 'alice',             │
        │    band_id: 'slipknot',          │
        │    created_at: timestamp         │
        │  })                              │
        │  [SUCCESS]                       │
        │                                   │
        ├─ Delete from queue:              │
        │  removeFromOfflineQueue(         │
        │    'alice:slipknot:uuid-123'     │
        │  )                               │
        │                                   │
        ├─ flushed++                       │
        │                                   │
        └─ Return flushed=1                │
                    │
                    ▼
                SyncToast appears:
                "✓ Synced 1 pick"
                    │
                    ▼
        PendingChip disappears from
        BandCard
                    │
                    ▼
        IndexedDB and Supabase
        now consistent:
        Alice has picked Slipknot
```

---

## Sync Behavior (Queue Deduplication)

**Scenario**: User toggles band offline 5 times.

```
T=0:10 online: user picks → offline_picks: [op1: action='add']
T=0:15 online: user unpicks → offline_picks: [op1, op2: action='remove']
T=0:20 online: user picks → offline_picks: [op1, op2, op3: action='add']
T=0:25 online: user unpicks → offline_picks: [op1, op2, op3, op4: action='remove']
T=0:30 online: user picks → offline_picks: [op1, op2, op3, op4, op5: action='add']

UI State Progression:
  T=0:10: picked
  T=0:15: unpicked
  T=0:20: picked
  T=0:25: unpicked
  T=0:30: picked  ← FINAL STATE

Browser comes online
      │
      ▼
flushOfflineQueue():
      │
      ├─ Load all 5 operations
      │
      ├─ Sort by created_at (already sorted)
      │
      ├─ Group by 'alice:slipknot':
      │  {
      │    all: [op1, op2, op3, op4, op5],
      │    last: op5  ← action='add' (final state)
      │  }
      │
      ├─ Sync ONLY last action:
      │  await supabase.from('user_picks').upsert({
      │    user_id: 'alice',
      │    band_id: 'slipknot',
      │    created_at: op5.created_at
      │  })
      │  [SUCCESS]
      │
      ├─ Delete ALL 5 queue entries:
      │  for each op in [op1, op2, op3, op4, op5]:
      │    removeFromOfflineQueue(op.id)
      │  offline_picks: []
      │
      └─ Return flushed=5
           (5 operations, 1 Supabase call)

Result:
  • 5 operations grouped
  • 1 Supabase call made
  • All 5 queue entries removed
  • Final state matches: picked
  • Server sees only 1 request (efficient)
```

---

## Realtime Updates from Other Users

**Scenario**: Other crew member Alice picks Slipknot while user Bob is viewing.

```
Alice (remote):
    │
    ├─ Picks Slipknot
    ├─ Supabase upsert(alice, slipknot)
    ├─ [SUCCESS]
    │
    └─ Realtime event broadcasts

            │
            ▼
    All subscribed clients receive:
    postgres_changes event:
    {
      eventType: 'INSERT',
      schema: 'public',
      table: 'user_picks',
      new: {
        user_id: 'alice-uuid',
        band_id: 'slipknot-uuid',
        created_at: '2026-05-11T14:30:00Z'
      }
    }
            │
            ▼
    Bob's browser:
    usePickCounts().on('postgres_changes',
      { event: 'INSERT', table: 'user_picks' },
      async (payload) => {
        await saveUserPick(payload.new)
        [IndexedDB write]
      })
            │
            ▼
    emitPicksChanged() fired
            │
            ▼
    All listening components
    re-render:
    • usePickCounts() updates
    • BandCard shows new count
    • PopularPage re-ranks
            │
            ▼
    Bob sees Slipknot count
    increase from 3 to 4
    within ~3 seconds
```

---

## Edge Cases

### Case 1: User picks band, band is deleted server-side while offline

```
User offline:
  ├─ Picks 'slipknot' (band exists on client)
  ├─ Queued to offline_picks
  └─ [awaits reconnect]

Server (while user offline):
  ├─ Godlike user deletes 'slipknot' from band table
  └─ [cascade delete from user_picks if RLS allows]

User reconnects:
  ├─ Flush offline queue
  ├─ Supabase.upsert({user_id, band_id: 'slipknot'})
  └─ Error: foreign key violation (band doesn't exist)
     OR
     Success: Upsert re-creates deleted band (weird behavior)

Mitigation:
  • Don't delete bands (disable band delete in RLS)
  • Or: Accept orphaned picks, ignore FK error
  • Or: Validate band still exists before flushing
```

### Case 2: Multiple simultaneous picks (race condition)

```
User rapidly taps pick button 10 times (before UI responds)

Repository.toggle() called 10 times synchronously:
  ├─ saveUserPick(1) → IDB
  ├─ saveUserPick(2) → IDB
  ├─ ...
  ├─ saveUserPick(10) → IDB
  ├─ All emit PICKS_CHANGED_EVENT
  ├─ Components re-render (batched by React)
  └─ Async Supabase calls queue

Result:
  • All 10 writes to IDB complete
  • Only final state visible to user (10th pick/unpick)
  • 10 Supabase calls queued (not deduped at write time)
  • On sync, 10 will be deduped to 1 (if same band) or 10 (if different bands)

OK for small group, not optimal for high-contention UIs.
```

### Case 3: User loses connectivity mid-sync

```
User online:
  ├─ Picks band
  ├─ Supabase.upsert() in flight
  └─ Network drops

Supabase call:
  ├─ Request sent (in-flight)
  ├─ No response from server
  ├─ Browser timeout (~30s)
  └─ Error returned

picksRepository.toggle():
  ├─ error detected
  ├─ await queuePick()
  └─ Operation now in offline_picks

User later reconnects:
  ├─ Flush queue (retry same operation)
  ├─ Supabase.upsert() succeeds
  └─ Consistency restored

Result: User has pick both in IDB and Supabase, consistent.
No duplicate pick (upsert is idempotent).
```

---

## Important Hooks / Services / Repositories

### Repositories
- `picksRepository.toggle()` — Main entry point
- `picksRepository.flushOfflineQueue()` — Called on reconnect
- `picksRepository.syncCrewFromRemote()` — Fetch all picks from server

### Hooks
- `useMyPicks()` — Returns Set of user's picked band IDs
- `usePickCounts()` — Returns {bandId: count} + Realtime subscription
- `useOfflinePendingBandIds()` — Returns Set of queued pick IDs

### Services
- None specific to picking (logic in repository)

---

## Data Flow Diagram

```
User Interaction
     │
     ▼
BandCard.onClick()
     │
     ├─ picksRepository.toggle()
     │  ├─ [1] saveUserPick() to IDB
     │  ├─ [2] emitPicksChanged()
     │  ├─ [3] if offline: queuePick()
     │  └─ [4] if online: Supabase.upsert()
     │       └─ if error: queuePick()
     │
     └─ useMyPicks() hook
        ├─ Listens to PICKS_CHANGED_EVENT
        ├─ Refreshes from IDB
        └─ Component re-renders
               │
               ├─ BandCard: pick ✓ shown
               ├─ usePickCounts(): count updated
               ├─ MyPicksPage: added to timeline
               └─ PopularPage: re-ranked

Meanwhile (async):
     └─ Realtime subscription
        ├─ Receives INSERT from other users
        ├─ saveUserPick() to IDB
        ├─ emitPicksChanged()
        └─ Other users' UIs update
```

---

## Offline Guarantees

✅ **Offline Pick**: Queued, synced on reconnect
✅ **Offline Unpick**: Queued, synced on reconnect
✅ **Offline Toggle**: Deduped to final action, 1 sync call
✅ **Crew Counts Stale**: Offline crew sees cached counts (hours old)
✅ **Realtime Propagation**: Other users see pick within 3s (if online)

---

## Open Questions

- Should rapid taps be debounced (e.g., max 1 toggle/500ms)?
- Should queue dedup happen at write time (not flush time)?
- Should orphaned picks (band deleted) be automatically cleaned up?
- Should there be a limit to queue size?

---

**Last updated:** 2026-05-11
