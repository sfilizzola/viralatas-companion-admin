# Feature Flags — Design Spec

**Date:** 2026-06-04  
**Phase:** 4 (per PHASES.md)  
**File:** `src/sections/TestingTools/FeatureFlags.tsx`  
**Status:** Approved, ready for implementation

---

## Goal

Replace the no-op stub in `FeatureFlags.tsx` with a fully working card that reads and toggles two global boolean flags from the `app_settings` Supabase table.

---

## Flags in scope

| Toggle label        | Column                 | Default | Effect in companion app                                      |
|---------------------|------------------------|---------|--------------------------------------------------------------|
| Duck notifications  | `duck_enabled`         | `true`  | When `false`, duck button is hidden for all users on next load |
| User registration   | `registration_enabled` | `true`  | When `false`, registration screen is closed; only existing users can log in |

`playlist_testing` is out of scope for this phase (V2).

---

## Table reference

```sql
-- public.app_settings (single row)
id                   uuid PRIMARY KEY
registration_enabled boolean DEFAULT true NOT NULL
duck_enabled         boolean DEFAULT true NOT NULL
playlist_testing     boolean DEFAULT true NOT NULL   -- not touched here
updated_at           timestamptz DEFAULT now() NOT NULL
```

**RLS:**
- `app_settings_select`: `USING (true)` — any authenticated user can read
- `app_settings_update`: `USING (auth.jwt() ->> 'email' = 'sfilizzola@gmail.com')` — only godlike can write

---

## Data flow

### Read (on mount)

```typescript
const { data, error } = await supabase
  .from('app_settings')
  .select('duck_enabled, registration_enabled')
  .limit(1)
  .single()
```

- Set `duckEnabled` and `registrationEnabled` from `data`
- If `error` or no row: default both to `true` (resilience principle — fetch failure must never silently disable features)
- Set `loading = false` after fetch completes (success or error)

### Write (per toggle)

```typescript
const { error } = await supabase
  .from('app_settings')
  .update({ duck_enabled: val, updated_at: new Date().toISOString() })
```

```typescript
const { error } = await supabase
  .from('app_settings')
  .update({ registration_enabled: val, updated_at: new Date().toISOString() })
```

- **Optimistic UI:** flip the toggle immediately before the Supabase call
- **On error:** revert toggle to previous value, show error feedback
- **On success:** show success feedback for 5 seconds (via `useFeedback`)

---

## Component design

Single `FunctionCard` (id `A-05`), no new files or components.

### Card status logic

| Condition                        | Status    |
|----------------------------------|-----------|
| Fetch in progress                | `loading` |
| Fetch failed                     | `error`   |
| Both flags `true`                | `active`  |
| Either flag `false`              | `off`     |

### Controls layout

Two `Toggle` rows stacked vertically inside `cardControls`:

```
Toggle  "Duck notifications"    ← duck_enabled
Toggle  "User registration"     ← registration_enabled
```

Each toggle is `disabled` while `loading`.

### Feedback

One shared feedback line below the toggles. Shows the result of the last toggle action (success or error). Uses the existing `useFeedback` hook (auto-dismisses after 5s).

Example messages:
- `"Duck notifications disabled globally"` (success)
- `"User registration enabled globally"` (success)  
- `"Failed to update flag — check connection"` (error)

---

## Stub bugs fixed

| What the stub had              | What the real code uses           |
|--------------------------------|-----------------------------------|
| `duck_notifications_enabled`   | `duck_enabled`                    |
| No Supabase call               | Real SELECT + UPDATE              |
| Single toggle only             | Two toggles                       |
| `show('success', '... (stub)')` | Real feedback based on Supabase result |

---

## Out of scope

- No Realtime subscription — `app_settings` is not realtime-enabled per schema; changes propagate on next companion app load, which is the documented behavior
- `playlist_testing` flag — V2
- No confirmation dialog — these are soft feature toggles, not destructive; instant optimistic toggle is appropriate
