# Sync Engine

## Purpose

Document how data is synchronized between IndexedDB (primary), offline queues, and Supabase (secondary). This includes startup sync, realtime updates, queue management, and error handling.

---

## Relevant Source Files

- `src/components/sync/` — Sync orchestration (`SyncOrchestration`, `CacheVersionCheck`, `BandSync`, `ReconnectSync`, `PushSetup`, `DuckNotificationsListener`) — extracted from `App.tsx` (Phase 26.G)
- `src/lib/syncCoordinator.ts` — `runReconnectSync()` single reconnect contract (Phase 27.C)
- `src/lib/optimisticQueue.ts` — shared `OptimisticQueue` with configurable dedup strategies (Phase 27.E)
- `src/App.tsx` — Mounts `<SyncOrchestration />` only (84 lines)
- `src/lib/realtimeSync.ts` — `subscribePostgresChanges()` unified Realtime helper (Phase 26.H)
- `src/repositories/picks.ts` — Pick sync, queue deduplication
- `src/repositories/announcements.ts` — Announcement sync and pending queue
- `src/repositories/presence.ts` — Presence sync
- `src/repositories/users.ts` — Crew member sync
- `src/repositories/missed.ts` — Missed band sync
- `src/repositories/bands.ts` — Band sync (`sync()`), cache version check, godlike cache invalidation (Phase 27.H)
- `src/lib/db/` — IndexedDB domain modules (barrel `index.ts`; public shim `src/lib/db.ts`)

---

## High-Level Explanation

The sync engine ensures:
1. **Optimistic writes** — User sees changes immediately
2. **Eventual consistency** — Server catches up asynchronously
3. **Offline queue management** — Operations don't get lost
4. **Deduplication** — No redundant sync calls
5. **Realtime updates** — Other users' changes appear in ~3s
6. **Cache invalidation** — Stale data is cleared on version bump

---

## Sync Orchestration (`src/components/sync/`, Phase 26.G)

`App.tsx` mounts `<SyncOrchestration />`, which composes focused sync components:

### 1. CacheVersionCheck

```typescript
function CacheVersionCheck() {
  const { session } = useAuth();
  const userId = session?.user?.id;

  useEffect(() => {
    if (userId) {
      bandsRepository.checkAndApplyCacheVersion().catch(() => {});
    }
  }, [userId]);

  return null;
}
```

**Trigger**: On login (userId changes)

**Purpose**: 
1. Get cache version from Supabase
2. Compare with local cache version (from IndexedDB meta store)
3. If different: `wipeAllLocalData()` → forces full re-sync

**Why?**: If band lineup changes (e.g., band dropped), old picks reference deleted bands. A version bump clears everything and forces fresh fetch.

---

### 2. BandSync

```typescript
function BandSync() {
  const { session } = useAuth();
  const userId = session?.user?.id;

  useEffect(() => {
    if (userId) {
      bandsRepository.sync().catch(() => {});  // Swallow offline errors
    }
  }, [userId]);

  return null;
}
```

**Trigger**: On login

**Operation** (`bandsRepository.sync()` in `src/repositories/bands.ts`):
```typescript
async sync(): Promise<void> {
  const { data, error } = await supabase
    .from('bands')
    .select('*')
    .order('start_time');

  if (error) throw error;
  if (data && data.length > 0) await saveBands(data);
}
```

**Behavior**:
- If online: Fetches all bands from Supabase, overwrites IndexedDB
- If offline: Swallows error, user sees cached bands from previous login
- Run once on login; not re-run on reconnect (band list is immutable)

---

### 3. ReconnectSync (Phase 27.C — replaces PickSync, AnnouncementSync, DuckSync)

```typescript
function ReconnectSync() {
  const { session } = useAuth();
  const userId = session?.user?.id;

  useEffect(() => {
    if (!userId) return;

    async function reconnect() {
      const flushed = await runReconnectSync(userId);
      if (flushed > 0) emitSyncComplete();
    }

    reconnect().catch(() => {});
    window.addEventListener('online', () => reconnect().catch(() => {}));
    return () => window.removeEventListener('online', reconnect);
  }, [userId]);

  return null;
}
```

**Triggers**:
1. On login (userId changes)
2. On `'online'` event (window event)

**Operations** (`runReconnectSync` in `src/lib/syncCoordinator.ts`):

1. **Flush all offline queues** (parallel) — all repos expose `flushOfflineQueue()` backed by `OptimisticQueue`:
   - **picks** — `keepLast` by `(user_id, band_id)`, sorted by `created_at`
   - **presence** — `keepLast` by `user_id`, sorted by `updated_at`
   - **missed** — `byId` (`${user_id}|${band_id}`)
   - **announcements** — `fifo` (no dedup)
   - **duck** — `fifo` (no dedup)
2. **Pull remote crew data** (parallel):
   - `picksRepository.syncCrewFromRemote()`
   - `usersRepository.syncCrew()`
   - `presenceRepository.syncCrewFromRemote()`
   - `announcementsRepository.sync()`
   - `missedRepository.syncFromRemote(userId)`
3. **Emit SyncToast** → `viralatas:sync-complete` once if any queue items flushed

**Why one coordinator?** Previously PickSync, AnnouncementSync, and DuckSync each registered separate `online` handlers; DuckSync skipped mount flush; missed-band flush only ran when `useMissedBands` mounted. Hooks (`usePickCounts`, `usePresenceRealtime`, etc.) duplicated remote pulls on mount.

---

### 4. PickSync (removed in 27.C)

<details>
<summary>Historical — replaced by ReconnectSync</summary>

```typescript
function PickSync() {
  const { session } = useAuth();
  const userId = session?.user?.id;

  useEffect(() => {
    if (!userId) return;

    async function syncNow() {
      // 1. Flush offline picks
      const [picksFlushed, presenceFlushed] = await Promise.all([
        picksRepository.flushOfflineQueue(),
        presenceRepository.flushOfflineQueue(),
      ]);
      if (picksFlushed + presenceFlushed > 0) emitSyncComplete();

      // 2. Fetch crew data
      await Promise.all([
        picksRepository.syncCrewFromRemote(),
        usersRepository.syncCrew(),
        presenceRepository.syncCrewFromRemote(),
      ]);
    }

    syncNow().catch(() => {});  // Initial sync

    // Re-sync on reconnect
    function handleOnline() {
      syncNow().catch(() => {});
    }

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [userId]);

  return null;
}
```

</details>

## Sync Flows in Detail

### Flow: Offline Queue Flush

```
Trigger: 'online' event or app init

╔════════════════════════════════════════════════════════╗
║  picksRepository.flushOfflineQueue()                   ║
╚════════════════════════════════════════════════════════╝
         │
         ├─ 1. Load all offline_picks from IndexedDB
         │     queue = [{user_id, band_id, action}, ...]
         │
         ├─ 2. Sort by created_at (oldest first)
         │
         ├─ 3. Group by (user_id, band_id)
         │     groups.get('user:band') = {
         │       all: [op1, op2, op3],  ← all operations
         │       last: op3               ← final state
         │     }
         │
         ├─ 4. For each group, sync ONLY last action:
         │     ├─ if (last.action === 'add')
         │     │    await supabase.from('user_picks').upsert({...})
         │     │
         │     └─ else
         │        await supabase.from('user_picks')
         │          .delete()
         │          .eq('user_id', last.user_id)
         │          .eq('band_id', last.band_id)
         │
         ├─ 5. If no error:
         │     await Promise.all(all.map(op => removeFromOfflineQueue(op.id)))
         │     flushed += all.length
         │
         ├─ 6. If error:
         │     Leave all in queue for next retry
         │     Don't increment flushed
         │
         └─ 7. Return flushed count
```

**Example**:
```
Queue before flush:
[
  {id: 'uuid1', user_id: 'alice', band_id: 'band1', action: 'add',    created_at: '10:00'},
  {id: 'uuid2', user_id: 'alice', band_id: 'band1', action: 'remove', created_at: '10:05'},
  {id: 'uuid3', user_id: 'alice', band_id: 'band1', action: 'add',    created_at: '10:10'},
  {id: 'uuid4', user_id: 'bob',   band_id: 'band2', action: 'add',    created_at: '10:00'},
]

Grouped:
{
  'alice:band1': { all: [1,2,3], last: 3 (action='add') },
  'bob:band2':   { all: [4], last: 4 (action='add') }
}

Sync calls:
- upsert({user_id: 'alice', band_id: 'band1', created_at: '10:10'})
  → SUCCESS
  → Remove uuid1, uuid2, uuid3 from queue
  → flushed += 3
  
- upsert({user_id: 'bob', band_id: 'band2', created_at: '10:00'})
  → SUCCESS
  → Remove uuid4 from queue
  → flushed += 1

Result: flushed = 4, queue is empty
```

---

### Flow: Realtime Update

```
Trigger: postgres_changes event from Supabase Realtime

╔════════════════════════════════════════════════════════╗
║  usePickCounts hook's Realtime subscription            ║
╚════════════════════════════════════════════════════════╝
         │
         ├─ Supabase.channel('pick_counts')
         │   .on('postgres_changes', 
         │       { event: 'INSERT', table: 'user_picks' },
         │       async (payload) => {
         │         const pick = payload.new as UserPick;
         │         await saveUserPick(pick);  ← Update IndexedDB
         │         [PICKS_CHANGED_EVENT emitted]
         │       })
         │   .subscribe()
         │
         ├─ Components listening to PICKS_CHANGED_EVENT:
         │   window.addEventListener(PICKS_CHANGED_EVENT, () => {
         │     refreshFromCache();  ← Re-render with new data
         │   });
         │
         └─ User sees new attendance count in ~3 seconds
```

**Invariant**: IndexedDB is updated **before** component re-render, ensuring consistency.

---

### Flow: Sync on App Init

```
User logs in
     │
     ▼
useAuth() detects session
     │
     ├─ CacheVersionCheck
     │  ├─ bandsRepository.checkAndApplyCacheVersion()
     │  │  ├─ Get version from Supabase
     │  │  ├─ Compare with local
     │  │  └─ If mismatch: wipeAllLocalData()
     │  │
     │  └─ bandsRepository.sync()
     │     ├─ Fetch bands from Supabase
     │     └─ Save to IndexedDB
     │
     ├─ ReconnectSync (runReconnectSync)
     │  ├─ flushOfflineQueue() × picks, presence, announcements, duck, missed
     │  ├─ syncCrewFromRemote() + syncCrew() + announcements.sync() + missed.syncFromRemote()
     │  └─ emit viralatas:sync-complete (if flushed > 0)
     │
     └─ User sees populated app with band schedule + crew attendance
```

**Time**: All happens in background; user sees content immediately from IndexedDB cache.

---

## Key Sync Functions

### picksRepository.toggle(userId, bandId, currentlyPicked)

```typescript
async function toggle(userId: string, bandId: string, currentlyPicked: boolean) {
  const now = new Date().toISOString();

  if (currentlyPicked) {
    // Unpick
    await removeUserPick(userId, bandId);  // IndexedDB
    if (!navigator.onLine) {
      await queuePick(userId, bandId, 'remove', now);  // Queue
      return;
    }
    const { error } = await supabase
      .from('user_picks')
      .delete()
      .eq('user_id', userId)
      .eq('band_id', bandId);
    if (error) await queuePick(userId, bandId, 'remove', now);
  } else {
    // Pick
    const pick = { user_id: userId, band_id: bandId, created_at: now };
    await saveUserPick(pick);  // IndexedDB
    if (!navigator.onLine) {
      await queuePick(userId, bandId, 'add', now);  // Queue
      return;
    }
    const { error } = await supabase.from('user_picks').upsert(pick);
    if (error) await queuePick(userId, bandId, 'add', now);
  }
}
```

**Pattern**:
1. Write to IndexedDB immediately
2. If offline, queue and return
3. If online, try Supabase
4. If Supabase fails, queue
5. Never fail the operation to user (graceful degradation)

---

### picksRepository.syncCrewFromRemote()

```typescript
async function syncCrewFromRemote(): Promise<void> {
  const { data, error } = await supabase.from('user_picks').select('*');
  if (error || !data) return;

  // Atomic replace all crew picks
  await replaceUserPicks(data as UserPick[]);
}
```

**Behavior**:
- Fetch all user_picks from Supabase (no filtering)
- Overwrite all picks in IndexedDB (atomic transaction)
- Emit PICKS_CHANGED_EVENT
- Components re-render with new counts

**Called**:
- On app init
- On 'online' event
- Manually (if user wants fresh data)

---

### bandsRepository.checkAndApplyCacheVersion()

```typescript
// In bandsRepository
export const bandsRepository = {
  async checkAndApplyCacheVersion() {
    const { data } = await supabase
      .from('app_config')
      .select('*')
      .eq('key', 'cache_version')
      .single();

    const serverVersion = data?.value;
    const localVersion = await loadCacheVersion();

    if (serverVersion && serverVersion !== localVersion) {
      // Mismatch: lineup changed (or operator bumped), clear all
      await wipeAllLocalData();
      await saveCacheVersion(serverVersion);
      // Force re-fetch on next sync
    }
  }
};
```

**Purpose**: Invalidate cache when the band lineup changes or an operator bumps the version (godlike "Reset all data" button, or `npm run festival:reset` — see `docs/ai-wiki/festival-reset.md`).

**Server table**: `public.app_config` row with `key = 'cache_version'`, `value = <ISO timestamp string>` (defined in `supabase/migrations/20260504000006_cache_version.sql`).

**Trigger**: On every login.

**Side effect**: Clears all picks, announcements, crew data if version mismatch.

---

## Error Handling

| Error | Behavior | Recovery |
|-------|----------|----------|
| Offline during pick | Queue operation | Auto-retry on 'online' |
| Supabase validation error | Queue operation | Retry (may fail again) |
| Supabase 5XX error | Queue operation | Auto-retry on 'online' |
| IndexedDB quota exceeded | Log error, stop writes | User clears storage |
| Auth token expired | Redirect to login | User logs in again |
| Realtime connection fails | Fall back to polling (manual sync) | Auto-reconnect |

**Philosophy**: Never fail silently. If operation is queued, we have a record. If queue fails to flush, we'll retry.

---

## Realtime Subscriptions

All Realtime → IndexedDB writes are mounted once in **`RealtimeSync`** (`src/components/sync/SyncOrchestration.tsx`) via repository `subscribeToRealtime()` methods. Hooks react to window events only — they do not own Supabase channels.

| Consumer | Channel | Events | Action |
|------|---------|--------|--------|
| picksRepository | pick_counts | INSERT, DELETE on user_picks | Saves to user_picks IDB |
| presenceRepository | metal_place_config_live | * on metal_place_config | Saves to metal_place_config IDB |
| liveBandTest service | live_band_test_config_live | * on live_band_test_config | Saves to live_band_test_config IDB |
| presenceRepository | user_presence_live | * on user_presence | Saves to user_presence IDB |
| announcementsRepository | announcements_live | INSERT/UPDATE/DELETE announcements | Saves to announcements IDB |
| usersRepository | blocked_posters_live | INSERT/DELETE blocked_posters | Emits `BLOCKED_POSTERS_CHANGED_EVENT` |
| useDuckNotifications | duck_quacks_realtime | INSERT on duck_quacks | Dispatches `viralatas:duck-quack` event |
| missedRepository | missed_bands | INSERT, DELETE on user_missed_bands | Saves to user_missed_bands IDB |

**Subscription lifecycle** (sync layer):
```typescript
// src/components/sync/RealtimeSync.tsx
useEffect(() => {
  const unsubscribers = [
    picksRepository.subscribeToRealtime(),
    announcementsRepository.subscribeToRealtime(),
    presenceRepository.subscribeToRealtime(),
    // ...
  ];
  return () => unsubscribers.forEach((u) => u());
}, []);
```

---

## Monitoring & Debugging

### Check Queue Status

```typescript
// In browser console
const queue = await db.getAll('offline_picks');
console.log(`${queue.length} picks pending sync`);
```

### Emit Sync Event Manually

```typescript
// In browser console
window.dispatchEvent(new Event('online'));
// Triggers ReconnectSync → runReconnectSync()
```

### View Cache Version

```typescript
// In browser console
const version = await loadCacheVersion();
console.log(`Local cache version: ${version}`);
```

---

## Open Questions

1. Should sync be debounced (e.g., wait 5s after first write)?
2. Should we implement exponential backoff for failed queue flushes?
3. Should crew data have a TTL (refresh every N hours)?
4. Should offline queue have size limits or warning?

---

## OptimisticQueue (Phase 27.E)

Shared primitive in `src/lib/optimisticQueue.ts`:

```typescript
createOptimisticQueue(storage, {
  getId,
  dedup: { strategy: 'keepLast' | 'byId' | 'fifo', ... },
  syncOne: async (item) => supabase...,
  onBatchSynced?: async (item) => { ... },
});
```

| Domain | Dedup strategy | Group / sort key |
|--------|----------------|------------------|
| Picks | `keepLast` | `(user_id, band_id)` / `created_at` |
| Presence | `keepLast` | `user_id` / `updated_at` |
| Missed bands | `byId` | `${user_id}\|${band_id}` |
| Announcements | `fifo` | — |
| Duck quacks | `fifo` | — |

On flush: load IDB queue → `buildFlushBatches()` → `syncOne()` per batch → remove all IDs in batch on success. Failed batches stay queued for next reconnect.

**Last updated:** 2026-05-25 — Phase 27.H: band sync folded into `bandsRepository.sync()`; `src/lib/sync.ts` removed.
