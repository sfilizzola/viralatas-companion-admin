# Testing Strategy

## Purpose

Document testing approach, test organization, offline scenario testing, and how to verify synchronization guarantees.

---

## Relevant Source Files

- `src/__tests__/` — All test files (**53 files**, **599 tests** as of Phase 31 close)
- `vitest.config.ts` — Test runner configuration
- `package.json` — Test scripts (`test`, `test:coverage`) and seed scripts (`seed:bands`, `seed:bands:sync`, `seed:bands:backfill-slot-id`, `seed:bands:move`, `seed:test-users`, `seed:live-now`, `festival:reset`)
- `supabase/seed/` — Seed scripts for test data and the destructive `festival-reset.ts` operator script (see `docs/ai-wiki/festival-reset.md`)

---

## Test Categories

### 1. Unit Tests

**Location**: `src/__tests__/*.test.ts`

**Focus**: Business logic, utilities, functions with clear inputs/outputs.

| Test File | Coverage |
|-----------|----------|
| `registration.test.tsx` | `getRegistrationEnabled`, `RegisterPage` signup flow and form constraints |
| `login.test.tsx` | `useAuth` hook, `LoginPage` sign-in and profile verification |
| `auth-integration.test.ts` | IDB auth storage, trigger metadata contract, mocked signup → profile flow |
| `db.test.ts` | IndexedDB layer (Phase 26.N): session, catalog, picks, presence, announcements, missed, config, duck, meta, events, wipe |
| `useBands.test.ts` | Catalog hook: IDB load + `BANDS_CHANGED_EVENT` refresh (26.C) |
| `usePickActions.test.ts` | Pick toggle wrapper delegating to `picksRepository` (26.E) |
| `useMissedBands.test.ts` | Deduped missed-band load/sync/realtime (26.D) |
| `useBandDetailModal.test.ts` | Shared band detail modal state (26.F) |
| `useAnnouncements.test.ts` | Announcements mural hook: IDB, events, moderation (26.K) |
| `announcementsDisplay.test.ts` | Pure display helpers for announcements (26.K) |
| `useBadgeContext.test.ts` | Badge context from crew IDB, location counts, persist metadata (Phase 31 IDB-only display) |
| `socialSnapshot.test.ts` | Pure `buildSocialSnapshot()` derivation (Phase 31) |
| `useSocialSnapshot.test.ts` | Shared IDB cache hook (Phase 31) |
| `stackLayout.test.ts` | Vest collapsed scatter layout math (26.I) |
| `persistMetadata.test.ts` | `mergedPersistedBadgeSlugs`, `persistMetadataPatch` dual-key persist |
| `useNowData.test.ts` | `/now` composable hook: presence toggle, skip/undo, duck gating (26.M) |
| `realtimeSync.test.ts` | `subscribePostgresChanges()` channel setup/cleanup (26.H) |
| `schedule.test.ts` | Band filtering, sorting, time logic |
| `time.test.ts` | Festival day calculation, time utilities, formatting |
| `useBandConflicts.test.ts` | Conflict detection, overlap logic, severity |
| `livePreview.test.ts` | Live plan math, presence grouping, `derivePresenceValue`, `computeCrewLocationCounts` |
| `liveNowScenarios.test.ts` | Table-driven Live Now scenarios: multi-band crew layout, camping/Metal Place/lost transitions |
| `badges.test.ts` | Badge condition evaluation + registry integration (incl. lost `crew_at_location_min`) |
| `missed.test.ts` | Marking bands as seen/missed |
| `BandCard.test.tsx` | Component rendering, user interactions |
| `bandTime.test.ts` | Band overlap/conflict logic, current/next band calc (`bandTime.ts`) |
| `bandFilter.test.ts` | Schedule filter predicate: stage, genre, day, time, search (`bandFilter.ts`) |
| `scheduleFilterStorage.test.ts` | localStorage persistence for schedule filter state (`scheduleFilterStorage.ts`) |
| `deduplicatePickQueue.test.ts` | Queue deduplication (keepLast semantics) as pure function (`picks.ts`) |
| `attendees.test.ts` | `computeAttendees()` mapping picks → hydrated `BandAttendee[]` per band (`attendees.ts`) |
| `stageColors.test.ts` | Stage-name → CSS color mapping, fallback for unknown stages (`stageColors.ts`) |
| `i18n.test.ts` | Translation key completeness across `br`/`en` locale files |
| `picksRepository.test.ts` | `toggle()` online/offline/error, `flushOfflineQueue()` dedup/routing, `syncCrewFromRemote()` (26 tests) |
| `presenceRepository.test.ts` | `setCampingStatus()` online/offline, `isTimeWithinMetalPlaceWindow()` boundary, `validateAndAutoCheckout()` (11 tests) |
| `announcementsRepository.test.ts` | Online post, offline queue, `flushPendingAnnouncements()` (7 tests) |
| `usersRepository.test.ts` | Crew sync incl. `special_badges`, auth metadata hydration, role map, block/unblock (13 tests) |
| `bandsRepository.test.ts` | `checkAndApplyCacheVersion()` match/mismatch/no-data (3 tests) |
| `missedRepository.test.ts` | Mark/unmark missed band online and offline (4 tests) |
| `festivalWrap.test.ts` | `buildFestivalWrapStats()` badge parity, crew Jaccard, assigned slugs, avatar URLs (Phase 30) |
| `wrapDismiss.test.ts` | `viralatas:wrap-dismissed-2026` dismiss key round-trip (Phase 30) |

**Coverage**: **599 tests** across **53** test files (Phase 31 social snapshot + Phase 30 wrap)

**Run**:
```bash
npm test                # Run all tests
npm test:coverage       # With coverage report
npm test -- <file>      # Run specific test file
```

---

### 2. Integration Tests

**Approach**: Test full flows through repositories + IndexedDB

**Not in separate files** — Some unit tests function as integration tests (e.g., auth-integration.test.ts exercises the full Supabase + session flow).

**Key flows tested**:
- User signup + login + session persistence
- Pick toggle + cache read
- Conflict detection across multiple picks
- Time-based filtering

---

### 3. Offline Scenario Testing

**Manual testing** (not automated):

#### Test 1: Offline Pick Sync

```
Setup:
1. Open app, login
2. Navigate to /schedule
3. DevTools → Network → Offline

Test:
1. Pick a band
2. Verify:
   - Band appears picked in UI immediately
   - No network request made
   - OfflineBanner shows "🚫 Offline"
   - PendingChip appears on band card (if implemented)
3. Toggle the band (pick again)
4. Verify:
   - UI updates immediately (toggled to unpicked)
   - Still offline, no network request
5. Switch to /my-picks
6. Verify:
   - User's pick changes are visible
   - No crash, no errors

Cleanup:
1. DevTools → Network → Online
2. Verify:
   - SyncToast appears (if any queued items)
   - Band state matches final offline toggle
3. Open app in another tab
4. Verify:
   - Other user sees the final state (no duplicates, no contradictions)
```

#### Test 2: Offline Announcement Post

```
Setup:
1. Open app, login
2. Navigate to /announcements
3. DevTools → Network → Offline

Test:
1. Type a message
2. Tap "Post"
3. Verify:
   - Message appears immediately
   - PendingChip shows "⏳ Pending"
   - No network request made
4. Type another message and post
5. Verify:
   - Both messages visible, both with pending chip

Cleanup:
1. DevTools → Network → Online
2. Verify:
   - SyncToast shows "✓ Synced 2 items"
   - Both pending chips disappear
   - Timestamps unchanged (still reflect offline post time)
3. Refresh page
4. Verify:
   - Both messages still visible (not re-fetched from server, they're in IDB)
5. Open app in another tab
6. Verify:
   - Both messages appear in other tab's feed within ~3s (via Realtime)
```

#### Test 3: Queue Deduplication

```
Setup:
1. Open app, login
2. DevTools → Network → Offline
3. Pick a band (appears as pending)

Test:
1. Toggle the band multiple times offline:
   - Pick → Unpick → Pick → Unpick → Pick
2. Verify:
   - UI updates immediately each time
   - OfflineBanner shows
3. DevTools → Network → Online
4. Verify:
   - SyncToast shows "✓ Synced X items" (should be 5, or 1 if deduped)
   - Final state matches last toggle (picked)
5. Check browser console (optional):
   - const queue = await db.getAll('offline_picks')
   - console.log(queue.length)  // Should be 0 after sync
```

#### Test 4: Offline Cache Expiration

```
Setup:
1. Login, browse /schedule
2. Cache band list (happens on init)
3. DevTools → Network → Offline
4. Refresh page

Test:
1. Verify:
   - App loads immediately (Service Worker + IndexedDB)
   - Band schedule visible
   - Crew attendance shown (stale from last sync)
2. Tap a band card
3. Verify:
   - Detail modal opens
   - All band info available (no blank fields)
4. Offline for 1+ hours
5. User tries to sync cache
6. Verify:
   - If cache version updated on server, local data wiped on next 'online'
   - Fresh fetch triggered
```

---

## Test Running

### Commands

```bash
# Run all tests
npm test

# Run with coverage
npm test:coverage

# Run specific file
npm test -- registration.test.ts

# Watch mode
npm test -- --watch

# Debug mode
npm test -- --inspect-brk
```

### Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('feature', () => {
  beforeEach(() => {
    // Setup (clear IDB, mock fetch, etc.)
  });

  afterEach(() => {
    // Cleanup
  });

  it('should do something', () => {
    // Arrange
    const input = ...;

    // Act
    const result = doSomething(input);

    // Assert
    expect(result).toBe(expected);
  });
});
```

---

## Testing Offline-First Behavior

### Simulation Techniques

#### 1. Mock navigator.onLine

```typescript
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: false,
});

// ... run offline test ...

navigator.onLine = true;  // Restore
```

#### 2. Mock IndexedDB

Use a real IDB in tests (vitest can access real IDB):
```typescript
const db = await openDB('test-db', 1, { ... });
```

#### 3. Mock Supabase

```typescript
vi.mock('src/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ data: [] })),
      })),
      upsert: vi.fn(async () => ({ error: null })),
      delete: vi.fn(async () => ({ error: null })),
    })),
  },
}));
```

---

## Live Now Scenario Tests

**Location**: `src/__tests__/liveNowScenarios.test.ts` + `src/__tests__/fixtures/liveNowScenarios.ts`

These tests exercise the `/now` derivation pipeline without mounting React or Supabase:

```
bands + picks + presence + now
  → mapCrewLivePlans → groupCrewLivePlans   (crew layout)
  → findLivePlan → applyPresenceToLivePlan  (focus user card)
  → derivePresenceValue                     (PresenceToggle value)
```

**Run only scenario tests:**

```bash
npm test -- liveNowScenarios.test.ts
```

**Adding a new scenario:**

1. Build fixtures with `scenarioBand`, `scenarioUser`, `scenarioPick`, `scenarioPresence` (or extend `threeBandLiveFixture()`).
2. Call `runLiveNowScenario({ bands, users, picks, presence, focusUserId, metalPlaceWindowActive, ... })`.
3. Assert with `assertLiveNowExpectations(result, { myGroupKind, presenceValue, groupMemberCounts, ... })`.

**Transition flows** (multi-step): run `runLiveNowScenario` once per step with updated `presence` / `now` / `metalPlaceWindowActive`.

**Documented behaviors under test:**

| ID | Flow | Expected end state |
|----|------|-------------------|
| T1 | camping → Metal Place → event ends or quit | **Lost** — camping is not restored unless user toggles it |
| T1b | camping → Metal Place → manual quit (toggle off) | Lost, not camping |
| T2 | lost → Metal Place → leave | Lost |
| T3 | at Metal Place → band goes live → leave MP | Current band group |
| T4 | camping flag + current band | `presenceValue: auto`, band group |
| T9 | at Metal Place while picked band is live | MP group + `myPlan` lost (band overridden); `myRawPlan` still current |
| T5 | stale MP flag + event over + live picked band | Band group, MP group hidden |
| T7 | stale MP flag + event over + no picks | Lost, MP group hidden |
| T8 | stale MP flag + event over + future pick only | Lost (with nextBand), MP group hidden |
| T6 | friend off-stage | Hidden from camping/lost |

Pure helpers live in [`src/services/livePreview.ts`](../src/services/livePreview.ts): `derivePresenceValue`, `findUserCrewGroup`, `applyPresenceToLivePlan`, `groupCrewLivePlans`.

---

## Key Test Scenarios

### Scenario 1: Sync Deduplication

```typescript
// Test: Queue deduplication on flush
it('should deduplicate offline picks', async () => {
  // 1. Queue 5 pick/unpick operations
  await enqueueOfflinePick({...action: 'add'});
  await enqueueOfflinePick({...action: 'remove'});
  await enqueueOfflinePick({...action: 'add'});
  await enqueueOfflinePick({...action: 'remove'});
  await enqueueOfflinePick({...action: 'add'});

  // 2. Flush queue
  const flushed = await picksRepository.flushOfflineQueue();

  // 3. Verify only 1 Supabase call made (last action)
  expect(supabaseSpy).toHaveBeenCalledTimes(1);
  expect(supabaseSpy).toHaveBeenCalledWith('add');

  // 4. Verify all 5 queue entries removed
  const remaining = await loadOfflineQueue();
  expect(remaining).toHaveLength(0);

  // 5. Verify flushed count (5 ops, 0 or 1 calls?)
  expect(flushed).toBe(5);  // All entries removed
});
```

### Scenario 2: Offline Write Fallback

```typescript
it('should queue pick when offline', async () => {
  navigator.onLine = false;

  const userId = 'test-user';
  const bandId = 'test-band';

  await picksRepository.toggle(userId, bandId, false);

  // Verify pick was written to IDB
  const picks = await loadUserPicks(userId);
  expect(picks).toContainEqual({ user_id: userId, band_id: bandId });

  // Verify operation was queued
  const queue = await loadOfflineQueue();
  expect(queue).toHaveLength(1);
  expect(queue[0]).toEqual({
    action: 'add',
    user_id: userId,
    band_id: bandId,
  });

  // Verify Supabase was not called
  expect(supabaseSpy).not.toHaveBeenCalled();
});
```

### Scenario 3: Realtime Update

```typescript
it('should update IndexedDB on Realtime event', async () => {
  // 1. Start subscription
  const hook = renderHook(() => usePickCounts());

  // 2. Simulate Realtime event (INSERT)
  const mockPayload = {
    new: { user_id: 'other-user', band_id: 'band-1', created_at: now },
  };
  realtime_channel.on_postgres_changes_INSERT_handler(mockPayload);

  // 3. Verify IndexedDB updated
  const picks = await loadAllUserPicks();
  expect(picks).toContainEqual(mockPayload.new);

  // 4. Verify hook state updated
  expect(hook.result.current).toEqual({ 'band-1': 1 });
});
```

---

## Testing Badges

Badge conditions are evaluated purely on client-side data:

```typescript
it('should unlock badge for 3+ Wacken years', () => {
  const user = {
    wacken_years: [2018, 2019, 2022],
    ...
  };

  const badge = BADGES.find(b => b.slug === 'wacken_veteran');
  const unlocked = evaluateCondition(badge.condition, user);

  expect(unlocked).toBe(true);
});
```

---

## Testing Time Logic

Time-based tests use the `useNow()` override:

```typescript
it('should show band as live when now equals start_time', () => {
  // Override time to 18:30 (band start)
  localStorage.setItem('viralatas:override-now', '2026-07-29T18:30:00Z');

  const { result } = renderHook(() => useNow());
  expect(result.current.now).toEqual(new Date('2026-07-29T18:30:00Z'));

  // Verify band appears as current
  const currentBand = getCurrentBand(...);
  expect(currentBand).toEqual(slipknot);
});
```

---

## What's NOT Tested

- **Realtime subscription lifecycle** — Workbox SW interactions (browser-specific)
- **PWA manifest** — Served by build tool, not testable in vitest
- **Service Worker caching** — Would require browser environment (e.g., Playwright)
- **UI visual regression** — No screenshot tests (manual or future snapshot tests)
- **Accessibility** — Not automated (manual a11y review recommended)

---

## Recommended Manual Tests (Pre-Release)

- [ ] Login on multiple devices simultaneously (session consistency)
- [ ] Offline at festival (full workday without signal)
- [ ] Browser storage quota exceeded (graceful degradation)
- [ ] App in background, Realtime updates (does it still work?)
- [ ] Hard refresh (Ctrl+F5) with offline data (preserved?)
- [ ] Multiple tabs open, pick in one, see in other
- [ ] Clear IndexedDB mid-session (redirects to login)
- [ ] Very old browser (CSS variables, IndexedDB support)
- [ ] **Festival reset dry-run on staging** — `npm run festival:reset -- --dry-run` prints accurate pre-flight counts and writes nothing. See `docs/ai-wiki/festival-reset.md`.
- [ ] **Festival reset on staging with bands** — `npm run festival:reset -- --with-bands --force` wipes pre-festival activity, strips persistent badge keys from `auth.users` metadata (positive-strip pattern), bumps `public.app_config.cache_version`, and re-seeds the lineup. Verify a connected client picks up realtime DELETEs and re-fetches on next reload.

---

## Open Questions

- Should we add E2E tests (Playwright) for full flows?
- Should Realtime subscriptions be mocked or use test Supabase instance?
- Should we test against real Wacken lineup or mock bands?
- How to test Service Worker caching behavior?

---

**Last updated:** 2026-05-28 — Phase 31: 599 tests, 53 files; socialSnapshot + useSocialSnapshot tests.
