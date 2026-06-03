# Phase History

Complete record of every development phase for Viralatas Metaleiros, in order of completion. This is the canonical log — **do not maintain this list in CLAUDE.md or PHASES.md**.

**Rule:** When a phase is completed, append an entry here following the format below. Keep PHASES.md lean (active phase only) and CLAUDE.md free of phase history.

---

## Entry format

```markdown
### Phase N — Title
**Status:** ✅ Complete
**Deliverables:**
- ...
```

---

## Completed Phases

### Phase 1 — Foundation
**Status:** ✅ Complete
**Deliverables:**
- Auth flow (email/password)
- Initial Supabase schema
- Offline shell (Service Worker + IndexedDB setup)

---

### Phase 2 — Schedule
**Status:** ✅ Complete
**Deliverables:**
- Full band lineup data (78+ bands across 8 stages, 4 days)
- Schedule page with stage + day filters
- Full schedule cached to IndexedDB on first load (offline browsing works)

---

### Phase 3 — Picks
**Status:** ✅ Complete
**Deliverables:**
- Pick / unpick bands; picks stored in IndexedDB immediately
- Live vira-latas attendance counts via Supabase Realtime
- Offline pick queue with flush-on-reconnect

---

### Phase 4B — Live Preview
**Status:** ✅ Complete
**Deliverables:**
- Camping state tracking
- Vira-latas grid on `/now`
- LOST detection (user not at any known location)

---

### Phase 5 — Announcements & User Roles
**Status:** ✅ Complete
**Deliverables:**
- Mural-style announcements board (`/announcements`)
- Role hierarchy: `normal` / `manager` / `godlike`
- Manager blocking of posters
- Godlike powers (pin, delete any post)

---

### Phase 6 — Metal Place
**Status:** ✅ Complete
**Deliverables:**
- Festival-day check-in (`metal_place_config` table)
- Vira-latas grid card showing who is where
- Test mode via `live_band_test_config`

---

### Phase 7 — Profile Polish
**Status:** ✅ Complete
**Deliverables:**
- Badge modal on profile
- Live band test toggle in admin panel
- Collapsible admin sections
- Useful links section

---

### Phase 8 — Badge Asset Intake
**Status:** ✅ Complete
**Deliverables:**
- Inventoried `public/badges/` images
- Added Belgian country badge (`belga`)
- Added Colombian country badge (`cafetero`)

---

### Phase 9 — Schedule / My Picks / Popular Differentiation
**Status:** ✅ Complete
**Deliverables:**
- Extracted shared bones: `BandCard`, `BandFilters`, `BandDetailModal`, `useBandConflicts`
- Schedule: added search + genre filter
- My Picks: day-grouped timeline with conflict chips
- Popular: avatar clusters per band + detail modal

---

### Phase 9.B — Godlike Time Travel
**Status:** ✅ Complete
**Deliverables:**
- `now()` helper + `useNow` hook backed by `localStorage` override
- Quick-jump chips for D-1 / D1–D4 / D+1 in the Profile admin panel
- All time-dependent UI respects the override

---

### Phase 10 — Badge Expansion
**Status:** ✅ Complete
**Deliverables:**
- **10a:** Characteristic-badge conditions engine (`bands_picked_genre_min`, `bands_picked_stage_min`, `bands_picked_before_hour_min`, `band_picked_named`)
- **10b:** Seen-tracking via `user_missed_bands` table, IDB schema v8, offline missed-band queue; "Não vi essa banda" toggle in `BandDetailModal`
- 5 new `bands_seen_*` badge conditions
- Extended `BandDetailModal`: vira-latas breakdown, conflict warning
- 177 tests

---

### Design System Phase F — /now Visual Polish
**Status:** ✅ Complete
**Deliverables:**
- 4px stage-color accent strips per band card
- Oswald group titles for location sections
- Tinted gradient backgrounds (orange / teal / purple) per location type
- `useNow()`-driven page header showing festival day + time
- No structural/data changes

---

### Design System Phase G — /profile Restyle
**Status:** ✅ Complete
**Deliverables:**
- 56px avatar profile head with role chip / country flag / years pill
- All-badges patches-grid (4/6/8 cols by viewport; locked badges shown as grayscale)
- `year?` field on `BadgeConfig`
- Edit-profile collapsible with PT/EN language segment
- Gold godlike + blue manager collapsible section headers
- Sign-out pill at bottom

---

### Design System Phase H — Announcements Restyle
**Status:** ✅ Complete
**Deliverables:**
- `announce` grid card: 40px avatar | head/body/actions in column 2
- Role chips (Vira-latas / Manager / Godlike)
- Mono action buttons (pin, delete, block)
- Updated timestamp format: N min / Nh / DD/MM

---

### Design System Phase I — Auth Pages + Bottom Nav + Offline Chrome
**Status:** ✅ Complete
**Deliverables:**
- Login/register: 4px accent top border + Oswald title + mono labels
- `BottomNav`: mono 9px caps + filled-icon active states (6 tabs)
- `OfflineBanner` on `/now`, `/schedule`, `/my-picks`
- `PendingChip` on offline-queued picks and announcements
- `SyncToast` fires on reconnect flush when ≥1 item was synced

---

### Design System Phase J — Icon Pass
**Status:** ✅ Complete
**Deliverables:**
- `<Icon name="..."/>` component at `src/components/icons/Icon.tsx`
- 17 design-system icons (square caps, miter joins; filled variants for active states)
- `StarIcon` delegates to `Icon`
- `BandFilters` filter icon + `BandDetailModal` close icon updated
- ProfilePage chevrons (▼ → Icon); 🔧/👤 stripped; ✓/✗ removed from buttons

---

### Phase 11 — Profile, Header, Badges
**Status:** ✅ Complete
**Sub-phases:**

| Sub-phase | Deliverable |
|---|---|
| **11.A** | Fix `/now` header datetime stacking on mobile |
| **11.B** | Replace Wacken year checkboxes with pill grid (2005–2026) |
| **11.C** | New badge conditions: `wacken_years_count_min`, `wacken_attended_in_year` |
| **11.D** | Camping arrival day (`wacken_arrival_day` in user metadata) + `wacken_arrived_before` badge condition; `early-bird` badge |
| **11.E** | Godlike-assigned joke badges: `special_badges text[]` column, `assigned` condition, `assign-badge` Edge Function, assignment modal in Profile admin |
| **11.F** | Conflict severity split: soft ≤15 min / hard >15 min; 3-conflict warning banner on MyPicksPage |
| **11.G** | Collapsible day sections in `/my-picks`; 7 new badges + translations |
| **11.H** | Location presence badges + after-hour time badge conditions |
| **post-11** | 4 music-style badges: alestorm, mosh-pit, party-metal, crowdsurfer |

---

### Phase 12 — Crew Arrival Map
**Status:** ✅ Complete
**Sub-phases:**

| Sub-phase | Deliverable |
|---|---|
| **12.A** | Migrated `wacken_arrival_day` to `public.users` column; `EditProfileForm` writes to both places; `syncCrew()` expanded |
| **12.B** | Built `<ArrivalMap />`: bar-row-per-day layout with avatar clusters + name chips; 4px accent strips (teal/red/amber); time-aware auto-minimize |
| **12.C** | Integrated `<ArrivalMap>` on `/announcements` above announcements list |
| **12.D** | Localized arrival map strings for all 4 languages (br/en/es/de) with localized day labels |

---

### Phase 13 — Wiki: User Flows
**Status:** ✅ Complete
**Deliverables:**
- `flows/announcements.md` — Post lifecycle: online immediate, realtime from others, offline queue, reconnect flush, soft-delete, moderation RLS
- `flows/live-now.md` — BandTime logic, current/next band selection, `useNow()` time-shift override, conflict severity (soft/hard), crew counts
- `flows/offline-pick-sync.md` — Queue store structure (13 object stores), dedup by (user_id, band_id), keepLast semantics, worked example (T=0:10→T=0:30), error recovery, SyncToast
- `flows/authentication.md` — Signup trigger → users table, custom IndexedDB session adapter, test user metadata, godlike role assignment, RLS per-table enforcement

---

### Phase 14 — Wiki: Architectural Decisions
**Status:** ✅ Complete
**Deliverables:**
- `decisions/supabase-as-sync-target.md` — Why Supabase (Auth + DB + Realtime), alternatives considered, cost/vendor tradeoffs, eventual consistency accepted
- `decisions/custom-hooks-events-no-redux.md` — Why window events + custom hooks over Zustand/Redux; simplicity, bundle size, when NOT to use
- `decisions/workbox-caching-strategy.md` — NetworkFirst for API, CacheFirst for assets, cache invalidation via version bump, offline resilience

---

### Phase 15 — Wiki: Glossary Expansion & Index
**Status:** ✅ Complete
**Deliverables:**
- Glossary expanded to 140+ terms (was ~100); covers deduplication, soft-delete, time-shift, NetworkFirst, offline queue, godlike, and all terms introduced in Phases 13–14
- `index.md` updated: lists all 19 wiki documents, organised with reading paths for first-time engineer / badge developer / offline expert

---

### Phase 16 — Schedule Sort Order Filter
**Status:** ✅ Complete
**Deliverables:**
- `sortOrder: 'time-asc' | 'time-desc' | 'alpha'` field added to `BandFilterValue` and `EMPTY_FILTERS` (`src/components/bandFilterValue.ts`)
- Sort logic moved into `filterBands()` in `src/services/bandFilter.ts` as a final step; secondary sort by `name` for stable ordering on identical `start_time`
- `scheduleFilterStorage.ts` persists and restores `sortOrder`; falls back to `'time-asc'` on invalid/missing stored value
- 3 new icons added to `src/components/icons/Icon.tsx`: `sort-time-asc` (clock + sun), `sort-time-desc` (clock + crescent moon), `sort-alpha` (A/Z + arrow)
- Day tabs row restructured to flex in `BandFilters.tsx`; sort button (36×36px, accent dot on non-default) + upward-anchored icon-only popover added
- `BandFilters.module.css` — `.dayTabsRow`, `.sortWrapper`, `.sortBtn`, `.sortBtnActive`, `.sortDot`, `.sortPopover`, `.sortOption`, `.sortOptionActive` styles
- Hardcoded `.sort()` removed from `SchedulePage.tsx` `loadBands()` callback
- 4 i18n keys (`sortLabel`, `sortTimeAsc`, `sortTimeDesc`, `sortAlpha`) added to all 4 locale files
- `clearAll()` preserves `sortOrder` (sort is a display preference, not a filter)

---

### Phase 17 — My Picks: Saw / Didn't See Sections
**Status:** ✅ Complete
**Deliverables:**
- `hidePick?: boolean` prop added to `BandCard` — suppresses the star button (controlled by `variant !== 'ranked' && !hidePick`)
- `hidePick?: boolean` prop added to `BandDetailModal` — hides the pick/unpick action button when `true`; saw/missed toggle is unaffected
- `MyPicksPage` grouping refactored: `myBands` split into `upcomingBands` (end_time ≥ now) and `endedBands` (end_time < now); `endedBands` further split into `sawBands` / `didntSeeBands` via per-user `missedBandIds` from `allMissed`
- `grouped` now derives from `upcomingBands`; ended bands no longer appear in day sections
- Two new collapsible sections rendered at the bottom of the list: "Saw" (green `--signal-ok` border) and "Didn't See" (amber `--signal-warn` border); each hidden when empty
- `.dayHeaderSaw` and `.dayHeaderDidntSee` CSS modifier classes added to `SchedulePage.module.css`
- `sectionSaw` and `sectionDidntSee` i18n keys (with `{count}` interpolation) added to all 4 locale files (`br`, `en`, `de`, `es`)
- `BandDetailModal` in `MyPicksPage` receives `hidePick={isBandEnded}` so the pick/unpick button disappears once a band has ended

---

### Phase 18 — Badge Preview Tool in Godlike Menu
**Status:** ✅ Complete
**Deliverables:**
- `src/components/profile/TestBadgeSection.tsx` — new self-contained component; renders scrollable grid of all badges from `BADGES` registry; manages local `selectedBadge: BadgeConfig | null` state; opens a detail modal with badge image, optional year chip, translated title, and description; zero persistence, zero network calls
- `src/components/profile/GodlikeAdminPanel.module.css` — new CSS module with `.testBadgeGrid`, `.testBadgeCell`, `.testBadgeCaption` (grid) and full set of `.testBadgeModal*` classes (modal detail) mirroring `BadgesDisplay.module.css` visual pattern
- `GodlikeAdminPanel.tsx` — imports and mounts `<TestBadgeSection t={t} />` after `<TimeTravelSection />`, before the registered users list

---

## Phase 19 — Closing Ceremony Slot

**Completed:** 2026-05-15

**Goal:** Model the Wacken closing ceremony as a first-class pickable timetable entry — visible across `/schedule`, `/now`, and `/my-picks` with a distinctive gold border and "Closing Ceremony" label, excluded from `/popular`, excluded from all music-badge counts, and generating no conflict alerts when overlapping a band pick.

**Deliverables:**
- `supabase/migrations/20260514000000_idea7_band_category.sql` — `category text not null default 'band'` column + check constraint `('band','ceremony')` on `public.bands`
- `BandCategory = 'band' | 'ceremony'` union and `category` field on `Band` type in `src/types/index.ts`
- `category` field added to `BadgeBand` via `Pick<Band, ...>` in `src/services/badges/types.ts`
- `buildBadgeContext` in `src/services/badges/engine.ts` filters ceremony from `pickedBands` / `seenBands`; `bands_picked_min` condition changed to use `pickedBands.length` (consistent with all other `bands_picked_*` conditions)
- `computeBandOverlaps` in `src/hooks/useBandConflicts.ts` skips ceremony entries — no conflict chip ever shown
- `.cardCeremony` + `.ceremonyLabel` CSS in `src/components/BandCard.module.css`; ceremony rendering logic in `src/components/BandCard.tsx` (gold color, `✦ Closing Ceremony` chip replacing stage chip)
- `popularBands` filter in `src/pages/PopularPage.tsx` excludes `category === 'ceremony'`
- `scheduleClosingCeremony` i18n key in all 4 locale files (`SchedulePage_br/en/de/es.json`)
- `Farewell & Announcements` ceremony seed entry in `supabase/seed/bands.ts` at Faster stage, slot FAS17 (22:30–23:00 Day 4 Saturday Aug 1)
- Phase 19 ceremony badge regression suite (12 tests) in `src/__tests__/badges.test.ts`; `band()` helper updated with `category: 'band'` default; new `ceremonyBand()` helper

---

### Phase 20 — The Duck 🦆
**Status:** ✅ Complete

**Goal:** Add a social rubber-duck quack button to live band cards. When a user who has picked a band presses the duck during the live set, a floating duck notification is broadcast to all other pickers — in-app via Supabase Realtime (DuckToast) and as a Web Push system notification for background/closed-app users. 90-second per-user per-band cooldown shown as a conic-gradient drain animation. Offline presses are queued and flushed on reconnect.

**Deliverables:**
- `supabase/migrations/20260515000002_phase20_duck.sql` — `duck_quacks` (Realtime-enabled, RLS INSERT own / SELECT all) + `push_subscriptions` (RLS INSERT/DELETE/SELECT own) tables
- `src/lib/db.ts` — `offline_duck_quacks` IDB store (DB version 8→9); `OfflineDuckQuackOp` type + helpers
- `src/lib/pushSubscription.ts` — `subscribeToPush(userId)`: Notification permission + PushSubscription registration + Supabase upsert
- `src/workers/sw.ts` — custom SW (injectManifest): Workbox precache + NetworkFirst (Supabase) + CacheFirst (Wacken images) + `push` + `notificationclick` handlers
- `vite.config.ts` — switched from `generateSW` → `injectManifest` strategy
- `src/repositories/duck.ts` — `quackBand` (online/offline) + `flushOfflineDucks`; exported from `src/repositories/index.ts`
- `src/hooks/useDuckQuack.ts` — 90s localStorage cooldown; returns `{ quack, isOnCooldown, cooldownUntil }`
- `src/hooks/useDuckNotifications.ts` — Realtime listener on `duck_quacks` INSERT; dispatches `viralatas:duck-quack` CustomEvent
- `src/components/DuckButton.tsx` + `DuckButton.module.css` — circular duck PNG button; conic-gradient drain overlay (elapsed CW sweep); pop animation
- `src/components/DuckToast.tsx` + `DuckToast.module.css` — global floating toast; listens to `viralatas:duck-quack`; resolves band name from IndexedDB; animated entrance/exit; 3s auto-dismiss
- `src/i18n/DuckButton_{br,en,de,es}.json` — i18n namespace for duck UI labels; registered in `src/lib/i18n.ts`
- `src/components/BandCard.tsx` + `BandCard.module.css` — `onDuck?`/`duckCooldownUntil?` props; `.withDuck` CSS grid variant
- `src/components/now/CrewGroupsSection.tsx` — `onDuck?`/`duckCooldownUntil?` props; DuckButton in `.groupActions` on user's live band group
- `src/hooks/useNowData.ts` — `useDuckQuack(userId, duckBandId)`; exposes `duckBandId`, `duckQuack`, `duckCooldownUntil`
- `src/pages/RightNowPage.tsx` — passes duck props to `CrewGroupsSection`
- `src/pages/SchedulePage.tsx` — `DuckableBandCard` wrapper (hook per band, null when not applicable)
- `src/App.tsx` — mounts `DuckSync`, `PushSetup`, `DuckNotificationsListener`, `DuckToast`
- `supabase/functions/send-duck-push/index.ts` — Edge Function for Web Push via `npm:web-push`; triggered by Supabase Database Webhook on `duck_quacks` INSERT
- `public/vira-lata-ds.html` §11 — pre-authored DuckButton states (ready/cooldown drain at 10/50/85%), DuckToast entrance/exit, live card simulation with 8 crew + "I am weak" + duck button

**Post-phase additions (2026-05-16):**
- `supabase/functions/send-test-push/index.ts` — diagnostic Edge Function for godlike admins; authenticates caller, looks up their `push_subscriptions`, sends a real VAPID push directly to their own device; allows end-to-end push stack verification without needing a second user
- `src/components/profile/GodlikeAdminPanel.tsx` — "📲 Test Push Notification" button calling `send-test-push`; inline feedback for success, no-subscription, and failure states
- `docs/ai-wiki/flows/duck.md` — full flow document (was missing after Phase 20 closed)

---

### Phase 21 — Duck Killswitch 🦆🔌
**Status:** ✅ Complete

**Goal:** Global on/off switch for the Duck feature, managed from Godlike Powers → Duck feature. When OFF, the rubber-duck button does not render anywhere — `/now`, `/schedule`, and any future `BandCard` instance are all duck-free. When ON, behavior is identical to Phase 20. The Godlike "Test Quack" diagnostic tile remains visible regardless of switch state (admin escape hatch) and surfaces a "currently disabled for users" hint when the feature is off.

**Architectural shape:** Single boolean column on the existing `app_settings` table (same pattern as `registration_enabled`). Fetched once at app boot via `getDuckEnabled()`, cached in a small `DuckEnabledProvider` Context, consumed by `useDuckEnabled()` at three gate-points. Server-side (Edge Function, `duck_quacks` INSERT, Realtime subscription) is untouched on purpose: offline-queued ducks still flush and broadcast on reconnect, respecting the user's intent at press time. The killswitch is a "future button visibility" gate, not a data block.

**Deliverables:**
- `supabase/migrations/20260517000000_app_settings_duck_enabled.sql` — adds `duck_enabled boolean default true not null` to `public.app_settings`; inherits existing RLS (anyone reads, only godlike updates); no Realtime publication change
- `src/lib/supabase.types.ts` — `app_settings` Row/Insert/Update types extended with the new column
- `src/lib/appSettings.ts` — `getDuckEnabled()` and `setDuckEnabled()` helpers mirroring the registration killswitch shape; both default to `true` on read failure (offline-first principle)
- `src/contexts/DuckEnabledContext.tsx` — `DuckEnabledProvider` + `useDuckEnabled()` + `useRefreshDuckEnabled()`; Context value memoized; defaults to `true` while loading so users never see a "missing duck button" flash
- `src/App.tsx` — app tree wrapped in `<DuckEnabledProvider>`
- `src/pages/RightNowPage.tsx` — `onDuck` passed to `CrewGroupsSection` only when `duckEnabled && duckBandId`
- `src/pages/SchedulePage.tsx` — `DuckableBandCard.canDuck` short-circuits when `duckEnabled` is `false`
- `src/components/profile/GodlikeAdminPanel.tsx` — new "Duck feature 🦆" toggle section mirroring the existing "Control registration" UI (button + 🟢/🔴 status dot, identical styling); calls `useRefreshDuckEnabled()` after a successful toggle so the admin's own session reflects the change immediately; existing Test Quack tile now shows a `testQuackDisabledHint` line above the `DuckButton` when the feature is OFF
- `src/i18n/ProfilePage_{br,en,es,de}.json` — 7 new keys: `duckToggle`, `duckToggleDescription`, `duckEnabled`, `duckDisabled`, `duckLoading`, `duckToggleError`, `testQuackDisabledHint`
- `public/vira-lata-ds.html` — BandCard component-section now documents the killswitch visibility rule and where the toggle lives
- `docs/ai-wiki/flows/duck.md` — new "Killswitch (Phase 21)" section; "Relevant Source Files" table extended with `DuckEnabledContext.tsx` and `appSettings.ts`
- `docs/ai-wiki/supabase-schema.md` — new `public.app_settings` table section documenting both `registration_enabled` and `duck_enabled` (this filled a pre-existing gap — `app_settings` had been missing from the schema doc since the registration killswitch shipped)
- `src/__tests__/duckKillswitch.test.tsx` — 12 new tests covering `getDuckEnabled` (true/false/error/throws/null defaults), `setDuckEnabled` (happy path, row-lookup failure, update failure), and `DuckEnabledProvider` (initial true, initial false, network failure stays true, `refresh()` picks up a toggle within the same session)

**Architectural notes:**
- The killswitch is a UI-layer gate, not a server-side block. `send-duck-push`, the `duck_quacks` INSERT path, and `useDuckNotifications` Realtime subscription are all untouched. Offline-queued ducks still flush and broadcast on reconnect even if the switch was flipped to OFF in the meantime — this respects the user's intent at press time and preserves the offline-first contract.
- **Next-load propagation only.** No Realtime subscription on `app_settings`; mid-session users won't see the change until reload. The admin's own session is the exception: a successful toggle triggers `useRefreshDuckEnabled()` so the cached Context value updates immediately (so the Test Quack hint appears/disappears in real time within the admin panel).
- The Test Quack tile is the **only non-gated duck render**. It uses a local-only window event (no DB write, no other user affected), so leaving it functional during killswitch=off is safe.
- `useDuckEnabled` defaults to `true` while loading so users never see a flash of missing duck button on a slow first paint.

---

### Phase 22 — Playlist Launch
**Status:** ✅ Complete

**Goal:** Add a "Generate setlist" strip to `/my-picks` that deep-links the user to **Setlist Vira-Latas** (`setlist.viralatas.org`) with their picked band names pre-filled. The external app shows a track preview; the user taps "Generate" and lands in Spotify with their personal playlist. Shipped behind a feature flag so the godlike can test with managers before releasing to all vira-latas.

**Deliverables:**
- `supabase/migrations/20260522000000_playlist_testing.sql` — adds `playlist_testing boolean DEFAULT true NOT NULL` to `public.app_settings`; inherits existing RLS (anyone reads, only godlike updates)
- `src/lib/supabase.types.ts` — `app_settings` Row/Insert/Update types extended with `playlist_testing`
- `src/lib/appSettings.ts` — `getPlaylistTesting()` + `setPlaylistTesting()` helpers (duck pattern)
- `src/components/PlaylistLaunchButton.tsx` — self-contained component: reads `playlist_testing`, user role, and `preferred_language` on mount; hidden when 0 picks; hidden to `normal` role when `playlist_testing = true`; builds `/launch` URL via `URLSearchParams` with repeated `bands` params, `user_name` trimmed to 20 chars, `lang` mapped (`br` → `pt-BR`, else `en`); renders as `<a target="_blank">`
- `src/components/PlaylistLaunchButton.module.css` — full-width teal strip using design-system tokens only
- `src/pages/MyPicksPage.tsx` — `<PlaylistLaunchButton bands={myBands} userName={displayName} />` below conflict banner, above band sections
- `src/components/profile/GodlikeAdminPanel.tsx` — new "Playlist feature" toggle section in Godlike Powers, mirroring the duck toggle pattern
- `src/i18n/MyPicksPage_{br,en,es,de}.json` — `generateSetlist` + `generateSetlistSub` keys
- `src/i18n/ProfilePage_{br,en,es,de}.json` — `playlistToggle`, `playlistTesting`, `playlistLive`, `playlistToggleError` keys
- `public/vira-lata-ds.html` — `PlaylistLaunchButton` documented in a new component section

**Part 2 (integration, no code changes):** Deep-link confirmed working end-to-end — opens `setlist.viralatas.org` with correct `user_name`, all picked band names, and `lang`; track preview loads; "Generate" lands in Spotify with the user's personal playlist.

**Acceptance criteria (all met):**
- [x] Godlike and manager see the strip on `/my-picks` when `playlist_testing = true`
- [x] Normal users hidden while `playlist_testing = true`
- [x] Godlike flips flag to `false` → all users see strip on next load
- [x] URL carries correct `user_name`, band list, and `lang`
- [x] Strip hidden when user has 0 picks
- [x] Build and tests green
- [x] End-to-end: Setlist preview + Spotify playlist generation confirmed

**Wiki:** `docs/ai-wiki/flows/playlist-launch.md` · App Pack section in `architecture.md`

**Architectural notes:**
- `PlaylistLaunchButton` reads `playlist_testing` directly from Supabase on mount (not cached in IndexedDB). This is intentional — the flag is low-frequency and the button is purely a convenience deep-link out of the app; offline-first treatment is unnecessary.
- The flag graduation path (when `playlist_testing` is removed) requires only deleting the flag column, the role-check logic inside the component, and the admin toggle — the component itself stays permanently.

---

### Phase 23 — MoshSplit Balance Section
**Status:** ✅ Complete

**Goal:** Add a self-contained collapsible `MoshSplitSection` component to the Profile page showing the user's net balance from **MoshSplit** (`split.viralatas.org`) — the festival finance app used by the vira-latas at Wacken. Shipped in two parts: Part 1 (mocked UI for approval), Part 2 (real API connection).

**Deliverables:**
- `src/components/profile/MoshSplitSection.tsx` — self-contained component accepting only `userEmail: string`; fetches `POST /v1/balances/external-summary` via same-origin proxy; five render states: `loading` (spinner in trigger), `not_found` (returns null), `settled` (balance = 0, teal "Quitado" chip), `active` (nonzero balance, red chip if owes / teal if owed), `error` (orange `!` chip + warning message, CTA still visible)
- `src/components/profile/MoshSplitSection.module.css` — collapsible card styles using existing design-system tokens only (`--bg-elevated`, `--border`, `--signal-ok`, `--accent`, `--font-display`, `--font-mono`, `--s-*`, `--r-*`); no new custom properties
- `src/pages/ProfilePage.tsx` — `<MoshSplitSection userEmail={user.email ?? ''} />` inserted after `<ConflictSection>`, before `<EditProfileForm>`
- `vercel.json` — `/api/moshsplit/:path*` → `https://split.viralatas.org/:path*` rewrite added before SPA catch-all; solves CORS (browser never contacts `split.viralatas.org` directly)
- `vite.config.ts` — `server.proxy` mirrors the Vercel rewrite for local development
- `README.md` — `VITE_MOSHSPLIT_TOKEN` documented in Environment Setup section
- `public/vira-lata-ds.html` — `MoshSplitSection` documented in the profile components section
- `docs/ai-wiki/flows/moshsplit.md` — new wiki page covering component states, API contract, proxy architecture, and data flow
- `docs/ai-wiki/architecture.md` — App Pack section extended with MoshSplit integration
- **Hotfixes shipped during phase:** fix horizontal scroll on iOS mobile (`SchedulePage.module.css`), fix offline gap for godlike-assigned badges (`BadgesDisplay.tsx` two-phase loading with skeleton), hide `PlaylistLaunchButton` once the festival starts

**Acceptance criteria (all met):**
- [x] Real balance loaded from `POST /v1/balances/external-summary` using user email + `VITE_MOSHSPLIT_TOKEN`
- [x] `404` response → `not_found` state (component invisible)
- [x] Network / `4xx` error → error state (warning message visible, CTA still available)
- [x] Amounts displayed in EUR converted from cents (`total_balance_cents / 100`)
- [x] CTA "Abrir MoshSplit →" opens `https://split.viralatas.org` in new tab
- [x] `VITE_MOSHSPLIT_TOKEN` documented in README env var section
- [x] Build passes, no linter errors; all 416 tests green

**Architectural notes:**
- The component talks to MoshSplit exclusively through a same-origin Vercel proxy (`/api/moshsplit/*`), mirrored by a Vite dev proxy. This keeps the API token server-side and avoids CORS entirely without a dedicated Edge Function.
- `MoshSplitSection` is deliberately NOT offline-first: balance data is financial and time-sensitive; showing stale cached amounts would be misleading. If offline, the component stays in the `loading` state (spinner) and shows no balance — same as a network error, but without the error message since the user is simply offline.
- `BadgesDisplay` was refactored to two-phase loading during this phase: Phase 1 reads from IndexedDB immediately (fast, offline-safe); Phase 2 fetches `special_badges`/`is_friend` from Supabase in the background with a skeleton pulse animation.

---

### Phase 24 — Non-Destructive Lineup Sync
**Status:** ✅ Complete

**Goal:** Replace destructive `seed:bands` as the default path for lineup edits. Stable `slot_id` identity on every band row; `seed:bands:sync` applies name/time/genre/image changes without wiping `user_picks`.

**Deliverables:**
- `supabase/migrations/20260524000000_bands_slot_id_add.sql` — NULLable `slot_id` + index
- `supabase/migrations/20260524000001_bands_slot_id_lock.sql` — NOT NULL + UNIQUE; drops composite `UNIQUE(stage, start_time, name)`
- `supabase/seed/bands.ts` — `slot_id` on all 187 rows; `assertSeedIntegrity()`; destructive banner points at sync
- `supabase/seed/bands-sync.ts` + `npm run seed:bands:sync` — dry-run default; `--apply` UPDATE/INSERT/DELETE by `slot_id`; bumps `cache_version`; timestamptz-normalized diff
- `supabase/seed/bands-move.ts` + `npm run seed:bands:move` — pick transfer when band relocates slot
- `supabase/seed/bands-backfill-slot-id.ts` — non-destructive `slot_id` bootstrap (UPDATE only; picks preserved)
- `supabase/seed/seed-shared.ts` — shared env loader, service client, cache bump
- `src/types/index.ts` — `Band.slot_id: string` required
- Wiki: `lineup-sync.md`, `lineup.md`, `supabase-schema.md`, `festival-reset.md`, `index.md`; `.claude/context/production-database.md`

**Acceptance criteria (all met):**
- [x] Every band row has unique `slot_id` in DB and `bands.ts` (187 / 187 verified on prod)
- [x] `seed:bands:sync` dry-run exits 0 with empty plan on aligned DB
- [x] One-field change → 1-row UPDATE; `--apply` preserves `user_picks` count (Lovebites FAS1 genre test on prod)
- [x] `cache_version` bumps on `--apply`
- [x] Destructive `seed:bands` banner warns to use sync for small edits
- [x] Build + tests green; wiki + changelog updated

**Wiki:** `docs/ai-wiki/lineup-sync.md` · design `docs/superpowers/specs/2026-05-20-non-destructive-lineup-sync-design.md`

**Architectural notes:**
- `slot_id` is canonical DB identity; UI keeps using `band.id` for FKs. Client unchanged except type field.
- Bootstrap path: migration add → `seed:bands:backfill-slot-id -- --apply` → migration lock. **Not** destructive seed (no PITR on this Supabase plan).
- Agents must never run destructive seed/reset on prod without explicit operator confirmation (see `production-database.md`).

---

### Phase 25 — Genre Collapse
**Status:** ✅ Complete

**Goal:** Collapse ~95 distinct genre strings to **13 canonical labels** by renaming band genres in-place. Schedule genre filter becomes usable on mobile via pills + inline genre guide.

**Deliverables:**
- `docs/superpowers/specs/2026-05-24-genre-collapse-design.md` — collapse spec + old→new mapping table
- `src/services/genreGuide.ts` — `GENRE_COLLAPSE_MAP`, `GENRE_GUIDE`, `sortFilterGenres()`
- `supabase/seed/bands.ts` + `docs/ai-wiki/lineup.md` — 93 genre strings → 13; `TBD_GENRE` → `Metal`; all `Metal Battle *` → `Metal Battle`
- `scripts/apply-genre-collapse.ts` — one-shot rename helper for seed + lineup
- `src/components/BandFilters.tsx` — genre filter uses single-select pills (replaces native `<select>`)
- `src/components/GenreGuideCollapsible.tsx` — inline collapsible guide below pill row in filter drawer
- `src/i18n/SchedulePage_{br,en,es,de}.json` — genre guide keys
- `public/vira-lata-ds.html` — genre pills + GenreGuideCollapsible documented
- Wiki: `domain-model.md`, `lineup.md`, `changelog.md`

**Acceptance criteria (all met):**
- [x] Distinct genre strings in seed ≤ 13 (verified: 13)
- [x] Schedule genre filter uses pills (not native `<select>`); ≤ 13 options
- [x] `party-metal` badge unchanged; Alestorm + Airbourne remain `Party Metal`
- [x] Zero pick loss after `seed:bands:sync --apply` (prod: no changes needed — DB already aligned; 0 picks affected)
- [x] Genre guide reachable in ≤1 tap from open filter drawer (inline collapsible)
- [x] Guide shows all 13 canonical labels and absorbed subgenres; Party Metal exception copy visible
- [x] Guide usable at 375px width with Apply button still reachable (`max-height: 28dvh` on list)
- [x] Pattern documented in Design System
- [x] `lineup.md` + `bands.ts` in sync with live DB
- [x] Build + tests green; wiki + changelog updated

**Wiki:** `docs/ai-wiki/genre-collapse-mapping.md` · `docs/ai-wiki/decisions/genre-collapse-canonical-labels.md` · `docs/superpowers/specs/2026-05-24-genre-collapse-design.md` · `domain-model.md` · `lineup.md`

**Architectural notes:**
- No schema change — rename in-place only; deploy via `seed:bands:sync --apply`.
- Guide data is static in `genreGuide.ts` (offline-safe), not computed from live band list.
- `death-metal` / `power-metal` badge thresholds kept at 3; `party-metal` unchanged.
- Doom Metal absorbs Gothic Metal and related tags (Gothic / Industrial, Sludge, Post-Metal, Stoner Rock, Occult Rock).

---

### Phase 26 — Complexity Reduction & Simplification
**Status:** ✅ Complete

**Goal:** Reduce cognitive load and file size across the React app without changing user-visible behavior. Extract repeated patterns into hooks and services, split god files into focused modules, and strengthen tests so each sub-stage is safely reviewable. Preserve offline-first invariants (`UI → IndexedDB ↕ Supabase`).

**Deliverables:**
- **26.A — Refactor safety net:** `db.test.ts`, real auth module tests (`login`, `registration`, `auth-integration`), `fake-indexeddb`, `resetDbConnectionForTests()`
- **26.B — Festival constants:** `FESTIVAL_DAY_1_START`, `isFestivalActive()`, `getFestivalDay()`, `wackenLocalMidnight()` in `time.ts`; five consumers migrated
- **26.C — `useBands()`:** catalog hook + `BANDS_CHANGED_EVENT`; Schedule, My Picks, Popular, useNowData
- **26.D — `useMissedBands()`:** deduped missed-band loading/sync/realtime across My Picks, Popular, BadgesDisplay
- **26.E — `usePickActions()`:** pick toggle wrapper; five consumers migrated
- **26.F — `useBandDetailModal()` + `BandDetailModalHost`:** shared modal state for My Picks and Popular
- **26.G — Sync orchestration:** `src/components/sync/` extracts from `App.tsx` (238 → 84 lines)
- **26.H — Realtime helper:** `subscribePostgresChanges()` in `realtimeSync.ts`; six call sites refactored
- **26.I — BadgesDisplay split:** `stackLayout.ts`, `useBadgeContext.ts`; component 599 → 258 lines
- **26.J — Repository boundaries:** admin user ops → `usersRepository`; announcements repo mural-only
- **26.K — `useAnnouncements()`:** hook + `announcementsDisplay.ts`; AnnouncementsPage 437 → 299 lines
- **26.L — GodlikeAdminPanel:** five section components; panel 933 → 203 lines
- **26.M — Slim `useNowData()`:** config/realtime/cache/plan hooks + presence side effects in repository; hook 335 → 162 lines
- **26.N — `db.ts` domain modules:** monolith (~555 lines) → 12 modules under `src/lib/db/` + barrel; public import path unchanged

**Acceptance criteria (all met):**
- [x] `rtk npm run build` green
- [x] `rtk npm test` — 488 tests at phase close (502 after post-phase lost-badge fix); coverage thresholds tightened (95% stmts/lines/funcs on `src/lib/db/**`)
- [x] No new direct Supabase reads from presentation components (admin boundaries preserved)
- [x] Offline-first invariants preserved — IndexedDB primary, repositories emit events, hooks subscribe
- [x] Wiki updated (`architecture.md`, `flows/live-now.md`, `sync-engine.md`, `testing.md`, per-sub-stage `changelog.md` entries)

**Wiki:** `docs/ai-wiki/architecture.md` · `docs/ai-wiki/changelog.md` (26.A–26.N.k entries) · post-close gap pass (`testing.md`, `live-now.md`, `sync-engine.md`, lost-badge fix)

**Architectural notes:**
- Hooks + window events pattern unchanged (no Redux/Zustand). Pages consume hooks; repositories own IDB writes and event emission.
- `src/lib/db.ts` is a one-line shim re-exporting `src/lib/db/index.ts`; ~40 importers unchanged.
- `useNowData()` composes `useMetalPlaceConfig`, `useLiveBandTestConfig`, `usePresenceRealtime`, `useNowCache`, `useNowPlans`; presence toggles delegate to `applyPresenceToggle()` in `presenceRepository`.
- Sub-stages landed as 29 individual commits on `dev` (26.A through 26.N.k); phase closed with docs commit.

---

### Phase 27 — Architecture Deepening (Seam Restoration)
**Status:** ✅ Complete

**Goal:** Restore the intended offline-first seam (`UI → IndexedDB ← repositories → Supabase`). Deepen shallow modules from the May 2026 architecture review: fix correctness gaps first, then consolidate sync orchestration, Realtime ownership, and offline-queue semantics. Preserve Phase 26 hook + window-event model; extend ADRs where subscription site moves to sync layer.

**Deliverables:**
- **27.A — Complete `wipeAllLocalData`:** extend `src/lib/db/meta.ts` to clear all non-session stores; test against `connection.ts` store list
- **27.B — Badge presence alignment:** `deriveUserBadgeLocation()` shared with `/now` grouping; gate `liveTestBandId` on `enabled`; cross-domain contract tests via `liveNowScenarios.ts`
- **27.C — Sync coordinator:** `runReconnectSync()` in `syncCoordinator.ts` — flush all queues → pull remote → `viralatas:sync-complete`; `ReconnectSync` replaces PickSync/AnnouncementSync/DuckSync
- **27.D — Realtime in repositories:** `subscribeToRealtime()` on picks, announcements, presence, users, live band test; `RealtimeSync` mount; hooks IDB + window events only
- **27.E — Offline-queue primitive:** shared `OptimisticQueue` with configurable dedup; five repositories migrated; uniform `flushOfflineQueue()` for coordinator
- **27.F — IDB subscription caches:** `useIdbSubscription` / `useSyncExternalStore`; `useAllPicks` shared cache; `usePickCounts`, `useBandAttendees`, `useNowCache`, `useBadgeContext` consume cache
- **27.G — Decompose `useBadgeContext`:** `useBadgeCache` + `buildBadgeContextFromSnapshot()` + `useBadgePersist` + thin composer (mirror 26.M `/now` split)
- **27.H — Bands repository sync:** fold `src/lib/sync.ts` into `bandsRepository.sync()`; delete pass-through module

**Acceptance criteria (all met):**
- [x] 27.A–27.H shipped (8 sub-stages on `dev`)
- [x] `rtk npm run build` green
- [x] `rtk npm test` green — 537 tests; wipe, badge presence parity, queue dedup, coordinator reconnect, bands sync covered
- [x] Offline-first invariants preserved — no new presentation-layer Supabase reads (auth/admin boundaries unchanged)
- [x] Wiki updated: `architecture.md`, `sync-engine.md`, `offline-first.md`, `flows/live-now.md`, `badges.md`, `changelog.md`
- [x] ADR amended: `docs/ai-wiki/decisions/custom-hooks-events-no-redux.md` — Realtime subscription site = sync layer; IDB subscription caches (27.F)
- [x] Phase entry appended; PHASES.md bumped to Phase 28 TBD

**Wiki:** `docs/ai-wiki/architecture.md` · `sync-engine.md` · `offline-first.md` · `flows/live-now.md` · `badges.md` · `decisions/custom-hooks-events-no-redux.md` · `changelog.md` (27.A–27.H + close entries)

**Architectural notes:**
- Reconnect contract centralized: one `runReconnectSync()` flush-before-pull path; missed-band online gap closed.
- Realtime writes land in repositories → IDB → window events → hooks; no Supabase subscriptions in presentation hooks.
- `OptimisticQueue` unifies dedup semantics (keepLast / byId / fifo) across five offline-write domains.
- `useIdbSubscription` deduplicates IDB reads without introducing a global store (ADR-compliant).
- Badge pipeline mirrors `/now`: cache → pure builder → persist side-effects → composer hook.
- Band sync is repository-owned; `src/lib/sync.ts` removed — all remote fetch logic in `src/repositories/*`.

---

### Phase 28 — Badge Vest Layout Preference (Chaotic / Neat)
**Status:** ✅ Complete

**Goal:** Per-device collapsed-vest layout preference: **chaotic** (existing meadow scatter) or **neat** (horizontal chip stack showing every badge). Control in Edit profile beside fabric swatches; applies on `/profile` and `/now`.

**Deliverables:**
- **`patchesLayout.ts`** — `chaotic` | `neat` localStorage preference + change event (mirrors `patchesBackground.ts`)
- **`neatStackLayout.ts`** — scale-down row math, 0°–5° rotation, scroll fallback at min patch size
- **`PatchesLayoutToggle.tsx`** — I1 icon-only toggle (scatter dots / stacked circles) in Edit profile
- **`BadgesDisplay`** — branches collapsed render; chaotic reseed on Close vest only
- i18n aria keys (`patchesLayout`, `layoutChaotic`, `layoutNeat`) in all 4 ProfilePage locales
- Wiki + Design System updated

**Acceptance criteria (all met):**
- [x] Edit profile: swatches + icon toggle on same row (Variant C)
- [x] Default chaotic — no behavior change until opt-in
- [x] Neat shows all badges with scale-down sizing
- [x] Open vest grid unchanged; preference offline-safe on both routes
- [x] `rtk npm run build` green · `rtk npm test` green — 542 tests (5 new neat-layout tests)

**Wiki:** `docs/ai-wiki/badges.md` · `changelog.md` · `public/vira-lata-ds.html`

**Architectural notes:**
- Cosmetic preference stays localStorage-only (same contract as vest color); no Supabase sync.
- Neat layout is pure presentation in `neatStackLayout.ts`; chaotic math unchanged in `stackLayout.ts`.

---

### Phase 29 — Badge Consolidation (Year Archive)
**Status:** ✅ Complete

**Goal:** Snapshot year-badges into `user_badge_history` after Wacken ends so 2026 wins survive `festival:reset`. Live vest shows evergreen + current-festival badges; past years in **Conquistas Anteriores** on `/profile`.

**Deliverables:**
- Migration `20260527000001_user_badge_history.sql` + RLS
- Edge Function `consolidate-year-badges` (engine/registry/types copies + `contextBuilder.ts`)
- IDB v10 `user_badge_history` store; `badgeHistoryRepository`; `useUserBadgeHistory`
- `getCurrentFestivalYear()`, `isLiveVestBadge()`, `isFestivalEnded()`
- `BadgeHistorySection` (U2 flat grid, diamond year chips), godlike `ConsolidateBadgesSection`; archive modal M2 (no description/zoom)
- Godlike archive preview seed (`TestBadgeSection`); kutte → vest terminology
- Tests: `time.test.ts`, `currentFestivalYear.test.ts`, `badgeHistoryRepository.test.ts`, `archivePreviewSeed.test.ts`, `db.test.ts` wipe coverage

**Acceptance criteria (all met):**
- [x] Idempotent consolidation; godlike-only; test users excluded; evergreen excluded
- [x] Live vest filters current year; archive offline after first profile sync
- [x] `rtk npm run build` green · `rtk npm test` green — 581 tests

**Wiki:** `badges.md` · `festival-reset.md` · `supabase-schema.md` · `architecture.md` · `domain-model.md` · `index.md` · `routes.md` · `offline-first.md` · `changelog.md` · `vira-lata-ds.html`

**Architectural notes:**
- UI → IndexedDB for badge history; Supabase sync on profile load / reconnect.
- `festival:reset` strip list unchanged — archive lives in dedicated table, not `achieved_badge_slugs`.

---

### Phase 30 — Festival Wrap (`/wrap`)
**Status:** ✅ Complete

**Goal:** Private offline-first `/wrap` recap (A2 Vest Chronicle) with scroll-snap sections, client-side stats from IndexedDB, post-festival discovery banners, and approved vira-latas copy in four locales.

**Deliverables:**
- `src/services/festivalWrap.ts` — `buildFestivalWrapStats()` with badge-engine parity; `assignedBadgeSlugs`; pick-twin + current-user avatar URLs
- `src/hooks/useFestivalWrapStats.ts`, `useWrapTeaserVisible.ts`, `src/lib/wrapDismiss.ts`
- `src/pages/WrapPage.tsx` + CSS — welcome gate; hero / personality / chaos / crew stat sections with **epigraphs above cards**; optional godlike **assigned patches** grid; pick-twin spotlight portrait; patches vest pile; **finale thanks** gate (Wacken 2027 · Rain or Shine) + CTA to `/now`
- Celebration layer — ambient orbs, film grain, scroll reveal animations; `prefers-reduced-motion` respected
- `WrapProgress` (7–9 dots), `WrapTeaserBanner` Variant B on `/now` + `/profile`
- Private route `/wrap`; godlike Time Travel disclaimer; vest deep-link `/profile?vest=open#vest` + `#vest` anchor on profile
- i18n `WrapPage_*` (br, en, es, de) — user-approved section phrases; **vira-latas** in user-facing copy
- Tests `festivalWrap.test.ts`, `wrapDismiss.test.ts`
- Wiki `flows/festival-wrap.md`; Design System wrap section table

**Acceptance criteria (all met):**
- [x] A2 scroll-snap recap (7–8 sections: welcome + stats + optional assigned + patches + thanks); Variant B teaser; IDB-only stats; offline after first load
- [x] Teaser gated; `/wrap` open anytime; godlike D+1; vira-latas copy; friend privacy; empty state
- [x] Open vest → profile vest; finale → `/now`
- [x] `rtk npm run build` green · `rtk npm test` green — **594 tests**

**Wiki:** `flows/festival-wrap.md` · `routes.md` · `index.md` · `changelog.md` · `vira-lata-ds.html`

**Architectural notes:**
- No Supabase reads for wrap stats; reuses `buildBadgeContextFromSnapshot` semantics.
- Teaser discovery only — route never gated on `isFestivalEnded()`.

---

### Phase 31 — Social Snapshot Unification
**Status:** ✅ Complete

**Goal:** Unify `/now` and live vest crew derivation behind one deep module (`buildSocialSnapshot`), dedupe IDB loads via shared hooks, and eliminate display-path Supabase reads so assigned badges and friend status work offline after crew sync.

**Deliverables:**
- `src/services/socialSnapshot.ts` — pure `buildSocialSnapshot()` from IDB inputs (crew plans, groups, location counts, Metal Place window, live test band id)
- `src/hooks/useSocialSnapshot.ts`, `useSocialSnapshotSpecs.ts` — shared IDB cache cells (`useCrewUsersCache`, `usePresenceCache`); composes `useAllPicks`, `useBands`, config hooks
- `CrewUser.special_badges` on `crew_users` IDB — synced in `usersRepository.syncCrew()`; auth metadata hydration on reconnect; godlike assign/revoke triggers resync
- `useNowData` / `useNowPlans` — consume pre-built `SocialSnapshot`; slim `useNowCache` for announcements only
- `useBadgeContext` — `useSocialSnapshot` + `useBadgePersist`; IDB-only display (no `supabase.from('users')` in vest path)
- `buildBadgeContextFromSocialSnapshot()` in `badgeContextBuilder.ts`; `useBadgeCache` deleted
- `useFestivalWrapStats` / `buildFestivalWrapStats` — accept `SocialSnapshot` where crew pipeline was duplicated
- Tests: `socialSnapshot.test.ts`, updated `useBadgeContext.test.ts`, `usersRepository.test.ts`, `badgeContextBuilder.test.ts`
- Wiki + `CONTEXT.md` — **Social snapshot**, **Crew profile cache** terms; architecture file map updated

**Acceptance criteria (all met):**
- [x] Assigned badges and `is_friend` display from `crew_users` IDB after sync — no live Supabase reads in vest
- [x] `/now` and live vest share one `buildSocialSnapshot()` derivation — lost/camping counts aligned
- [x] `useSocialSnapshot` shared hook pattern (not prop-drilling from `/now` only)
- [x] `rtk npm run build` green · `rtk npm test` green

**Wiki:** `architecture.md` · `changelog.md` · `CONTEXT.md` · `PHASES.md`

**Architectural notes:**
- Crew profile cache extends `crew_users` with `special_badges`; no IDB version bump (schemaless store).
- Persist-metadata `auth.updateUser` writes remain best-effort online; out of scope for offline queue.
- Reconnect + post-assign `syncCrew()` sufficient for v1; no Realtime on `users.special_badges`.

---

### Phase 32 — Vira-lata Rating
**Status:** ✅ Complete

**Goal:** After a set ends, eligible vira-latas rate concerts 1–5 in band detail; `/popular` gains a second sort mode by crew average rating (offline-first, Supabase sync).

**Deliverables:**
- `supabase/migrations/20260528100000_phase32_user_band_ratings.sql` — table, RLS, Realtime publication
- IDB v11 — `user_band_ratings` + `offline_band_ratings` stores; `src/lib/db/ratings.ts`
- `src/services/bandRatings.ts` — `canRateBand()`, `computeRatingAggregates()`, `sortBandsByRating()`, `formatRatingAvg()`
- `src/repositories/ratings.ts` — optimistic writes, offline queue, reconnect sync, Realtime handlers
- `src/hooks/useBandRatings.ts`, `useBandDetailModal` + `usePickActions` eligibility purge
- `BandRatingInput` + `PawIcon` in `BandDetailModal`; rating cluster on `BandCard` (Popular rating mode)
- `/popular` segmented sort pill (picks vs rating); ceremony excluded from rated list
- i18n `SchedulePage_*` + `PopularPage_*` (4 locales); Design System rating section
- Tests: `bandRatings.test.ts`, `ratingsRepository.test.ts`, `useBandRatings.test.ts`

**Acceptance criteria (all met):**
- [x] Eligible vira-lata can rate 1–5 only in `BandDetailModal` (picked + ended + not missed)
- [x] Rating changeable anytime; tap same score clears row
- [x] Mark missed or unpick deletes user's rating for that band
- [x] Crew average includes all raters (including self); solo rating → avg equals that score
- [x] `/popular` second mode lists bands with ≥1 rating, sorted avg → count → start_time
- [x] Ceremony bands excluded from rated list
- [x] Offline-first: UI reads IndexedDB; writes queue when offline; sync on reconnect
- [x] Realtime updates peer ratings into IndexedDB
- [x] All four locales updated; Design System documents rating control
- [x] `rtk npm run build` and `rtk npm test` green

**Wiki:** `domain-model.md` · `supabase-schema.md` · `changelog.md` · `vira-lata-ds.html` · `PHASES.md`

**Architectural notes:**
- No server-side aggregate; Popular sort reads full crew snapshot from IDB.
- Eligibility is client/service-layer only — DB enforces score range and row ownership via RLS.
- Out of scope deferred to `FUTURE_IDEAS.md` #8–#10: My Picks display, `/wrap` stats, rating badges.

---

### Phase 33 — My Wacken inline attendance
**Status:** ✅ Complete

**Goal:** Ended picks stay on their festival day with inline Attended/Missed chips; nav **Lineup** + **My Wacken**; one-time coach banner on first ended pick.

**Deliverables:**
- `LineupPage.tsx` / `MyWackenPage.tsx` renames; routes `/schedule`, `/my-picks` unchanged
- Bottom nav + i18n: Lineup / My Wacken (4 locales)
- `src/services/myWackenGrouping.ts` + tests — A2 grouping, divider, collapse, left-today stat
- `MyWackenPage` — inline ended rows; removed Saw / Didn't See footer; upcoming-only conflicts
- `BandCard` `attendanceChip` — stripe + mono chip on ended timeline rows
- `MyWackenCoachBanner` + `myWackenCoachDismiss.ts` — teal dismiss-once banner
- Design System + wiki (`routes.md`, `architecture.md`, `changelog.md`)

**Acceptance criteria (all met):**
- [x] Nav **Lineup** / **My Wacken**; files renamed; build green
- [x] Ended picks on festival day; divider; no footer buckets
- [x] Attended/Missed chips; no timing chips on ended rows
- [x] Header days/conflicts/left-today; collapse rules
- [x] Coach banner + `localStorage` dismiss
- [x] No schema/sync changes; `rtk npm run build` + `rtk npm test` green

**Wiki:** `changelog.md` · `architecture.md` · `routes.md` · `PHASES.md` · Design System

**Architectural notes:**
- Grouping and chips are client-only from IndexedDB + `useNow`; same offline-first path as before.
- Coach flag not synced — intentional per-device UX.

---

### Phase 34 — Rating recap & badge predicates
**Status:** ✅ Complete

**Goal:** Rich rating stats on `/wrap` (Variant **C · Popular Echo**); six badge engine predicates; no registry badges, schema, or sync changes.

**Deliverables:**
- `src/services/ratingStats.ts` + `src/hooks/useAllRatingsCache.ts` + tests
- Wrap Ratings section (after Chaos) + dynamic progress dots + i18n ×4 + Design System
- Six `BadgeCondition` types in `engine.ts`; `BadgeContext` rating fields via `badgeContextBuilder`
- Wiki + `.claude/context/badges.md` updated; `registry.ts` unchanged

**Acceptance criteria (all met):**
- [x] Ratings section when ≥1 crew rating and `hasPicks`; hidden otherwise
- [x] Variant C nested crew cards; lowest guard; top score fallback
- [x] Six predicates per spec; wiki documented
- [x] `rtk npm run build` + `rtk npm test` green

---

### Phase 35 — Festival Minimap (live vira-lata positions)
**Status:** ✅ Complete
**Completed:** 2026-05-29

**Goal:** New private route `/map` showing live vira-lata avatar dots over a cartoon Wacken festival map. Pure presentation over existing data — no schema change, no Edge Function, no new sync. Positions are derived from the same `useSocialSnapshot` pipeline as `/now`.

**Sub-phases:**

| Sub-phase | Deliverable |
|---|---|
| **35.A** | Optimize `public/infield_map.png` in-place (3.3 MB → 628 KB; same path/format) |
| **35.B** | `src/components/map/minimapZones.ts` (MINIMAP_ZONES 10 zones, stageToZone, groupKindToZone) · `src/services/minimapPlacement.ts` (buildPlacements, phyllotaxis layout, self ordering) · `src/services/userColor.ts` (colorForUserId) · dev `?calibrate` harness (MinimapCalibrate) |
| **35.C** | `src/pages/MapPage.tsx` · `src/components/map/MinimapOverlay.tsx` · `/map` route in `src/App.tsx` |
| **35.D** | Glyph F "Pin + bolt" button in `/now` header (`RightNowPage.tsx` + CSS module) · `mapButton` i18n key in all 4 locales |
| **35.E** | Docs + design system + harness removal + phase close |

**Key deliverables:**
- `src/pages/MapPage.tsx` — page container; `useSocialSnapshot(useNow(30_000))` + `buildPlacements`; offline note; back nav to `/now`
- `src/components/map/MinimapOverlay.tsx` — presentation-only: `<img>` + absolute avatar `<button>`s; tap-toggle name pill; self gold ring on top; image-load fallback
- `src/components/map/minimapZones.ts` — single source of zone geometry (10 fractional bounding boxes)
- `src/services/minimapPlacement.ts` — pure `buildPlacements(crewGroups, zones, selfUserId)`; deterministic phyllotaxis layout; isSelf ordered last
- `src/services/userColor.ts` — `colorForUserId(id)` deterministic HSL color for initials fallback
- `src/pages/RightNowPage.tsx` — glyph F header button (Variant A, glyph F "Pin + bolt") linking to `/map`
- `src/i18n/MapPage_{br,en,es,de}.json` + `RightNowPage_{br,en,es,de}.json` — `mapButton`, `title`, `subtitle`, `offlineNote`, `mapAlt` keys
- **Removed:** `src/components/map/MinimapCalibrate.tsx` + `MinimapCalibrate.module.css` (35.E); `?calibrate` gate removed from `MapPage.tsx`
- `FUTURE_IDEAS.md` — Idea 6 status flipped to `✅ Phase 35`
- `docs/ai-wiki/flows/festival-minimap.md` — new flow page
- `docs/ai-wiki/routes.md`, `architecture.md`, `domain-model.md`, `changelog.md` updated
- `public/vira-lata-ds.html` — §13 Minimap section (zone config, avatar dot, glyph F button, offline note)

**Acceptance criteria (all met):**
- [x] `/map` renders dots at fractional coords; scales from 375 px to desktop
- [x] Self gold-ring dot on top; tap toggles name pill; self pill default open
- [x] `elsewhere` never overlaps a stage or camping box (left-margin zone)
- [x] Fully offline after first load (map image precached, positions from IndexedDB)
- [x] Image-load failure degrades to flat backdrop; dots still render
- [x] Glyph F button visible in `/now` header at 375 px; navigates to `/map`; all 4 locales present
- [x] `?calibrate` dev harness removed; no MinimapCalibrate chunk in production build
- [x] `rtk npm run build` green · `rtk npm test` green (680 tests)

**Wiki:** `docs/ai-wiki/flows/festival-minimap.md` · `routes.md` · `architecture.md` · `domain-model.md` · `changelog.md` · `public/vira-lata-ds.html`

**Architectural notes:**
- Placement is derived, not stored: a dot appears at a stage zone only when the user's picked band is live now; `UserPresence` handles camping + Metal Place. No `current_stage` column on `user_presence` exists.
- `buildPlacements` is pure + deterministic — no Supabase, no clock, no randomness — so re-renders are stable.
- Welcome to the Jungle shares the Wasteland zone; unknown stages fall back to `elsewhere`.
- `is_friend` semantics inherited from `crewGroups` unchanged — friends absent from camping/lost, appear in band groups only.

---

### Phase 36 — Duck Button Redesign (QuackStrip + QuackGhostRow)
**Status:** ✅ Complete

**Goal:** Replace the 64×64 duck tile with two lighter, contextually appropriate components. Delete `DuckButton` entirely.

**Deliverables:**

| Location | Old | New |
|---|---|---|
| `/now` group card | 64×64 tile in count column | `QuackStrip` — 34px strip attached below card |
| `/schedule` band card | 64px extra grid column | `QuackGhostRow` — ghost row inside card body |
| `/my-picks` band card | 64×64 tile in duckRow | `QuackGhostRow` — ghost row inside card body |

**Key deliverables:**
- `src/components/QuackStrip.tsx` + `.module.css` + tests — 34px strip with duck 16px + `QUACK` label + optional MM:SS countdown
- `src/components/QuackGhostRow.tsx` + `.module.css` + tests — ghost row with duck 13px + `QUACK` label + 1px underline progress
- `src/services/duck/constants.ts` — shared `DUCK_COOLDOWN_MS = 90_000`
- `src/hooks/useCountdownProgress.ts` + tests — RAF loop for MM:SS + fill fraction, used by both components
- i18n: `QuackStrip_{br,en,es,de}.json` + `QuackGhostRow_{br,en,es,de}.json` (8 files) · deleted `DuckButton_{br,en,es,de}.json` (4 files)
- `src/lib/i18n.ts` — swapped imports and TranslationFile type
- `src/components/now/CrewGroupsSection.tsx` + `src/pages/RightNowPage.module.css` — wired `QuackStrip` into `/now` group card, removed duck column width hacks
- `src/components/BandCard.tsx` + `.module.css` — wired `QuackGhostRow` into body, removed variant duck layout logic + duck column/row CSS
- `src/components/profile/GodlikeAdminPanel.tsx` — updated test quack to use `QuackGhostRow` instead of deleted `DuckButton`
- Deleted: `src/components/DuckButton.tsx` + `.module.css`
- `public/vira-lata-ds.html` — replaced § 11 DuckButton docs with `QuackStrip` + `QuackGhostRow` specs

**Acceptance criteria (all met):**
- [x] `/now` group card shows no tile; discreet strip below with progress + MM:SS countdown during cooldown
- [x] `/schedule` + `/my-picks` band cards show no extra column; ghost row inside body with underline progress + MM:SS
- [x] `DuckButton` and all its files fully removed
- [x] Build green · Tests green (697 tests)
- [x] Admin test quack updated to use new component

**Wiki:** `public/vira-lata-ds.html` (§ 11 updated) · no new architecture pages (pure component extraction)

**Architectural notes:**
- Two focused components sharing prop contract `{ onDuck, cooldownUntil }` and countdown animation logic
- Both use `useCooldown(cooldownUntil)` to derive disabled state
- Countdown derivation factored into shared `useCountdownProgress(cooldownUntil, DUCK_COOLDOWN_MS)` hook — returns `{ fillFraction, countdown }` for two different visual representations (fill sweep vs. underline progress)
- Godlike admin panel remains out of scope but was updated to not break when DuckButton removed
- Asset `/rubber-duck.png` stays in use; user to replace with more compact variant independently

---

### Phase 37 — Upcoming Band Card
**Status:** ✅ Complete

**Goal:** Show a dismissible pre-show banner on `/now` 15 minutes before the user's next picked band starts, with crew attendance context.

**Design:** Horizontal Banner (V2) — full-width card with gold accent left stripe, gradient background, overlapping crew avatars as focal point, collapsible crew drawer, QuackStrip always attached below.

**Key deliverables:**
- `src/components/now/UpcomingBandCard.tsx` — full-width banner with collapsed/expanded states, dismiss (X) button, crew avatar overlaps, band name/stage/time, QuackStrip below
- `src/hooks/useNowData.ts` — added `nextBand` (next picked band within 15 min that isn't current) and `timeDelta` (ms until start) to hook return
- `src/pages/RightNowPage.tsx` — renders UpcomingBandCard, manages `dismissedBands` (session-only `Set<string>`) and `expandedUpcoming` toggle; card mutually exclusive with `LatestAnnouncementBanner`
- i18n: upcoming card strings in all 4 locales (br, en, es, de)
- Unit tests: visibility logic, expand/collapse toggle, dismiss, offline state

**Acceptance criteria (all met):**
- [x] Card appears when: user NOT at a band + next pick starts ≤15 min away + not dismissed
- [x] Card replaces LatestAnnouncementBanner slot (mutually exclusive)
- [x] Collapsed: "Upcoming" badge, band name, stage, time, crew avatars, X button
- [x] Expanded: collapsed header + full crew list (names + avatars)
- [x] Tap body toggles collapsed ↔ expanded; X dismisses for session
- [x] Card auto-disappears when band starts (myPlan updates to 'current')
- [x] QuackStrip always visible below (both states)
- [x] All interactions offline-capable (no new network calls)
- [x] Build green · Tests green (707 tests)

**Architectural notes:**
- Dismissal is session-only (`Set<string>` in component state) — no IDB writes needed
- Crew list derived from existing `crewPlans` memo — zero new DB queries
- QuackStrip below card is a separate duck instance with its own cooldown, not shared with group cards
- Card slot priority: UpcomingBandCard > LatestAnnouncementBanner (only one renders at a time)
