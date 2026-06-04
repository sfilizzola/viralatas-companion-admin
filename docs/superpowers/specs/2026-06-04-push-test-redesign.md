# Push Test Redesign — Test Quack & Test Push

**Date:** 2026-06-04  
**Scope:** `viralatas-companion-admin` — PushTest section (cards B-01 and B-02)  
**Also touches:** `viralatas-companion` — `send-test-push` Edge Function

---

## Context

Both `TestQuack` and `TestPush` cards are currently stubs with no real implementation. This spec defines the full behaviour for both.

The current wiki documents Test Quack as a local-only operation (dispatches a window event, no DB write, no push). This redesign replaces that with the full production duck flow initiated from the admin — a deliberate, impactful action.

---

## Shared Infrastructure

### `useBands` hook — `src/hooks/useBands.ts`

Extract the band-loading query currently inlined in `LiveBandTest` into a shared hook:

```typescript
// Returns bands sorted by pick count descending
function useBands(): { bands: BandOption[], loading: boolean }
```

Query: `supabase.from('bands').select('id, name, user_picks(count)')`, mapped to `BandOption[]` and sorted by `pickCount` desc.

`LiveBandTest` is updated to use this hook. `TestQuack` imports the same hook — no duplication.

**Note:** No DB migration needed. The godlike RLS policy on `push_subscriptions` (allowing SELECT all for godlike role) already exists in the Supabase project.

---

## Test Quack — card B-01

### What it does

Fires a real duck quack as the godlike user for a selected band. Inserts into `duck_quacks`, which triggers the DB webhook → `send-duck-push` Edge Function → Web Push to all pickers of that band (excluding the admin). Users who have the companion app open also receive the DuckToast via Supabase Realtime.

This is the full production duck flow, not a local simulation.

### UI

1. `BandCombobox` — select a band (data from `useBands()`, sorted by pick count desc)
2. Once a band is selected, show an inline recipient preview:
   - `"X users will be notified"` — live count of `user_picks` for that band excluding the godlike user
   - If count is 0: `"No pickers — quack will fire but nobody receives it."` (warning, does not block send)
   - Count query failure: silently hidden (does not block send)
3. `"Send Quack →"` button — disabled until a band is selected, disabled during cooldown
4. On success: 15s cooldown, feedback `"Quack sent — {bandName} ({X} pickers notified)"`
5. On error: `"Failed — {error.message}"`

### Data flow

1. Mount → `useBands()` populates the combobox
2. Band selected → query picker count:
   ```typescript
   supabase
     .from('user_picks')
     .select('*', { count: 'exact', head: true })
     .eq('band_id', selectedId)
     .neq('user_id', session.user.id)
   ```
3. Send Quack →
   ```typescript
   supabase
     .from('duck_quacks')
     .insert({ user_id: session.user.id, band_id: selectedId })
   ```
4. DB webhook fires → `send-duck-push` (unchanged) → pushes to all pickers
5. 15s cooldown starts

### RLS notes

`duck_quacks` INSERT policy is `WITH CHECK (auth.uid() = user_id)` — the godlike user inserts with their own `user_id`, which satisfies this. No schema changes needed.

---

## Test Push — card B-02

### What it does

Lists all real users (non-test) who have a push subscription registered. Lets the admin send a targeted test push to any individual user with one click.

### UI

1. On mount: fetch real users with push subscriptions (see query below). Show loading skeleton while fetching.
2. Render a compact list. Each row:
   - `display_name` (fallback to `email` if null)
   - `"Send →"` button
3. Clicking `"Send →"`:
   - Button enters loading state
   - Calls `send-test-push` with `{ targetUserId: user.id }` in the body
   - On response, show inline per-row result (auto-clears after 5s):
     - ✅ `"Sent"` — push delivered
     - ⚠️ `"No subscription"` — `no_subscription` returned by Edge Function
     - ❌ `"Failed — {reason}"` — delivery error or Edge Function error
4. Empty state: `"No real users with push subscriptions found"`

### Data flow — listing

```typescript
supabase
  .from('users')
  .select('id, display_name, email, push_subscriptions!inner(user_id)')
  .eq('is_test_user', false)
```

Returns real users who have at least one `push_subscriptions` row. The godlike RLS policy on `push_subscriptions` already allows this SELECT.

### Data flow — sending

```typescript
supabase.functions.invoke('send-test-push', {
  body: { targetUserId: user.id },
})
```

### `send-test-push` Edge Function modification (companion app)

File: `supabase/functions/send-test-push/index.ts`

Changes:
- Parse optional `targetUserId` from JSON body
- If `targetUserId` present:
  - Verify caller is godlike: query `public.users.role` for the JWT user's id
  - If not godlike: return `403`
  - Query `push_subscriptions` for `targetUserId`
  - Send test push to that user's subscriptions
  - Same payload as today: `{ title: '🦆 Test Push', body: 'Push notifications are working! 🤘' }`
- If `targetUserId` absent: existing behaviour (send to caller's own subscriptions) — fully backward compatible

Response shape is unchanged: `{ sent, failed, errors }`.

---

## Files Changed

### `viralatas-companion-admin`

| File | Change |
|------|--------|
| `src/hooks/useBands.ts` | New — extracted band-loading hook |
| `src/sections/TestingTools/LiveBandTest.tsx` | Updated — use `useBands()` instead of inline query |
| `src/sections/PushTest/TestQuack.tsx` | Rewritten — full implementation |
| `src/sections/PushTest/TestPush.tsx` | Rewritten — full implementation |

### `viralatas-companion`

| File | Change |
|------|--------|
| `supabase/functions/send-test-push/index.ts` | Updated — add optional `targetUserId` param |

---

## Out of Scope

- Notification content format (band name + sender name) — deferred
- Sending to all pickers regardless of band picks — not needed
- Test quack for test users only — not needed (production flow handles recipients)
