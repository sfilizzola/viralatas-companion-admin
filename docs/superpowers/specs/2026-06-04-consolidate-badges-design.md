# Consolidate Badges — Design Spec

**Date:** 2026-06-04  
**Section:** Badge Consolidation (admin app)  
**Status:** Approved

---

## Overview

Add a `ConsolidateBadges` card to the Badge Consolidation section of the admin app. The card runs the year-end badge consolidation that snapshots each non-test user's earned year-badges into `user_badge_history`. It supports a **dry run** mode (full preview without writing) and a guarded **real consolidation** that is disabled until dry run has been seen at least once in the session.

The year is hardcoded to **2026**. The `force` flag is always `true` in the admin app (the `isFestivalEnded()` gate is only relevant in the companion app UI).

---

## Edge Function Changes (`consolidate-year-badges`)

**File:** `supabase/functions/consolidate-year-badges/index.ts` (companion app)

Add a `dryRun: boolean` parameter to the request body.

**When `dryRun: true`:**
- Run the full badge evaluation loop (identical logic to real consolidation)
- Do **not** write to `user_badge_history`
- Return:
  ```json
  {
    "dryRun": true,
    "totalBadges": 124,
    "users": [
      {
        "userId": "<uuid>",
        "displayName": "sfilizzola",  // falls back to email prefix if display_name is null
        "badges": [
          { "slug": "death-metal", "imagePath": "/badges/badge_death-metal.png", "labelKey": "badgeDeathMetal" }
        ]
      }
    ]
  }
  ```

**When `dryRun: false` (or omitted):**
- Behavior unchanged — upserts rows, returns:
  ```json
  { "dryRun": false, "consolidated": 124 }
  ```

**`force` flag:** Already exists; admin always sends `force: true`.

---

## Admin UI Card

**File:** `src/sections/BadgeTesting/ConsolidateBadges.tsx` (new)

### Card metadata
- ID: `C-02`
- Title: `Consolidate Badges 2026`
- Description: `Snapshot year-badges for all non-test users into the permanent archive.`

### Buttons
- **`Dry Run`** — always enabled; calls EF with `{ year: 2026, force: true, dryRun: true }`
- **`Consolidate →`** — disabled until `dryRunResult` is non-null in component state; clicking opens confirm modal

### Confirm modal
> "This will write frozen badge rows for all non-test users (year 2026). Operation is idempotent — re-running is safe. Confirm?"

Two buttons: **Cancel** / **Confirm**

### Results area (rendered after dry run completes)
- Summary: `"Would consolidate {totalBadges} badges across {userCount} users"`
- Scrollable list, max-height ~320px, grouped by user:
  - User `display_name` as mono label
  - Badge slugs as inline tags (comma-separated or pill chips)
- Muted note: `"Results from last dry run — run again to refresh"`

### Post-consolidation
- Success: `useFeedback` banner `"Done — {consolidated} badges consolidated"`
- Error: `useFeedback` error with reason

### State machine
```
idle
  → dryRunLoading  (Dry Run clicked)
    → dryRunDone   (results shown; Consolidate button enabled)
      → confirmOpen  (Consolidate clicked)
        → consolidating  (Confirm clicked)
          → idle         (done; feedback shown)
        → dryRunDone     (Cancel clicked)
```

---

## Section Integration

**File:** `src/sections/BadgeTesting/index.tsx`

Add `<ConsolidateBadges />` to the existing `cardGrid` div alongside `<TestBadges />`.

---

## What Is Not Changing

- `TestBadges` card — untouched
- No new CSS files — reuses `FunctionCard`, `useFeedback`, and `sections.module.css` classes
- No new hooks
- `user_badge_history` schema — unchanged
- `festival:reset` behavior — unchanged (archive table is never touched by reset)

---

## Acceptance Criteria

- [ ] Dry Run calls EF with `dryRun: true, force: true, year: 2026`; shows full per-user badge list
- [ ] Consolidate button is disabled until dry run has run at least once in the session
- [ ] Confirm modal appears before real consolidation
- [ ] Real consolidation calls EF with `dryRun: false, force: true, year: 2026`
- [ ] Success feedback shows consolidated count; error feedback shows reason
- [ ] Test users excluded (handled server-side by EF, no admin-app change needed)
- [ ] Re-running consolidation is idempotent (same result as first run)
- [ ] EF dry run returns same user/badge data shape whether or not rows already exist in `user_badge_history`
