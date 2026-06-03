# Flow: Live Now Display

## Purpose

Document how the app displays the current/next band for each crew member, including time-based band selection logic, conflict detection, crew grouping, presence states, and godlike test mode.

---

## Relevant Source Files

| File | Role |
|---|---|
| `src/pages/RightNowPage.tsx` | `/now` route shell |
| `src/hooks/useNowData.ts` | Thin composer — wires config, cache, plans, presence side effects, weak-skip commit timer (Phase 26.M); calculates `nextBand` and `timeDelta` (Phase 37) |
| `src/services/weakSkips.ts` | Committed “I am weak” counter in `user_metadata.weak_skips_2026` |
| `src/hooks/useNowCache.ts` | IDB cache load + window event listeners for picks/crew/presence/announcements |
| `src/hooks/useNowPlans.ts` | Live plan memos (`myPlan`, `crewPlans`, `crewGroups`, `duckBandId`, …) |
| `src/hooks/useMetalPlaceConfig.ts` | Metal Place config IDB + window events (Realtime via `RealtimeSync`) |
| `src/hooks/useLiveBandTestConfig.ts` | Live band test config IDB + window events (Realtime via `RealtimeSync`) |
| `src/components/sync/RealtimeSync.tsx` | Mounts repository Realtime subscriptions (Phase 27.D) |
| `src/components/now/UpcomingBandCard.tsx` | Dismissible 15-minute pre-show banner (Phase 37) |
| `src/repositories/presence.ts` | `applyPresenceToggle`, `autoClearCampingOnCurrentBand`, `validateAndAutoCheckout` |
| `src/services/livePreview.ts` | `findLivePlan`, `mapCrewLivePlans`, `groupCrewLivePlans`, `computeCrewLocationCounts` |
| `src/lib/realtimeSync.ts` | `subscribePostgresChanges()` helper (Phase 26.H) |

---

## Trigger

1. **Page load** → `/now` route initializes
2. **Every 30 seconds** → `useNow()` hook updates `now` state (via `setInterval`)
3. **Time override changes** → Godlike adjusts test date via Profile admin panel

---

## Time Model: Festival-Local Hours

All band times stored in **UTC** (`start_time`, `end_time`). Wacken is in **Central European Summer Time (CEST)**, UTC+2.

Conversion in `bandTime.ts`:
```typescript
function formatTime(iso: string): string {
  const d = new Date(iso);
  const cest = new Date(d.getTime() + 2 * 60 * 60 * 1000);  // Add 2 hours
  const h = String(cest.getUTCHours()).padStart(2, '0');
  const m = String(cest.getUTCMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}
```

**Example**:
- Band start_time: `2026-07-29T18:00:00Z` (UTC)
- Festival time: `20:00` (CEST)
- Display: `20:00`

---

## Happy Path (Online): User Loads /now Page

```
User taps /now route
                    │
                    ▼
        RightNowPage component mounts
                    │
                    ▼
   useNowData() composes (Phase 26.M):
     - useBands() → bands from IndexedDB
     - useNowCache() → picks, crewUsers, presence, latestAnnouncement
     - useMetalPlaceConfig() / useLiveBandTestConfig()
     - usePresenceRealtime() → user_presence Realtime → IDB
     - useNowPlans() → myPlan, crewPlans, crewGroups, duckBandId
     - useNow() → current time (localStorage override or Date.now())
                    │
                    ▼
   ┌─────────────────────────────────────┐
   │ Step 1: Calculate User's Live Plan  │
   └─────────────────────────────────────┘
                    │
        ┌───────────┴──────────────────┐
        ▼                              ▼
   Load user picks          Apply live band test:
   for current user         if liveBandTestConfig.enabled
   (Set<band_id>)           && liveBandTestConfig.band_id
        │                              │
        ▼                              ▼
   Call findLivePlan(                Create virtual band:
     bands,                          original_band = find(band_id)
     picks,                          duration = end - start
     now,                            virtual = {
     liveTestBandId                    ...original,
   )                                   start: now - 5min
                                        end: now - 5min + duration
   ┌─────────────────────────────────────┐
   │ Inside findLivePlan()               │
   └─────────────────────────────────────┘
                    │
        ┌───────────┴──────────────────────┐
        ▼                                  ▼
   Filter: only user's         Search for CURRENT:
   picked bands, sorted        band where:
   by start_time ASC             start_time <= now
                                 && now < end_time
                    │
                    ▼
           Found?
           │
     ┌─────┴──────────────┐
     ▼ YES                ▼ NO
   return {             Search NEXT:
     status: 'current', band where:
     band: current        start_time > now
   }                      (first one, ASC)
                            │
                            ▼
                        Found?
                        │
                    ┌───┴────────┐
                    ▼ YES        ▼ NO
                  return {      return {
                    status: 'next', status: 'empty',
                    band: next    band: null
                  }            }
                    
   ┌─────────────────────────────────────┐
   │ Step 2: Apply Presence Override     │
   └─────────────────────────────────────┘
                    │
        ┌───────────┴──────────────┐
        ▼                          ▼
   Load user presence      applyPresenceToLivePlan():
   (camping, at_metal_place)
                    │
        ┌───────────┴──────────────────────┐
        ▼                                  ▼
   If status = 'current'     If camping
   (watching now)            or status = 'next'
        │                    (waiting)
        ▼                         │
   return plan as-is         ▼ Override status
   (user IS watching)        return {
                               status: 'lost',
                               band: null,
                               nextBand: plan.band
                             }
                             (User is camping,
                              not at the band)
   
   ┌─────────────────────────────────────┐
   │ Step 3: Group Crew Members          │
   └─────────────────────────────────────┘
                    │
   mapCrewLivePlans():
     - Collect all crew + user
     - For each: calculate plan (same as above)
     - Sort by band start_time, then by name
                    │
                    ▼
   Result: CrewLivePlan[] =
   [
     { user: alice, plan: {current, band: Slipknot}, camping: true },
     { user: bob, plan: {next, band: Kreator}, camping: false },
     { user: charlie, plan: {lost, band: null}, camping: true },
     ...
   ]
                    │
   ┌──────────────────────────────────────┐
   │ Step 4: Group Crew by Location       │
   └──────────────────────────────────────┘
                    │
   groupCrewLivePlans():
     For each crew member:
       1. Check if at_metal_place
          && isTimeWithinMetalPlaceWindow(config, now)
          → Add to metalPlaceGroup
       2. Else if status='current' && band
          → Add to bandGroups[band.id]
       3. Else if camping
          → Add to campingGroup
       4. Else
          → Add to lostGroup
                    │
                    ▼
   Sort each group alphabetically
   
   CrewLiveGroup[] output:
   [
     { band: Slipknot, members: [alice, ...] },
     { band: Kreator, members: [bob, ...] },
     { camping, members: [charlie, ...] },
     { metal_place, members: [dave, ...] },  // If active
     { lost, members: [eve, ...] }
   ]
                    │
                    ▼
   ┌──────────────────────────────────────┐
   │ Step 5: Render to User               │
   └──────────────────────────────────────┘
                    │
   RightNowPage displays:
     - Header: current time (Wacken CEST)
     - Presence toggle: camping / metal place / auto
     - UpcomingBandCard (if within 15-min window, see below)
       OR LatestAnnouncementBanner (if no upcoming card)
     - Badges: user's earned badges
     - CrewGroupsSection:
       For each group:
         - Group header (band name, stage, time)
         - Member avatars + names
         - (Metal Place: conditional)
                    │
                    ▼
   User sees current/next bands and crew
   locations updated live every 30s
```

**Timeline**:
- T=0ms: User navigates to /now
- T=50ms: IndexedDB queries complete
- T=100ms: Plans calculated
- T=150ms: UI renders crew groups
- T=30000ms: useNow() updates, recalculates
- T=30100ms: Components re-render with new band/plan

---

## Weak skip (“I am weak”)

When the user is on their **current live picked band**, `CrewGroupsSection` shows **souFraco** (“I am weak”). This is separate from the duck button and from generic unpicks on schedule cards.

```
User taps "I am weak"
        │
        ▼
handleSkip (useNowData)
  ├─ commit previous pending weak skip (if re-skip before timer)
  ├─ unpickBand → picksRepository → IndexedDB (existing path)
  ├─ undo toast (5s) + undo timer
  └─ commit timer (5s)

commit timer fires:
  ├─ loadUserPicks(userId) from IndexedDB
  ├─ if band still unpicked → recordCommittedSkip(userId, bandId)
  └─ else → no count (e.g. user re-picked via schedule card)

handleUndo (within 5s):
  ├─ cancel commit timer
  ├─ pickBand → picksRepository
  └─ no counter increment
```

**Isolation:** `togglePick`, `BandDetailModal`, and `ConflictSection` never call `recordCommittedSkip()`.

**Storage:** `user_metadata.weak_skips_2026` via best-effort `auth.updateUser` — same family as `location_visits`. No badge registry entries yet; festival reset strip deferred. See `docs/superpowers/specs/2026-05-26-weak-skip-counter-design.md`.

---

## Upcoming Band Card (Phase 37)

A dismissible full-width banner that appears on `/now` when the user's next picked band starts within **15 minutes** and the user is not currently watching a band (`myPlan.status !== 'current'`).

### Visibility Logic

```
timeDelta = (nextBand.start_time - now) / 60_000   // ms → minutes

show card when:
  nextBand !== null
  && !dismissedBandIds.has(nextBand.id)        // not dismissed this session
  && myPlan.status !== 'current'               // not already at a band
  && timeDelta >= 0                            // band hasn't started yet
  && timeDelta <= 15                           // within 15-minute window
```

`nextBand` is computed in `useNowData` as the earliest user-picked band whose `start_time > now` when `myPlan.status !== 'current'`:

```typescript
const nextBand = useMemo(() => {
  if (myPlan.status === 'current' || !userId) return null;
  const upcomingBands = picks
    .filter((pick) => pick.user_id === userId)
    .map((pick) => bands.find((b) => b.id === pick.band_id))
    .filter((b): b is Band => b !== undefined && b.start_time > now.toISOString())
    .sort((a, b) => a.start_time.localeCompare(b.start_time));
  return upcomingBands[0] ?? null;
}, [picks, bands, myPlan.status, userId, now]);
```

### Card Anatomy

```
┌──────────────────────────────────────────────────────┐
│▌ BAND NAME                         [Upcoming]   [✕] │
│  ██Stage██  22:00     3 going                        │
└──────────────────────────────────────────────────────┘
│ ──── QuackStrip (if duck enabled) ─────────────────  │
└──────────────────────────────────────────────────────┘
```

- **Left stripe** — 4 px, colored with `stageColor(nextBand.stage)`, same palette as CrewGroupsSection cards.
- **Gradient background** — dark elevated surface from `--bg-elevated`.
- **Name row** — band name (`var(--font-display)`, uppercase) + gold "Upcoming" badge.
- **Meta row** — colored stage pill + formatted start time (`formatFestivalTime`) + crew going count (hidden when 0).
- **Dismiss button** — absolute top-right `✕`; taps do NOT propagate to the expand toggle.
- **Crew going** — `crewMembers` is filtered from `crewPlans` (members whose `plan.band?.id` or `plan.nextBand?.id` matches `nextBand.id`).

### Expand / Collapse

Clicking anywhere on the card body (except the dismiss button) toggles `isExpanded`. When expanded, a drawer below the card lists all `crewMembers` with avatar + name rows; the current user's row is visually highlighted and annotated with a "you" tag.

### Dismiss Behavior

Dismissal is **session-only** (React `useState<Set<string>>`). After dismiss:
- The card disappears.
- If there is a `latestAnnouncement` and `myPlan.status !== 'current'`, the `LatestAnnouncementBanner` replaces the card slot.
- Navigating away and back resets `dismissedBandIds`, so the card reappears if still within window.

### Priority / Slot Sharing

The upcoming card and the announcement banner share the same render slot. Priority:
1. **UpcomingBandCard** — if `nextBandInWindow` is truthy.
2. **LatestAnnouncementBanner** — otherwise, if an announcement exists and user not currently at band.
3. **Nothing** — if neither condition holds.

### QuackStrip

`UpcomingBandCard` accepts an optional `onDuck` prop. When duck is enabled (`useDuckEnabled()`), `RightNowPage` passes `nextDuckQuack` (a `useDuckQuack(userId, nextBand.id)` instance distinct from the current-band duck) so users can quack the upcoming band before it starts.

### Offline Behavior

The card is entirely derived from IndexedDB data (`picks`, `bands`, `now`). It renders correctly offline — no network calls required. There is no separate persistence for dismissed IDs; dismiss state resets on reload.

---

## Current vs. Next Band Selection

### Current Band Algorithm

```
Given: now (current time), picks (user's band IDs)

1. Filter bands to only user's picks
2. Sort by start_time ASC
3. Find band where: start_time <= now < end_time
4. If multiple overlap (possible if bands have gaps < 1s):
   Sort by start_time DESC (most recent)
   Take first

Result: Band | null (null if no band is current)
```

**Why DESC sort on current?** Rare edge case: if two bands overlap and end at the same time, we want the one that started most recently (closest to `now`).

### Next Band Algorithm

```
Given: bands (user's picks, sorted)

After no 'current' found:
1. Find first band where: start_time > now
2. Return that band

Result: Band | null
```

---

## Conflict Severity (Hard vs. Soft)

From `useBandConflicts.ts`:

```
HARD_CONFLICT_THRESHOLD_MS = 15 minutes = 900,000 ms

Two bands on different stages overlap if:
  band_a.start_time < band_b.end_time
  && band_b.start_time < band_a.end_time

Overlap duration = min(aEnd, bEnd) - max(aStart, bStart)

severity = duration > 900_000 ms ? 'hard' : 'soft'
```

**Semantics**:
- **Soft conflict** (≤15 min): Could leave one band early to catch the other
- **Hard conflict** (>15 min): Cannot physically catch both; must choose

**Example**:
```
Slipknot:  20:00 - 20:45 (Faster stage)
Kreator:   20:20 - 21:05 (Harder stage)

Overlap:   20:20 - 20:45 = 25 minutes = HARD ✗

Metallica: 20:00 - 20:45 (Faster)
Dio:       20:35 - 21:00 (Harder)

Overlap:   20:35 - 20:45 = 10 minutes = SOFT ✓ (could skip last 10 min)
```

---

## Presence States: Camping vs. Metal Place

### Camping State

User is at festival grounds but not at a band stage:

```
presence.is_camping = true

If current band exists:
  → Status: 'current', band shown (at stage)
Else:
  → Status: 'lost', band: null (in campground)
```

**Auto-clear on current band**: When user starts watching (`status='current'`), app calls:
```typescript
presenceRepository.autoClearCampingOnCurrentBand(userId, isCamping, myRawPlanStatus)
```
which clears camping when both `isCamping` and `myRawPlanStatus === 'current'`.

**Manual toggle**: User taps route through `handlePresenceChange` → `presenceRepository.applyPresenceToggle(userId, nextValue, context)` with plan/presence context (`myRawPlanStatus`, `isAtMetalPlace`, `isCamping`).

### Metal Place Check-In Window

Godlike can configure a **time window** when a special venue ("Metal Place") is open:

```
metal_place_config = {
  festival_day: 1,        // Only on Day 1
  start_time: "18:00",    // 6 PM CEST
  end_time: "06:00",      // 6 AM CEST (next day)
  test_override_day: null
}

isTimeWithinMetalPlaceWindow(config, now):
  1. Check festival_day matches current day
  2. Convert now to Wacken wall-clock time
  3. Return: startTime <= wallClock < endTime
```

**Rendering**:
- If `is_at_metal_place && isTimeWithinMetalPlaceWindow()` → Show "Metal Place" group
- If window closed → Auto-checkout: set `is_at_metal_place = false`
- Group order: Bands → Camping → Metal Place (if active) → Lost

**Auto-checkout Validation** (`useNowData` effect → `presenceRepository.validateAndAutoCheckout`):
```typescript
useEffect(() => {
  validateAndAutoCheckout(metalPlaceConfig, userId)
    // Clears is_at_metal_place if outside window
}, [metalPlaceConfig, userId, isMetalPlaceWindowActive])
```

---

## Godlike Live Band Test Mode

Godlike user (via Profile admin panel) can test how Live Now displays a specific band as "currently playing":

### Test Mode Mechanics

```
liveBandTestConfig = {
  enabled: true,
  band_id: 'slipknot-uuid'
}

applyLiveBandTestOverride(bands, liveTestBandId, now):
  If enabled:
    1. Find original band by band_id
    2. Calculate duration: end - start
    3. Shift to wrap now:
       newStart = now - 5 minutes
       newEnd = newStart + duration
    4. Replace in bands array
    5. Return modified bands
  
  If disabled:
    Return bands unchanged
```

**Example**:
```
Original Slipknot: 20:00 - 20:45 (45 min duration)
Now (test): 14:30

Virtual Slipknot: 14:25 - 15:10
               (5 min before now, same 45 min duration)

User sees: Slipknot as CURRENT (15 min into set)
```

**Display**: Test banner shows at top of RightNowPage:
```
"🔬 Testing: Slipknot (shifted time)"
```

### Test Mode Impact

- Only affects `findLivePlan()` calculation
- Users who picked that band see it as current
- Other users unaffected
- Crew attendance counts include/exclude based on their picks

---

## Crew Grouping & Rendering

### Group Order

```
1. Live bands (sorted by start_time, then band name)
2. Camping (members not at any band, not at metal place)
3. Metal Place (if isTimeWithinMetalPlaceWindow && ≥1 member checked in)
4. Lost (members not at band, not camping, not at metal place)
```

### Member Sorting Within Groups

Alphabetical by `label = display_name || 'Vira-lata ' + id.slice(0,4).toUpperCase()`

### Avatar Clusters

`CrewGroupsSection` renders members as small avatar bubbles:
- Hover shows name
- Tinted background (stage color for band groups, specific colors for camping/lost)

---

## Realtime Updates: Crew Presence Changes

```
User opens /now
  ↓
usePresenceRealtime() (mounted by useNowData):
  subscribePostgresChanges('user_presence_live', { table: 'user_presence' })
  → saveUserPresence(payload.new || payload.old)
  ↓
When Bob checks into Metal Place:
  1. Bob's client: presenceRepository.setMetalPlaceStatus(bob_id, true)
  2. Supabase: user_presence row updated, is_at_metal_place = true
  3. Realtime event sent to all subscriptions
  ↓
Other users' clients:
  1. Receive payload: { new: { user_id: bob, is_at_metal_place: true, ... } }
  2. Save to IndexedDB
  3. Event emitted: window.dispatchEvent(viralatas:presence-changed)
  4. useNowCache() effect re-runs → picks/crew/presence state updates
  5. useNowPlans() recomputes crew groups (Bob now in metalPlaceGroup)
  6. UI updates within 3s (~1.5s median)
```

---

## Edge Cases

### 1. Band Ends Exactly at `now`

```
Band ends: 20:45:00
Now: 20:45:00

Condition: now < end_time?
  false (20:45:00 is NOT < 20:45:00)

Band is NOT current, marked as PAST.
Next band search begins.
```

**Fix**: Some apps use `<=` for end boundary, but we use strict `<` for clarity.

### 2. User Camping During Current Band

```
myRawPlan = { status: 'current', band: Slipknot }
isCamping = true

applyPresenceToLivePlan():
  if status === 'current': return as-is
  → Still shows Slipknot as current
  
Result: User claims to be watching despite camping flag.
This is an intentional UX choice:
- "Current" overrides camping
- If user is truly camping away, they see "Lost" instead
```

### 3. Multiple Bands Claimed as Current (Timezone Edge)

Theoretically impossible if bands don't overlap on the same stage. But overlap **across stages** is common:

```
Slipknot (Faster): 20:00 - 20:45
Kreator (Harder):  20:20 - 21:05

User picked both.
At 20:30, both are current.

findLivePlan():
  Filter: [Slipknot, Kreator] (both picked)
  Current candidates: [Slipknot, Kreator]
  Sort DESC by start_time: [Kreator (20:20), Slipknot (20:00)]
  Take first: Kreator
  
Result: Kreator shown as current (most recent start).
```

This is intentional: show the band the user most recently "decided" to watch.

### 4. Time Override: Godlike Testing

```
Godlike sets time to 2026-07-29 14:00
  → localStorage.setItem('viralatas-time-override', '2026-07-29T12:00:00Z')
  → window.dispatchEvent(TIME_OVERRIDE_CHANGED_EVENT)

useNow() hook:
  now() function checks override first:
  const override = getTimeOverride()
  if (override) return new Date(override)
  
All band times recalculate with override time.
Live Now shows bands at override time, not real time.
```

**Visible indicator**: No banner (by design, godlike knows they're testing).

### 5. Live Test Band Not Found

```
liveBandTestConfig.enabled = true
liveBandTestConfig.band_id = 'invalid-uuid'

applyLiveBandTestOverride():
  idx = bands.findIndex(...) → -1 (not found)
  return bands unchanged
  
Test mode silently disabled.
```

### 6. Metal Place Window Wraps Day Boundary (18:00 - 06:00)

```
metal_place_config = {
  start_time: "18:00",  // 6 PM
  end_time: "06:00"     // 6 AM next day
}

Now: 05:00 (5 AM, within window)

Wall-clock conversion (all in CEST):
  05:00 >= 18:00? NO
  05:00 < 06:00?  YES
  
isTimeWithinMetalPlaceWindow → true ✓
(Time wrapping handled by numeric comparison)
```

### 7. Crew Member Offline, Presence Stale

```
Alice offline, is_at_metal_place = true (set before disconnect)
Metal Place window closes (06:00)
Alice still offline, didn't receive auto-checkout

When Alice comes online:
  validateAndAutoCheckout() runs
  isTimeWithinMetalPlaceWindow() = false
  auto-clears is_at_metal_place = false
  
Result: Alice moved to camping/lost group ✓
```

---

## Summary: State Machine

### User's State at `/now` Page

```
                   ┌─────────────────┐
                   │   LOADING       │
                   └────────┬────────┘
                            │
                            ▼
         ┌─────────────────────────────────┐
         │  Calculate: myPlan, crewPlans   │
         └────────────┬────────────────────┘
                      │
            ┌─────────┴──────────┐
            ▼                    ▼
      status='current'    status='next'/'empty'/'lost'
      (at band)                    │
            │                      ▼
            ├──────────┬──────────────┬──────────────┐
            │          │              │              │
     ┌──────▼──┐  ┌────▼─────┐  ┌────▼─────┐  ┌────▼─────┐
     │ AT BAND │  │ CAMPING  │  │METAL PLT │  │  LOST    │
     │ (watch) │  │(grounds) │  │(checkin) │  │(nowhere) │
     └─────────┘  └──────────┘  └──────────┘  └──────────┘

Transitions:
  AT BAND → CAMPING (user taps "Camping" after band ends)
  CAMPING → AT BAND (new band starts in user's picks)
  CAMPING → METAL PLT (window active, user checks in)
  METAL PLT → CAMPING (window closes, auto-checkout)
  Any → LOST (user opts out, or no current/camping)
```

---

## Performance Optimization

### Memoization in useNowPlans (via useNowData)

Live plan derivations live in `useNowPlans.ts` (extracted Phase 26.M):

```typescript
// Only recalculate when bands/picks/now change
const myRawPlan = useMemo(
  () => findLivePlan(bands, pickedBandIds, now, liveTestBandId),
  [bands, picks, now, liveTestBandId]
)

// Only recalculate crew groups when plans change
const crewGroups = useMemo(
  () => groupCrewLivePlans(crewPlans, { metalPlaceWindowActive }),
  [crewPlans, isMetalPlaceWindowActive]
)
```

### Realtime Subscriptions Cleaned Up

`usePresenceRealtime`, config hooks, and repository subscribers use `subscribePostgresChanges()` (Phase 26.H):

```typescript
useEffect(() => {
  return subscribePostgresChanges('user_presence_live', {
    filter: { event: '*', table: 'user_presence' },
    handler: async (payload) => { /* save to IDB */ },
  })
}, [])
```

---

## Summary

**Guarantees:**

1. ✅ **Band selection logic**: Current (most recent start), then Next, then Empty
2. ✅ **Conflict severity**: Hard (>15 min), Soft (≤15 min)
3. ✅ **Presence states**: Camping, Metal Place (time-limited), Lost
4. ✅ **Crew grouping**: By band → camping → metal place → lost
5. ✅ **Realtime updates**: ~3s latency for presence changes
6. ✅ **Test mode**: Godlike can shift any band to `now`, affects UI only
7. ✅ **Auto-checkout**: Metal Place window close → auto-clear flag

**Known Limitations:**

1. ⚠️ **Timezone handling**: Hard-coded CEST (+2 hours). If festival moves, requires code change
2. ⚠️ **No "missed band" tracking on /now**: Live Now does not update `user_missed_bands` when user watches (only manual toggle in BandDetailModal)
3. ⚠️ **No conflict warning on /now**: Soft/hard conflicts calculated but not displayed (shown on MyPicksPage instead)
4. ⚠️ **Crew member null name**: If display_name is null, fallback is "Vira-lata XXXX" (not ideal)

**Future Improvements:**

- Parameterize timezone offset (CEST hard-coded)
- Show conflict badges on /now band cards
- Auto-mark bands as "seen" when user watches current band
- Add "at band" duration timer before next band

---

**Last updated:** 2026-05-31 — Phase 37 Upcoming Band Card (15-minute pre-show banner, dismiss, expand/collapse, crew going, QuackStrip attachment, slot priority with LatestAnnouncementBanner).
