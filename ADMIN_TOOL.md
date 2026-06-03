# Godlike Admin Tool — Separate Web App Design

**Status:** Design approved (2026-05-31)  
**Scope:** Separate web app for godlike user to manage all admin configuration currently in `/profile` GodlikeAdminPanel  
**Tech Stack:** React + Vite (lightweight), Supabase JS SDK, plain CSS modules  
**Deployment:** Separate Git repo, separate domain, independent CI/CD  

---

## Visual Design — Control Room

**Direction:** Brand-adjacent ops dashboard. Same color tokens as `metaleiros.viralatas.org`, decorative elements stripped out. Feels like a festival production console, not a concert poster.

**Reference file:** `_temp/design-demos/demo-control-room.html`

### Color Tokens (from viralatas brand, verbatim)

```css
--ink:        #0d0d10;   /* page background */
--ink-soft:   #1a1a1f;   /* card / panel background */
--charcoal:   #2a2a30;   /* input background */
--slate:      #3f4d60;   /* sidebar nav hover */
--slate-deep: #2d3845;   /* sidebar background */
--slate-mid:  #364455;   /* sidebar accent surfaces */
--bone:       #f2ebde;   /* primary text */
--bone-soft:  #c8bfaf;   /* secondary text */
--bone-dim:   rgba(242,235,222,.45);  /* muted labels */
--caramel:    #d97b2c;   /* primary accent — active states, CTAs */
--caramel-hot:#f3953f;   /* hover on caramel */
--blood:      #c01e1e;   /* destructive actions only */
--rule:       rgba(242,235,222,.10);  /* dividers, subtle borders */
--rule-slate: rgba(63,77,96,.6);      /* sidebar borders */
```

### Typography

| Role | Font | Weight | Size | Traits |
|---|---|---|---|---|
| Section titles, nav labels | Bungee | 400 | 12–20px | uppercase, letter-spacing .04–.12em |
| Body copy, descriptions | Space Grotesk | 400/500 | 13–15px | — |
| All labels, IDs, values, inputs | JetBrains Mono | 300–500 | 9–14px | uppercase labels at .15–.25em spacing |

### Layout

- **Shell:** Fixed sidebar (220px) + scrollable main panel, full viewport height
- **Sidebar background:** `--slate-deep`; 1px border-right `--rule-slate`
- **Main panel background:** `--ink`
- **Topbar:** 56px, `--ink-soft`, 1px border-bottom `--rule`; breadcrumb left, meta right
- **Content area:** 28px padding all sides

### Sidebar Anatomy

```
┌──────────────────────────┐
│ [logo 28px] ADMIN        │  ← Bungee, caramel sub-label
│           Vira-Latas     │
├──────────────────────────┤
│ ● Supabase · connected   │  ← Mono 10px, green dot
├──────────────────────────┤
│  Sections                │  ← group label, mono 9px
│ ⚡ Testing Tools    [6]  │  ← active: caramel left-border + bg tint
│ ⊞ Data Management  [2]  │
│ ◈ Badge Testing    [1]  │
│ ⊙ User Management  [1]  │
├──────────────────────────┤
│ ● sfilizzola@gmail.com   │  ← caramel dot, Godlike badge
│ [Sign out]               │  ← on hover: blood red border + text
└──────────────────────────┘
```

### Function Card Anatomy

Each admin function renders as a card in a **3-column grid**:

```
┌──────────────────────────────┐
│ A-01                  ● Ready│  ← mono ID + status (ok/warn/off)
│ TEST QUACK                   │  ← Bungee title
│ Send a test duck…            │  ← Mono 11px description
│                              │
│ [Send Quack →]               │  ← caramel border btn; hover fills
└──────────────────────────────┘
```

Card variants by control type:
- **Button only** — Test Quack, Test Push
- **Number input + button** — Time Travel (`±days`)
- **Text input + button** — Live Band Test (band ID)
- **Toggle + input + button** — Metal Place Test (test mode on/off + zone radius)
- **Toggle only** — Feature Flags, Live Band Test mode

### Button Styles

| Variant | Default | Hover |
|---|---|---|
| Primary | `--caramel` border + text, transparent bg | Fill `--caramel`, ink text |
| Destructive | `--blood` border + text, transparent bg | Fill `--blood`, bone text |

Both use Mono font, uppercase, 1px border, no border-radius.

### Toggle Switch

- Dimensions: 36×20px; 1px border `--rule-slate`; bg `--charcoal`
- Off state: knob `--bone-dim`
- On state: bg `rgba(217,123,44,.25)`, border `--caramel`, knob `--caramel`
- Animated: 0.2s ease

### Status Indicators

```
● Ready    → color: #22c55e
◆ Active   → color: --caramel
○ Off      → color: --bone-dim
```

Mono 9px, uppercase, inline in card header.

### Realtime Banner

Full-width card (`grid-column: span 3`) above the function grid when a realtime subscription is active:

```
[● pulse]  metal_place_config · subscribed         last update 2m ago
```

Background `rgba(217,123,44,.04)`, border `rgba(217,123,44,.2)`.

### Login Screen

- Full-viewport centered; radial slate gradient behind panel
- Panel: 420px wide, `--ink-soft` bg, 1px border `--rule-slate`, caramel top accent line (2px)
- Header row: logo (36px) + "Admin Console" (Bungee) + "Vira-Latas · Restricted" (Mono, caramel)
- Fields: Mono 14px input on `--charcoal` bg, 1px border; focus → caramel border
- Labels: Mono 10px uppercase, .18em spacing
- CTA: Full-width `--caramel` button, Bungee, uppercase
- Note: Mono 10px centered, muted; Supabase Auth tagged in caramel

### CSS Naming Convention

Use CSS custom properties from the token list above. No raw hex values in component CSS — always reference `var(--token-name)`.

---

## Overview

A dedicated admin web application for the godlike user (`sfilizzola@gmail.com`) to configure festival settings, run tests, and manage data. Separate from the main app to achieve:
- **Architectural separation:** Admin tooling isolated from user-facing features
- **Independent deployment:** Can host on separate domain/infrastructure
- **Simplified auth:** Reuses Supabase email/password auth from main app

---

## Architecture & Deployment Model

### Repo Structure
- **Separate Git repository** (e.g., `viralatas-admin`)
- **Independent build pipeline** (Vite configuration separate from main app)
- **Independent deployment** (GitHub Actions, deploy to admin domain)

### Authentication
- **Auth method:** Supabase email/password (reuses godlike user credentials)
- **Session management:** Supabase JS SDK handles session persistence
- **Access control:** On app load, check if logged-in user email matches hardcoded godlike email (`sfilizzola@gmail.com`)
  - If match: unlock all admin features
  - If no match or not logged in: show "access denied" screen with login form
- **Logout:** Standard logout flow clears Supabase session

### Hosting & Deployment
- **Domain:** Separate from main app (e.g., `admin.viralatas.com` or `admin-panel.viralatas.com`)
- **Host:** Netlify, Vercel, or same infrastructure as main app (separate deployment)
- **CI/CD:** GitHub Actions workflow in admin repo
  - Trigger: push to `main` branch
  - Steps: lint → build → test → deploy
  - Pre-flight checks: build passes, tests pass, no secrets in code
- **Rollback:** Independent — rolling back admin app does not affect main app

### Shared Backend
- **Supabase:** Same project as main app
- **Tables accessed:** `metal_place_config`, `live_band_test_config`, `user_badge_history`, `users`
- **Realtime:** Subscriptions to `metal_place_config` and `live_band_test_config` for live updates
- **Environment variables:** Same as main app (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) + new `VITE_GODLIKE_EMAIL`

---

## UI Organization & Navigation

### Layout
- **Single-column, desktop-first** (admin tool, not mobile-optimized)
- **Header:** App title, godlike user email, logout button
- **Main content:** 4 collapsible sections, each with brief description

### Section A: Testing Tools (6 functions)
**Description:** Trigger events, configure test modes, and validate features.

1. **Test Quack** — Send a test duck notification to self (cooldown: 15s)
2. **Test Push** — Send a test web push notification (shows "Sent ✓" or error)
3. ~~**Time Travel**~~ — *(excluded from V1 — already handled in companion app)*
4. **Live Band Test** — Configure which band is "live now" for testing presence/alerts
5. **Metal Place Test** — Toggle metal place test mode on/off + configure test settings
6. **Feature Flags** — Toggle duck notification feature globally (affects all users)

**Interaction:** Each has a button, toggle, or form input. Results show instant feedback or error messages.

### Section B: Data Management (2 functions)
**Description:** Manage cache and data consolidation.

1. **Cache Reset** — Increment a version counter in Supabase; all main app clients detect the bump and invalidate their local cache (shows new counter value + timestamp)
2. ~~**Badge Consolidation**~~ — *(deferred to V2 — merge logic undefined until a real dedup problem appears)*

**Interaction:** Buttons with confirmation dialogs. Results show "Success" or error.

### Section C: Badge Testing (1 function)
**Description:** Add test badges to verify badge rendering and conditions.

1. **Test Badges** — Create test badges on godlike user's account (select badge, optionally set year)

**Interaction:** Dropdown to select badge, button to add. Shows success confirmation.

### Section D: User Management (1 function)
**Description:** Manage test user accounts (servants).

1. **Manage Servants** — List, create, and delete test user accounts for testing vira-lata interactions

**Interaction:** Table of test users with "create" and "delete" buttons. Shows confirmation on delete.

---

## Data Flow & Supabase Integration

### Read Operations
- **`metal_place_config`** (Realtime subscribed) — Read test mode status, zone configuration
- **`live_band_test_config`** (Realtime subscribed) — Read active band ID, test mode status
- **`users`** — List test users for management
- **`user_badge_history`** — View badges on godlike user

### Write Operations
- **`metal_place_config`** — Toggle test mode, update zone config
- **`live_band_test_config`** — Set active band ID, toggle test mode
- **`user_badge_history`** — Add test badges
- **`users`** — Create/delete test users (via Edge Function or direct insert)

### Realtime Sync
- Admin app subscribes to `metal_place_config` and `live_band_test_config`
- When main app or another admin instance updates these tables, changes reflect instantly in UI
- No polling; Supabase Realtime handles subscriptions

### Edge Functions (for complex operations)
- **Time Travel** — May invoke a custom Edge Function to shift festival date (TBD)
- **Cache Reset** — May invoke an Edge Function to clear distributed caches (TBD)
- **Test Push** — Invokes existing `send-test-push` Edge Function from main app

### Result Display
- **Toggle operations** (feature flags, test modes) → Instant visual feedback (button state changes)
- **Test notifications** → Success/error message displayed for 5–6 seconds
- **Data mutations** (add badge, delete user) → Confirmation message + data refresh
- **Errors** → Show error message with reason (e.g., "User not found", "Network error")

---

## Tech Stack & Build Configuration

### Core Dependencies
- **React** 18+ (same version as main app for consistency)
- **Vite** (same build tool and config style as main app)
- **TypeScript** (same language discipline)
- **@supabase/supabase-js** — Auth + database client
- **Plain CSS modules** or **Tailwind CSS** (minimal, no component library bloat)

### Excluded (vs. Main App)
- Service Worker / PWA layer (admin tool, not offline-first)
- IndexedDB (Supabase is single source of truth)
- Workbox / offline caching
- i18n (English-only for admin)
- Design system / badge components (admin has simple UI)

### Build Output
- Target: **~300–400 KB gzipped** (lightweight, but not minimal)
- Tree-shaking: Aggressive (remove unused React/Supabase code)
- Minification: Enabled
- Source maps: Included for debugging

### Environment Variables
```
VITE_SUPABASE_URL=<same as main app>
VITE_SUPABASE_ANON_KEY=<same as main app>
VITE_GODLIKE_EMAIL=sfilizzola@gmail.com
```

### Code Reuse Strategy
**Start:** Copy relevant utilities from main app (e.g., `src/lib/supabase.ts`, auth hooks)
**Later:** If admin app grows, extract shared code into private npm package and publish to npm registry
**Never:** Share source code via Git submodules or monorepo (keep repos independent)

---

## Deployment & CI/CD Pipeline

### Repository
- **Name:** `viralatas-admin` (suggested; user decides)
- **Visibility:** Private (admin tool, not public)
- **Default branch:** `main`

### GitHub Actions Workflow
**Trigger:** Push to `main` branch

**Steps:**
1. Checkout code
2. Setup Node.js
3. Install dependencies (`npm ci`)
4. Lint code (`npm run lint`)
5. Build (`npm run build`)
6. Run tests (`npm run test`)
7. Deploy to hosting (Netlify/Vercel/custom)

**Failure handling:** If any step fails, deployment stops and notifies (email, Slack, etc.)

**Deployment target:**
- **Domain:** Admin domain (e.g., `admin.viralatas.com`)
- **SSL/HTTPS:** Required
- **Environment variables:** Injected at deploy time (not in repo)

### Rollback
- **Manual:** Go to Netlify/Vercel dashboard, select previous deployment, click "Rollback"
- **Automatic:** Not set up initially; can add if needed later

### Frequency
- No scheduled deployments
- Deploy on demand (push to `main`)

---

## Testing Strategy

### Unit Tests (Vitest)
- Auth logic: Supabase session setup, email check, access control
- Component behavior: Button clicks, form submissions, state changes
- Data transformation: Time travel calculations, badge conditions, etc.
- Error handling: Network failures, validation errors

### Integration Tests
- **Auth flow:** Log in with godlike email → features unlock; log in with non-godlike email → access denied
- **Realtime sync:** Update `metal_place_config` in admin app → verify change in Supabase and vice versa
- **Data mutations:** Add test badge → verify it appears in user's badge history
- **Error handling:** Network timeout → show error message; user recovers by retrying

### Manual Testing Checklist (Before Release)
- [ ] All 10 functions work end-to-end
- [ ] Realtime sync works with main app (if applicable)
- [ ] Non-godlike user sees "access denied"
- [ ] Logout flow works
- [ ] All error messages are clear
- [ ] No console errors or warnings
- [ ] Performance is acceptable (page load < 3s)

### CI/CD Includes Tests
- Tests run on every push (before deployment)
- Deployment fails if tests fail
- No manual approval gate (fully automated)

---

## Dependencies & Constraints

### Must-Have (All 10 Functions)
All 10 admin functions are critical and must be included in initial release:
1. Test Quack
2. Test Push
3. Time Travel
4. Live Band Test
5. Metal Place Test
6. Feature Flags
7. Cache Reset
8. Badge Consolidation
9. Test Badges
10. User Management

### Nice-to-Have (Future)
- Admin audit log (track who made changes and when)
- Scheduled tasks (e.g., auto-reset cache daily)
- Role-based access (multiple admin users with different permissions)
- Dark/light mode toggle

### Known Constraints
- **Single godlike user:** Currently hardcoded (`sfilizzola@gmail.com`). Extending to multiple admins requires future work.
- **No offline support:** Admin tool requires internet connection (not a PWA)
- **English-only:** No i18n for now
- **Desktop-first:** Not optimized for mobile

---

## Success Criteria

1. ✅ Admin app deploys to separate domain independently
2. ✅ Godlike user can log in with email/password
3. ✅ All 10 functions are accessible and functional
4. ✅ Real-time changes sync with main app (where applicable)
5. ✅ Build passes and tests pass on every push
6. ✅ Error messages are clear and actionable
7. ✅ Load time < 3 seconds on typical connection
8. ✅ No secrets leaked in code or logs

---

## Next Steps

1. ✅ **Design approval**
2. ✅ **Grilling session** — scope locked (see V1 scope below)
3. **Scaffold the app** — Vite + React + TypeScript + Supabase client, sidebar shell, auth gate, all 7 section cards as stubs
4. **Implement each function one-by-one** — connect to Supabase, consult companion app wiki/code for schema details before implementing each card
5. **Deploy to production** (admin domain)

## V1 Scope (7 functions)

| # | Section | Function | Status |
|---|---|---|---|
| 1 | Testing | Test Quack | stub → implement |
| 2 | Testing | Test Push | stub → implement |
| 3 | Testing | Live Band Test | stub → implement |
| 4 | Testing | Metal Place Test | stub → implement |
| 5 | Testing | Feature Flags | stub → implement |
| 6 | Data | Cache Reset | stub → implement |
| 7 | Badges | Test Badges | stub → implement |
| — | Users | Manage Servants | stub → design TBD after consulting Supabase schema |

**Deferred to V2:** Time Travel (handled in companion app), Badge Consolidation (logic undefined)

---

## Notes & Open Questions

- **Time travel Edge Function:** Does this exist yet, or do we need to create it?
- **Cache reset:** Which caches are we resetting (IndexedDB only, or also Redis/CDN)?
- **User management:** Should we allow bulk operations (e.g., create 10 test users at once)?
- **Audit logging:** Nice-to-have, but should we design for it now?

**Add notes/questions as you iterate on this plan.**
