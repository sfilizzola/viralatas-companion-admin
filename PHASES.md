# Implementation Phases — viralatas-companion-admin

Each phase is self-contained and can be planned independently. Phases 2–7 can be tackled in any order; Phase 1 is a quick prerequisite.

> **Schema reference:** `ref-ai-wiki/supabase-schema.md` is the source of truth for all table DDL, RLS policies, and realtime config. Read it before implementing any Supabase call.

---

## Current State (baseline)

All 8 V1 functions exist as **UI stubs only**. The scaffold is complete:

- Auth gate, sidebar, section routing — working
- `useAuth` / `useFeedback` hooks — working
- `FunctionCard`, `Toggle`, `Sidebar` components — working
- Supabase client singleton — wired but **connection status is hardcoded `true`**
- Every section component has `// TODO` placeholders; no real Supabase calls anywhere
- Several stub assumptions are **wrong** vs. the real schema (see per-phase notes)

---

## Phase 1 — Live Supabase Connection Status

**Goal:** Replace the hardcoded `connected={true}` in the sidebar with real connection state.

The schema is already known from `ref-ai-wiki/supabase-schema.md` — no discovery work needed. This phase is purely about the sidebar status indicator.

### 1.1 `useSupabaseStatus` hook
- On mount: attempt a lightweight query (`supabase.from('app_config').select('key').limit(1)`)
- Returns `'connected' | 'error' | 'checking'`
- No polling — one-shot on mount (admin tool, not a dashboard)

### 1.2 Wire to Sidebar
- Replace `connected={true}` in `App.tsx` with the real status from `useSupabaseStatus`
- Sidebar already renders the green/dim dot — just pass the real value

**Deliverable:** Sidebar shows real Supabase connectivity instead of hardcoded "connected".

---

## Phase 2 — Realtime Config Cards (LiveBandTest + MetalPlaceTest)

**Goal:** Implement the two cards that read config on mount, stay live via Realtime, and write on user action.

> ⚠️ **Both stubs have wrong column names.** Fix before implementing.

### 2.1 LiveBandTest (`A-03`) — real schema

Table: `public.live_band_test_config` (single row, `id = 1`)

```
enabled   boolean DEFAULT false   ← toggle (stub uses "test_mode" — WRONG)
band_id   uuid FK → bands.id      ← input is a UUID, not plain text (stub uses text — WRONG)
updated_by uuid
updated_at timestamptz
```

Implementation:
- On mount: `SELECT enabled, band_id FROM live_band_test_config WHERE id = 1`
- Populate toggle from `enabled` and show current `band_id` (if set)
- Subscribe to Realtime on `live_band_test_config` — update UI on remote changes
- Toggle handler: `UPDATE live_band_test_config SET enabled = $val, updated_by = $userId, updated_at = now() WHERE id = 1`
- Set Band handler: `UPDATE live_band_test_config SET band_id = $uuid, updated_by = $userId, updated_at = now() WHERE id = 1`
- Input UX: the `band_id` is a UUID, not a human name. Consider: either a UUID text input (acceptable for godlike admin) or a future lookup against `bands` table. For V1, a UUID input with validation is sufficient.
- RLS: godlike-only table — the logged-in session automatically satisfies the policy

### 2.2 MetalPlaceTest (`A-04`) — real schema

Table: `public.metal_place_config` (single row, `id = 1`)

```
festival_day       integer (1–4 or NULL)   ← real festival day
start_time         time DEFAULT '18:00'
end_time           time DEFAULT '06:00'
label              text DEFAULT 'Metal Place'
test_override_day  integer (1–4 or NULL)   ← THIS is the test knob (stub uses "test_mode" bool + radius — BOTH WRONG)
updated_by         uuid
updated_at         timestamptz
```

The card needs to be **redesigned** — the stub's `test_mode` toggle and `radius` input do not match the real schema.

New control:
- **Enable test override:** toggle — maps to `test_override_day IS NOT NULL`
- **Override day selector:** when enabled, a 1–4 selector (or number input) that writes to `test_override_day`
- Disable: set `test_override_day = NULL`
- Show current `festival_day`, `start_time`, `end_time` as read-only context labels
- On mount: fetch current row; subscribe to Realtime

### 2.3 Realtime Banner component
- Design spec: full-width card (`grid-column: span 3`) above the Testing Tools grid when a subscription is active
- Shows: table name · "subscribed" · last-update timestamp
- Pulsing dot animation

**Deliverable:** Both cards correctly wired; realtime banner in Testing Tools.

---

## Phase 3 — Fire-and-Forget Actions (TestQuack + TestPush)

**Goal:** Wire the two "send something" buttons.

### 3.1 TestQuack (`A-01`) — local event, no DB write

Per `ref-ai-wiki/flows/duck.md`:
> "No database write. No Web Push. Only tests the DuckToast component."
> After 15 seconds, dispatches `viralatas:duck-quack` window event with `{ bandName: 'Queen' }` locally.

The companion app's TestQuack is a **local UI test** — it fires the `viralatas:duck-quack` window event to show the in-app DuckToast. The admin app does not have the DuckToast component.

**Approach for admin app:** Since the admin app has no DuckToast to test, the button can:
- Start the 15s drain animation (timer is already in the stub)
- After 15s: show success feedback "DuckToast event dispatched (no DB write, no push). Open the companion app to confirm the DuckToast appears."
- No Supabase call needed — this is a pure client-side feedback test

If a full push test is needed instead, **use Test Push** (`A-02`) — it covers the VAPID stack end-to-end.

Implementation changes from stub:
- Remove the `// TODO: call Supabase` comment; replace with a `setTimeout(15000)` that resolves and shows the success feedback
- The 15s cooldown timer is already implemented correctly

### 3.2 TestPush (`A-02`) — full VAPID stack

Per `ref-ai-wiki/flows/duck.md`:
> Calls `send-test-push` Edge Function via `supabase.functions.invoke`
> Edge Function authenticates via JWT, queries `push_subscriptions`, sends a real VAPID push

Implementation:
```typescript
const { error } = await supabase.functions.invoke('send-test-push')
```

Error variants to handle (from companion app source):
- `FunctionsHttpError` with status-specific messages
- No subscription row found → "No push subscription found. Grant push permission in the companion app first."
- Push delivery error → "Push failed — check VAPID keys / Supabase secrets"
- Edge Function call failed → "Edge Function unreachable — check deployment"

**Deliverable:** TestQuack shows a clear 15s local feedback; TestPush calls the real Edge Function.

---

## Phase 4 — Feature Flags (`A-05`)

**Goal:** Read and toggle the global duck-enabled flag from `app_settings`.

Table: `public.app_settings` (single row)

```
duck_enabled           boolean DEFAULT true NOT NULL   ← the flag we want (stub uses "duck_notifications_enabled" — WRONG)
registration_enabled   boolean DEFAULT true NOT NULL   ← future card
playlist_testing       boolean DEFAULT true NOT NULL   ← future card
updated_at             timestamptz
```

RLS: SELECT by all authenticated; UPDATE only by godlike (checked via JWT email, no role lookup needed).

### 4.1 Read on mount
- `SELECT duck_enabled FROM app_settings LIMIT 1`
- Set toggle initial state from result
- Default to `false` if row somehow doesn't exist

### 4.2 Write on toggle
- `UPDATE app_settings SET duck_enabled = $val, updated_at = now()`
- Optimistic UI: flip toggle immediately, revert on Supabase error
- Show success/error feedback

### 4.3 Scope note
Only `duck_enabled` is in V1 scope per the design doc. `registration_enabled` and `playlist_testing` can be added as additional toggle rows in the same card in a V2 pass.

**Deliverable:** Toggle reads and writes `app_settings.duck_enabled`.

---

## Phase 5 — Cache Reset (`B-01`)

**Goal:** Make the button write a fresh ISO timestamp to `app_config.cache_version`, causing all companion app clients to wipe their local IndexedDB on next load.

Table: `public.app_config` (key/value)

```sql
-- Only one relevant row:
key = 'cache_version', value = '<ISO timestamp or version string>'
```

Per `ref-ai-wiki/supabase-schema.md`:
> "The godlike 'Reset all data' button in the admin panel writes a fresh ISO timestamp."
> No `increment_cache_version` RPC exists — it is a direct `UPDATE`.

RLS: all authenticated can `SELECT`; only godlike can `UPDATE` (role check in policy).

### 5.1 Read on mount
- `SELECT value FROM app_config WHERE key = 'cache_version'`
- Display current value as a meta label ("Current version: 2026-05-28T…") so the admin can see the last reset time

### 5.2 Write on confirm
- Confirmation dialog is already in the stub — keep it
- `UPDATE app_config SET value = $isoTimestamp WHERE key = 'cache_version'`
  where `$isoTimestamp = new Date().toISOString()`
- On success: re-fetch and display the new value + show success feedback
- On error: show reason

**Deliverable:** Cache Reset reads the current version and writes a fresh ISO timestamp.

---

## Phase 6 — Badge Testing (`C-01`)

**Goal:** Replace stub badge options with real slugs and wire the insert to `user_badge_history`.

Table: `public.user_badge_history`

```
id               uuid DEFAULT gen_random_uuid()
user_id          uuid NOT NULL REFERENCES auth.users(id)
festival_year    integer NOT NULL
slug             text NOT NULL
image_path       text NOT NULL    ← must match companion app's BadgeConfig.imagePath
label_key        text NOT NULL    ← must match companion app's BadgeConfig.labelKey
consolidated_at  timestamptz DEFAULT now()
UNIQUE (user_id, festival_year, slug)
```

RLS: godlike has ALL (via Edge Function service_role for bulk — but direct insert from godlike session should also work given the policy grants ALL to godlike).

### 6.1 Real badge list
- Source: `ref-ai-wiki/badges.md` — all badge slugs are documented there with their `imagePath` and `labelKey`
- Build a static `BADGE_OPTIONS` array with `{ slug, imagePath, labelKey, label }` entries
- Group by category in the dropdown (optional, nice UX)

### 6.2 Implement insert
```typescript
await supabase.from('user_badge_history').insert({
  user_id: session.user.id,
  festival_year: Number(year),
  slug: selectedSlug,
  image_path: selectedBadge.imagePath,   // from static registry
  label_key: selectedBadge.labelKey,     // from static registry
})
```

- On unique-constraint conflict (same user/year/slug already exists): show "Badge already exists for this year"
- On success: show "Badge added" feedback

### 6.3 Current badges preview (optional enhancement)
- After add, fetch and display the godlike user's existing `user_badge_history` rows in the card
- Confirms the insert without needing to switch to the companion app

**Deliverable:** Dropdown shows real badges with correct slugs; inserts land correctly in `user_badge_history`.

---

## Phase 7 — Manage Servants (`D-01`)

**Goal:** Replace the empty placeholder with a working servant table.

**How test users work** (from `ref-ai-wiki/flows/authentication.md` + `supabase-schema.md`):
- `public.users.is_test_user boolean DEFAULT false`
- Set at registration via `raw_user_meta_data->>'is_test_user' = 'true'` → trigger `handle_new_user` reads it
- Any user with `is_test_user = true` is a servant

### 7.1 List servants
- `SELECT id, email, display_name, created_at FROM public.users WHERE is_test_user = true ORDER BY created_at DESC`
- RLS allows all authenticated users to SELECT all profiles (policy: `USING (true)`)
- Render as a simple table: email, display name, created date, Delete button
- Empty state: "No test users yet"

### 7.2 Create servant
- Form: email + password inputs
- `supabase.auth.signUp({ email, password, options: { data: { is_test_user: 'true', preferred_language: 'en' } } })`
- The `handle_new_user` trigger picks up `is_test_user: 'true'` and sets the flag in `public.users`
- On success: re-fetch list; show "Servant created: email"
- Gotcha: `auth.signUp()` works with the anon key — no Edge Function needed for creation

### 7.3 Delete servant
- Deleting a user requires removing from `auth.users` (Supabase Auth), which cascades to `public.users` via FK
- **The anon key cannot delete auth users** — this requires `service_role` key
- Solution: create an Edge Function `delete-test-user` that:
  - Verifies the caller is the godlike user (JWT check)
  - Verifies the target user has `is_test_user = true` (safety guard)
  - Uses `supabaseAdmin.auth.admin.deleteUser(userId)` with service_role key
- In the admin app: `supabase.functions.invoke('delete-test-user', { body: { userId } })`
- Confirmation dialog before delete
- On success: re-fetch list

### 7.4 Edge Function: `delete-test-user`
- New function (does not exist in companion app)
- Must be created in the Supabase project
- Deno runtime, same as other Edge Functions
- Needs `SUPABASE_SERVICE_ROLE_KEY` in Supabase secrets (already set for other admin functions)

**Deliverable:** Servants list, create (via `signUp`), and delete (via new Edge Function) all work.

---

## Phase 8 — CI/CD & Deployment

**Goal:** Automated pipeline that lints, builds, tests, and deploys on push to `main`.

### 8.1 GitHub Actions workflow
Create `.github/workflows/deploy.yml`:
- Trigger: `push` to `main`
- Steps: checkout → Node setup → `npm ci` → `npm run lint` → `npm run build` → `npm run test`
- Deploy step: publish `dist/` to hosting (Netlify recommended)
- Inject `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GODLIKE_EMAIL` from GitHub repository secrets

### 8.2 Hosting setup
- Choose host (Netlify or Vercel)
- Configure custom domain (e.g. `admin.viralatas.com`)
- Set up HTTPS (automatic on Netlify/Vercel)
- Add env vars in the host dashboard

### 8.3 Supabase allowed redirect URLs
- Add the production admin domain to Supabase Auth's allowed redirect URLs so login works on the deployed domain

**Deliverable:** Pushing to `main` auto-deploys to the admin domain.

---

## Phase 9 — Polish, Tests & QA

**Goal:** Harden before calling it production-ready.

### 9.1 Unit tests (Vitest)
- `useAuth` — loading, authorized, unauthorized, unauthenticated
- `useFeedback` — auto-dismiss timer, success/error variants
- `CacheReset` — confirmation cancel vs confirm
- Any pure utility functions introduced in previous phases

### 9.2 Error boundary
- Add a React `ErrorBoundary` around `AdminShell` so an unhandled throw in a card doesn't blank the whole page

### 9.3 Accessibility pass
- All interactive elements have visible labels or `aria-label`
- Toggle is keyboard-accessible (already has `role="switch"` from the Toggle component)
- Focus order is logical

### 9.4 Manual QA checklist (before first production release)
- [ ] Log in with godlike email → all sections accessible
- [ ] Log in with a different email → "access denied" screen
- [ ] Log out → redirected to login
- [ ] Sidebar shows real Supabase connection status
- [ ] TestQuack: 15s timer runs, success feedback shown
- [ ] TestPush: real push received on device
- [ ] LiveBandTest: set `enabled = true` + set a band UUID → confirm in companion app
- [ ] LiveBandTest: realtime update from companion app changes the card state
- [ ] MetalPlaceTest: set `test_override_day = 2` → confirm in companion app
- [ ] MetalPlaceTest: realtime update from companion app changes the card state
- [ ] Feature Flags: toggle `duck_enabled` off → duck button hidden in companion app on next load
- [ ] Cache Reset: button updates `app_config.cache_version`; companion app re-fetches on next load
- [ ] Test Badges: insert badge → visible in godlike user's `user_badge_history`
- [ ] Manage Servants: create servant → appears in list; delete → removed
- [ ] No console errors
- [ ] No `// TODO` stubs remain

**Deliverable:** Test coverage for core logic; QA checklist signed off.

---

## Dependency Order Summary

```
Phase 1 (Supabase Connection Status)   ← trivial; do first or alongside Phase 2+
  │
  ├── Phase 2 (LiveBandTest + MetalPlaceTest)
  ├── Phase 3 (TestQuack + TestPush)
  ├── Phase 4 (Feature Flags)
  ├── Phase 5 (Cache Reset)
  ├── Phase 6 (Badge Testing)
  └── Phase 7 (Manage Servants)        ← needs new Edge Function; most involved

Phases 2–7 are independent of each other.
Phase 8 (CI/CD) can start any time.
Phase 9 (Polish) comes last.
```

---

## Known Stub Bugs (fix during implementation)

| Card | Stub assumption | Reality |
|---|---|---|
| LiveBandTest | column `test_mode` | column is `enabled` |
| LiveBandTest | band input is plain text | `band_id` is a UUID FK |
| MetalPlaceTest | `test_mode` bool toggle + radius input | column is `test_override_day integer` (1–4 or NULL) — no radius |
| FeatureFlags | column `duck_notifications_enabled` | column is `duck_enabled` in `app_settings` |
| CacheReset | calls `supabase.rpc('increment_cache_version')` | no RPC exists; direct UPDATE to `app_config` |
| TestBadges | stub badge options (stub_badge_1 etc.) | must use real slugs from `ref-ai-wiki/badges.md` |

---

## Out of Scope (V2+)

- **Time Travel** — already handled in the companion app
- **Badge Consolidation** — merge logic undefined until a real dedup problem appears
- **`registration_enabled` / `playlist_testing` flags** — `app_settings` columns exist; wire in a V2 pass
- **Audit log** — who changed what and when
- **Scheduled tasks** — e.g. auto-reset cache daily
- **Role-based access** — multiple admin users
- **Mobile layout** — admin is desktop-first by design
