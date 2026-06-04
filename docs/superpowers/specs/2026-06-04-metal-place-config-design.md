# Metal Place Config — Design Spec

**Date:** 2026-06-04  
**Status:** Approved  
**Phase:** Phase 2 extension (Data Management)

---

## Problem

The real festival configuration for Metal Place (which day it happens, and the check-in time window) lives in `metal_place_config` but the admin app has no way to view or edit it. The existing `MetalPlaceTest` stub in Testing Tools used wrong columns and a wrong mental model (test override, not real config).

## Goal

A single card in Data Management that lets the godlike user see and edit the real Metal Place festival config: which day the event falls on and the check-in start/end times.

---

## Decisions

| Decision | Choice | Reason |
|---|---|---|
| Section | Data Management (Section B) | This is real production config, not a testing knob |
| Fields | `festival_day`, `start_time`, `end_time` | `label` excluded — not needed |
| UX mode | Always-editable form | Single save for all fields; no mode-switching overhead |
| Width | Standard single-column card | 3 fields fit comfortably in one column |
| Test override | Removed | `test_override_day` no longer needed — real config is the source of truth |
| Existing stub | Delete `MetalPlaceTest.tsx` | Wrong schema, wrong section, wrong purpose |

---

## Schema

Table: `public.metal_place_config` (single row, `id = 1`)

```sql
festival_day  integer CHECK (festival_day IN (1, 2, 3, 4, NULL))
start_time    time DEFAULT '18:00'
end_time      time DEFAULT '06:00'
label         text DEFAULT 'Metal Place'   -- not exposed in card UI
test_override_day  integer                 -- not exposed in card UI
updated_by    uuid
updated_at    timestamptz
```

Only `festival_day`, `start_time`, and `end_time` are read or written by this card.

---

## Component

**File:** `src/sections/DataManagement/MetalPlaceConfig.tsx`  
**Card id:** `B-02`  
**Title:** `Metal Place Config`  
**Description:** `Configure the festival day and check-in time window.`

### Visual layout

```
[ Metal Place Config ]          status: active (day set) | off (day null)

  Festival Day   [ —  ▾ ]       <select> — options: — (null), Day 1, Day 2, Day 3, Day 4
  Start Time     [ 18:00  ]     <input type="time">
  End Time       [ 06:00  ]     <input type="time">

  [ Save →  ]                   disabled when draft === saved

  ✓ Saved successfully          useFeedback banner (5s auto-dismiss)
```

### State

```typescript
interface MetalPlaceData {
  festival_day: number | null   // 1–4 or null
  start_time: string            // "HH:MM" — Supabase returns "HH:MM:SS"; truncate to "HH:MM" when populating the input
  end_time: string              // "HH:MM" — same truncation applies
}

saved: MetalPlaceData     // last DB values (from fetch or successful save)
draft: MetalPlaceData     // current form input values
loading: boolean          // initial fetch
saving: boolean           // in-flight UPDATE
```

`isDirty = JSON.stringify(draft) !== JSON.stringify(saved)`  
Save button disabled when `!isDirty || saving`.

---

## Data Flow

### On mount
```typescript
SELECT festival_day, start_time, end_time
FROM metal_place_config
WHERE id = 1
```
Set both `saved` and `draft` from the result. Set `loading = false`.

### On Save
```typescript
UPDATE metal_place_config
SET festival_day = $draft.festival_day,
    start_time   = $draft.start_time,
    end_time     = $draft.end_time,
    updated_by   = $session.user.id,
    updated_at   = now()
WHERE id = 1
```
- Optimistic: set `saving = true`, show no feedback yet
- On success: set `saved = draft`, `saving = false`, show success feedback
- On error: set `saving = false`, show error feedback (do not reset draft)

### Realtime
Subscribe to `metal_place_config` channel (same pattern as `LiveBandTest` in Phase 2). On remote change:
- Update `saved` to the new DB values
- If `!isDirty` at that moment, also update `draft` (keep form in sync with remote)
- If `isDirty` (user has uncommitted edits), do NOT overwrite `draft` — let the user finish

---

## Removals

| File | Action |
|---|---|
| `src/sections/TestingTools/MetalPlaceTest.tsx` | Delete |
| `src/sections/TestingTools/index.tsx` | Remove `MetalPlaceTest` import and usage |
| `PHASES.md` — Phase 2 MetalPlaceTest section | Update to reflect removal and new placement |

---

## Wire-up in DataManagement

`src/sections/DataManagement/index.tsx` — import and render `<MetalPlaceConfig />` alongside `<CacheReset />`.

---

## PHASES.md update

Phase 2 in `PHASES.md` currently describes implementing `MetalPlaceTest` with the `test_override_day` knob. This is superseded:

- The Phase 2 `MetalPlaceTest` entry should be replaced with a note pointing to this spec
- The new `MetalPlaceConfig` card is effectively a **Phase 2 addendum** (same Realtime infrastructure, same mount-fetch pattern)
- No new phase needed — it fits naturally alongside `LiveBandTest` in the same implementation session

---

## Out of Scope

- `label` field — not useful to expose for now
- `test_override_day` — removed from admin UI
- Realtime banner component — already specified in Phase 2.3; reused here, no changes needed
