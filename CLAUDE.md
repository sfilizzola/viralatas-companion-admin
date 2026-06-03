# viralatas-companion-admin — Project Context

## What This Is

A dedicated admin web application for the godlike user (`sfilizzola@gmail.com`) to configure festival settings, trigger tests, and manage data for the **viralatas** main app. It runs as a separate repo, separate domain, and independent CI/CD pipeline — fully isolated from the user-facing app while sharing the same Supabase backend.

Design doc: [`ADMIN_TOOL.md`](./ADMIN_TOOL.md)  
Implementation phases: [`PHASES.md`](./PHASES.md)

---

## Companion App Reference Wiki

`ref-ai-wiki/` contains the full AI-readable wiki exported from the companion app (`viralatas-companion`). **Read this before touching any Supabase integration.** It is the single source of truth for:

| File | What to read it for |
|---|---|
| `supabase-schema.md` | Exact table DDL, column names, RLS policies, realtime config |
| `flows/duck.md` | TestQuack + TestPush mechanics, `duck_quacks` table, `send-test-push` / `send-duck-push` Edge Functions |
| `badges.md` | `BadgeConfig` structure, all badge slugs, `user_badge_history` columns |
| `flows/authentication.md` | How test users are created (`is_test_user` meta, trigger), session, RLS |
| `index.md` | Quick navigation to all other wiki pages |

**Key schema facts for admin functions** (extracted from the wiki):

| Admin card | Table | Key columns / notes |
|---|---|---|
| Live Band Test | `live_band_test_config` | `enabled boolean`, `band_id uuid` (FK → `bands.id`) — NOT a text field |
| Metal Place Test | `metal_place_config` | `test_override_day integer` (1–4 or NULL) — no `test_mode` bool, no radius |
| Feature Flags | `app_settings` | `duck_enabled boolean`, also `registration_enabled`, `playlist_testing` |
| Cache Reset | `app_config` | key=`'cache_version'`, value=ISO timestamp — no RPC, direct `UPDATE` |
| Test Badges | `user_badge_history` | `user_id, festival_year, slug, image_path, label_key, consolidated_at` — `image_path` + `label_key` must be provided |
| Manage Servants | `public.users` | `is_test_user boolean` — test users listed by this flag; delete requires an Edge Function (service_role key) |
| Test Quack | local event | fires `viralatas:duck-quack` window event — **no DB write**, no push; only tests DuckToast locally |
| Test Push | Edge Function | `supabase.functions.invoke('send-test-push')` — tests full VAPID push stack |

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 18 + Vite |
| Language | TypeScript (strict) |
| Styling | Plain CSS modules (no component library) |
| Backend / DB | Supabase JS SDK (same project as main app) |
| Realtime | Supabase Realtime subscriptions |
| Testing | Vitest (unit) + manual checklist |
| CI/CD | GitHub Actions → deploy on push to `main` |

**Intentionally excluded** (vs. main app): Service Worker, PWA/offline, IndexedDB, Workbox, i18n, any design-system badge components.

---

## Auth Model

- Supabase email/password auth (same credentials as main app)
- On load: check `session.user.email === VITE_GODLIKE_EMAIL`
  - Match → unlock all admin features
  - No match / not logged in → render "access denied" screen with login form
- `VITE_GODLIKE_EMAIL=sfilizzola@gmail.com` (env var, not hardcoded in source)
- Standard Supabase `signOut()` on logout

---

## Environment Variables

```
VITE_SUPABASE_URL=<same as main app>
VITE_SUPABASE_ANON_KEY=<same as main app>
VITE_GODLIKE_EMAIL=sfilizzola@gmail.com
```

Never commit `.env` files. Inject at deploy time.

---

## The 10 Admin Functions

Organized into 4 collapsible sections in the UI:

### Section A — Testing Tools
| # | Function | What it does |
|---|---|---|
| 1 | **Test Quack** | Send a test duck notification to self (15s cooldown) |
| 2 | **Test Push** | Send a test web push notification via `send-test-push` Edge Function |
| 3 | **Live Band Test** | Configure which band is "live now" for testing presence/alerts |
| 4 | **Metal Place Test** | Toggle metal place test mode on/off + configure test zone settings |
| 5 | **Feature Flags** | Toggle duck notification feature globally (affects all users) |

> **V1 scope note:** Time Travel is excluded — already working in the companion app. 5 testing functions in Section A.

### Section B — Data Management
| # | Function | What it does |
|---|---|---|
| 7 | **Cache Reset** | Increment a version counter in Supabase — all main app clients detect the change and invalidate their local cache |

> **V1 scope note:** Badge Consolidation deferred to V2 — logic unclear until a real deduplication problem is observed in production.

### Section C — Badge Testing
| # | Function | What it does |
|---|---|---|
| 9 | **Test Badges** | Add test badges to godlike user's account (dropdown to select badge, optional year) |

### Section D — User Management
| # | Function | What it does |
|---|---|---|
| 10 | **Manage Servants** | List, create, delete test user accounts for testing vira-lata interactions |

---

## Supabase Tables & Operations

| Table | Reads | Writes | Realtime |
|---|---|---|---|
| `metal_place_config` | `test_override_day` (1–4 or NULL) | Set `test_override_day` | ✅ subscribed |
| `live_band_test_config` | `enabled`, `band_id` (uuid) | Set `enabled`, set `band_id` | ✅ subscribed |
| `app_settings` | `duck_enabled`, `registration_enabled`, `playlist_testing` | Toggle flags | — |
| `app_config` | `cache_version` (key/value) | `UPDATE value = now()::text WHERE key = 'cache_version'` | — |
| `user_badge_history` | Badges on godlike user | Insert with `slug`, `image_path`, `label_key`, `festival_year` | — |
| `public.users` | `is_test_user = true` rows | — (create via `auth.signUp`) | — |

Edge Functions (existing in companion app):
- `send-test-push` — Tests full VAPID web push stack (TestPush card)
- `consolidate-year-badges` — Bulk upserts year-badges (not used by admin app directly)
- `send-duck-push` — Triggered by DB webhook on `duck_quacks` INSERT (TestQuack reference)

---

## UI Layout

- **Desktop-first**, fixed sidebar (220px) + scrollable main panel
- **Sidebar:** App logo + name, Supabase connection status, 4 section nav items (with function counts), logged-in email + logout button
- **Main:** 3-column card grid per section; each function renders as a card
- **Feedback pattern:**
 - Toggle operations → instant visual state change
 - Test notifications → success/error banner for 5–6 seconds
 - Data mutations → confirmation message + data refresh
 - Errors → clear message with reason (e.g. "User not found")

---

## Project Structure (target)

```
src/
  lib/
    supabase.ts          # Supabase client singleton
  hooks/
    useAuth.ts           # Session + godlike email check
  components/
    AuthGate.tsx         # Wraps app: renders login or children
    Header.tsx
    Section.tsx          # Collapsible section wrapper
  sections/
    TestingTools/
    DataManagement/
    BadgeTesting/
    UserManagement/
  App.tsx
  main.tsx
```

---

## Key Constraints

- **Single godlike user** — email check is hardcoded via env var. Multi-admin is a future concern.
- **No offline support** — requires internet. Not a PWA.
- **English-only** — no i18n.
- **Desktop-first** — not optimized for mobile.
- **Build size target** — ~300–400 KB gzipped.
- **No shared source** with main app via submodules or monorepo. Copy utilities directly; extract to npm package only if the admin app grows significantly.

---

## Common Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # Lint
npm run test         # Run Vitest
```

---

## Success Criteria (from design)

1. Admin app deploys to separate domain independently
2. Godlike user can log in with email/password
3. All 10 functions are accessible and functional
4. Real-time changes sync with main app (where applicable)
5. Build passes and tests pass on every push
6. Error messages are clear and actionable
7. Load time < 3 seconds on typical connection
8. No secrets leaked in code or logs
