# ADR: Custom Hooks + Window Events (No Redux/Zustand)

**Status**: Accepted

**Date**: 2026-05

**Deciders**: Product team, engineering lead

---

## Context

The app needs a state management strategy for:
1. **Auth state** — session, user, loading (shared across all pages)
2. **Async data** — picks, bands, announcements, presence (from IndexedDB + Supabase)
3. **Realtime updates** — crew pick counts update within ~3s from any page
4. **Cross-component sync** — when one component writes a pick, other components on different routes must re-render with new counts

The challenge is **cross-component sync without a shared store**: IndexedDB is the source of truth, but components don't know when IndexedDB changes unless something tells them.

Options considered:
1. **Redux Toolkit** — Centralized store, time-travel debugging, well-known
2. **Zustand** — Lightweight, minimal boilerplate, similar to Redux
3. **React Context + useReducer** — Built-in React, no extra dependency
4. **Custom hooks + Window events** — Event-driven, zero-boilerplate, IDB-centric

---

## Decision

**Use custom React hooks for state encapsulation + window events (custom `viralatas:*` events) for cross-component communication.**

No global state store. No Redux. No Zustand. No Context for data (only for i18n).

---

## Rationale

### The Core Problem: IndexedDB as Source of Truth

The unusual constraint is that IndexedDB — not React state — is the primary store. When a pick is saved:

```
picksRepository.toggle()
  → saveUserPick()  [IndexedDB write]
  → emitPicksChanged()  [window event]
```

All components that care about picks must react to this write. In a traditional React app, you'd call a state setter. But `saveUserPick()` is called from a repository that has no access to React state.

**Window events solve this cleanly**: The repository emits an event. Any component listening to that event re-reads from IndexedDB. No coupling between repository and UI layer.

---

### Why Custom Hooks + Window Events

✅ **Zero coupling between repository and UI**: `db.ts` emits `window.dispatchEvent(new Event('viralatas:picks-changed'))` — it has no knowledge of React components, hooks, or contexts.

✅ **No boilerplate**: A new hook is just a `useState + useEffect` that reads from IDB and subscribes to events. No reducers, actions, selectors, or slice definitions.

✅ **IDB-native**: Hooks read from IndexedDB directly, not from a Redux store that mirrors IDB. The hook IS the IDB read. One layer, not two.

✅ **Small bundle**: No `redux`, `@reduxjs/toolkit`, or `zustand` dependencies. The entire state management system is ~10 window event constants + per-hook `useEffect` subscriptions.

✅ **Simple mental model**: Data flows one way: `IDB mutation → window event → hook re-read → component re-render`. Easy to reason about.

✅ **Easy cleanup**: Each hook cleans up its own subscriptions on unmount. No leaked subscriptions across route changes.

✅ **Testing**: Window events can be dispatched in tests. IDB can be mocked. No Redux store to wrap in Provider.

---

### Why NOT Redux Toolkit

❌ **Mirrors a store Redux doesn't own**: Redux would be a mirror of IndexedDB, not the source of truth. Every IDB write would need to be followed by a Redux dispatch. Double maintenance.

❌ **Boilerplate**: Slice definition, action creators, selectors, reducers for each data type (picks, bands, announcements, presence, users, badges, etc.) — ~200 LoC per domain entity.

❌ **Time-travel debugging**: Valuable for complex forms and wizards. Not useful for eventual-consistency, real-time data where the "correct" state is always "what IndexedDB says".

❌ **No offline-first awareness**: Redux doesn't know which actions are queued for sync. Would need custom middleware to distinguish online/offline ops.

❌ **Larger bundle**: `@reduxjs/toolkit` adds ~15KB gzipped. Not huge, but unnecessary.

---

### Why NOT Zustand

❌ **Same source-of-truth problem**: Zustand would still mirror IndexedDB. Every IDB write triggers a `set()` call. Two sources of truth = divergence bugs.

❌ **Still a global store**: Cross-component sync via a global Zustand store breaks the "each hook manages its own subscription" model. Fine for simple apps, but creates subtle update order bugs when IDB and Zustand diverge.

✅ (However, if this app needed complex client-side derived state with many producers and consumers, Zustand would be worth it.)

---

### Why NOT React Context

❌ **Re-render performance**: A top-level Context that holds all picks would re-render every consumer on every change, even unrelated ones. Requires `useMemo`/`useCallback` everywhere to mitigate.

❌ **Still needs window events for IDB**: Context doesn't solve the "how do components know IDB changed?" problem. Would need Context + window events → more complexity, not less.

✅ (Context IS used for i18n: `useI18n` uses a Context provider because language is read-only, changes rarely, and all components need it.)

---

## The Event-Driven Pattern

### Event Constants

Defined in `src/lib/db.ts`:

```typescript
export const PICKS_CHANGED_EVENT      = 'viralatas:picks-changed';
export const CREW_USERS_CHANGED_EVENT = 'viralatas:crew-users-changed';
export const PRESENCE_CHANGED_EVENT   = 'viralatas:presence-changed';
export const ANNOUNCEMENTS_CHANGED_EVENT = 'viralatas:announcements-changed';
export const METAL_PLACE_CONFIG_CHANGED_EVENT = 'viralatas:metal-place-config-changed';
export const LIVE_BAND_TEST_CONFIG_CHANGED_EVENT = 'viralatas:live-band-test-config-changed';
export const MISSED_CHANGED_EVENT     = 'viralatas:missed-changed';
export const BLOCKED_POSTERS_CHANGED_EVENT = 'viralatas:blocked-posters-changed';
```

### Emission (Repository Layer)

```typescript
// src/lib/db.ts
export async function saveUserPick(pick: UserPick) {
  const db = await getDB();
  await db.put('user_picks', pick);
  window.dispatchEvent(new Event(PICKS_CHANGED_EVENT));  // ← Notify all subscribers
}
```

### Subscription (Hook Layer)

```typescript
// src/hooks/useMyPicks.ts
export function useMyPicks(userId: string): Set<string> {
  const [pickedIds, setPickedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      const picks = await loadUserPicks(userId);
      setPickedIds(new Set(picks.map(p => p.band_id)));
    }

    load();
    window.addEventListener(PICKS_CHANGED_EVENT, load);
    return () => window.removeEventListener(PICKS_CHANGED_EVENT, load);
  }, [userId]);

  return pickedIds;
}
```

### Result

When any component calls `picksRepository.toggle()`:
1. IndexedDB is updated
2. `PICKS_CHANGED_EVENT` is dispatched
3. Every component using `useMyPicks`, `usePickCounts`, `useBandAttendees`, `useNowData` re-fetches from IDB
4. All components re-render with consistent data

---

## When NOT to Use This Pattern

This pattern is optimal for **IDB-synced data** with **multiple independent readers**. Avoid it for:

- **Multi-page state that doesn't come from IDB** (e.g., a multi-step wizard form): Use local `useState` or a small Zustand store.
- **Complex derived state with many consumers** (e.g., shopping cart + discounts + tax + shipping): Zustand or Redux are better.
- **Real-time collaborative editing** (e.g., two users editing the same announcement): Need CRDT or server-side locking.

---

## Consequences

### Positive

✅ No global store to initialize or mock in tests
✅ Each hook is self-contained and independently testable
✅ Zero-boilerplate: new data type → new IDB store + event constant + hook → done
✅ Event-driven decoupling: repositories and hooks are completely independent
✅ Realtime writes to IDB in repositories; hooks subscribe to window events only — same refresh path for local and remote updates
✅ Small bundle size: 0 extra state management dependencies

### Negative

❌ **No time-travel debugging**: Can't replay state transitions in Redux DevTools.
❌ **No centralized state inspection**: State is distributed across hook instances; `console.log` or DevTools are needed.
❌ **Window event naming discipline**: If two features accidentally share an event name, they interfere. Prevented by the `viralatas:` namespace prefix.
❌ **Multiple re-reads on bulk updates**: If 20 picks are saved in a loop, `PICKS_CHANGED_EVENT` fires 20 times. Each hook re-fetches IDB 20 times. Mitigated by React batching and fast IDB reads.
❌ **`useEffect` pitfalls**: Subscription cleanup must be correct. Missing cleanup causes memory leaks and stale listeners. Requires careful `return () => removeEventListener(...)` discipline.
❌ **Cross-tab sync**: Window events don't fire across browser tabs. If the user has two tabs open, picks in tab A don't update tab B. Realtime subscriptions handle this for pick counts, but not for all event types.

---

## Tradeoffs Accepted

### No Time-Travel Debugging
**Tradeoff**: Can't inspect state history with Redux DevTools.
**Acceptance**: State history is irrelevant for eventual-consistency data. The source of truth (IndexedDB) is always inspectable via DevTools → Application → IndexedDB.

### Event Name Discipline
**Tradeoff**: Window events are global; naming collisions are possible.
**Acceptance**: All events are defined as constants in `db.ts` with the `viralatas:` namespace. Naming discipline is enforced by code review.

### Multiple IDB Reads on Bulk Updates
**Tradeoff**: Bulk inserts trigger N events and N IDB reads.
**Acceptance**: IDB reads are fast (<1ms for indexed key lookups). React batches renders. Not a performance problem for small groups.

---

## Implementation Details

### Hook Lifecycle Pattern

Every data hook follows this pattern (Realtime is **not** mounted in hooks):

```typescript
export function useX(params): X {
  const [data, setData] = useState<X>(initial);

  useEffect(() => {
    async function refresh() {
      const data = await loadX();  // IDB read
      setData(data);
    }

    refresh();                                       // Initial load
    window.addEventListener(X_CHANGED_EVENT, refresh); // IDB subscription

    return () => {
      window.removeEventListener(X_CHANGED_EVENT, refresh);
    };
  }, [params]);

  return data;
}
```

### IDB Subscription Caches (Phase 27.F)

When multiple hooks read the same IDB store on the same window event, each hook previously re-fetched independently. **`useIdbSubscription`** (backed by `useSyncExternalStore`) maintains a module-level cache per key: one event listener, one IDB read, many React subscribers.

```typescript
// src/hooks/useAllPicks.ts
export function useAllPicks(): UserPick[] | undefined {
  return useIdbSubscription({
    key: ALL_PICKS_CACHE_KEY,
    events: [PICKS_CHANGED_EVENT],
    loader: loadAllUserPicks,
  });
}

// Derived hooks consume cache — no duplicate listeners
export function usePickCounts(): Record<string, number> {
  const allPicks = useAllPicks();
  return useMemo(() => countPicks(allPicks ?? []), [allPicks]);
}
```

Window events remain the cross-component signal; the cache layer only deduplicates IDB reads within a tab.

---

### Realtime Subscription Site (Phase 27.D)

Supabase Realtime → IndexedDB writes live in **repository `subscribeToRealtime()` methods**, mounted once by **`RealtimeSync`** in the sync layer (`SyncOrchestration`). Hooks never call `subscribePostgresChanges` directly.

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

### Realtime + Window Event Integration

Realtime subscriptions write to IDB (via repositories), which emits a window event, which the hook handles. There is no special Realtime code path in hooks — Realtime just updates IDB like any other write.

```
Realtime: postgres_changes INSERT
  → picksRepository handler → saveUserPick(payload.new)  [IDB write]
  → PICKS_CHANGED_EVENT        [window event]
  → usePickCounts.refresh()    [IDB read]
  → setState(newCounts)        [React update]
```

---

## Related Decisions

- **ADR: IndexedDB as Primary Store** — The reason window events are needed (IDB mutations happen outside React)
- **ADR: Supabase as Sync Target** — Realtime subscriptions feed into the same window event pipeline

---

## Revision History

- **2026-05-25**: Phase 27.H — Band sync folded into `bandsRepository.sync()`; removed `src/lib/sync.ts` pass-through
- **2026-05-25**: Phase 27.F — IDB subscription caches (`useIdbSubscription`, `useAllPicks`) deduplicate IDB reads across derived hooks
- **2026-05-25**: Phase 27.D — Realtime subscription site moved from hooks to sync layer (`RealtimeSync` + repository `subscribeToRealtime()`)
- **2026-05**: Initial decision, accepted based on project requirements

---

**Last updated:** 2026-05-25
