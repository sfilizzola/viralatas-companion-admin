# Wiki Changelog

All modifications to the AI-readable architectural wiki, discoveries, and corrections are recorded here.

---

## 2026-06-01

### Added
- **Artifact layout** — `CLAUDE.md` § Artifact layout: gitignored `docs/superpowers/{specs,plans,prototypes}/` for local scratch; wiki + `public/vira-lata-ds.html` remain committed truth after ship.

### Changed
- **Agent routing for artifact layout** — `.cursor/rules/artifact-layout.mdc` (Cursor always-apply) and `.claude/context/skill-routing.md` (Claude Code: skill matrix, huashu path override, handoffs). `.gitignore` now allows committing `.claude/context/*.md`.
- `docs/design/2026-06-01-ds-code-sync-design.md` — removed tracked duplicate; local pre-ship spec remains at `docs/superpowers/specs/2026-06-01-ds-code-sync-design.md` (gitignored).
- `public/vira-lata-ds.html` — readability pass: added `#ds-manifest` agent table of contents (sections + token index + component index); extracted all inline styles into reusable classes; rebuilt nav (ordered, labelled, mobile-collapsible); reordered DOM so §12 Governance precedes §13 Minimap (anchors/numbers unchanged); fixed broken self-referential `--metal-place*` tokens.
- `CLAUDE.md` — design-system rule now points agents to read `#ds-manifest` first.

### Architectural Notes
- Pre-ship specs/plans/prototypes are local-only (`docs/superpowers/` gitignored). Committed docs link wiki pages, not local spec paths, for essential context.
- The DS file stays a single standalone HTML (no split, no build step). `#ds-manifest` is the agent navigation layer; the rendered page is the human layer. Both live in one source of truth; a governance checklist item enforces manifest sync.

---

## 2026-06-01 (Design-system consistency pass)

### Changed
- **`font-weight: 800` → `700`** across `RightNowPage`, `ProfilePage`, `LiveCardSheet`, and `BandDetailModal` module CSS. Only 400/500/600/700 are loaded for IBM Plex Sans (400/600/700 for Oswald), so every `800` was triggering synthetic faux-bold; `700` is the heaviest real weight.
- **Off-palette red removed (`RightNowPage.module.css`)** — the 4 `rgba(229, 85, 85, …)` (#e55555) values (`.latestSignalClickable:active`, `.liveDot` glow, `.memberPill.me` border/bg) now use `rgba(192, 57, 43, …)` = `--accent` (#c0392b), matching the convention already used in `BandCard`. The `:active` tint alpha was nudged 0.06 → 0.08 to stay perceptible at the darker hue.
- **Legacy token aliases retired** — migrated all 19 `var(--radius)` references (`ProfilePage` ×17, `RightNowPage` ×2) to `var(--r-2)`, then deleted `--radius` and the unused `--font` from `:root` in `index.css`.
- **`/now` font sizes onto the type scale** — converted 16 ad-hoc `rem` font-sizes in `RightNowPage.module.css` to px snapped to existing scale steps (e.g. band name 1.55rem→24px, eyebrow/stage/time 0.72rem→11px, body copy 0.9rem→14px). Spacing `rem` values left untouched to keep the change low-risk.
- **`prefers-reduced-motion` coverage** — added guards for `RightNowPage`'s `slideUp` (undo toast) and `latestPulse` (signal dot), and the global `pending-pulse` chip in `index.css`.
- **`public/vira-lata-ds.html`** — updated the location "me" chip (`.loc-chip.me`) and its annotation to the on-palette `rgba(192,57,43,…)` so the design system mirrors the corrected code.

### Architectural Notes
- Pure consistency/maintenance pass: no behavioral or layout changes, no new components. Brings the older pages (`/now`, `/profile`) into line with the token discipline the newer components already follow. Build green; 716/716 unit tests pass.

---

## 2026-06-01 (Metal Battle country flags)

### Added
- **`src/services/metalBattle.ts`** — `getMetalBattleCountryFlag(slotId)`: maps each Metal Battle `slot_id` (WET*/HBA*) to a country/region, returning the ISO2→emoji flag (built via `isoToFlag()` regional-indicator math) or a pre-built regional 🌍 glyph for multi-country entries (Sub-Saharan Africa, Balkans). Returns `null` when the slot has no confirmed representative yet.
- **Unit tests** — `src/__tests__/metalBattle.test.ts` (slot→flag mapping, regional fallback, unknown slot → null) and a `BandCard.test.tsx` case asserting the flag prefix renders for Metal Battle bands.

### Changed
- `src/components/BandCard.tsx` — the genre label now prefixes the country flag emoji for bands whose `genre === 'Metal Battle'` (`` `${getMetalBattleCountryFlag(band.slot_id) ?? ''} Metal Battle`.trim() ``); all other genres render unchanged.
- `docs/ai-wiki/architecture.md` — added `src/services/metalBattle.ts` to Relevant Source Files and the Services table.
- `public/vira-lata-ds.html` — documented the Metal Battle flag prefix in the BandCard genre-label section.

### Architectural Notes
- Fully client-side and offline-safe: the slot→country table is static data baked into the bundle; no IDB or network reads. New competitor reveals are shipped as code edits to `METAL_BATTLE_COUNTRIES`.
- Mapping is keyed on `slot_id` (stable across lineup syncs), not band name — survives TBD→named band fills without touching the flag logic.

---

## 2026-05-31 (Phase 37 — Upcoming Band Card)

### Added
- **`src/components/now/UpcomingBandCard.tsx`** — Full-width horizontal banner that appears on `/now` when the user's next picked band starts within 15 minutes and the user is not currently watching a band. Features: stage-colored left stripe, gradient background, band name + stage pill + formatted start time, crew-going count, "Upcoming" badge, X dismiss button, expand/collapse toggle revealing per-member crew drawer, and optional QuackStrip below.
- **i18n strings** in all 4 locales (br, en, es, de) for `upcomingLabel`, `atLabel`, `goingLabel`, `dismissLabel` keys under the `UpcomingBandCard` namespace.
- **Unit tests** in `src/__tests__/` covering visibility logic (15-min window boundary, dismiss, status guard), expand/collapse, crew filtering, and offline state.

### Changed
- `src/hooks/useNowData.ts` — added `nextBand: Band | null` to `NowData`; computed as earliest user-picked band with `start_time > now` when `myPlan.status !== 'current'`.
- `src/pages/RightNowPage.tsx` — renders `UpcomingBandCard` above `BadgesDisplay` when `nextBandInWindow`; manages `dismissedBandIds` (`Set<string>` session state) and `expandedUpcoming` toggle; `UpcomingBandCard` and `LatestAnnouncementBanner` share one render slot (card has priority).
- `docs/ai-wiki/flows/live-now.md` — documented Upcoming Band Card section (visibility logic, anatomy, dismiss/expand behavior, priority slot, QuackStrip, offline behavior).
- `docs/ai-wiki/architecture.md` — added `UpcomingBandCard.tsx` to Relevant Source Files; updated `/now` key pages note and `useNowData` hook table entry.
- `public/vira-lata-ds.html` — added Upcoming Band Card design system section (collapsed/expanded states, stripe, crew avatars, QuackStrip attachment).

### Architectural Notes
- `dismissedBandIds` is session-only React state (no IndexedDB); dismissal resets on page reload — intentional so the reminder reappears if user navigates away and back.
- `nextBandCrew` is derived from `crewPlans` by matching `plan.band?.id` or `plan.nextBand?.id` — no new IDB query.
- The card uses a **separate `useDuckQuack` instance** (`nextDuckQuack`) keyed to `nextBand.id` so quacking the upcoming band does not interfere with the current-band duck cooldown.

---

## 2026-05-29 (Phase 35 — Festival minimap)

### Added
- **`docs/ai-wiki/flows/festival-minimap.md`** — new flow page covering trigger, happy path, offline behavior, sync behavior, data flow diagram, edge cases, and hooks/services for the `/map` minimap feature
- **`/map` route** — documented in `routes.md` with full component breakdown and flow wiki link

### Changed
- `docs/ai-wiki/routes.md` — added `/map` route entry in route map + dedicated `MapPage` section
- `docs/ai-wiki/architecture.md` — added `MapPage`, `MinimapOverlay`, `minimapZones`, `minimapPlacement`, `userColor` to Relevant Source Files and Key Pages list
- `docs/ai-wiki/domain-model.md` — added derived minimap placement note to `UserPresence` section (no new schema; positions derived from existing picks + presence + clock)
- `FUTURE_IDEAS.md` Idea 6 — status flipped to `✅ Phase 35`

### Architectural Notes
- Minimap placement is **derived**, not stored: `buildPlacements(crewGroups, MINIMAP_ZONES, selfUserId)` runs over the same `crewGroups` as `/now`. No `current_stage` column on `user_presence`; no new sync.
- `public/infield_map.png` (628 KB) is precached by Workbox; `/map` is fully offline after first load.
- `?calibrate` dev harness (MinimapCalibrate component) removed in Phase 35.E.

---

## 2026-05-29

### Added
- **Three rating badges (2026)** — `zine-pup` (4 ratings), `press-pass` (12), `pitchfork-paw` (20); all use `bands_rated_min`; PNG assets + registry + i18n ×4

### Changed
- `docs/ai-wiki/badges.md` — first `bands_rated_min` registry entries; inventory count 71

---

## 2026-05-28 (Phase 34 — Rating wrap & badge predicates)

### Added
- **`src/services/ratingStats.ts`** — `buildRatingStatsSnapshot()` shared by wrap and badge context
- **`src/hooks/useAllRatingsCache.ts`** — read-only crew-wide ratings IDB cell + `RATINGS_CHANGED_EVENT`
- **Wrap Ratings section** — Variant **C · Popular Echo** on `/wrap` (after Chaos, before Vira-latas); dynamic progress dots
- **Six badge engine predicates** — `bands_rated_min`, `band_rated_score_min`, `crew_avg_on_picked_band_min`, `user_rating_avg_min` / `_max`, `bands_rated_pct_of_seen_min`
- Tests: `ratingStats.test.ts`; extended `festivalWrap.test.ts`, `badges.test.ts`

### Changed
- `festivalWrap.ts` / `useFestivalWrapStats` — merge rating snapshot into `FestivalWrapStats`
- `badgeContextBuilder.ts` / `useBadgePersist` — feed rating fields into `BadgeContext`
- `WrapPage` + i18n ×4 — Ratings copy uses **vira-latas** terminology
- Design System — Wrap Ratings § C anatomy in `public/vira-lata-ds.html`

### Architectural Notes
- **`registry.ts` unchanged** — zero new badge slugs; future phases add catalog entries using Phase 34 predicates
- Offline-first unchanged: stats from IndexedDB via `useAllRatingsCache`, not Supabase

---

## 2026-05-28 (Design system — single canonical file)

### Changed
- **All project docs** — `public/vira-lata-ds.html` is the only design system path in CLAUDE.md, agents, wiki, plans, and specs.
- **Removed** superseded `public/Design-System.html`, `public/Design System.html`, and `scripts/merge-vira-lata-ds.py`.

### Architectural Notes
- UI changes must update **`public/vira-lata-ds.html`** only.

---

## 2026-05-28 (Design system unification)

### Added
- **`public/vira-lata-ds.html`** — single canonical design system (v3.0): unified the former two HTML files (tokens, live demos, layouts, motion, duck, audit, Phase 29–33 component specs). New §12 Governance (audit score, checklist, best practices).

### Changed
- BandCard (paw pick, day ghost, attendance chips, rating mode), My Wacken page anatomy, BadgesDisplay vest modes, sidenav (§10 Empty, §12 Governance, Changelog).

### Architectural Notes
- Agents and wiki treat **`public/vira-lata-ds.html`** as the living UI spec.

---

## 2026-05-28 (Phase 33 — My Wacken inline attendance)

### Added
- **`MyWackenPage`** (renamed from `MyPicksPage`) — A2 day grouping: upcoming → **already played today** divider → ended inline; no Saw / Didn't See footer sections.
- **`myWackenGrouping.ts`** — `groupMyWackenByDay`, collapse seeding, **{n} left today** count.
- **`BandCard` `attendanceChip`** — timeline ended rows: Attended/Missed mono pill; teal/amber left stripe only; stage color on badge.
- **`MyWackenCoachBanner`** + **`myWackenCoachDismiss.ts`** — one-time teal coach when ≥1 ended pick; `viralatas:my-wacken-ended-coach-dismissed` in `localStorage`.
- **Lineup** nav label + **`LineupPage`** rename (route `/schedule` unchanged).

### Changed
- Bottom nav + page titles: **Lineup** / **My Wacken** (BR **Line-up** / **Meu Wacken**); empty state points to Line-up.
- Header stats: `{days}` = all days with picks; conflicts/overlaps from upcoming picks only; **{n} left today** during festival when n ≥ 1.
- Mid-festival collapse: calendar days before `todayKey` collapsed; today + future expanded; post-festival all expanded; `picksReady` + CEST time-travel parsing.
- **`docs/ai-wiki/routes.md`**, **`architecture.md`**, **`public/vira-lata-ds.html`** — My Wacken page section, coach banner, godlike CEST time travel, timeline chip demos.

### Architectural Notes
- No schema or sync changes; attendance opt-out unchanged in `BandDetailModal`.
- Coach dismiss is per-device only (not Supabase).

---

## 2026-05-28 (Pick icon → paw)

### Changed
- **Pick affordance** — schedule/my-picks `BandCard` toggle, bottom nav My Picks tab, and empty state use locked **`PawIcon`** (canine + heel, −14°) instead of star polygon.
- **`Icon name="pick"`** — delegates to `PawIcon`; **`StarIcon`** wraps same asset for BandCard.
- **Design System** — BandCard pick column demo updated.

---

## 2026-05-28 (Godlike admin i18n lazy load)

### Added
- **`GodlikeAdmin_{br,en,es,de}.json`** — 123 admin-only strings split out of `ProfilePage_*`.
- **`useGodlikeAdminI18n()`** + **`loadGodlikeAdminTranslations()`** — dynamic import per locale; separate Vite chunk loaded only for godlike/manager sessions.

### Changed
- **`ProfilePage_*`** — trimmed to ~58 user-facing keys (profile, conflicts, patches, badge history).
- **`GodlikeAdminPanel`**, **`ManagerAdminPanel`**, **`TimeTravelSection`** — consume lazy admin i18n; collapsible trigger labels moved into translation files.
- **`UserManagementSection`** — hybrid A layout: status pills + switches for manager/friend; action toolbar for assign patch / unblock.
- **`roleLabel()`** — normal users show **Vira-lata** (singular), not Vira-latas.
- New **`Switch`** UI primitive for admin toggles.

### Architectural Notes
- Regular vira-latas no longer bundle godlike admin copy on first load; offline PWA caches the admin chunk after first godlike/manager profile visit.

---

## 2026-05-28 (Phase 32 — Vira-lata Rating)

### Added
- **`user_band_ratings` table** — composite PK `(user_id, band_id)`, `score` 1–5, `rated_at`; RLS (authenticated SELECT all rows; INSERT/UPDATE/DELETE own rows only); Realtime enabled
- **IndexedDB v11** — stores `user_band_ratings` (index `by_user`) and `offline_band_ratings` queue
- **`UserBandRating` domain entity** — eligibility via `canRateBand()` (picked + ended + not missed + not ceremony); purge on unpick, mark missed, or tap-same-score clear
- **`ratingsRepository`** — optimistic IDB writes, Supabase upsert/delete, offline queue flush on reconnect, `syncCrewFromRemote()` full replace, Realtime subscription
- **`useBandRatings` hook** — crew-wide IDB snapshot, `userRatingByBand`, `aggregates`, `toggleRating` / `clearRating`
- **`BandRatingInput` + `PawIcon`** — five paw buttons in `BandDetailModal`; filled paws for scores ≤ selected; accent highlight on exact score
- **`/popular` dual sort** — segmented pill toggles pick-count vs crew-avg rating mode; rating list excludes ceremony; sort avg → count → `start_time`; `sessionStorage` persistence when any rated band exists
- **BandCard rating cluster** — ranked variant shows formatted avg, rater count, optional "you: N" line in rating sort mode
- **Tests** — `bandRatings.test.ts`, `ratingsRepository.test.ts`, `useBandRatings.test.ts`; updated sync/db/modal tests
- **i18n** — `SchedulePage_*` rating strings; `PopularPage_*` sort modes, rating stats, empty states (br, en, es, de)
- **Design System** — `BandRatingInput` paw control + Popular sort pill section

### Changed
- **`useBandDetailModal`** — wires `canRate`, `userScore`, `onRate`; clears rating when marking missed
- **`usePickActions`** — clears rating when unpicking
- **`runReconnectSync()`** — flushes ratings offline queue and pulls remote crew ratings
- **`RealtimeSync`** — mounts `ratingsRepository.subscribeToRealtime()`
- **`domain-model.md`**, **`supabase-schema.md`**, **`phases-history.md`**, **`PHASES.md`** — Phase 32 documentation

### Architectural Notes
- UI → IndexedDB for all rating reads; Supabase is sync target only — same pattern as picks/missed bands
- Crew averages computed client-side from full IDB snapshot; no Postgres aggregate view
- Rating eligibility enforced in UI/services, not DB — RLS only restricts who can write which rows

---

### Added
- **`buildSocialSnapshot()`** — pure service in `src/services/socialSnapshot.ts`; single derivation path for crew plans, groups, and location counts.
- **`useSocialSnapshot`** + **`useSocialSnapshotSpecs`** — shared IDB cache cells (`useCrewUsersCache`, `usePresenceCache`) feeding `/now` and live vest.
- **Crew profile cache** — `special_badges` on `CrewUser` synced via `usersRepository.syncCrew()`; auth metadata hydration on reconnect; godlike assign/revoke triggers resync.
- **CONTEXT.md** — **Social snapshot** and **Crew profile cache** domain terms.

### Changed
- **`useNowData`** / **`useNowPlans`** — consume pre-built `SocialSnapshot` instead of re-running `mapCrewLivePlans` / `groupCrewLivePlans`.
- **`useBadgeContext`** — composes `useSocialSnapshot` + `useBadgePersist`; display reads crew IDB only (no Supabase `users` fetch for assigned badges or friend status).
- **`useBadgeCache`** — removed; vest and `/now` share one cache path.
- **`badgeContextBuilder`** — `buildBadgeContextFromSocialSnapshot()` accepts pre-built snapshot.
- **`architecture.md`**, **`phases-history.md`**, **`PHASES.md`** — Phase 31 documented; active work cleared.
- **Wiki follow-up** — **`badges.md`**, **`flows/festival-wrap.md`**, **`domain-model.md`**, **`offline-first.md`**, **`testing.md`**, **`index.md`** synced to Phase 31 (removed stale `useBadgeCache` / two-phase Supabase vest paths).

### Architectural Notes
- Golden rule preserved: live vest display is UI → IndexedDB (`crew_users.special_badges`, `is_friend`); persist-metadata writes remain best-effort online only.
- `/now` crew cards and live vest patches now derive from the same `buildSocialSnapshot()` call — counts stay aligned offline after crew sync.

---

## 2026-05-27 (Wiki audit — Phase 30 doc sync)

### Changed
- **Design System** — wrap section counts corrected (7–8 sections/dots); epigraph scope clarified (stat sections only).
- **`testing.md`** — 594 tests / 52 files; added `festivalWrap.test.ts`, `wrapDismiss.test.ts`.
- **`architecture.md`**, **`authentication.md`** — `/wrap` route documented.

---

## 2026-05-27 (Phase 30 closed)

### Changed
- **Phase 30 marked complete** — full wrap polish shipped (welcome/finale gates, epigraphs, assigned patches, twin spotlight, approved copy); `PHASES.md` now shows no active phased work; phases-history entry updated; **594 tests** green.

---

## 2026-05-27 (Wrap — closing thanks section)

### Added
- **Finale thanks section** — scroll-snap closing gate with vira-lata thank-you, Wacken 2027 sign-off, and CTA to `/now`.

---

## 2026-05-27 (Wrap — welcome gate)

### Added
- **Welcome section** — first scroll-snap screen on `/wrap` (poster title, phrase, scroll hint); progress bar now 6–7 dots.

### Changed
- Stat sections shifted +1 index; hero count-up triggers on hero section reveal.

---

## 2026-05-27 (Wrap — assigned patches + section phrases)

### Added
- **Conditional assigned-badges section** on `/wrap` — appears when user has godlike-assigned patches (`assignedBadgeSlugs` from `buildFestivalWrapStats`); 6th scroll section + progress dot.
- **Section phrases** — playful vira-latas copy per section (`heroPhrase`, `personalityPhrase`, etc.) in all 4 locales.

### Changed
- **`WrapPage.tsx`** — dynamic section count; assigned patch grid with staggered drop-in animation.
- **`festivalWrap.ts`** — `personal.assignedBadgeSlugs` filtered to registry `assigned` condition type.
- **Design System** — wrap section table + phrase note.

---

## 2026-05-27 (Phase 30 — Festival Wrap)

### Added
- **`/wrap` recap page** — A2 Vest Chronicle: five scroll-snap sections, 5-dot progress, client-side stats from IndexedDB.
- **`buildFestivalWrapStats()`** — reuses `buildBadgeContextFromSnapshot`, `getEarnedBadges`, `computeBandOverlaps`, crew Jaccard + PopularPage sort.
- **`useFestivalWrapStats`**, **`useWrapTeaserVisible`**, **`wrapDismiss.ts`** — IDB-first hook; teaser gate; `viralatas:wrap-dismissed-2026`.
- **`WrapTeaserBanner` Variant B** — 4px accent bar, patch pile, on `/now` and `/profile` after festival end.
- **Godlike QA** — `timeTravelWrapDisclaimer` in Time Travel (4 locales); D+1 previews teaser without reload.
- **Tests** — `festivalWrap.test.ts`, `wrapDismiss.test.ts`.
- **Wiki** — `flows/festival-wrap.md`; Design System wrap section.

### Changed
- **`App.tsx`** — private route `/wrap`.
- **`routes.md`**, **`index.md`**, **`PHASES.md`**, **`FUTURE_IDEAS.md`**, **`phases-history.md`**.

### Architectural Notes
- Golden rule preserved: wrap stats path is UI → IndexedDB only; no Supabase reads for recap numbers.
- Teaser gated by `isFestivalEnded(now(), bands)`; `/wrap` route always open when logged in.
- **591 tests passing** at phase close.

---

## 2026-05-27 (Phase 29 closed)

### Added
- **`user_badge_history`** — Supabase table + RLS; IndexedDB v10 store; frozen year-badge archive survives `festival:reset`.
- **`consolidate-year-badges`** Edge Function — godlike year snapshot (Deno badge engine/registry copies); idempotent; test users excluded.
- **Client archive stack** — `badgeHistoryRepository`, `useUserBadgeHistory`, `BadgeHistorySection` (U2 layout), godlike `ConsolidateBadgesSection`.
- **`getCurrentFestivalYear()`**, **`isLiveVestBadge()`**, **`isFestivalEnded()`** — live vest filters to evergreen + current festival year only.
- **Godlike archive preview** — `TestBadgeSection` seeds local IDB rows without Supabase (`seedLocalPreview` / `clearLocalPreview`).

### Changed
- **Vest terminology** — kutte → vest (and locale equivalents) across UI, wiki, and design docs.
- **`BadgeDetailModal`** — optional `showDescription` / `showZoom` for archive taps (M2).
- **`BadgeHistorySection` U2 polish** — flat 4×48 px grid, Oswald year headings, red enamel diamond year chips (24 px @ 48 px patch).
- **Wiki sync** — `index.md`, `architecture.md`, `domain-model.md`, `routes.md`, `offline-first.md`, `badges.md`, `festival-reset.md`, `supabase-schema.md`, `phases-history.md`.
- **`public/vira-lata-ds.html`** — Previously Achieved + consolidation anatomy with diamond chip demo.

### Architectural Notes
- Badge history follows golden rule: UI → IndexedDB; Supabase is sync target on profile mount / `'online'`. No offline queue for consolidate (network-only godlike op).
- Frozen rows store `image_path` + `label_key` at consolidate time (P1 asset immutability).
- After consolidation + `festival:reset`, year-badges appear only in **Previously Achieved** — not on the live vest.
- **581 tests passing** at phase close.

---

## 2026-05-27 (Terminology: kutte → vest)

### Changed
- Replaced **kutte** with **vest** (and locale equivalents: colete, chaleco, Weste) across UI strings, code comments, wiki, and design docs — aligned with existing *Open vest* / `isLiveVestBadge` language.

---

## 2026-05-27 (Previously Achieved U2 polish)

### Changed
- `BadgeHistorySection` — U2 flat grid (4×48 px, gap 10), Oswald year headings, lighter collapsible header; removed live-vest denim grid shell.
- Archive patch year chip — red enamel **diamond** (24 px @ 48 px patch), same `.yearChip` language as live vest (clip-path, gloss, hover glow); not the gray pill from early U2 mock.
- `public/vira-lata-ds.html` — multi-year archive anatomy + demo aligned with `_temp/badge-history-proposals`; diamond chip spec in patch row.
- `docs/ai-wiki/badges.md` — U2 layout documents diamond chip sizing.

---

## 2026-05-27 (Godlike archive preview seed)

### Added
- Godlike **Archive preview (local)** in `TestBadgeSection` — seeds `user_badge_history` IDB rows without Supabase or consolidate; `archivePreviewMode` pauses sync on that device.

### Changed
- `badgeHistoryRepository.seedLocalPreview` / `clearLocalPreview`; `docs/ai-wiki/badges.md`.

---

## 2026-05-27 (Phase 29 — Badge consolidation)

### Added
- `user_badge_history` table + RLS; `consolidate-year-badges` Edge Function (Deno copies of badge engine/registry).
- IndexedDB `user_badge_history` store (v10); `badgeHistoryRepository`, `useUserBadgeHistory`, `BadgeHistorySection`, godlike `ConsolidateBadgesSection`.
- `getCurrentFestivalYear()`, `isLiveVestBadge()`, `isFestivalEnded()`; live vest filters to evergreen + current festival year only.

### Changed
- `BadgeDetailModal` — optional `showDescription` / `showZoom` for archive taps (M2).
- `docs/ai-wiki/badges.md`, `festival-reset.md`, `supabase-schema.md`; `public/vira-lata-ds.html` — Previously Achieved + consolidate anatomy.

### Architectural Notes
- Badge history is IndexedDB-primary on `/profile`; Supabase is sync target. `festival:reset` never touches `user_badge_history`.
- Frozen rows store `image_path` + `label_key` at consolidate time (P1 asset immutability).

---

## 2026-05-27 (Alemão Mode badge)

### Added
- **`alemao-mode`** — `assigned`, `year: 2026`. Godlike-only emotional-moment badge; asset at `public/badges/badge_alemao-mode.png`.
- i18n keys (`badgeAlemaoMode`, `badgeAlemaoModeDescription`) in all four locale files.

### Changed
- **`docs/ai-wiki/badges.md`** — inventory 67 → 68; assigned badge entry documented.

---

## 2026-05-26 (Weak skip + Patient Zero badges)

### Added
- **`weak`** — `weak_skips_min` count 3, `year: 2026`, no persist. Committed "I am weak" milestone.
- **`weakling-supreme`** — `weak_skips_min` count 10, `year: 2026`, no persist.
- **`patient-zero`** — `assigned`, `year: 2026`. Godlike-only overdose joke badge.
- i18n keys in all four locale files; registry tests in `badges.test.ts`.

### Changed
- **`docs/ai-wiki/badges.md`** — inventory 64 → 67; weak-skip + assigned entries documented.

### Architectural Notes
- Weak badges live on `user_metadata.weak_skips_2026` without `persist: true` — festival reset can strip them when counter clears.

---

## 2026-05-26 (Weak skip badge engine plumbing)

### Added
- **`weak_skips_min`** badge condition + `BadgeContext.weakSkipCount` — engine ready for future weak-skip badges; no registry entries yet.
- **`evaluateBadge`** branch and **`buildBadgeContextFromSnapshot`** wiring via `getWeakSkipCount()`.
- Tests in `badges.test.ts` and `badgeContextBuilder.test.ts`.

### Changed
- **`docs/ai-wiki/badges.md`**, **`.claude/context/badges.md`**, **`registry.ts`** author comments — document `weak_skips_min`.
- **`docs/superpowers/specs/2026-05-26-weak-skip-counter-design.md`** — badge context section marked implemented.

### Architectural Notes
- `getWeakSkipCount()` lives in `weakSkipMetadata.ts` (no Supabase import) so `badgeContextBuilder` stays testable without pulling auth client. `weakSkips.ts` re-exports for write path.
- `BadgesDisplay` unchanged until a badge is authored. Refresh path: `recordCommittedSkip` → `USER_UPDATED` → `useBadgeCache` (same as `location_visits`).

---

## 2026-05-26 (Weak skip counter)

### Added
- **`src/services/weakSkips.ts`** — `getWeakSkipCount()`, `recordCommittedSkip()`, `WEAK_SKIPS_2026_KEY`, `WEAK_SKIP_UNDO_MS`; persists committed “I am weak” skips in `user_metadata.weak_skips_2026` via best-effort `auth.updateUser` (same pattern as `location_visits`).
- **`src/__tests__/weakSkips.test.ts`** — unit tests for read/increment helpers.
- **`useNowData` commit timer** — increments counter only after the 5s undo window when the unpick still holds; cancels on undo; commits previous pending skip when a second weak skip starts before the first timer fires.

### Changed
- **`src/hooks/useNowData.ts`** — weak-skip commit path is the sole caller of `recordCommittedSkip()` (generic unpicks unchanged).
- **`src/__tests__/useNowData.test.ts`**, **`src/__tests__/usePickActions.test.ts`** — integration/isolation tests for commit, undo, re-skip, and card-toggle unpick.
- **`docs/ai-wiki/glossary.md`** — weak skip vs generic unpick terminology.
- **`docs/ai-wiki/architecture.md`** — `weakSkips.ts` in Services table; offline writes note for metadata counters.
- **`docs/ai-wiki/flows/live-now.md`** — weak skip commit flow and isolation rules.
- **`docs/superpowers/specs/2026-05-26-weak-skip-counter-design.md`** — approved spec.

### Fixed
- **`recordCommittedSkip`** — ignores increment when `auth.getUser().id` does not match the passed `userId`.

### Architectural Notes
- Badge registry unchanged — counter is stored now for future `weak_skips_min` conditions. Festival reset strip for `weak_skips_2026` deferred until festival-close script. Future Supabase event log documented in spec, not built.

---

## 2026-05-26 (BandCard corner day label)

### Added
- **`bandWeekdayKey()`** in `src/services/bandTime.ts` — weekday i18n key from a band's CEST festival day (same rollover rules as `bandDay()`).
- **`.dayGhost` / `.bodyWithDayGhost`** in `BandCard.module.css` — V1 corner ghost: 9px mono weekday abbr, `--text-faint`, top-right of body.
- **`showDayLabel?: boolean`** prop on `BandCard` — renders ghost on `schedule` and `ranked` variants only.

### Changed
- **`SchedulePage`** — passes `showDayLabel={filters.day === null}` (visible during search / all-days browse; hidden when a day tab is active).
- **`PopularPage`** — always passes `showDayLabel` (cross-day popularity list).
- **`public/vira-lata-ds.html`** — BandCard section documents day label visibility rules + static demo.
- **`docs/ai-wiki/glossary.md`** — BandCard entry mentions corner day ghost.
- Tests in `BandCard.test.tsx` and `bandTime.test.ts`.

### Architectural Notes
- Presentation-only; no sync or IndexedDB changes. Weekday strings reuse existing SchedulePage i18n keys (`wednesday`, etc.).

---

## 2026-05-25 (Phase 28 — Badge vest layout preference)

### Added
- **`src/lib/patchesLayout.ts`** — per-device `chaotic` | `neat` preference (localStorage + change event).
- **`src/services/badges/neatStackLayout.ts`** — scale-down horizontal stack for collapsed neat mode.
- **`src/components/profile/PatchesLayoutToggle.tsx`** — I1 icon toggle beside fabric swatches in Edit profile.
- **`src/__tests__/neatStackLayout.test.ts`** — neat sizing, rotation cap, pose map tests.

### Changed
- **`BadgesDisplay.tsx`** — reads layout preference; neat collapsed row shows all badges; chaotic reseed only in chaotic mode.
- **`BadgesDisplay.module.css`** — `.vestNeat`, `.vestNeatRow`, `.patchNeatItem`, scaled year chip.
- **`EditProfileForm.tsx`** — vest prefs row: swatches + layout toggle.
- **`docs/ai-wiki/badges.md`**, **`public/vira-lata-ds.html`** — chaotic/neat docs and demos.
- i18n `patchesLayout`, `layoutChaotic`, `layoutNeat` in all 4 ProfilePage locales.

### Architectural Notes
- Cosmetic preference stays localStorage-only (same contract as `patchesBackground.ts`); applies on `/now` and `/profile`, control UI profile-only.

---

## 2026-05-25 (Phase 27 close — Architecture Deepening)

### Changed
- **`PHASES.md`** — Phase 27 complete; active phase → Phase 28 TBD.
- **`docs/ai-wiki/phases-history.md`** — Full Phase 27 entry (27.A–27.H).
- **`docs/ai-wiki/architecture.md`**, **`sync-engine.md`**, **`offline-first.md`**, **`flows/live-now.md`**, **`badges.md`**, **`index.md`** — Seam restoration docs aligned; `src/lib/sync.ts` references removed.

### Architectural Notes
- Offline-first seam restored: `UI → IndexedDB ← repositories → Supabase`; hooks are IDB subscribers only.
- All sync orchestration lives in `src/components/sync/` + repository modules; no standalone `sync.ts` pass-through.
- 537 tests green at phase close.

---

## 2026-05-25 (Phase 27.H — Bands repository sync)

### Changed
- **`src/repositories/bands.ts`** — `bandsRepository.sync()` owns Supabase band fetch → `saveBands`; cache invalidation calls `bandsRepository.sync()`.
- **`src/components/sync/BandSync.tsx`** — Calls `bandsRepository.sync()` instead of `syncBands()`.
- **`src/__tests__/bandsRepository.test.ts`** — `sync()` unit tests + cache-version spy on repository method.

### Removed
- **`src/lib/sync.ts`** — Pass-through module deleted.

### Architectural Notes
- Final 27 sub-stage: all remote fetch/sync logic now lives in repository modules.

---

## 2026-05-25 (Phase 27.G — Decompose useBadgeContext)

### Added
- **`src/services/badges/badgeContextBuilder.ts`** — Pure `buildBadgeContextFromSnapshot()` + `BadgeIdbSnapshot` type + `EMPTY_BADGE_CONTEXT`.
- **`src/hooks/useBadgeCache.ts`** — IDB loads, session read, presence/crew window events (mirror `useNowCache`).
- **`src/hooks/useBadgePersist.ts`** — `special_badges` drift sync + `persistMetadataPatch` writes.
- **`src/__tests__/badgeContextBuilder.test.ts`**, **`src/__tests__/useBadgeCache.test.ts`** — Pure builder and cache hook tests.

### Changed
- **`src/hooks/useBadgeContext.ts`** — Thin composer: `useBadgeCache` → `useBadgePersist`.
- **`docs/ai-wiki/badges.md`** — Key files table updated for 27.G split.

### Architectural Notes
- Badge evaluation pipeline unchanged; `/now` parity logic stays in pure `buildBadgeContextFromSnapshot()`.
- Mirrors Phase 26.M `/now` split: cache (IDB + events) → pure builder → persist side-effects → composer hook.

---

## 2026-05-25 (Phase 27.F — IDB subscription caches)

### Added
- **`src/hooks/useIdbSubscription.ts`** — Module-level `useSyncExternalStore` cache: one window-event listener + one IDB read per key, shared across subscribers.
- **`src/hooks/useAllPicks.ts`** — Shared picks cache keyed on `PICKS_CHANGED_EVENT`.
- **`src/__tests__/useIdbSubscription.test.ts`** — One event → one IDB read; multi-subscriber cache sharing.

### Changed
- **`src/hooks/usePickCounts.ts`**, **`useBandAttendees.ts`**, **`useNowCache.ts`**, **`useBadgeContext.ts`** — Consume `useAllPicks()` instead of independent `loadAllUserPicks()` subscriptions.
- **`docs/ai-wiki/architecture.md`**, **`decisions/custom-hooks-events-no-redux.md`** — IDB subscription cache pattern documented.

### Architectural Notes
- Window event model preserved (ADR-compliant); cache deduplicates IDB reads only.
- Full `useBadgeContext` decomposition deferred to Phase 27.G; picks domain wired to shared cache in 27.F.

---

## 2026-05-25 (Phase 27.D — Realtime in repositories)

### Added
- **`src/components/sync/RealtimeSync.tsx`** — Mounts all Supabase Realtime → IndexedDB subscriptions once at app level via repository `subscribeToRealtime()` methods.
- **`src/repositories/picks.ts`**, **`announcements.ts`**, **`presence.ts`**, **`users.ts`** — `subscribeToRealtime()` (presence also exports `subscribeToMetalPlaceConfigRealtime()`).
- **`src/services/liveBandTest.ts`** — `subscribeToLiveBandTestConfigRealtime()`.
- **`src/lib/db/events.ts`** — `BLOCKED_POSTERS_CHANGED_EVENT` for blocked-poster Realtime → hook refresh.
- **`src/__tests__/RealtimeSync.test.tsx`** — Subscription mount and cleanup tests.

### Changed
- **`src/components/sync/SyncOrchestration.tsx`** — Mounts `RealtimeSync` alongside `ReconnectSync`.
- **`src/hooks/usePickCounts.ts`**, **`useAnnouncements.ts`**, **`useMetalPlaceConfig.ts`**, **`useLiveBandTestConfig.ts`**, **`useMissedBands.ts`** — IDB reads + window events only; no Supabase Realtime ownership.
- **`src/hooks/useNowData.ts`** — Removed `usePresenceRealtime()` composition.
- **`docs/ai-wiki/sync-engine.md`**, **`architecture.md`**, **`decisions/custom-hooks-events-no-redux.md`** — Realtime subscription site = sync layer via repositories.

### Removed
- **`src/hooks/usePresenceRealtime.ts`** — Presence Realtime moved to `presenceRepository.subscribeToRealtime()` + `RealtimeSync`.

### Architectural Notes
- Hooks remain read-only IDB subscribers reacting to `viralatas:*` window events for remote updates.
- `blocked_posters` Realtime emits `BLOCKED_POSTERS_CHANGED_EVENT`; `useAnnouncements` refetches via `usersRepository.fetchBlockedPosters()`.
- Duck Realtime remains in `useDuckNotifications` (out of 27.D scope).

---

## 2026-05-25 (Phase 27.E — Offline-queue primitive)

### Added
- **`src/lib/optimisticQueue.ts`** — `createOptimisticQueue()`, `buildFlushBatches()`, dedup strategies: `keepLast`, `byId`, `fifo`.
- **`src/__tests__/optimisticQueue.test.ts`** — Dedup strategy unit tests and flush behavior.

### Changed
- **`src/repositories/picks.ts`**, **`presence.ts`**, **`missed.ts`**, **`announcements.ts`**, **`duck.ts`** — Flush paths migrated to `OptimisticQueue`; removed inline dedup/flush loops.
- **`src/lib/syncCoordinator.ts`** — Uniform `flushOfflineQueue()` on all five repositories (announcements/duck aliases `flushPending`/`flushOfflineDucks` retained).
- **`docs/ai-wiki/sync-engine.md`** — OptimisticQueue section and dedup strategy table.

### Removed
- **`src/repositories/picks.ts`** — Exported `deduplicatePickQueue()` (logic lives in `optimisticQueue.ts`).
- **`src/__tests__/deduplicatePickQueue.test.ts`** — Replaced by `optimisticQueue.test.ts`.

### Architectural Notes
- Preserves per-domain dedup semantics: picks/presence keepLast, missed byId, announcements/duck FIFO.
- Single flush contract for coordinator; missed flush returns count but remains excluded from sync-toast total.

---

## 2026-05-25 (Phase 27.C — Sync coordinator)

### Added
- **`src/lib/syncCoordinator.ts`** — `runReconnectSync(userId)`: flush picks, presence, announcements, duck, missed queues → pull crew remote → return flushed count.
- **`src/components/sync/ReconnectSync.tsx`** — Single mount + `online` handler; emits `viralatas:sync-complete` once when items flushed.
- **`src/__tests__/syncCoordinator.test.ts`**, **`src/__tests__/ReconnectSync.test.tsx`** — Coordinator flush-before-pull ordering and reconnect component behavior.

### Changed
- **`src/components/sync/SyncOrchestration.tsx`** — Replaces `PickSync`, `AnnouncementSync`, `DuckSync` with `ReconnectSync`.
- **`src/repositories/missed.ts`** — Extracted `syncFromRemote(userId)` for coordinator pull phase.
- **`src/hooks/usePickCounts.ts`**, **`usePresenceRealtime.ts`**, **`useAnnouncements.ts`**, **`useBandAttendees.ts`**, **`useMissedBands.ts`** — Removed redundant mount-time remote sync (coordinator owns reconnect).

### Removed
- **`src/components/sync/PickSync.tsx`**, **`AnnouncementSync.tsx`**, **`DuckSync.tsx`** — Consolidated into coordinator.

### Architectural Notes
- Fixes Duck mount-flush gap (was online-only) and missed-band online gap (was hook-mount-only).
- Single reconnect contract: all five offline queues flush before any remote pull; one sync toast event per reconnect cycle.

---

## 2026-05-25 (Phase 27.A — Complete wipeAllLocalData)

### Changed
- **`src/lib/db/connection.ts`** — `VIRALATAS_OBJECT_STORES`, `WIPE_PRESERVED_OBJECT_STORES`, `wipeTargetObjectStores()` — canonical store list derived from schema.
- **`src/lib/db/meta.ts`** — `wipeAllLocalData()` clears all 13 non-session/meta stores (adds `offline_duck_quacks`, `metal_place_config`, `live_band_test_config`).
- **`src/__tests__/db.test.ts`** — Wipe characterization updated; parity test ensures new stores auto-enroll.

### Architectural Notes
- Cache-version invalidation now matches ADR/glossary contract: every store cleared except `session` and `meta` (local `cache_version` marker preserved).

---

## 2026-05-25 (Phase 27.B — Badge presence alignment)

### Changed
- **`src/services/livePreview.ts`** — Added `deriveUserBadgeLocation()`, `resolveLiveTestBandId()`, `crewLocationCountsFromGroups()`; badge `currentLocation` now derives from the same `groupCrewLivePlans` output as `/now`.
- **`src/hooks/useBadgeContext.ts`** — Uses shared presence derivation; `liveTestBandId` gated on `enabled` via `resolveLiveTestBandId()`.
- **`src/hooks/useNowPlans.ts`** — Reuses `resolveLiveTestBandId()` (DRY with badges).
- **`src/__tests__/badgePresence.test.ts`** — Cross-domain contract tests: `/now` group kind ↔ badge location, count parity, live test enabled gate.

### Architectural Notes
- Fixes semantic drift: a vira-lata watching a live band was `'lost'` in badges but in a band card on `/now`; camping flag no longer overrides band group membership for `crew_at_location_min`.
- Single pipeline: `mapCrewLivePlans` → `groupCrewLivePlans` → `deriveUserBadgeLocation` + `crewLocationCountsFromGroups`.

---

## 2026-05-24 (Release v1.2.0)

### Changed
- **`src/version.ts`** — `1.2.0` (minor release on `main`).
- **`CLAUDE.md`** — version counter reset to `0` for the `v1.2.x` line.

### Architectural Notes
- **v1.2.0** bundles Phase 26 (complexity reduction: hooks, `src/lib/db/` split, sync extract), lost-badge counting fix (`computeCrewLocationCounts`, `lost-together` threshold 15), wiki/CLAUDE agent navigation refresh, and 502 tests green.

---

## 2026-05-24 (CLAUDE.md agent navigation refresh)

### Changed
- **`CLAUDE.md`** — Phase 27 active (26 complete); project structure reflects `src/lib/db/`, `components/sync/`, `realtimeSync.ts`; new post–Phase 26 agent navigation table; badge data vs presentation split; expanded `offline-sync-auditor` trigger paths.

### Architectural Notes
- Keeps CLAUDE.md as rules + file routing; deep detail remains in AI Wiki and `.claude/context/`.

---

## 2026-05-24 (Fix: lost location badge counting + lost-together threshold)

### Changed
- **`src/services/badges/registry.ts`** — `lost-together` threshold raised from 10 to 15 (`crew_at_location_min`, location `'lost'`).
- **`src/services/livePreview.ts`** — new `computeCrewLocationCounts()` reuses `mapCrewLivePlans` + `groupCrewLivePlans` so badge crew counts match `/now` location cards (all non-friend crew, excludes current-band watchers, respects Metal Place window).
- **`src/hooks/useBadgeContext.ts`** — uses `computeCrewLocationCounts`; loads metal place + live band test config; merges `crew_earned_badge_slugs` on read; writes crew location badges to both metadata keys on earn.
- **`src/services/badges/persistMetadata.ts`** — `mergedPersistedBadgeSlugs`, `persistMetadataPatch` helpers.
- **`src/i18n/Badges_{br,en,es,de}.json`** — `badgeLostTogetherDescription` updated from "10+" to "15+".
- **`docs/ai-wiki/badges.md`** — lost-together threshold, crew-count semantics, persist dual-key behavior, key files.
- **`.claude/context/badges.md`** — persist write contract for crew location badges.

### Added
- **`src/__tests__/persistMetadata.test.ts`**, **`src/__tests__/livePreview.test.ts`** (`computeCrewLocationCounts`), **`src/__tests__/badges.test.ts`** (lost `crew_at_location_min`), **`src/__tests__/useBadgeContext.test.ts`** (crew without presence rows, legacy `crew_earned_badge_slugs` restore).

### Architectural Notes
- Prior bug: `crewLocationCounts` iterated only `user_presence` rows, undercounting Lost vs the `/now` UI when vira-latas had never toggled presence. Counts now derive from the same live-preview grouping as `/now`.
- Persist read merges `achieved_badge_slugs` ∪ `crew_earned_badge_slugs`; crew-at-location earns write both keys so legacy-only records still restore.

### Changed (wiki gap closure)
- **`docs/ai-wiki/testing.md`** — 502 tests / 37 files; Phase 26 hook + IDB test inventory.
- **`docs/ai-wiki/flows/live-now.md`** — composable `useNowData` (26.M), `usePresenceRealtime`, `subscribePostgresChanges`.
- **`docs/ai-wiki/sync-engine.md`** — `src/components/sync/` orchestration (26.G).
- **`docs/ai-wiki/architecture.md`** — `useBadgeContext` in hooks table; `useMissedBands` consumer fix.
- **`docs/ai-wiki/phases-history.md`** — post-phase test count note (502).

---

## 2026-05-24 (Phase 26 closed — Complexity Reduction & Simplification)

### Changed
- `docs/ai-wiki/phases-history.md` — Phase 26 complete entry (26.A–26.N.k deliverables, acceptance criteria).
- `PHASES.md` — Phase 26 closed; active phase → Phase 27 TBD (`FUTURE_IDEAS.md`).

### Architectural Notes
- Whole phase complete: hooks extracted (`useBands`, `usePickActions`, `useMissedBands`, `useAnnouncements`, `useBandDetailModal`, `useNowData` composables), god components slimmed (`App`, `BadgesDisplay`, `GodlikeAdminPanel`, `AnnouncementsPage`), `db.ts` split into 12 domain modules, test safety nets at 488 tests. Zero user-visible behavior change; offline-first invariants preserved.

---

## 2026-05-24 (Phase 26.N.k — Finalize db module barrel)

### Added
- `src/lib/db/index.ts` — barrel re-exporting all 12 domain modules (`events`, `types`, `connection`, `session`, `catalog`, `picks`, `presence`, `announcements`, `missed`, `config`, `duck`, `meta`).

### Changed
- `src/lib/db.ts` — one-line public shim (`export * from './db/index'`); consumers still import `from '../lib/db'`.
- `vitest.config.ts` — coverage thresholds glob `src/lib/db.ts` → `src/lib/db/**`.

### Architectural Notes
- Zero behavior/schema change; zero consumer import path changes. Stage 26.N complete (N.0–N.k).

---

## 2026-05-24 (Phase 26.N.j — Extract meta and wipe db module)

### Added
- `src/lib/db/meta.ts` — `saveCacheVersion`, `loadCacheVersion`, `wipeAllLocalData` (verbatim extract; 10 cleared stores, 5 preserved).

### Changed
- `src/lib/db.ts` — imports and re-exports meta + wipe from `./db/meta` module (104 → 68 lines).

### Architectural Notes
- Verbatim move; zero consumer import path changes; wipe store lists unchanged from N.0 characterization. Next: 26.N.k optional barrel finalize.

---

## 2026-05-24 (Phase 26.N.i — Extract duck offline queue db module)

### Added
- `src/lib/db/duck.ts` — `enqueueOfflineDuckQuack`, `loadOfflineDuckQuackQueue`, `removeFromOfflineDuckQuackQueue` (verbatim extract).

### Changed
- `src/lib/db.ts` — imports and re-exports duck offline queue from `./db/duck` module (119 → 104 lines).

### Architectural Notes
- Verbatim move; zero consumer import path changes. Next: 26.N.j meta + wipe.

---

## 2026-05-24 (Phase 26.N.h — Extract admin config db module)

### Added
- `src/lib/db/config.ts` — `loadMetalPlaceConfig`, `saveMetalPlaceConfig`, `clearMetalPlaceConfig`, `loadLiveBandTestConfig`, `saveLiveBandTestConfig`, `clearLiveBandTestConfig` + `METAL_PLACE_CONFIG_CHANGED_EVENT` / `LIVE_BAND_TEST_CONFIG_CHANGED_EVENT` emits (verbatim extract).

### Changed
- `src/lib/db.ts` — imports and re-exports admin config from `./db/config` module (168 → 122 lines).

### Architectural Notes
- Verbatim move; zero consumer import path changes. Next: 26.N.i duck offline queue.

---

## 2026-05-24 (Phase 26.N.g — Extract missed bands db module)

### Added
- `src/lib/db/missed.ts` — `saveMissedBand`, `removeMissedBand`, `loadMissedBands`, `loadAllMissedBands`, `replaceUserMissedBands`, offline queue ops (`enqueueOfflineMissed`, `loadOfflineMissedQueue`, `removeFromOfflineMissedQueue`) + `MISSED_CHANGED_EVENT` emit (verbatim extract).

### Changed
- `src/lib/db.ts` — imports and re-exports missed bands from `./db/missed` module (213 → 168 lines).

### Architectural Notes
- Verbatim move; zero consumer import path changes. Next: 26.N.h admin config domain.

---

## 2026-05-24 (Phase 26.N.f — Extract announcements db module)

### Added
- `src/lib/db/announcements.ts` — `saveAnnouncements`, `saveAnnouncement`, `removeAnnouncementFromCache`, `loadAnnouncementsFromCache`, `loadLatestAnnouncement`, offline queue ops (`enqueueOfflineAnnouncement`, `loadOfflineAnnouncementsQueue`, `removeFromOfflineAnnouncementsQueue`) + `ANNOUNCEMENTS_CHANGED_EVENT` emit (verbatim extract).

### Changed
- `src/lib/db.ts` — imports and re-exports announcements from `./db/announcements` module (261 → 213 lines).

### Architectural Notes
- Verbatim move; zero consumer import path changes. Next: 26.N.g missed bands domain.

---

## 2026-05-24 (Phase 26.N.e — Extract presence db module)

### Added
- `src/lib/db/presence.ts` — `saveUserPresence`, `loadUserPresence`, `loadAllUserPresence`, `replaceUserPresence`, offline queue ops (`enqueueOfflinePresence`, `loadOfflinePresenceQueue`, `removeFromOfflinePresenceQueue`) + `PRESENCE_CHANGED_EVENT` emit (verbatim extract).

### Changed
- `src/lib/db.ts` — imports and re-exports presence from `./db/presence` module (304 → 261 lines).

### Architectural Notes
- Verbatim move; zero consumer import path changes. Next: 26.N.f announcements domain.

---

## 2026-05-24 (Phase 26.N.d — Extract picks db module)

### Added
- `src/lib/db/picks.ts` — `saveUserPick`, `removeUserPick`, `loadUserPicks`, `loadAllUserPicks`, `replaceUserPicks`, offline queue ops (`enqueueOfflinePick`, `loadOfflineQueue`, `removeFromOfflineQueue`) + `PICKS_CHANGED_EVENT` emit (verbatim extract).

### Changed
- `src/lib/db.ts` — imports and re-exports picks from `./db/picks` module (353 → 304 lines).

### Architectural Notes
- Verbatim move; zero consumer import path changes. Next: 26.N.e presence domain.

---

## 2026-05-24 (Phase 26.N.c — Extract session and catalog db modules)

### Added
- `src/lib/db/session.ts` — `saveSession`, `loadSession`, `clearSession` (verbatim extract from `db.ts`).
- `src/lib/db/catalog.ts` — `saveBands`, `loadBands`, `saveCrewUsers`, `loadCrewUsers` + `BANDS_CHANGED_EVENT` / `CREW_USERS_CHANGED_EVENT` emits (verbatim extract).

### Changed
- `src/lib/db.ts` — imports and re-exports session + catalog from `./db/` modules (407 → 353 lines).

### Architectural Notes
- Verbatim move; zero consumer import path changes. Next: 26.N.d picks domain.

---

## 2026-05-24 (Phase 26.N.b — Extract db connection layer)

### Added
- `src/lib/db/connection.ts` — `DB_NAME`, `DB_VERSION`, `getDB()`, upgrade handler (15 object stores), `resetDbConnectionForTests()` (verbatim extract from `db.ts`).

### Changed
- `src/lib/db.ts` — imports `getDB` from `./db/connection`; re-exports `resetDbConnectionForTests` for tests (482 → 407 lines).

### Architectural Notes
- Verbatim move; zero schema/version change. Shared singleton connection; domain functions unchanged. Next: 26.N.c session + catalog.

---

## 2026-05-24 (Phase 26.N.a — Extract db events and types)

### Added
- `src/lib/db/events.ts` — 8 window `*-changed` event string constants (verbatim extract from `db.ts`).
- `src/lib/db/types.ts` — `OfflinePickOp`, `OfflineDuckQuackOp`, internal offline row types (`OfflineMissedOp`, `OfflinePresenceOp`), and `ViralatasDB` schema interface.

### Changed
- `src/lib/db.ts` — imports and re-exports events + public types from `./db/` modules; monolith body unchanged (555 → 482 lines).

### Architectural Notes
- Verbatim move; zero consumer import path changes (all still `from '../lib/db'`). First safe file split before 26.N.b connection layer.

---

## 2026-05-24 (Phase 26.N.0 — IDB safety net)

### Added
- `src/__tests__/db.test.ts` — 23 new tests (41 total): all 8 `*-changed` event constants; `loadAllUserPresence` / `replaceUserPresence` (scoped + full clear); offline presence / announcement / missed / duck quack queues; bulk `saveAnnouncements` + `removeAnnouncementFromCache`; metal place + live band test config load/save/clear + save events; all missed-band CRUD + `MISSED_CHANGED_EVENT`; full `wipeAllLocalData` characterization (10 cleared stores, 5 preserved: session, meta, metal_place_config, live_band_test_config, offline_duck_quacks); 15 object stores created on first open.

### Changed
- `vitest.config.ts` — per-file `db.ts` coverage thresholds raised to 95% statements/lines/functions, 55% branches.

### Architectural Notes
- Test-only stage; no production code changes. Characterization tests guard store lists, event names, and cross-store wipe before 26.N domain file splits.

---

## 2026-05-24 (Phase 26.M.d — Consolidate presence side effects)

### Added
- `presenceRepository.applyPresenceToggle(userId, nextValue, context)` — orchestrates camping / Metal Place / auto presence toggles from `/now` (verbatim logic from `useNowData.handlePresenceChange`).
- `presenceRepository.autoClearCampingOnCurrentBand(userId, isCamping, myRawPlanStatus)` — clears camping when user has a current band (verbatim logic from camping auto-clear effect).
- `PresenceToggleContext` type exported from `src/repositories/presence.ts`.
- `src/__tests__/presenceRepository.test.ts` — 7 tests for `applyPresenceToggle` and `autoClearCampingOnCurrentBand`.

### Changed
- `src/hooks/useNowData.ts` — delegates presence side effects to repository helpers (169 → 162 lines).
- `docs/ai-wiki/flows/live-now.md` — documents new repository presence APIs.

### Architectural Notes
- Presence orchestration testable at repository layer; hook remains thin composition wiring. Stage 26.M complete.

---

## 2026-05-24 (Phase 26.M.c — Extract cache and plan derivations)

### Added
- `src/hooks/useNowCache.ts` — IDB cache load (`picks`, `crewUsers`, `presence`, `latestAnnouncement`) + window event listeners for `PICKS_CHANGED_EVENT`, `CREW_USERS_CHANGED_EVENT`, `PRESENCE_CHANGED_EVENT`, `ANNOUNCEMENTS_CHANGED_EVENT` (verbatim extract from `useNowData`); accepts `undoTimerId` so effect cleanup clears skip/undo timer on re-run/unmount.
- `src/hooks/useNowPlans.ts` — live plan memos (`myRawPlan`, `myPlan`, `crewPlans`, `crewGroups`, `presenceValue`, `duckBandId`, MP window, live test band) (verbatim extract from `useNowData`).

### Changed
- `src/hooks/useNowData.ts` — composes `useNowCache()` and `useNowPlans()`; no behavior change (270 → 169 lines).
- `docs/ai-wiki/architecture.md` — hooks table documents `useNowCache()` and `useNowPlans()`.

### Architectural Notes
- IDB/event wiring separated from live plan math before optional 26.M.d side-effect consolidation.

---

## 2026-05-24 (Phase 26.M.b — Extract usePresenceRealtime)

### Added
- `src/hooks/usePresenceRealtime.ts` — mount `syncCrewFromRemote()` + `user_presence` realtime channel via `subscribePostgresChanges` (verbatim extract from `useNowData`).

### Changed
- `src/hooks/useNowData.ts` — composes `usePresenceRealtime()`; no behavior change (281 → 270 lines).
- `docs/ai-wiki/architecture.md` — hooks table documents `usePresenceRealtime()`.
- `docs/ai-wiki/sync-engine.md` — realtime consumer table: `user_presence_live` owned by `usePresenceRealtime`.

### Architectural Notes
- Crew presence live updates isolated before 26.M.c–d extractions.

---

## 2026-05-24 (Phase 26.M.a — Extract config hooks)

### Added
- `src/hooks/useMetalPlaceConfig.ts` — IDB load, `syncMetalPlaceConfig`, `METAL_PLACE_CONFIG_CHANGED_EVENT`, and `metal_place_config` realtime channel (verbatim extract from `useNowData`).
- `src/hooks/useLiveBandTestConfig.ts` — IDB load, `syncLiveBandTestConfig`, `LIVE_BAND_TEST_CONFIG_CHANGED_EVENT`, and `live_band_test_config` realtime channel (verbatim extract from `useNowData`).

### Changed
- `src/hooks/useNowData.ts` — composes `useMetalPlaceConfig()` and `useLiveBandTestConfig()`; no behavior change (335 → 281 lines).
- `docs/ai-wiki/architecture.md` — hooks table documents new config hooks.

### Architectural Notes
- Config wiring isolated before 26.M.b–d extractions; realtime ownership moves from `useNowData` to dedicated hooks.

---

## 2026-05-24 (Phase 26.M.0 — useNowData hook safety net)

### Added
- `src/__tests__/useNowData.test.ts` — 12 hook tests covering `handlePresenceChange` branches, camping auto-clear effect, `validateAndAutoCheckout` on inactive MP window, skip/undo, `duckBandId` gating (ceremony / 15-min window), `PRESENCE_CHANGED_EVENT` cache refresh, and a characterization snapshot for key `NowData` fields.

### Architectural Notes
- Test-only stage: no production code changes; safety net before 26.M.a–d hook extractions.

---

## 2026-05-24 (Phase 26.L — Decompose GodlikeAdminPanel)

### Added
- `src/components/profile/CacheResetSection.tsx` — godlike cache invalidation.
- `src/components/profile/FeatureFlagsSection.tsx` — registration, duck, playlist_testing toggles.
- `src/components/profile/MetalPlaceAdminSection.tsx` — Metal Place config + test mode.
- `src/components/profile/LiveBandTestAdminSection.tsx` — live band test override.
- `src/components/profile/UserManagementSection.tsx` — roles, block list, assign badge modal.

### Changed
- `GodlikeAdminPanel.tsx` — composition + shared loading + test quack/push; 933 → 203 lines.
- Metal Place / Live Band Test mutual-exclusion logic bridged via parent refs (no behavior change).

### Architectural Notes
- Pure decompose: admin user ops remain on `usersRepository` (26.J); no new Supabase reads from parent.

---

## 2026-05-24 (Phase 26.K — useAnnouncements hook)

### Added
- `src/hooks/useAnnouncements.ts` — IDB cache read, Realtime (announcements + blocked_posters), pagination, role/block state, post/delete/pin/block actions.
- `src/services/announcementsDisplay.ts` — pure `applyPinSort`, `relativeTime` helpers.
- `src/__tests__/useAnnouncements.test.ts` — 4 hook tests (IDB load, crew users, event refresh, canModerate).
- `src/__tests__/announcementsDisplay.test.ts` — 7 tests for pin sort + relative time formatting.

### Changed
- `AnnouncementsPage.tsx` — layout + form only; data/actions via `useAnnouncements()`; 437 → 299 lines.
- `docs/ai-wiki/architecture.md`, `flows/announcements.md` — hook documented.

### Architectural Notes
- Offline-first preserved: hook reads IDB first, Realtime writes IDB (emitting `ANNOUNCEMENTS_CHANGED_EVENT`); page never calls Supabase directly.

---

## 2026-05-24 (Phase 26.I — Split BadgesDisplay)

### Added
- `src/services/badges/stackLayout.ts` — pure vest scatter layout (`buildStackPoses`, `stackStyle`, anti-bury math).
- `src/hooks/useBadgeContext.ts` — IDB-first badge context + `PICKS_CHANGED`/`PRESENCE_CHANGED`/`CREW_USERS_CHANGED` refresh + Supabase `special_badges` drift sync + persist badge earning.
- `src/__tests__/stackLayout.test.ts` — 7 tests for grid, clamp, aspect distance, pose stability, CSS vars.
- `src/__tests__/useBadgeContext.test.ts` — 3 tests for IDB context build, picks refresh, metadata drift sync.

### Changed
- `BadgesDisplay.tsx` — presentation only (vest toggle, modal, glow ack); 599 → 258 lines.
- `docs/ai-wiki/badges.md` — key files table updated for new modules.

### Architectural Notes
- Offline-first preserved: Phase 1 reads IDB + cached `user_metadata`; Phase 2 Supabase `users` row syncs assigned badges in background. Layout math is now unit-testable without React.

---

## 2026-05-24 (Phase 26.J — Repository boundary cleanup)

### Added
- `usersRepository.fetchUserRolesMap()`, `fetchAllUsers()`, `setUserRole()`, `fetchBlockedPosters()`, `fetchBlockedPostersWithUserDetails()`, `blockUser()`, `unblockUser()` — admin/user moderation ops (network-dependent).
- `src/__tests__/usersRepository.test.ts` — 10 tests for crew sync, role map, user list, block/unblock, set role.

### Changed
- `announcementsRepository` — mural CRUD + sync + pin/unpin + current-user role/block checks only; admin ops removed.
- `AnnouncementsPage`, `GodlikeAdminPanel`, `ManagerAdminPanel` — import admin ops from `usersRepository`.
- `docs/ai-wiki/architecture.md`, `flows/announcements.md`, `testing.md` — repository boundary docs.

### Architectural Notes
- Admin moderation (roles, block list) lives in `usersRepository` alongside `syncCrew()`; `announcementsRepository` is mural-only. Offline-first unchanged — admin ops remain network-dependent by design.

---

## 2026-05-24 (Phase 26.H — Realtime subscription helper)

### Added
- `src/lib/realtimeSync.ts` — `subscribePostgresChanges(channelName, subscriptions)` unified Realtime channel setup + `removeChannel` cleanup.
- `src/__tests__/realtimeSync.test.ts` — channel creation, multi-handler registration, schema default, unsubscribe (4 cases).

### Changed
- `usePickCounts`, `useNowData` (3 channels), `AnnouncementsPage`, `useDuckNotifications`, `missedRepository.subscribeToRealtime` — use `subscribePostgresChanges` instead of copy-pasted `supabase.channel()` blocks.

### Architectural Notes
- Pure extract; offline-first unchanged — handlers still write IndexedDB (which emits window events). One unsubscribe pattern across all Realtime subscriptions.

---

## 2026-05-24 (Phase 26.G — App sync orchestration extract)

### Added
- `src/components/sync/` — `CacheVersionCheck`, `BandSync`, `PickSync`, `AnnouncementSync`, `DuckSync`, `PushSetup`, `DuckNotificationsListener`, `SyncOrchestration`, `emitSyncComplete`.

### Changed
- `src/App.tsx` — routes + providers only; mounts `<SyncOrchestration />` instead of inline sync components (238 → 84 lines).

### Architectural Notes
- Pure extract; offline-first sync lifecycle unchanged. Sync orchestration now auditable in one folder; ready for 26.H realtime helper refactor.

---

## 2026-05-24 (Phase 26.F — useBandDetailModal shared state)

### Added
- `src/hooks/useBandDetailModal.ts` — `{ activeBand, openBand, closeBand, modalProps }`; composes pick/missed/attendee inputs into one band-detail modal contract.
- `src/components/BandDetailModalHost.tsx` — thin render wrapper for `BandDetailModal`.
- `src/__tests__/useBandDetailModal.test.ts` — open/close, ended/missed derivation, pick and missed toggle handlers (6 cases).

### Changed
- `MyPicksPage`, `PopularPage` — band detail modal state/handlers via `useBandDetailModal()` instead of duplicated `activeBandId` memos and inline `BandDetailModal` props.

### Architectural Notes
- Pages keep composing `useBands`, `usePickActions`, `useMissedBands`, `useBandAttendees`; hook owns modal open/close and derived ended/missed/conflict props only.

---

## 2026-05-24 (Phase 26.D — useMissedBands hook)

### Added
- `src/hooks/useMissedBands.ts` — `{ allMissed, missedBandIds, missedCountsByBand, mark, unmark, toggleMissed, refresh }`; composes `missedRepository` + `MISSED_CHANGED_EVENT` + Realtime subscription.
- `src/__tests__/useMissedBands.test.ts` — mount load, user-scoped ids, mark, unmark, toggleMissed (5 cases).

### Changed
- `MyPicksPage`, `PopularPage` — missed-band state/effects via `useMissedBands()` instead of duplicated `useEffect` + memos + direct repository calls.
- `BadgesDisplay` — reads `allMissed` from hook; removed inline `missedRepository.loadAll()` and `MISSED_CHANGED_EVENT` listener.

### Architectural Notes
- Missed-band reads stay offline-first (`UI → IndexedDB`); hook centralizes sync + Realtime so pages only consume derived state and actions.

---

## 2026-05-24 (Phase 26.E — usePickActions hook)

### Added
- `src/hooks/usePickActions.ts` — `{ pickedIds, refresh, togglePick, pickBand, unpickBand }`; composes `useMyPicks` + `picksRepository.toggle`.
- `src/__tests__/usePickActions.test.ts` — mount load, togglePick, pickBand, unpickBand (4 cases).

### Changed
- `SchedulePage`, `MyPicksPage`, `PopularPage`, `ConflictSection`, `useNowData` — pick toggle via `usePickActions()` instead of direct `picksRepository` imports.
- `docs/ai-wiki/architecture.md` — hooks table documents `usePickActions`.

### Architectural Notes
- Pick writes remain optimistic via repository; hook adds refresh after toggle so UI stays in sync without pages duplicating toggle + refresh boilerplate.

---

## 2026-05-24 (Phase 26.C — useBands catalog hook)

### Added
- `src/hooks/useBands.ts` — `{ bands, loading, refresh }` from IndexedDB; subscribes to `BANDS_CHANGED_EVENT`.
- `BANDS_CHANGED_EVENT` in `lib/db.ts` — emitted by `saveBands()` so band sync refreshes all hook consumers.
- `src/__tests__/useBands.test.ts` — mount load + post-sync refresh (2 cases).

### Changed
- `SchedulePage`, `MyPicksPage`, `PopularPage`, `useNowData` — replaced duplicate `useState` + `loadBands()` patterns with `useBands()`.
- `src/__tests__/db.test.ts` — `saveBands` event emission test.

### Architectural Notes
- Band catalog reads stay offline-first (`UI → IndexedDB`); `BandSync` → `saveBands` → event → hook refresh preserves live lineup updates without direct Supabase reads in pages.

---

## 2026-05-24 (Phase 26.B — shared festival constants)

### Added
- `src/services/time.ts` — `FESTIVAL_DAY_1_START`, `FESTIVAL_DAY_1_START_ISO`, `WACKEN_CEST_OFFSET`, `FESTIVAL_DAY_MS`, `wackenLocalMidnight()`, `isFestivalActive()`, `getFestivalDay()` as the single source of truth for Wacken 2026 calendar boundaries (midnight CEST).

### Changed
- `MyPicksPage.tsx`, `AnnouncementsPage.tsx`, `ArrivalMap.tsx`, `ConflictSection.tsx`, `repositories/presence.ts` — replaced hardcoded `+01:00` / `Z` festival date literals with shared constants.
- `src/__tests__/time.test.ts` — 4 tests for festival constant helpers.

### Architectural Notes
- Festival day boundaries now align with CEST (`+02:00`), matching `bandTime.ts` and wiki schedule docs. Resolves prior 1–2 h drift between UI "festival active" checks (old `+01:00`) and metal-place day math (old UTC midnight).

---

## 2026-05-24 (Phase 26.A — refactor safety net)

### Added
- `src/__tests__/db.test.ts` — IndexedDB layer tests (17 cases) using `fake-indexeddb`: session, bands, picks, offline queue, presence, announcements, cache version, window events.
- `src/__tests__/helpers/fakeIdb.ts` — test helper to install fake IndexedDB and reset `viralatas-db` between cases.
- `src/__tests__/login.test.tsx` — real `useAuth` + `LoginPage` tests with mocked Supabase (9 cases).
- `src/__tests__/registration.test.tsx` — real `getRegistrationEnabled` + `RegisterPage` tests (8 cases).
- Dev dependency `fake-indexeddb` (scoped to db/auth IDB tests; `setup.ts` stub remains for other files).
- `vitest.config.ts` — per-file coverage thresholds for `src/lib/db.ts`.

### Changed
- Replaced stub-only `login.test.ts`, `registration.test.ts`, and `auth-integration.test.ts` with tests that import real app modules.
- `src/lib/db.ts` — `resetDbConnectionForTests()` closes the cached IDB connection (test-only export).
- `src/__tests__/setup.ts` — configurable `indexedDB` mock + `@testing-library/jest-dom/vitest`.
- `PHASES.md` — Stage 26.A marked complete.

### Architectural Notes
- IndexedDB remains the UI primary store; db tests exercise the real `idb` schema without touching production bundle.
- Auth page tests mock Supabase only; session persistence tests mirror `lib/supabase.ts` IDB-backed auth storage.

---

## 2026-05-24 (compact patches — Variant C vest stack)

### Changed
- `BadgesDisplay` — **Variant C (Vest Stack):** fixed 112 px collapsed vest with meadow scatter (±55° rotation, reseed on collapse, anti-bury overlap), glow-only animation when collapsed; **Open vest** / **Close vest** toggle; expanded 4-col grid with `settlePatch`; user `data-bg` on both states.
- `BadgesDisplay.module.css` — stack/spread styles; 48 px patches in both states; `.vestStack[data-bg=…]` shares background variants with `.patchesGrid`.
- `ProfilePage` / `RightNowPage` — unified patches header inside `BadgesDisplay` (count + vest toggle); removed external `PATCHES` kicker.
- `src/i18n/Badges_*.json` — `patchesKicker`, `patchesSpread` (Open vest), `patchesCollapse` (Close vest).
- `public/vira-lata-ds.html` — BadgesDisplay section with collapsed/expanded spec table and demo.
- `docs/ai-wiki/badges.md` — Vest Stack layout, constants, CSS class map, scatter algorithm notes.
- `docs/ai-wiki/architecture.md` — BadgesDisplay entry notes vest-stack UI.

### Architectural Notes
- Pure presentation change; badge engine, modal, fullscreen zoom, offline evaluation unchanged.
- Collapsed patches are decorative only; interaction requires opening the vest.
- Design comparison canvas preserved at `_temp/patches-layout-variants/index.html` (not committed).

---

## 2026-05-24 (joke assigned badges — sun sacrifice, tactical nap)

### Added
- Two godlike-assigned joke badges for Wacken 2026: `sun-sacrifice`, `tactical-nap` (`condition: assigned`, `year: 2026`).
- Registry entries + label/description keys in all four locale files.

### Changed
- `docs/ai-wiki/badges.md` — inventory 62 → 64; Merit / Assigned section updated.
- `.claude/context/badges.md` — registry entry count updated.

---

## 2026-05-24 (genre-based badges — Phase 25 canonical)

### Added
- Eight festival 2026 genre badges using `bands_seen_genre_min`: `denim-and-leather` (Heavy Metal, 4), `kvlt` (Black Metal, 4), `wall-of-death` (Thrash Metal, 2), `viking-fur` (Folk Metal, 4), `slow-and-low` (Doom Metal, 3), `breakdown-believer` (Metalcore, 2), `dad-rock-respect` (Hard Rock, 3), `pit-pup` (Punk, 2).
- Registry entries + label/description keys in all four locale files (`Badges_{br,en,es,de}.json`).

### Changed
- `docs/ai-wiki/badges.md` — inventory 54 → 62; Festival 2026 section lists all eleven genre badges; canonical-genre gap narrowed to `Metal` + `Metal Battle`.
- `.claude/context/badges.md` — registry entry count updated.

---

## 2026-05-24 (genre collapse mapping wiki page)

### Added
- `docs/ai-wiki/genre-collapse-mapping.md` — full old tag → canonical label lookup table inside ai-wiki.

### Changed
- `docs/ai-wiki/index.md`, `domain-model.md`, `lineup.md`, `phases-history.md`, ADR, superpowers spec — link to mapping page.

---

## 2026-05-24 (genre collapse ADR)

### Added
- `docs/ai-wiki/decisions/genre-collapse-canonical-labels.md` — ADR for Phase 25: why ~93 subgenre strings collapsed to 13 in-place labels, alternatives rejected, tradeoffs (Doom/Gothic, Metal catch-all, Party Metal lock).

### Changed
- `docs/ai-wiki/index.md` — ADR linked in decisions inventory + Path 6.
- `docs/ai-wiki/domain-model.md` — Band entity links to genre-collapse ADR.
- `docs/ai-wiki/badges.md` — genre condition docs link to ADR.
- `docs/ai-wiki/lineup.md` — genre section links to ADR.
- `docs/ai-wiki/phases-history.md` — Phase 25 wiki list includes ADR.
- `docs/superpowers/specs/2026-05-24-genre-collapse-design.md` — links to ADR.
- `.claude/context/key-decisions.md` — quick-reference row for canonical genres.

---

## 2026-05-24 (Phase 25 — Genre Collapse)

### Added
- `docs/superpowers/specs/2026-05-24-genre-collapse-design.md` — collapse spec + old→new mapping table.
- `src/services/genreGuide.ts` — `GENRE_COLLAPSE_MAP`, `GENRE_GUIDE`, `sortFilterGenres()`.
- `src/components/GenreGuideCollapsible.tsx` — inline genre guide in filter drawer.
- `scripts/apply-genre-collapse.ts` — one-shot rename helper for seed + lineup.

### Changed
- `supabase/seed/bands.ts` + `docs/ai-wiki/lineup.md` — ~93 genre strings collapsed to 13 canonical labels; `TBD_GENRE` → `Metal`; all `Metal Battle *` → `Metal Battle`.
- `src/components/BandFilters.tsx` — genre filter uses single-select pills (not native `<select>`); GenreGuide collapsible below pill row.
- `src/i18n/SchedulePage_{br,en,es,de}.json` — genre guide keys (`genreGuideTrigger`, `genreGuideIntro`, …).
- `public/vira-lata-ds.html` — genre pills + GenreGuideCollapsible documented.
- `docs/ai-wiki/domain-model.md` — canonical 13-genre list on Band entity.

### Changed (doc audit)
- `docs/ai-wiki/badges.md` — aligned to 13 canonical labels; fixed party-metal / gutalax / wacken-firefighters / heavysaurus slot refs; replaced stale Pirate Metal section.
- `docs/ai-wiki/routes.md` — schedule genre filter documents canonical pills + guide.
- `docs/superpowers/specs/2026-05-24-genre-collapse-design.md` — status → Complete; `Children's Metal` in Metal bucket.
- `supabase/seed/bands.ts` — Heavysaurus `Children's Metal` → `Metal` (restores seed/lineup 13-genre parity).

### Architectural Notes
- No schema change — rename in-place only; deploy via `seed:bands:sync --apply`.
- `death-metal` / `power-metal` badge thresholds stay at 3; `party-metal` unchanged.
- Guide data is static (offline-safe), not computed from live band list.
- **Phase 25 closed:** prod `seed:bands:sync --apply` confirmed DB already aligned (0 genre updates needed, 0 picks affected).

---

## 2026-05-24 (production database safety)

### Added
- `.claude/context/production-database.md` — no PITR on Supabase plan; agent must ask before destructive prod ops.
- `docs/ai-wiki/lineup-sync.md` → **Verifying Phase 24 / lineup changes** — dry-run, SQL, app smoke checklist.

### Changed
- `CLAUDE.md` — **Production database safety** section; seed-script catalog references it.
- `.claude/context/stages-and-lineup.md` — sync/backfill as default; explicit no-PITR + ask-first for destructive seed.

### Architectural Notes
- Destructive `seed:bands` on prod without backup is irreversible for `user_picks`. Non-destructive path: `backfill-slot-id` + `seed:bands:sync`.

---

## 2026-05-24 (Phase 24 closed)

### Changed
- `PHASES.md` — active phase advanced to 25; Phase 24 entry appended to `phases-history.md`.
- Prod verified: sync dry-run empty plan, 1-row UPDATE `--apply` preserves `user_picks`, revert confirmed.

---

## 2026-05-24 (Phase 24 — non-destructive lineup sync)

### Added
- Non-destructive lineup sync: `npm run seed:bands:sync` (dry-run by default, `--apply` to write).
- Band slot move tool: `npm run seed:bands:move -- --from <slot> --to <slot> [--apply]`.
- `docs/ai-wiki/lineup-sync.md` — operator flow for sync and move tools.
- Migrations `20260524000000_bands_slot_id_add.sql` and `20260524000001_bands_slot_id_lock.sql`.
- `supabase/seed/seed-shared.ts` — shared env loader, service client, cache_version bump.

### Changed
- `public.bands` gains `slot_id text NOT NULL UNIQUE` as canonical stable identity.
- `supabase/seed/bands.ts` — every row declares `slot_id`; pre-flight integrity check; destructive banner points at sync.
- `Band` TypeScript type gains required `slot_id: string`.
- `lineup.md` maintenance guide defaults to sync; destructive seed recharacterized as festival-reset only.
- `supabase-schema.md` — updated bands DDL (slot_id, dropped composite UNIQUE).

### Architectural Notes
- One-time operator backfill still required: apply migration 1 → `npm run seed:bands -- --force` → apply migration 2. That single destructive run bootstraps `slot_id`; all subsequent edits use sync.
- Old `UNIQUE(stage, start_time, name)` dropped — redundant with slot_id identity.
- Client unchanged: UI reads IndexedDB by `id`; `cache_version` bump forces refresh after sync apply.

---


### Fixed
- **`MoshSplitSection` API path** — fetch URL updated from `/v1/balances/external-summary` to `/pitboss/v1/balances/external-summary`. The bare `/v1/…` path returns 404; the Pitboss prefix is required per MoshSplit API docs.

### Changed
- **`README.md`**, **`flows/moshsplit.md`**, **`architecture.md`**, **`vira-lata-ds.html`** — endpoint paths updated to include `/pitboss`.

---

## 2026-05-24 (assigned-badge drift loop fix)

### Fixed
- **BadgesDisplay drift loop** — replaced `refreshSession()` with one-shot `updateUser({ special_badges })` when DB and cached `user_metadata` diverge; effect depends on `user.id` only and reuses last DB snapshot on later refreshes. Fixes assigned-badge blink and session logout after godlike assignment.
- **`assign-badge` Edge Function** — auth metadata mirror checks errors and rolls back DB write if `updateUserById` fails.

### Architectural Notes
- `refreshSession()` only re-fetches JWT metadata from auth server; if `admin.updateUserById` failed or was never run for a legacy assignment, drift never healed and each refresh re-triggered the effect → badge flicker + repeated session refresh → logout.

---

## 2026-05-24 (Live Now scenario tests)

### Added
- **`derivePresenceValue()` and `findUserCrewGroup()`** in `src/services/livePreview.ts` — pure helpers extracted from `useNowData` for testable presence-toggle and crew-group resolution.
- **`src/__tests__/fixtures/liveNowScenarios.ts`** — shared band/user/presence builders, `runLiveNowScenario()` pipeline, and `assertLiveNowExpectations()`.
- **`src/__tests__/liveNowScenarios.test.ts`** — table-driven scenarios: 3 concurrent live bands + camping + lost + Metal Place snapshot; transition flows T1–T6 (camping/MP/lost/band); `derivePresenceValue` branch coverage.

### Changed
- **`resolveFocusUserLivePlan()`** in `livePreview.ts` — Metal Place (active window) overrides a concurrent live pick for the focus user's `myPlan` on `/now`; crew grouping already preferred MP via `groupCrewLivePlans`.
- **`useNowData.ts`** — uses `resolveFocusUserLivePlan()` instead of `applyPresenceToLivePlan()` for `myPlan`.
- **`PresenceToggle.tsx`** — `PresenceLocation` type re-exported from `livePreview.ts`.
- **`livePreview.test.ts`** — extended with `applyPresenceToLivePlan`, `derivePresenceValue`, `resolveFocusUserLivePlan`, `groupCrewLivePlans`, and `findUserCrewGroup` cases.
- **`liveNowScenarios.test.ts`** — T9 (MP overrides live band), T1b, T7, T8; T1/T3 updates for MP override on `myPlan`.
- **`docs/ai-wiki/testing.md`** — Live Now scenario test section; test count updated.

### Not implemented (deferred)
- **Auto-mark missed when a picked band ends while user was at Metal Place** — estimated **medium–high** effort (~1 phase). Requires a `useNow` tick or resume hook, overlap rule (mark only if still at MP at `end_time`?), offline queue via `missedRepository`, idempotency, and tests for leave-MP-before-end / app-closed-during-set. Manual toggle in band detail after set ends remains the supported path.

### Architectural Notes
- Scenario tests run the same pure pipeline as `/now` without Supabase subscriptions or IndexedDB. `metalPlaceWindowActive` is passed explicitly in fixtures (defaults to `true`) to avoid importing `presenceRepository` in test helpers.
- T1 documents current product behavior: leaving Metal Place (quit or event over) does **not** restore a prior camping flag — user lands in lost until they toggle camping again. While the event is over, a stale `is_at_metal_place` flag is ignored for grouping: user appears in **lost** or their **live band** group (T5/T7/T8); `validateAndAutoCheckout` clears the DB flag on the user's device.

---

## 2026-05-24 (Phase 23 Part 2 — MoshSplit real API + BadgesDisplay two-phase loading)

### Added
- **`error` LoadState in `MoshSplitSection`** — fifth render state: orange `!` chip in trigger, `⚠ Could not load MoshSplit data` message in body with CTA still visible. Handles non-OK HTTP responses and network failures. `.chipError` and `.errorMsg` CSS classes added in `MoshSplitSection.module.css`.
- **Vercel proxy rewrite** (`vercel.json`) — `/api/moshsplit/:path*` → `https://split.viralatas.org/:path*` added before the SPA catch-all. Solves CORS: browser always calls the same origin; `split.viralatas.org` is never contacted directly from the client.
- **Vite dev proxy** (`vite.config.ts` `server.proxy`) — mirrors the Vercel rewrite for local development.
- **`VITE_MOSHSPLIT_TOKEN` documented** in `README.md` Environment Setup section.
- **BadgesDisplay two-phase loading** (`src/components/BadgesDisplay.tsx`) — Phase 1 reads badges from IndexedDB immediately (instant, offline-safe); Phase 2 fetches `special_badges`/`is_friend` from Supabase in the background. Skeleton pulse animation shown while Phase 2 is in flight.

### Changed
- **`MoshSplitSection` Part 2 complete** — mock fetch (`setTimeout` + `ACTIVE_MOCK` cycle) replaced with real `POST /api/moshsplit/v1/balances/external-summary`. Bearer token from `VITE_MOSHSPLIT_TOKEN`. CTA upgraded from a `<button>` to a real `<a href="https://split.viralatas.org" target="_blank" rel="noopener noreferrer">`.
- **`flows/moshsplit.md`** — Updated to reflect Part 2 live status; removed "blocked on API docs" language; added real API endpoint, proxy data-flow diagram, and `error` state to the state table.
- **`architecture.md`** — App Pack section: `ACTIVE_MOCK` reference removed; MoshSplit row updated to show real proxy-based API; Vercel proxy subsection added to the App Pack rules.

### Architectural Notes
- MoshSplit balance API is now live via Vercel proxy. The client `POST`s to `/api/moshsplit/…` (same origin); Vercel rewrites to `split.viralatas.org`. No CORS headers are needed on the external service, and the bearer token never appears in cross-origin requests.
- BadgesDisplay now follows the same two-phase IndexedDB-first pattern used elsewhere in the app: core badge data is always available offline (Phase 1), and dynamic social attributes (`special_badges`, `is_friend`) are layered in when network is available (Phase 2). This keeps the badge UI instant on profile load even at Wacken with poor signal.

---

## 2026-05-22

### Changed
- **Phase 22 closed** — Playlist Launch removed from `PHASES.md`; acceptance criteria marked complete in `phases-history.md`. Active phase is now Phase 23.

### Added
- **`code-wizards` badge** — godlike-assigned badge "Magos do Código" / "Code Wizards". Registry entry, PNG asset, and i18n in all four locales.
- **`flows/playlist-launch.md`** — Full flow doc for Setlist Vira-Latas deep-link from `/my-picks`.
- **`flows/moshsplit.md`** — Full flow doc for MoshSplit balance section on `/profile` (Part 1 mock, Part 2 blocked).

### Changed
- **`architecture.md`** — New "Viralatas App Pack" section: Companion + Setlist + MoshSplit table, integration rules, cross-links to flows and `code-wizards` badge.
- **`routes.md`** — `/my-picks` documents `PlaylistLaunchButton`; `/profile` documents `MoshSplitSection`; Godlike Admin documents playlist toggle.
- **`badges.md`** — `code-wizards` entry expanded with app-pack context and architecture cross-link.
- **`index.md`** — App Pack in core loop, two new flow nav links, Key Files row, Reading Path 9.

### Architectural Notes
- Satellite app integrations (Setlist, MoshSplit) intentionally bypass IndexedDB — mount-time network reads only. Documented as explicit exception to offline-first for non-core deep-links.
- Phase 23 Part 1 remains hidden (`ACTIVE_MOCK = not_found`); wiki documents current state without closing the phase.

---

## 2026-05-22 (Phase 22 — Playlist Launch, Parts 1 & 2)

### Added
- **`playlist_testing` column on `app_settings`** — new `boolean DEFAULT true NOT NULL` column added via migration `20260522000000_playlist_testing.sql`. Controls visibility of the Playlist Launch button: `true` = testing mode (godlike/manager only), `false` = live mode (all vira-latas). Managed by `getPlaylistTesting()` / `setPlaylistTesting()` in `src/lib/appSettings.ts` (duck pattern).
- **`PlaylistLaunchButton` component** (`src/components/PlaylistLaunchButton.tsx`) — self-contained feature component that reads `playlist_testing`, user role, and `preferred_language` on mount; renders a full-width teal strip with a link to `https://setlist.viralatas.org/launch` carrying `bands` (repeated params) + `user_name` (trimmed to 20 chars) + `lang` (br→pt-BR, others→en). Always hidden when user has 0 picks. Opens in `target="_blank"`.
- **`PlaylistLaunchButton.module.css`** — full-width teal strip design using design-system tokens only (`--signal-ok`, `--font-display`, `--font-mono`, `--s-*`).
- **Playlist toggle in GodlikeAdminPanel** (`src/components/profile/GodlikeAdminPanel.tsx`) — new collapsible section in Godlike Powers for toggling `playlist_testing` on/off, following the same pattern as the duck toggle.
- **i18n keys** — `generateSetlist` + `generateSetlistSub` added to `MyPicksPage_{br,en,es,de}.json`; `playlistToggle`, `playlistTesting`, `playlistLive`, `playlistToggleError` added to `ProfilePage_{br,en,es,de}.json`.

### Changed
- **`supabase-schema.md`** — `app_settings` DDL updated with `playlist_testing boolean DEFAULT true NOT NULL`; column descriptions and RLS notes expanded to cover the new flag; "Last updated" bumped to 2026-05-22.
- **`architecture.md`** — no structural changes; existing Phase 22 observability note already present.

### Architectural Notes
- `PlaylistLaunchButton` reads `playlist_testing` directly from Supabase on mount (not cached in IndexedDB). This is intentional — it is a low-frequency flag that doesn't need offline-first treatment, since the button is purely a convenience deep-link out of the app.
- The component is placed in `MyPicksPage` below the conflict banner, above `<main>` — same slot as other non-pick content.
- URL encoding follows the pattern `lang=pt-BR` for Brazilian Portuguese and `lang=en` for all other locales, matching the target service's expected parameter format.
- **Part 2 — Integration confirmed working end-to-end.** Deep-link from the strip opens `setlist.viralatas.org` with correct `user_name`, all picked band names, and `lang`; track preview loads; "Generate" lands in Spotify with the user's personal playlist. No code changes required for Part 2 — the URL construction in `PlaylistLaunchButton` was already correct.

---

## 2026-05-20 (Wacken 2026 Running Order — stages.md + lineup.md sync)

### Changed
- `docs/ai-wiki/stages.md` — Synchronized the entire Stage Schedules grid with the official Wacken running order at https://www.wacken.com/en/line-up/running-order-music/. All previously-unconfirmed timeslots on stages that appear in the running order are now `Confirmed = YES`. Only the **Welcome to the Jungle** stage remains `NO` because it is not (yet) in the official running order.
- `docs/ai-wiki/stages.md` — Slot ID ranges updated to reflect added/removed slots:
  - **HAR**: HAR1–HAR12 → HAR1–HAR14 (added HAR8 for Sepultura on D3, added HAR14 for Sabaton on D4 — Farewell ceremony also moved to Harder as HAR13).
  - **FAS**: FAS1–FAS18 → FAS1–FAS17 (removed one D4 slot — Sabaton and the Farewell ceremony moved from Faster to Harder per official running order).
  - **WET**: WET1–WET35 → WET1–WET36 (added a new D4 slot at 11:00–11:55 TBA).
  - **HBA**: HBA1–HBA35 → HBA1–HBA36 (added D2 closer at 00:00*–03:00* for Cowgirls From Hell).
  - **WAS**: WAS1–WAS29 → WAS1–WAS32 (added one D2 slot for Year of the Goat at 23:00, plus two D4 TBA slots at 23:00–00:00 and 00:30*–01:11*).
  - **WAK**: WAK1–WAK28 → WAK1–WAK29 (added one D3 slot — Faun at 22:15–23:15).
  - LOU and JUN ranges unchanged.
- `docs/ai-wiki/stages.md` — Many slot start/end times updated to match the official running order (e.g. D1 HBA10/HBA11, D1 WET11, all of D2 HAR/FAS, D2 LOU12, all of D3 HAR/FAS, D3 LOU18, all of D3 WAK except WAK15, all of D3/D4 WAS, all of D4 HAR/FAS, D4 LOU26/LOU27).
- `docs/ai-wiki/stages.md` — "Last updated" bumped to 2026-05-20.
- `docs/ai-wiki/lineup.md` — Rewrote every day × stage band-assignment table to mirror the official running order. Bands moved substantially between stages and days (e.g. The Gathering Faster→Louder D1; Hämatom Louder→Faster D1; Sepultura Harder D3 final slot; Sabaton+Farewell ceremony moved to Harder D4; Cowgirls From Hell from Wasteland D2 to Headbangers D2 closer; etc.). Image URLs follow their bands to their new slots.
- `docs/ai-wiki/lineup.md` — Metal Battle slots whose representative band is not yet announced are filled with the placeholder string `TDB MTB` (31 slots total: 18 on D1, 12 on D2, 1 D3 W.E.T. Award Ceremony). Non-MTB slots that the running order lists as "TBA" use the existing `TBD` placeholder (Day 4 LOU21 12:00–13:00, WET30 11:00–11:55, WAS24 14:00–14:30, WAS32 00:30*–01:11*).
- `docs/ai-wiki/lineup.md` — Added a new `TDB MTB` status to the Band Status legend.
- `docs/ai-wiki/lineup.md` — Summary updated: 167 CONFIRMED · 25 TBD · 192 total → **155 CONFIRMED · 31 `TDB MTB` · 12 TBD · 199 total · 1 ceremony (now HAR13, was FAS17)**.
- `docs/ai-wiki/lineup.md` — Removed per-day "Band placement algorithm" notes (no longer relevant once the official running order is the source of truth); replaced with a "Source" note pointing to the running order URL.

### Architectural Notes
- The previous lineup contained a number of bands that **do not appear** in the official running order on any stage/day (e.g. E.N.D., Elvicho, Force, Given By The Flames, I See Red, Maschine's Late Night Show, Midhaven, Novelization, Sinamort, Thomas Nicholas Band, Gagamania, TBS, Ballroom Hamburg DJ Team, Sir Henry Hot Memorial, President, Wüstenberg formerly at WET17 — though Wüstenberg now appears at WAK8 D2). These were dropped from `lineup.md`. They should also be reviewed for removal from `supabase/seed/bands.ts`, but that is out of scope for this docs-only sync.
- **Welcome to the Jungle (JUN)** is not in the official running order. JUN slot times in `stages.md` remain `Confirmed = NO`, and in `lineup.md` all JUN slots are now `TBD` (the bands previously placed at JUN — Phantom, Diabolisches Werk, Kupfergold, Craft, Deafheaven, Municipal Waste, Kim Dracula, Focus. — are all confirmed on other stages now, so they cannot also be on JUN).
- Several long-set / unusual slots preserved as published: D2 HBA22 Cowgirls From Hell **00:00*–03:00*** (3-hour set), D4 WAS32 TBA **00:30*–01:11*** (unusual end time retained verbatim from running order).
- Metal Battle Cyprus is explicitly named in the running order: **Speak in Whispers** at WET2 (D1 11:50–12:10). All other MB country slots remain `TDB MTB`.

---

## 2026-05-20 (Phase 22: Vercel Speed Insights)

### Added
- `@vercel/speed-insights` production dependency — tracks Core Web Vitals (LCP, CLS, INP, FCP, TTFB) per route via Vercel's RUM pipeline.
- `<SpeedInsights />` component mounted in `src/App.tsx` inside `<BrowserRouter>` and `<DuckEnabledProvider>`, before the sync components — fires a single beacon POST per page navigation.

### Changed
- `docs/ai-wiki/architecture.md` — Added "Observability" subsection under Layer 1 (Presentation) describing the Speed Insights integration and its non-blocking, network-only nature.
- `docs/ai-wiki/architecture.md` — `src/App.tsx` entry in Relevant Source Files updated to reflect the new `<SpeedInsights />` mount point; "Last updated" bumped to 2026-05-20.

### Architectural Notes
- Beacon POSTs to `vitals.vercel-insights.com` are network-only requests; Workbox does not cache or intercept them, so no Service Worker changes were needed.
- Speed Insights is a pure observability layer: it has no effect on IndexedDB, sync, offline behavior, or Supabase.
- Data is visible only in the Vercel dashboard (production only).

---

## 2026-05-18 (Badges: beer-master + beer-hater godlike-assigned)

### Added
- `src/services/badges/registry.ts` — 2 new `BadgeConfig` entries (godlike-assigned, year: 2026):
  - `beer-master` — "Mestre da Cerveja". You drank Wacken dry and asked for seconds.
  - `beer-hater` — "Inimigo da Cerveja". Surrounded by oceans of beer and said "no thanks."
- `public/badges/badge_beer-master.png` — badge asset (pre-existing).
- `public/badges/badge_beer-hater.png` — badge asset (pre-existing).
- All 4 × 2 i18n keys (label + description) added to `Badges_br.json`, `Badges_en.json`, `Badges_es.json`, `Badges_de.json`.

### Changed
- `docs/ai-wiki/badges.md` — inventory 51 → 53; Merit/Assigned 11 → 13; new badges listed.
- `.claude/context/badges.md` — registry entry count 36 → 53 (corrected running total).

### Architectural Notes
- Both badges use `condition: { type: 'assigned' }` — no engine or type changes required.

---

## 2026-05-18 (Badges: new predicate `stage_diversity_min` + 4 new badges)

### Added
- `src/services/badges/types.ts` — new `BadgeCondition` variant `stage_diversity_min` (count: number). Earns when user has seen bands on N+ distinct stages.
- `src/services/badges/engine.ts` — new `case 'stage_diversity_min'` in `evaluateBadge`: builds a `Set` of stage names from `seenBands`, returns `size >= count`.
- `src/services/badges/registry.ts` — 4 new `BadgeConfig` entries:
  - `stage-hopper` — 4+ distinct stages seen (`stage_diversity_min`, count: 4). Year: 2026.
  - `octopus` — All 8 stages seen (`stage_diversity_min`, count: 8, persist: true). Year: 2026.
  - `smoke-signals` — Godlike-assigned (`assigned`). Year: 2026.
  - `space-brownie` — Godlike-assigned (`assigned`). Year: 2026.
- `public/badges/badge_stage-hopper.png` — new 512×512 px badge asset (metal patch style, jumping figure over stages).
- `public/badges/badge_octopus.png` — new 512×512 px badge asset (badass octopus with 8 stage tentacles).
- All 4 × 2 i18n keys (label + description) added to `Badges_br.json`, `Badges_en.json`, `Badges_es.json`, `Badges_de.json`.
- `src/__tests__/badges.test.ts` — 10 new tests covering `stage_diversity_min` predicate: earn at N stages, fail at N-1, duplicate stage deduplication, registry integration (stage-hopper + octopus), and persist short-circuit.

### Changed
- `.claude/context/badges.md` — count updated 27 → 28; "Seen-based (8)" → "Seen-based (9)"; new predicate row added to seen-based table.
- `docs/ai-wiki/badges.md` — count updated 27 → 28; `stage_diversity_min` section added under BANDS SEEN; inventory updated 47 → 51 (Festival 2026: 18 → 20; Merit/Assigned: 9 → 11); new badges listed.

### Architectural Notes
- `stage_diversity_min` counts distinct `stage` string values in `seenBands`. Ceremony bands are already excluded from `seenBands` by `buildBadgeContext` so they cannot inflate the stage count.
- `octopus` uses `persist: true` — once all 8 stages are conquered the badge survives pick removals.

---

## 2026-05-18 (Badges: 7 new badges — late-night, small-stage, crew milestones, medic, Judas Priest)

### Added
- `src/services/badges/registry.ts` — 7 new `BadgeConfig` entries appended to `BADGES[]`:
  - `witching-hour` — Saw 4+ bands starting at or after 22:00 CEST (`bands_seen_after_hour_min`, hour: 22, count: 4). Year: 2026.
  - `vampire` — Saw 8+ bands starting at or after 22:00 CEST (`bands_seen_after_hour_min`, hour: 22, count: 8). Tiers with `witching-hour`. Year: 2026.
  - `small-stage-champion` — Saw 6+ bands across W.E.T. ∪ Headbangers stages (`bands_seen_stages_min`). Year: 2026.
  - `full-pack` — All 21 vira-latas at camping simultaneously (`crew_at_location_min`, location: camping, count: 21, persist: true). Year: 2026.
  - `mass-lost` — All 21 vira-latas lost in infield simultaneously (`crew_at_location_min`, location: lost, count: 21, persist: true). Year: 2026.
  - `medic` — Godlike-assigned (`assigned`). Year: 2026. "Vira-Lata Medic" — held the hair, fetched the water, walked the wounded home.
  - `judas-witness` — Saw Judas Priest (`band_seen_named`, name: 'Judas Priest'). Year: 2026.
- All 7 × 2 i18n keys (label + description) added to all four locale files: `Badges_br.json`, `Badges_en.json`, `Badges_es.json`, `Badges_de.json`.
- PNG assets for all 7 badges were already present in `public/badges/`.

### Changed
- `docs/ai-wiki/badges.md` — updated inventory count 40 → 47, added 7 badges under their appropriate sections (Festival 2026 14 → 18, Merit/Assigned 8 → 9, Location Presence 3 → 5). Updated "Last updated" line.

### Architectural Notes
- No new predicates were added; all 7 badges use existing `BadgeCondition` types already covered by the test suite. No changes to `types.ts` or `engine.ts`.
- `full-pack` and `mass-lost` use `crew_at_location_min` with count: 21 (the full ~21-person vira-latas group). Both carry `persist: true` because the crew disperses quickly — the badge must survive the moment.
- `witching-hour` / `vampire` form a tiered pair (4 → 8 late-night bands) sharing the same `bands_seen_after_hour_min` predicate.

---

## 2026-05-18 (Ops: `festival-reset` script)

### Added
- `supabase/seed/festival-reset.ts` — new one-shot operator script (run via `tsx`). Wipes pre-festival activity (`public.announcements`, `public.blocked_posters`, `public.user_presence`), clears assigned badges (`public.users.special_badges`), strips three persistent-badge keys from `auth.users.raw_user_meta_data` (`achieved_badge_slugs`, `crew_earned_badge_slugs`, `location_visits`), bumps `public.app_config.cache_version` so connected clients invalidate IndexedDB on next load, and optionally chains the bands re-seed via `--with-bands`. Flags: `--dry-run` (preview only), `--force` (skip the 5-second countdown), `--with-bands` (delegate to `supabase/seed/bands.ts --force` as a subprocess afterward).
- `docs/ai-wiki/festival-reset.md` — new wiki page documenting purpose, when-to-run, the flag matrix, the explicit wiped-vs-preserved scope guard, edge cases, the positive-strip pattern for `auth.users` metadata, and the realtime + cache-version invalidation behavior. Cross-linked from `docs/ai-wiki/index.md`.

### Changed
- `package.json` — new npm script `"festival:reset": "tsx supabase/seed/festival-reset.ts"` alongside the existing `seed:*` entries.
- `docs/ai-wiki/index.md` — added a "Operational Tooling" section linking the new `festival-reset.md` page; updated the "Last Updated" date.

### Architectural Notes
- **Why a script, not a godlike button.** The reset is a one-time operation. Adding it to `GodlikeAdminPanel.tsx` would create permanent in-product surface area (risk of accidental tap from a phone mid-festival) and would need a new Edge Function (writes to `auth.users` require the service role key, which must never reach the client). The script approach matches the established seed-script idiom (`bands.ts`, `test-users.ts`), gates the destructive operation behind a laptop with the right `.env.local`, and adds zero UI.
- **Positive-strip pattern for `auth.users` metadata.** `auth.admin.updateUserById(id, { user_metadata })` REPLACES the metadata object entirely. The script copies the existing object and `delete`s the three known keys instead of building a fresh object with an allow-list. The positive-strip pattern guarantees that future metadata keys (push subscription fields, new profile attributes, future-year Wacken state) are never silently dropped — only the three named keys are removed.
- **Cache invalidation strategy.** `announcements`, `user_presence`, and `user_picks` have realtime publications, so their `DELETE`s converge on connected clients within seconds. Badges and `users.special_badges` don't have realtime, so a `cache_version` bump on `public.app_config` is needed: the existing `CacheVersionCheck` in `src/repositories/bands.ts` detects the mismatch on next app load, wipes IndexedDB, and refetches. The script writes directly to the `app_config` row rather than calling `bandsRepository.invalidateCacheForAllUsers()` because the latter also wipes the operator's local IndexedDB — meaningless from a Node process.
- **`--with-bands` is opt-in, not bundled.** Default behavior wipes state only and prints a reminder to seed bands separately. The festival reset and the bands re-seed are independent operations: an operator may want to reset state without touching bands (e.g. a test run on staging), or seed bands without wiping state (existing `seed:bands` flow). Bundling on by default would force every state reset to also nuke `user_picks` via CASCADE, which isn't always desired.
- **Type fix specific to this file.** The first version of the script used `type Sb = ReturnType<typeof createClient>` to annotate the supabase client argument. That type resolves to `SupabaseClient<unknown, ..., never, never, ...>` (the generic's default constraints) and is incompatible with the actual call-site type `SupabaseClient<any, "public", "public", any, any>` returned by `createClient(url, key)`. Switched to `type Sb = SupabaseClient<any>` (importing `SupabaseClient` as a type), which matches the runtime shape. The seed scripts are NOT included in any `tsconfig.*.json`'s `include` list, so the regular `npm run build` would not catch this — IDE typechecking does. Other seed scripts (`test-users.ts`) have the same latent pattern; not refactored in this commit to limit scope.

---

## 2026-05-17 (Badges: arrival-day patches — `wacken_arrived_on`)

### Added
- `src/services/badges/types.ts` / `engine.ts` — new `BadgeCondition` predicate `{ type: 'wacken_arrived_on'; day: string }`. Exact-match counterpart to the existing strictly-less-than `wacken_arrived_before`. Evaluated as `ctx.wacken_arrival_day === condition.day`; returns `false` when the user has no `wacken_arrival_day` set. Brings the supported predicate count to **27**.
- `src/services/badges/registry.ts` — four new 2026 arrival-day badges, mutually exclusive on `user_metadata.wacken_arrival_day`:
  - `civil-engineers-of-doom` → `sun-jul26` (Sunday) — `/badges/badge_civil.png`
  - `beerforcement` → `mon-jul27` (Monday) — `/badges/badge_beerforcement.png`
  - `campfire-veteran` → `tue-jul28` (Tuesday) — `/badges/badge_veteran.png`
  - `spawn-point-infield` → `wed-jul29` (Wednesday) — `/badges/badge_spawn-infield.png`
  All carry `year: 2026` (year chip on the patch). None set `persist: true` — the badge reflects the user's currently self-reported arrival; if they edit `wacken_arrival_day` on their profile, the patch they own swaps accordingly. Inventory grows 36 → 40.
- `src/i18n/Badges_{br,en,es,de}.json` — added `badgeCivilEngineersOfDoom`, `badgeBeerforcement`, `badgeCampfireVeteran`, `badgeSpawnPointInfield` (and `*Description`) in all four locales. BR is canonical; ES/DE are coherent translations and EN matches the user-supplied copy verbatim.
- `src/__tests__/badges.test.ts` — new `describe('evaluateBadge — wacken_arrived_on')` block covering exact match, mismatch, missing-arrival-day, and a registry-level test asserting the four arrival badges are pairwise mutually exclusive across `sun-jul26 | mon-jul27 | tue-jul28 | wed-jul29`.

### Changed
- `docs/ai-wiki/badges.md` — predicate count 26 → 27; added a `wacken_arrived_on` subsection alongside `wacken_arrived_before`; added a new **Arrival Day 2026 (4)** section to the inventory; appended a row to the cheat sheet; bumped the file footer date.
- `.claude/context/badges.md` — predicate header updated to "All 27 `BadgeCondition` types"; "Profile attributes" sub-table grew from (2) to (3) with the new `wacken_arrived_on` row plus a one-line description.
- `src/services/badges/registry.ts` (comment block) — added the `wacken_arrived_on` reference example next to `wacken_arrived_before`.

### Architectural Notes
- **Why an exact-match predicate.** `wacken_arrived_before` only expresses *strictly less than* in the camping-open day order. Expressing "arrived on day X" with the existing predicate would require `before(X+1) AND NOT before(X)`, which the engine doesn't support (each badge has exactly one `condition`). Adding a single new predicate keeps each badge a single declarative rule and matches the "minimum surface area for badge logic" pattern set by the rest of the engine.
- **Mutual exclusivity.** `user_metadata.wacken_arrival_day` is a single string from the fixed enum `{sun-jul26, mon-jul27, tue-jul28, wed-jul29, thu-plus}`. Because the four new badges each pin one distinct value, exactly one of them evaluates `true` for any non-null arrival day. A user with `thu-plus` gets none of the four (intentional — there is no "arrived Thursday or later" patch in this set). The new test enforces this invariant against the real registry.
- **Why `persist: false`.** Persistence is reserved for *historic moments that should survive data churn* (visited Metal Place, crew bonded at a location, picked 30+ bands once). Arrival day is profile metadata the user can edit at any point; treating it as historic would make a profile edit silently grant a *second* arrival badge. Live evaluation keeps the four-badge set a clean partition of `{sun, mon, tue, wed}`.
- **No image-naming churn.** Image filenames `badge_civil.png`, `badge_beerforcement.png`, `badge_veteran.png`, `badge_spawn-infield.png` were already supplied. The registry's `imagePath` honors them as-is rather than enforcing the `badge_{slug}.png` convention — the convention is documentation guidance, not a runtime constraint, and the same exception is precedented elsewhere in the registry (e.g. `puppy` → `badge_new-puppy.png`, `pack-member` → `badge_vira-latas-pack.png`).
- **Offline-first.** Badge evaluation is fully client-side and reads from `user.user_metadata` already cached for the session. No new IndexedDB store, no new network call, no Edge Function — these patches light up at Wacken with zero signal.

---

## 2026-05-17 (react-hooks/purity: duck cooldown)

### Added
- `src/hooks/useCooldown.ts` — render-pure cooldown derivation. Given an expiry timestamp (`number | null | undefined`), returns whether the cooldown is still active. Replaces the `cooldownUntil > Date.now()` pattern that was being computed in JSX / hook bodies. Implementation uses a lazy-initialized `useRef<number>` snapshot of `Date.now()` plus a `useReducer` tick that only fires from the `setTimeout` callback — keeping render pure (no `Date.now()` calls) and avoiding sync `setState` inside `useEffect` bodies.

### Changed
- `src/components/DuckButton.tsx` — removed the `isOnCooldown: boolean` prop from `DuckButtonProps`. The component now derives `isOnCooldown` internally via `useCooldown(cooldownUntil)`. The existing RAF loop for the conic-gradient drain animation is unchanged (its `Date.now()` runs inside `useEffect`, which is allowed by `react-hooks/purity`).
- `src/components/BandCard.tsx` — both `DuckButton` placements (timeline-variant `duckRow` and schedule-variant `duckColumn`) no longer pass `isOnCooldown`. Pass only `cooldownUntil={duckCooldownUntil ?? null}`.
- `src/components/now/CrewGroupsSection.tsx` — `DuckButton` placement in the live-band group card no longer passes `isOnCooldown`.
- `src/components/profile/GodlikeAdminPanel.tsx` — Test Quack tile no longer passes `isOnCooldown` to `DuckButton`. The local `isTestQuackOnCooldown` value, still consumed by the `onDuck` callback as a press-time guard, is now derived via `useCooldown(testQuackCooldownUntil)` instead of `testQuackCooldownUntil !== null && testQuackCooldownUntil > Date.now()` at render time.
- `src/hooks/useDuckQuack.ts` — replaced the in-hook `const isOnCooldown = cooldownUntil !== null && cooldownUntil > Date.now()` line with `const isOnCooldown = useCooldown(cooldownUntil)`. The returned `isOnCooldown` value is the same shape; callers (e.g. `SchedulePage.DuckableBandCard`) keep working unchanged.
- `docs/ai-wiki/flows/duck.md` — updated the `DuckButton` row in the source-file table to note the new prop contract (single `cooldownUntil` prop), and added a one-line reference to `useCooldown` as the cooldown derivation primitive used by both `useDuckQuack` and the Godlike Test Quack tile.

### Architectural Notes
- **Why:** `eslint-plugin-react-hooks` v6 (React Compiler / React 19 ruleset) introduced `react-hooks/purity`, which forbids calling impure functions like `Date.now()` during render. Render must be idempotent so the compiler's memoization is sound — otherwise a parent re-render could silently flip a derived boolean mid-cooldown without any prop or state change driving it.
- **Single owner of cooldown truth.** Previously two consumers (`BandCard` callsites, `CrewGroupsSection`, `GodlikeAdminPanel`) and the producer (`useDuckQuack`) each independently computed `cooldownUntil > Date.now()`. After this change, `useCooldown` is the canonical answer, used by `DuckButton` itself plus the two hook/consumer sites where the boolean is needed outside the button (the `quack` guard inside `useDuckQuack`, and the Test Quack click-guard in `GodlikeAdminPanel`).
- **Visual behavior preserved.** The conic-gradient drain animation still ticks via `requestAnimationFrame` inside `DuckButton`'s effect; only the gating boolean's *source* changed. The cooldown still:
  - lasts 90 seconds per user per band (90 s per real duck via `useDuckQuack`),
  - lasts 15 seconds for the Godlike Test Quack diagnostic tile,
  - is stored per-band in `localStorage` for the real ducks (unchanged).
- **No DB / no schema / no RLS change.** Purely client-side render correctness.
- **Out of scope.** The same lint rollout also surfaces `react-hooks/set-state-in-effect` violations in unrelated hooks (`useOfflinePendingBandIds`, `DuckEnabledContext`, `AnnouncementsPage`, etc.). Those are pre-existing tech debt and will be addressed under a separate cleanup pass. `useCooldown` is the only new hook authored here and it is clean against both rules.

---

## 2026-05-17 (Friend privacy: arrival data)

### Changed
- `src/components/ArrivalMap.tsx` — added a `visibleUsers` derivation (`crewUsers.filter((u) => u.is_friend !== true)`) and routed the per-day grouping, totals, and empty-state checks through it. Users flagged as `is_friend` no longer surface in any of the three `ArrivalMap` view states (collapsed summary, day cluster, full details), and they no longer contribute to the "X arrived · Y to arrive" counters on `/announcements`.
- `src/components/profile/EditProfileForm.tsx` — added an `isFriend` state hydrated from the IDB-cached `crew_users` store via `loadCrewUsers()` and refreshed on `CREW_USERS_CHANGED_EVENT`. When `isFriend === true` the `ArrivalDayPicker` is not rendered on `/profile`, and `handleSave` writes `wacken_arrival_day: null` to both the auth metadata and the `users` row so a previously-set value cannot be re-published while the picker is hidden.
- `docs/ai-wiki/domain-model.md` — extended the `User` invariants list to capture the friend-privacy rule for arrival data (ArrivalMap exclusion + EditProfileForm picker hidden + null-on-save).
- `public/vira-lata-ds.html` (canonical: `public/vira-lata-ds.html`) — extended the `ArrivalMap` subhead in §9 with a "Friend filtering" bullet that describes the dual-surface suppression (map + picker) and the null-on-save behavior.

### Architectural Notes
- This change is purely **read/write filtering on top of the existing `is_friend` flag** — no schema migration, no new IDB store, no new RLS policy. The flag remains godlike-toggle-only via the admin panel.
- **Offline-first preserved.** Both surfaces read `is_friend` from the IDB-cached `crew_users` store (`loadCrewUsers()` plus `CREW_USERS_CHANGED_EVENT`), so the filter and the hidden picker keep working when the device is offline. The same cache already powers the existing friend behaviors (`useNowData.isFriend`, `BadgesDisplay` location-badge exclusion, `livePreview.groupCrewLivePlans` skip rule).
- **Single direction of truth.** The user-facing surfaces consult `is_friend` independently — the map filters and the picker hides on the same flag — but both sides go through the IDB cache rather than re-querying Supabase, so a stale-while-revalidate read never produces an inconsistent view.
- **Why null-on-save (not just hide-on-render).** A user could be flagged friend after they had already set an arrival day. Hiding the picker without zeroing the value would leave a stale `wacken_arrival_day` in `users` and `auth.users.user_metadata` that other read paths (badges, future arrival surfaces) might still see. Writing `null` whenever the picker is hidden keeps the data and UI consistent.
- **No new badge interaction.** Existing `wacken_arrival_day`-keyed badges (Phase 12) are awarded from the picked value at evaluation time; nulling out the field for a friend simply means they cannot earn the arrival-keyed badges, which matches the broader friend-exclusion stance that already covers location badges.

---

## 2026-05-17 (Phase 21)

### Added
- `supabase/migrations/20260517000000_app_settings_duck_enabled.sql` — adds `duck_enabled boolean default true not null` to the existing single-row `public.app_settings` table. Inherits the existing RLS policies (anyone reads, only the godlike user updates). No new policies or Realtime publication changes.
- `src/lib/appSettings.ts` — `getDuckEnabled()` and `setDuckEnabled()` helpers, mirroring the existing `getRegistrationEnabled` / `setRegistrationEnabled` shape. Both default to `true` on any read failure so a transient network error never silently disables the feature.
- `src/contexts/DuckEnabledContext.tsx` — `DuckEnabledProvider` (wrapped around the app tree in `src/App.tsx`), `useDuckEnabled()` consumer hook, and `useRefreshDuckEnabled()` setter used by the Godlike admin panel after a successful toggle.
- `src/components/profile/GodlikeAdminPanel.tsx` — new **"Duck feature 🦆"** toggle section (mirroring the existing **"Control registration"** section). Adds a `testQuackDisabledHint` line above the Test Quack button when the feature is OFF, so the admin always knows whether end users are seeing the duck.
- `docs/ai-wiki/flows/duck.md` — new **Killswitch (Phase 21)** section documenting the read path, propagation rule (next load), default-on resilience, and the explicit "server-side stays dumb on purpose" rule.
- `docs/ai-wiki/supabase-schema.md` — new `public.app_settings` table section documenting both `registration_enabled` and `duck_enabled` columns with their RLS and non-Realtime behavior. (This filled a pre-existing gap — `app_settings` had been missing from the schema doc since the registration killswitch shipped.)

### Changed
- `src/App.tsx` — app tree is now wrapped in `<DuckEnabledProvider>` so the cached killswitch value is available throughout the routes.
- `src/pages/RightNowPage.tsx` — `onDuck` is passed to `CrewGroupsSection` only when `duckEnabled && duckBandId`.
- `src/pages/SchedulePage.tsx` — `DuckableBandCard.canDuck` short-circuits to `false` when `duckEnabled` is `false`.
- `src/i18n/ProfilePage_{br,en,es,de}.json` — added 7 new keys: `duckToggle`, `duckToggleDescription`, `duckEnabled`, `duckDisabled`, `duckLoading`, `duckToggleError`, `testQuackDisabledHint`.
- `public/vira-lata-ds.html` — BandCard component-section now documents the killswitch visibility rule and where the toggle lives.
- `PHASES.md` — Phase 20 details removed (already preserved in `phases-history.md`); Phase 21 written out as the active phase.

### Architectural Notes
- The killswitch is a **future button visibility gate**, not a data block. `send-duck-push`, `duck_quacks` INSERT, RLS on `duck_quacks`, and the `useDuckNotifications` Realtime subscription are all **untouched**. Offline-queued ducks still flush and broadcast on reconnect even if the switch was flipped to OFF in the meantime — this respects the user's intent at press time and preserves the offline-first contract.
- **Next-load propagation only.** No Realtime subscription on `app_settings`; mid-session users won't see the change until reload. The admin's own session is the exception: a successful toggle triggers `useRefreshDuckEnabled()` so the cached Context value updates immediately (so the Test Quack hint appears/disappears in real time within the admin panel).
- The Test Quack tile is the **only non-gated duck render**. It uses a local-only window event (no DB write, no other user affected), so leaving it functional during killswitch=off is safe — and the explicit `testQuackDisabledHint` makes the disabled state unambiguous.
- The `useDuckEnabled` Context defaults to `true` while the initial fetch is in flight, so users never see a flash of missing duck button on a slow first paint.

---

## 2026-05-17 (later)

### Changed
- `.claude/context/stages-and-lineup.md` — reconciled with `docs/ai-wiki/stages.md` and `docs/ai-wiki/lineup.md`. Corrected band total (78+ → 192: 167 confirmed, 25 TBD, 1 ceremony at FAS17). Replaced the misleading all-✅ per-day matrix with an explicit "HARDER opens on Day 2" note. Updated the stage-colors source pointer to `src/index.css` (CSS custom properties) + `src/services/stageColors.ts:getStageColor()`. Added stage abbreviations, day codes (D1–D4 plus overnight D1n–D4n), CEST note, pairing rules (HARDER↔FASTER, W.E.T.↔HEADBANGERS), and per-stage slot ranges. Long-form slot grid and band assignments stay in the wiki — the context file now just points to them.
- `.claude/context/auth-trigger.md` — completed the `handle_new_user` behavior list with the `display_name` / `avatar_url` coalesce rules and the role-preserving `ON CONFLICT` branch, matching `supabase/migrations/`.
- `.claude/context/key-decisions.md` — added the missing ADRs to the decision/choice/reason matrix: `custom-hooks-events-no-redux`, `workbox-caching-strategy`, and the "Edge Functions for LLM calls" rationale (API key never reaches the client).
- `.claude/context/llm-alerts.md` — dropped the stale Phase 6 marker; added the server-side cooldown rule (cooldowns enforced in the Edge Function, not in the client) to match `supabase/functions/*` reality.
- `.claude/context/wiki-template.md` — rewritten as two explicit variants: **Template A** (core pages: Purpose · Relevant Source Files · Data Flow · Key Hooks/Services/Repositories · Offline Behavior · Synchronization Behavior · Risks/Caveats · Open Questions) and **Template B** (flow pages: Purpose · Trigger · Happy Path · Offline Behavior · Sync Behavior on Reconnect · Relevant Source Files · Data Flow Diagram · Edge Cases), reflecting the section names actually used across `docs/ai-wiki/` today.
- `docs/ai-wiki/index.md` — corrected the top `Last Updated` stamp from `2026-05-12` to `2026-05-17` so it agrees with the `Last edited` footer.

### Architectural Notes
- No source code or schema change. This pass only reconciles `.claude/context/*` on-demand reference files with the wiki (which remains source of truth for system behavior). Confirms the intentional split: `docs/ai-wiki/` documents *the system*; `.claude/context/` documents *operational rules and procedures Claude loads on demand*. When the two disagree, the wiki wins and `.claude/context/` is the side that gets corrected — as happened here.
- No Design System change (no UI moved). No offline-first, RLS, or AlertContext contract change.

---

## 2026-05-17

### Added
- `.claude/context/` directory — on-demand reference material that `CLAUDE.md` now points to instead of inlining: `rtk-reference.md` (full RTK command catalog), `stages-and-lineup.md` (stage table + festival schedule + lineup update procedure), `llm-alerts.md` (`AlertContext` shape, prompt language and tone rules), `badges.md` (`BadgeConfig` contract + supported conditions + add-a-badge procedure), `auth-trigger.md` (`handle_new_user` contract and the four behaviors), `key-decisions.md` (decision/choice/reason matrix), `wiki-template.md` (the 8-section wiki page template).
- `.claude/agents/` directory — seven specialized subagent system prompts: `wiki-curator`, `phase-closer`, `migration-validator`, `edge-function-reviewer`, `badge-author`, `offline-sync-auditor`, `pwa-auditor`. Each is invoked on a specific class of change (see `CLAUDE.md` → "Subagent locations" for the trigger map).

### Changed
- `CLAUDE.md` slimmed from ~370 lines to a rules-and-pointers index. Long-form reference material moved to `.claude/context/` and is loaded on demand. Stale markers refreshed; `npm run seed:bands` flagged as destructive.
- `docs/ai-wiki/index.md` — added a "Where related project memory lives" subsection under "Contributing to This Wiki" pointing readers at `.claude/context/` (on-demand reference material) and `.claude/agents/` (specialized subagent definitions); refreshed the `Last edited` line.

### Architectural Notes
- Project institutional memory now lives in three locations with deliberately non-overlapping scopes:
  - `docs/ai-wiki/` — system behavior: offline-first guarantees, sync semantics, domain modeling, flows, ADRs (this wiki).
  - `.claude/context/` — operational rules and procedures loaded by Claude on demand (RTK, stages, badges, alerts, auth trigger, decisions matrix, wiki template).
  - `.claude/agents/` — specialized subagent system prompts that define how Claude operates on specific classes of change.
- The split is intentional: the wiki documents *the system*; `.claude/` documents *how AI agents work the codebase*. Wiki pages should not restate `.claude/context/` content; they should link to source files and explain the *why*.
- This change does not modify any source code path under `src/` or `supabase/`, does not alter system behavior, and does not affect the offline-first contract or RLS posture. No Design System change (no UI moved).

---

## 2026-05-16 (later)

### Changed
- `src/components/profile/ProfileHeader.tsx` — restored the inline **Wackens chip** that lives next to the country flag in `.pfMeta`. Replaces the diamond-shaped `.pfYearDiamond` badge (which clipped the count and was hard to read on small screens). The chip reuses the shared `Chip` primitive in its default (muted gray) variant and exposes the comma-separated year list as a native tooltip. Header now also receives `t` so the label can be localised.
- `src/pages/ProfilePage.tsx` — passes the `t` function down to `ProfileHeader` so the chip can resolve `wackenCountSingular` / `wackenCountPlural` / `wackenCountTooltip`.
- `src/pages/ProfilePage.module.css` — dropped `.pfYearDiamond` and the (already orphan) `.pfYearsPill`; introduced a thin `.pfWackenChip` override (cursor + intent doc) that lets the chip inherit the default Chip palette.
- `src/i18n/ProfilePage_{br,en,es,de}.json` — added `wackenCountSingular`, `wackenCountPlural`, and `wackenCountTooltip` (German collapses singular/plural to `{count}× Wacken`).
- `public/vira-lata-ds.html` — added a `ProfileHeader` component section documenting the metadata row (role chip · flag · Wackens chip) with three live variants (godlike default, manager singular, vira-lata empty-state) and a prop table; rationale notes why the diamond was retired and why the chip stays in the default gray palette.

### Architectural Notes
- The Wackens chip is intentionally rendered through the shared `Chip` primitive (default variant) rather than a bespoke `<span>`, so the role chip and the Wackens chip stay visually consistent if Chip ever evolves (border-radius, mono font, padding tokens). It deliberately stays in the muted gray palette: it's ambient metadata, not a CTA — coloured fills would compete with the role chip for attention.

---

## 2026-05-16

### Added
- `supabase/functions/send-test-push/index.ts` — new `send-test-push` Edge Function; authenticates caller via JWT, queries their `push_subscriptions`, sends a real VAPID Web Push directly to them; provides inline diagnostic feedback (`no_subscription`, `sent`, `failed`)
- `docs/ai-wiki/flows/duck.md` — new flow document covering the full duck quack lifecycle: button press → cooldown → online/offline quack → Realtime in-app DuckToast → Database Webhook → `send-duck-push` → Web Push → SW push handler; also documents admin test flows (Test Quack vs Test Push)
- `public/vira-lata-ds.html` — comprehensive design system audit & reference: token inventory (colors, spacing, radii, typography, motion), component docs (Button, Input, Chip, Modal, BandCard, Avatar), audit score 72/100, implementation checklist with 7 priority issues.
- `src/index.css` — new CSS tokens: `--role-godlike`, `--role-godlike-bg/border`, `--role-manager`, `--role-manager-bg/border`, `--btn-destructive`, `--btn-destructive-hover`, `--signal-warn-light`, `--text-on-warn`, `--text-white`; motion tokens: `--duration-fast`, `--duration-normal`, `--duration-slow`, `--easing-ease-out`, `--easing-ease-in`.

### Changed
- `src/ui/Chip.module.css` — role variant colors (`#d97706`, `#3b82f6`) replaced with `--role-godlike` / `--role-manager` token set.
- `src/ui/Button.module.css` — destructive variant colors (`#dc2626`, `#b91c1c`) replaced with `--btn-destructive` / `--btn-destructive-hover`; transition duration uses `--duration-fast`.
- `src/components/BandCard.module.css` — all hardcoded hex values replaced with CSS variables; hardcoded spacing (`2px`, `4px`, `6px`) replaced with `--s-1`/`--s-2`; stripe/thumb now use `--stage-color` custom property; transition uses `--duration-fast/normal`.
- `src/components/BandCard.tsx` — removed inline `style={{ background: color }}` from stripe and thumb; set `--stage-color` as a CSS custom property on the article root; replaced `Chip` with `styles.stageBadge` class for stage label (no more `color: '#fff'` inline).
- `src/components/profile/GodlikeAdminPanel.tsx` — added "📲 Test Push Notification" button in Godlike Powers panel; calls `send-test-push` and shows inline success/error feedback; the existing "Test Quack" description updated to clarify it only tests the in-app DuckToast (no push)
- `src/i18n/ProfilePage_{br,en,de,es}.json` — updated `testQuackDescription` to clarify in-app-only scope; added keys: `testPushTitle`, `testPushDescription`, `testPushButton`, `testPushSent`, `testPushNoSubscription`, `testPushFailed`, `testPushError`
- `docs/ai-wiki/domain-model.md` — fixed duplicate entity numbering (Announcement was erroneously numbered 6, BlockedPoster 7 — now 8 and 9); added full `### DuckQuack` and `### PushSubscription` entity sections with TypeScript types, invariants, business rules, lifecycle, and relevant source files
- `src/version.ts` + `CLAUDE.md` — bumped to version `1.0.23`

### Fixed
- ArrivalMap: removed force-collapse useEffect that prevented user interaction after festival starts; initial state still defaults to collapsed when festival is active (ArrivalMap.tsx)

### Architectural Notes
- Stage color is now propagated as a CSS custom property (`--stage-color`) on the BandCard root element, eliminating multiple inline style objects. The stripe, thumb, and stage badge all consume it via `var(--stage-color, <fallback>)`.
- All role and destructive action colors are now globally overridable via CSS tokens, making future theming straightforward.
- The "Test Quack" button and "Test Push Notification" button test different things and must remain separate. Test Quack fires a local window event only (for DuckToast component testing). Test Push exercises the real Web Push stack (VAPID, push_subscriptions, Service Worker) and is the correct tool for diagnosing push delivery failures on a real device.

---


## 2026-05-16

### Changed
- DuckButton: duck image renders grayscale during cooldown and transitions smoothly back to colour when cooldown ends (DuckButton.tsx, DuckButton.module.css)

---

## 2026-05-15 (Phase 21 — Live Card Monument Redesign)

### Changed
- `src/pages/RightNowPage.module.css` — rewrote the `CREW LOCATION CARDS` block as **Monument grammar**:
  - `.groupCard` now uses `display: grid; grid-template-columns: 6px 1fr` — 6 px full-height left rail (`.locStrip`) replaces the old 4 px top strip.
  - New `.groupBody` wraps everything; `.groupMain` is a 2-col grid (`1fr auto`) with `.groupLeft` (kicker / title / subtitle / pills) and `.groupCountCol` (twin tiles).
  - Crew pills (`.memberList`) now sit inside `.groupLeft` immediately under the subtitle (no gap row between title and pills).
  - `.groupCount` redesigned as a soft transparent tile (`rgba(255,255,255,0.02)` bg, `rgba(255,255,255,0.08)` border) instead of `--bg-elevated` + `--border-strong`.
  - `.groupCountCol:has(button)` selector grows the right column to `64 px` width when the duck is rendered, so count + duck become matching 64×64 tiles. Without a duck, the count tile auto-sizes.
  - `.groupActions` now has `border-top: 1px solid var(--border)` + top padding/margin — visually decouples the "I am weak 🤘" footer from the duck above.
  - `.groupTitle` bumped from 22 px to 26 px; `.locCountLabel` font-size dropped to 8 px with `white-space: nowrap` so "vira-latas" caption never wraps.
  - All four kinds (`band`, `metal_place`, `camping`, `lost`) now have explicit `.youAreHere` palette overrides (rail color = accent for bands; per-kind gradient backdrops for the others).
  - Removed `.youAreHere { border-left: 2px solid var(--accent) }` — the rail itself communicates the highlight now.
- `src/components/now/CrewGroupsSection.tsx` — restructured JSX to match the new grammar:
  - Wrapped header + pills + actions inside a single `.groupBody` div.
  - Crew pills moved into `.groupLeft` (under title + subtitle); empty-state copy uses `.groupEmpty` with mono italic styling.
  - Skip button kept in `.groupActions` footer below the main grid.
  - `youAreHere` presence dot (`.liveDot`) is rendered for **all** kinds (not only `band`) — the `kicker` flow is now consistent across band / metal_place / camping / lost.
- `.skipButton` ("I am weak 🤘") redesigned as a **ghost mono-caps micro-link**: transparent background, no border, `--font-mono` 10 px / 600 / uppercase / 0.16 em letter-spacing, `--text-faint` at rest. Hover lifts to `--text-muted`, draws a `--border-strong` bottom rule, and eases letter-spacing to 0.18 em. Active snaps to `--accent-hover` bottom rule. The intent: the duck is the unambiguous hero CTA on a live picked band; the skip button is a tertiary escape hatch and must visually recede.
- `src/components/DuckButton.tsx` — added optional `tile?: boolean` prop. When true, renders a 64×64 rounded-square button (`.buttonTile`) with transparent background, soft border, 46 px duck image, and square-cornered cooldown drain (`.drainOverlayTile`). Default circular variant is unchanged for `BandCard` usage.
- `src/components/DuckButton.module.css` — added `.wrapperTile`, `.buttonTile`, `.duckImgTile`, `.drainOverlayTile` styles; the tile variant pulls `border-radius` from `var(--r-1)` to match the count tile.
- `public/vira-lata-ds.html` §11 — replaced the live card simulation with six new examples covering the full Monument grammar (band you-here ready · band you-here cooldown · band others-only · metal_place you-here · camping empty · lost with members) and rewrote the Element Inventory + Component Ownership notes to match.
- `public/vira-lata-ds.html` changelog — added v2.3 entry documenting the Phase 21 Monument redesign.

### Architectural Notes
- **One grammar, four kinds.** The same body grid handles every `/now` card (band, metal_place, camping, lost). Variants only override the rail color, kicker color, count tile palette, pill palette, and gradient backdrop. This keeps future card kinds cheap to add.
- **`:has()` for layout adaptation.** `.groupCountCol:has(button)` uses CSS native `:has()` to grow the column to 64 px and tighten the count's padding only when a duck button is present. No JS branching needed; the CSS adapts to the React conditional render.
- **Duck stays the hero CTA, weak is a true ghost.** The 64×64 transparent tile beside the count makes the duck visually equal in footprint to the count metric — both are first-class signals. The skip button drops to a 10 px mono-caps micro-link tucked under a hairline divider, reinforcing that quack and weak are opposite emotional actions and that the duck is the unambiguous primary action on a live picked band.
- **No regression on `BandCard`.** `BandCard` still passes only `inBody` (no `tile`), so the duck on `/schedule` and `/my-picks` keeps the legacy 40 px circular treatment.

---

## 2026-05-15 (Phase 20 — The Duck 🦆)

### Added
- `supabase/migrations/20260515000002_phase20_duck.sql` — `duck_quacks` table (id, user_id, band_id, quacked_at; RLS INSERT own, SELECT all; Realtime enabled) + `push_subscriptions` table (id, user_id, endpoint UNIQUE, p256dh, auth; RLS INSERT/DELETE/SELECT own)
- `src/lib/db.ts` — `offline_duck_quacks` store (DB version 8→9); `OfflineDuckQuackOp` type; `enqueueOfflineDuckQuack`, `loadOfflineDuckQuackQueue`, `removeFromOfflineDuckQuackQueue` helpers
- `src/lib/pushSubscription.ts` — `subscribeToPush(userId)`: requests Notification permission, registers PushSubscription via SW, upserts to `push_subscriptions`; VAPID key read from `VITE_VAPID_PUBLIC_KEY`
- `src/workers/sw.ts` — custom Service Worker with Workbox `precacheAndRoute`, NetworkFirst for Supabase, CacheFirst for Wacken images, `push` event listener (shows system notification), `notificationclick` listener (focuses/opens `/now`)
- `vite.config.ts` — switched from `generateSW` to `injectManifest` strategy (srcDir: `src/workers`, filename: `sw.ts`); workbox runtime caching moved into the SW file
- `src/repositories/duck.ts` — `quackBand(userId, bandId)`: inserts to Supabase or queues offline; `flushOfflineDucks()`: flushes offline queue on reconnect
- `src/hooks/useDuckQuack.ts` — manages 90s per-user per-band cooldown via `localStorage` key `duck_cooldown:{userId}:{bandId}`; returns `{ quack, isOnCooldown, cooldownUntil }`
- `src/hooks/useDuckNotifications.ts` — Supabase Realtime subscription on `duck_quacks` INSERT; ignores own quacks and non-picked bands; dispatches `viralatas:duck-quack` CustomEvent
- `src/components/DuckButton.tsx` + `DuckButton.module.css` — circular rubber-duck button; conic-gradient drain overlay (dark sweeps CW from 12 o'clock over 90s representing elapsed cooldown); pop animation on press; disabled during cooldown
- `src/components/DuckToast.tsx` + `DuckToast.module.css` — global floating duck toast; listens to `viralatas:duck-quack`; looks up band name from IndexedDB; slide-up entrance / fade-out exit; auto-dismisses after ~3s
- `src/i18n/DuckButton_{br,en,de,es}.json` — duck-specific i18n keys: `quackLabel`, `cooldownLabel`, `pushPromptTitle`, `pushPromptBody`, `pushDenied`
- `supabase/functions/send-duck-push/index.ts` — Edge Function triggered by Database Webhook on `duck_quacks` INSERT; queries `user_picks` (excluding quacker), fetches `push_subscriptions`, sends Web Push via `npm:web-push` with VAPID keys from Supabase secrets

### Changed
- `src/components/BandCard.tsx` — added optional `onDuck?: () => void` and `duckCooldownUntil?: number` props; renders `<DuckButton>` when `onDuck` provided and band is not ceremony; CSS grid gains `.withDuck` class adding extra column for the duck button
- `src/components/BandCard.module.css` — added `.variantSchedule.withDuck` and `.variantTimeline.withDuck` grid templates (extra `auto` column for duck button)
- `src/components/now/CrewGroupsSection.tsx` — added `onDuck?: () => void` and `duckCooldownUntil?: number | null` props; renders `<DuckButton>` in `.groupActions` alongside skip button when user is at a live band group
- `src/hooks/useNowData.ts` — calls `useDuckQuack(userId, duckBandId)` where `duckBandId` is the user's current live non-ceremony band; exposes `duckBandId`, `duckQuack`, `duckCooldownUntil` in `NowData`
- `src/pages/RightNowPage.tsx` — passes `onDuck` and `duckCooldownUntil` to `CrewGroupsSection`
- `src/pages/SchedulePage.tsx` — `DuckableBandCard` wrapper component uses `useDuckQuack` per band (hook always called, null when not live/picked); passes `onDuck` and `duckCooldownUntil` to `BandCard`
- `src/App.tsx` — mounts `<DuckSync />` (flush offline ducks on reconnect), `<PushSetup />` (subscribeToPush after auth), `<DuckNotificationsListener />` (self-contained realtime listener), `<DuckToast />` (global)
- `src/repositories/index.ts` — exports `duckRepository`
- `src/lib/i18n.ts` — imports and registers `DuckButton` namespace for all 4 locales

### Architectural Notes
- **Service Worker strategy change**: switched from `generateSW` to `injectManifest` to enable custom push event handlers. All workbox caching configuration moved into `src/workers/sw.ts`. Functionally identical runtime caching behavior.
- **Cooldown is client-side only**: the 90s cooldown is enforced via `localStorage` on the client. Other users' cooldowns are independent. The DB accepts multiple quacks (no server-side dedup); the client-side guard prevents accidental rapid-fire.
- **Offline quacks flush harmlessly**: if a concert ends before reconnect, the queued duck still inserts to `duck_quacks` and triggers Web Push. This is documented as "stale but harmless" in the phase spec.
- **Push subscription is per-device**: users with multiple devices get multiple notifications. Acceptable for ~20 users.
- **Edge Function requires Supabase Database Webhook**: configure in Dashboard → Database → Webhooks; table `duck_quacks`, event INSERT, URL `https://<project>.supabase.co/functions/v1/send-duck-push`.

---

## 2026-05-15 (Phase 19 — Closing Ceremony Slot)

### Added
- `supabase/migrations/20260514000000_idea7_band_category.sql` — `category text not null default 'band'` column + check constraint `('band','ceremony')` on `public.bands`
- `category: BandCategory` field on `Band` type in `src/types/index.ts`; `BandCategory = 'band' | 'ceremony'` union exported from same file
- `category` field added to `BadgeBand` via `Pick<Band, ...>` in `src/services/badges/types.ts`
- `buildBadgeContext` in `src/services/badges/engine.ts` now filters `category === 'ceremony'` from `pickedBands` and `seenBands`
- `computeBandOverlaps` in `src/hooks/useBandConflicts.ts` skips ceremony entries — no conflict chip ever shown
- `.cardCeremony`, `.ceremonyLabel` CSS classes in `src/components/BandCard.module.css` (gold border `--ceremony-gold #d4af37`, warm tint, pill chip replacing stage chip)
- Ceremony rendering logic in `src/components/BandCard.tsx`: ceremony cards use `--ceremony-gold` for stripe/thumb/pick-active; stage chip replaced by `✦ Closing Ceremony` label
- `popularBands` filter in `src/pages/PopularPage.tsx` excludes `category === 'ceremony'`
- `scheduleClosingCeremony` i18n key in all 4 locale files (`br`, `en`, `de`, `es`) under `SchedulePage_*.json`
- `Farewell & Announcements` ceremony seed entry in `supabase/seed/bands.ts` at Faster stage, slot FAS17 (22:30–23:00 Day 4)
- Phase 19 ceremony badge regression suite in `src/__tests__/badges.test.ts`

### Changed
- `BandSeed.genre` type widened to `string | null`; `BandSeed.category` optional field added
- `band()` test helper in `badges.test.ts` now includes `category: 'band'` default; new `ceremonyBand()` helper added
- `public/vira-lata-ds.html` — ceremony card demos updated to "Farewell & Announcements" / 22:30–23:00 / `FA` monogram; notes corrected to reflect stage chip is hidden (not absent)

### Architectural Notes
- `category` column uses a DB-level check constraint — invalid values are rejected at the Postgres layer, not just TypeScript.
- Ceremony entries sync into IndexedDB exactly like bands (no special-casing in the sync layer); the filtering is purely presentational and in the badge engine.
- `bandsPicked` (raw pick count) still includes ceremony picks — it feeds `band_attendance_min` checks which are pick-based, not music-based. Only the `pickedBands` / `seenBands` arrays (used by all music conditions) are filtered.

---

## 2026-05-15 (LatestAnnouncementBanner DS alignment)

### Changed
- `src/pages/RightNowPage.module.css` — aligned `.latestSignalKicker`, `.latestSignalText`, `.latestAvatar`, `.latestSignalTime`, `.latestSignalReadMore` to DS §08.02 spec:
  - Kicker: `color: var(--signal-ok)` (was `--text-muted`), 9px (was 10px), letter-spacing 0.12em (was 0.1em), added `::before` red pulse dot with `latestPulse` keyframe
  - Body text: `font-family: var(--font-sans)`, 14px normal weight, `line-height: 1.5` (was display bold 1.05rem)
  - Avatar: 24px (was 22px), consistent with `av s24` in DS
  - Time: removed `/` separator `::before`
  - "See more →": `color: var(--accent-hover)` (was `--accent`), 10px (was 9px)

---

## 2026-05-15 (Friend user flag)

### Added
- `supabase/migrations/20260515000000_add_is_friend_flag.sql` — `is_friend boolean DEFAULT NULL` column on `public.users`
- `is_friend?: boolean | null` field on `User` and `CrewUser` types in `src/types/index.ts`
- `isFriend: boolean` on `CrewLivePlan` (derived from `user.is_friend === true`) in `src/services/livePreview.ts`
- `isFriend` derived value exposed from `useNowData` hook
- `handleToggleFriend` handler in `GodlikeAdminPanel.tsx`
- Friend toggle button in godlike user management row (next to promote/demote)
- i18n keys `marcarAmigo` / `removerAmigo` in all 4 `ProfilePage_*.json` locale files

### Changed
- `src/services/livePreview.ts` — `groupCrewLivePlans`: friends skip camping/lost routing when not on a current band; fallback synthetic users initialised with `is_friend: null`
- `src/repositories/users.ts` — crew sync select now includes `is_friend`
- `src/repositories/announcements.ts` — `fetchAllUsers` select now includes `is_friend`
- `src/pages/RightNowPage.tsx` — `PresenceToggle` hidden for friends (`!isFriend` guard)
- `src/components/BadgesDisplay.tsx` — `currentLocation` set to `null` for friends; `crewLocationCounts` excludes friend presence rows
- `src/components/profile/types.ts` — `UserWithLoading` gains `is_friend?: boolean | null`

### Architectural Notes
- `is_friend` is a permanent user identity flag (like `is_test_user`), not a presence state — stored on `users`, not `user_presence`
- Friends appear in the band group when on a current pick; otherwise invisible in crew grid
- Friends cannot earn `metal-place-2026`, `bbq-crew`, or `lost-together` badges and are excluded from the crew counts that gate those badges for others
- Toggle is godlike-only; setting back to non-friend uses `null` (not `false`) to stay consistent with the nullable default

---

## 2026-05-15 (Admin panel headers — DS §05 spec implementation)

### Changed
- `src/components/profile/GodlikeAdminPanel.tsx` — trigger content updated to DS §05 pf-collapse godlike spec: amber crown icon (`path M5 18 L7 4 L12 12 L17 4 L19 18`) + "Godlike admin" label in `font-display`, uppercase, `#d97706`; collapsible receives `className={styles.godlikeCollapsible}` for amber left accent border
- `src/components/profile/ManagerAdminPanel.tsx` — trigger content updated to DS §05 pf-collapse manager spec: blue shield icon (`path M12 2 L20 6 V12 …`) + "Manager tools" label in `font-display`, uppercase, `#3b82f6`; collapsible receives `className={styles.managerCollapsible}` for blue left accent border
- `src/pages/ProfilePage.module.css` — added `.adminTriggerInner`, `.adminTriggerIcon`, `.adminTriggerLabel` base classes; `.managerTriggerIcon`, `.managerTriggerLabel` (blue tints); `.godlikeTriggerIcon`, `.godlikeTriggerLabel` (amber tints); `.managerCollapsible`, `.godlikeCollapsible` (2px role-colored left border on the Collapsible wrapper)

### Architectural Notes
- All functionality and behaviour unchanged — only the trigger JSX content is replaced; `Collapsible` state management, chevron, collapse animation, and role guard (`userRole !== 'manager'` / `userRole !== 'godlike'`) are untouched
- Icons use `stroke="currentColor"` inheriting the `.adminTriggerIcon` color via CSS, matching the DS SVG stroke pattern

---

## 2026-05-15 (Sprint 3 — Design System Systematic Gaps)

### Added
- `src/components/ErrorState.tsx` + `ErrorState.module.css` — reusable error state component; props: `variant: 'network' | 'sync' | 'auth'`, `onRetry?: () => void`, `message?: string`; each variant shows an appropriate SVG icon and Portuguese copy; retry button only rendered when `onRetry` is provided
- `public/vira-lata-ds.html` §10 Empty & Error States — new section documenting 5 canonical empty states (`/now`, `/schedule`, `/my-picks`, `/popular`, `/announcements`) and 3 error state variants (`network`, `sync`, `auth`); visual pattern: centered layout, single muted line of copy, optional 24px stroke icon
- `public/vira-lata-ds.html` Changelog section — revision history for v1.0–v2.0 at the bottom of the document

### Changed
- `src/components/BadgesDisplay.tsx` — badge unlock animation fires once per session per slug; uses `sessionStorage` key `badgeAnimated` to track already-played slugs; applies `.unlocking` CSS class for 380 ms then clears it
- `src/components/BadgesDisplay.module.css` — added `@keyframes badgeUnlock` (scale 0.85 → 1.12 → 1.0) and `.unlocking` class (380 ms, `cubic-bezier(0.34, 1.56, 0.64, 1)`); respects `prefers-reduced-motion`
- `public/vira-lata-ds.html` masthead — added Wacken identity relationship statement after lede; eyebrow version bumped from v1.0 to v2.0; footer updated to v2.0
- `CLAUDE.md` — "After every meaningful change" rule expanded to include `public/vira-lata-ds.html` as a required update target alongside the wiki pages
- Deleted `docs/DESIGN_IMPROVEMENT_PLAN.md` — all 4 sprints complete; no longer needed

### Architectural Notes
- `ErrorState` is intentionally thin — no IndexedDB reads, no Supabase calls; it is a pure display component that wraps a known failure state
- Badge unlock animation uses `sessionStorage` (not `localStorage`) so it fires again on next browser open, giving a fresh moment of discovery each festival day
- DS §10 empty state copy is in Brazilian Portuguese as per product voice rules; component implementors should use these exact strings via i18n keys if/when these states are wired up per-page

---

## 2026-05-14 (Phase 18: Badge Preview Tool in Godlike Menu)

### Added
- `src/components/profile/TestBadgeSection.tsx` — self-contained godlike-only section; renders a scrollable grid of all badges from the registry; local `selectedBadge` state drives a detail modal; zero network calls, zero IndexedDB reads or writes
- `src/components/profile/GodlikeAdminPanel.module.css` — new CSS module with `.testBadgeGrid`, `.testBadgeCell`, `.testBadgeCaption` (grid styles) and `.testBadgeModalContent`, `.testBadgeModalPatch`, `.testBadgeModalImg`, `.testBadgeModalYearChip`, `.testBadgeModalName`, `.testBadgeModalDesc` (modal styles mirroring `BadgesDisplay.module.css` pattern)

### Changed
- `src/components/profile/GodlikeAdminPanel.tsx` — imports and mounts `<TestBadgeSection t={t} />` after `<TimeTravelSection />`, before the registered users list

### Architectural Notes
- `TestBadgeSection` uses `useI18n('Badges')` internally to resolve badge label/description keys — the `t` prop from the godlike panel is accepted for the component signature but not used for badge-specific text
- Data flow is entirely static: `BADGES` array (build-time) → grid → `selectedBadge` state → modal; no context evaluation, no persistence
- `BadgesDisplay.tsx` is untouched; `BADGES` registry is untouched; `user_metadata.achieved_badge_slugs` is never read or written

---

## 2026-05-14 (Patches Grid Background Preference)

### Added
- `src/lib/patchesBackground.ts` — shared module with `PatchesBackground` type, `PATCHES_BG_VALUES`, storage key, `PATCHES_BG_CHANGED_EVENT`, `loadPatchesBackground()`, `savePatchesBackground()`
- `src/components/profile/PatchesBackgroundPicker.tsx` + `.module.css` — 5-swatch fabric selector (`none`, `grid`, `steel`, `indigo`, `leather`), each swatch is a miniature of the real texture it represents; swatches sized 42×42px
- Picker mounted inside the **Edit Profile** collapsible (right under the Language control) — it's a per-device personalization, grouped with other cosmetic preferences
- i18n keys `patchesBackground` ("Pick your battle vest color" + translations), `bgNone`, `bgGrid`, `bgSteel`, `bgIndigo`, `bgLeather` in all 4 locale files (`br`, `en`, `es`, `de`)
- `data-bg` attribute on `.patchesGrid` in `BadgesDisplay` driven by the preference
- CSS variants `.patchesGrid[data-bg='none' | 'grid' | 'steel' | 'indigo' | 'leather']` in `BadgesDisplay.module.css`
- Leather texture uses three offset radial-gradient dot grids at differing sizes (8px / 11px / 13px) to simulate pebbled grain — non-repeating organic look on a `#2b1813` cordovan base

### Changed
- `.patchesGrid` no longer has a hard-coded background; the texture is fully delegated to the `data-bg` attribute selectors
- `BadgesDisplay` now reads `loadPatchesBackground()` on mount and listens to `PATCHES_BG_CHANGED_EVENT` for live updates
- **`country` label rephrased** to "Where do you live?" (and translations) — users were confusing this with country of origin; the field stores their current residence (`user_metadata.country`)

### Architectural Notes
- **Storage is localStorage, not Supabase or IndexedDB.** The preference is purely cosmetic, per-device by design, and must work offline at Wacken with zero round-trip. It does not belong in `user_metadata` or the `users` table.
- The picker dispatches a `CustomEvent` with the new value in `detail`; this matches the existing window-event pattern used for IDB changes (e.g. `PICKS_CHANGED_EVENT`), keeping component coupling minimal.
- Default is `steel` (dark indigo denim) — visually consistent with the rest of the dark theme.

---

## 2026-05-14 (Phase 17: My Picks — Saw / Didn't See Sections)

### Added
- `hidePick?: boolean` prop on `BandCard` — suppresses the star button when `true`; controlled by `variant !== 'ranked' && !hidePick`
- `hidePick?: boolean` prop on `BandDetailModal` — hides the pick/unpick action button in the `.actions` footer when `true`
- `upcomingBands` / `endedBands` split in `MyPicksPage` (filter on `end_time < currentNow`)
- `missedBandIds` (per current user) derived from `allMissed` to further split `endedBands` into `sawBands` and `didntSeeBands`
- Two collapsible sections at the bottom of `/my-picks`: "Saw" (green border, `--signal-ok`) and "Didn't See" (amber border, `--signal-warn`)
- `.dayHeaderSaw` and `.dayHeaderDidntSee` CSS modifier classes in `SchedulePage.module.css`
- `sectionSaw` and `sectionDidntSee` i18n keys (with `{count}` interpolation) in all 4 locale files (`br`, `en`, `de`, `es`)

### Changed
- `grouped` in `MyPicksPage` now derives from `upcomingBands` instead of `myBands`; ended bands no longer appear in day sections
- `BandDetailModal` in `MyPicksPage` receives `hidePick={isBandEnded}` so the pick/unpick button disappears for ended bands

### Architectural Notes
- All state is offline-first: `endedBands` / `sawBands` / `didntSeeBands` are derived entirely from IndexedDB (`allMissed` via `missedRepository`, bands from `loadBands()`). No new network calls.
- Saw/missed toggle in the detail modal still moves a card between the two ended sections in real time via the `MISSED_CHANGED_EVENT` window event and `refreshMissed()`.

---

## 2026-05-14 (Phase 16: Schedule Sort Order Filter)

### Added
- `sortOrder: 'time-asc' | 'time-desc' | 'alpha'` field to `BandFilterValue` and `EMPTY_FILTERS`
- Sort step at end of `filterBands()` — operates on post-filter result set; `time-asc`/`time-desc` use secondary `name` sort for stable ordering
- `VALID_SORT_ORDERS` guard in `scheduleFilterStorage.ts`; fallback to `'time-asc'` on missing/invalid value
- 3 new `IconName` values and SVG paths: `sort-time-asc`, `sort-time-desc`, `sort-alpha`
- Sort button + upward-anchored popover in `BandFilters.tsx`; outside-click closes via `mousedown` listener on document
- `.dayTabsRow` flex wrapper in `BandFilters.module.css` so day tabs and sort button share a row
- 4 aria-label i18n keys in all 4 locale files (`sortLabel`, `sortTimeAsc`, `sortTimeDesc`, `sortAlpha`)

### Changed
- `BandFilters.tsx` — `clearAll()` preserves `sortOrder` (it is a display preference, not a filter)
- `SchedulePage.tsx` — removed hardcoded `.sort()` from `loadBands()` callback; ordering is now fully delegated to `filterBands()`

### Architectural Notes
- Sort is 100% client-side and fully offline: operates on the in-memory band list, preference persisted to `localStorage`. No network dependency.
- `sortOrder` is excluded from the "clear filters" reset path intentionally per spec.

---

## 2026-05-14 (Tweak: lost-together threshold)

### Changed
- **`src/services/badges/registry.ts`** — `lost-together` condition bumped from `count: 5` to `count: 10` (`crew_at_location_min`, location `'lost'`). All other fields (slug, imagePath, year, persist) unchanged.
- **`src/i18n/Badges_br.json`, `Badges_en.json`, `Badges_es.json`, `Badges_de.json`** — `badgeLostTogetherDescription` updated from "15+" to "10+" in all four languages, fixing a pre-existing inconsistency where the descriptions claimed 15+ while the registry required 5.
- **`docs/ai-wiki/badges.md`** — Updated the three `lost-together` mentions (Location Presence inventory bullet, Festival 2026 inventory bullet, Persistent Badges example) from `5` / `5+` to `10` / `10+`. Bumped Last updated.

### Architectural Notes
- Non-breaking tightening. Because `lost-together` is `persist: true`, its slug is stored permanently in `user_metadata.crew_earned_badge_slugs` once earned — existing users who have already triggered the badge keep it regardless of the new threshold. Only future earnings require 10+ crew at the `lost` location simultaneously.

---

## 2026-05-13 (Badges: 6 image-driven festival 2026 additions)

### Added
- **6 new badges** wired up to images that already existed in `public/badges/` but were unreferenced by `BADGES[]`. Inventory grew 29 → 35.
  - `wacken-firefighters` — `band_seen_named: 'Wacken Firefighters'`, year 2026. Tribute to the volunteer parade band that opens Day 1 12:00 (WAK1) and closes Day 4 12:00 (WAK22) on the Wackinger stage. Label kept identical in BR/EN/ES/DE.
  - `gutalax` — `band_seen_named: 'Gutalax'`, year 2026. Goregrind, Wasteland Day 3 21:30 (WAS20). Inside-joke "Osmar" reference preserved across all 4 languages.
  - `heavysaurus` — display label "Mighty Roar" (translated per locale: "Rugido Poderoso" BR/ES, "Mächtiges Brüllen" DE). `band_seen_named: 'Heavysaurus'`, year 2026. Wasteland Day 4 21:30 (WAS28).
  - `wackinger-regular` — display label "Wackinger Viking" (kept identical in all 4 languages). `bands_seen_stage_min: { stage: 'Wackinger', count: 3 }`, year 2026. Description references Amon Amarth thematically.
  - `wasteland-warrior` — kept identical in all 4 languages. `bands_seen_stage_min: { stage: 'Wasteland', count: 1 }`, year 2026. Low threshold ("you went there at all"). Description preserves "Mad Max" as a globally recognized character name.
  - `bullhead-heat` — "Heat" translated per locale, "Bullhead" preserved (it's the proper name of the flaming bullhead landmark between Faster ↔ Harder). `bands_seen_stages_min: { stages: ['Faster', 'Harder'], count: 6 }`, year 2026. "More than 5" interpreted strictly as > 5 → count: 6.
- **6 unit-test groups** in `src/__tests__/badges.test.ts` under `registry — 2026 image-driven badges`. Each group looks up the badge in `BADGES[]` by slug (so the test will fail if the registry entry is removed) and exercises the earn / not-earn paths against a hand-built `BadgeContext`. Total badge tests grew from 54 → 65 (+11).

### Changed
- **`src/services/badges/registry.ts`** — Appended 6 new `BadgeConfig` entries after the location-presence section, grouped by intent: 3 band-named (firefighters, gutalax, heavysaurus), 2 stage-loyalty (wackinger-regular, wasteland-warrior), 1 multi-stage (bullhead-heat).
- **`src/i18n/Badges_br.json`, `Badges_en.json`, `Badges_es.json`, `Badges_de.json`** — 6 label keys × 4 languages = 24 new label strings + 24 new description strings. Naming follows the existing `badge{PascalCase(slug)}` / `badge{PascalCase(slug)}Description` convention; label values for slugs `heavysaurus` and `wackinger-regular` intentionally diverge from the slug PascalCase (display says "Mighty Roar" / "Wackinger Viking" while the keys remain `badgeHeavysaurus` / `badgeWackingerRegular` for backward compatibility with the convention).
- **`docs/ai-wiki/badges.md`** — Inventory total 29 → 35. "Festival 2026" subsection 8 → 14 entries. Bumped Last updated.
- **`src/__tests__/badges.test.ts`** — Imported `BADGES` from the barrel re-export and added the 6 test groups.

### Architectural Notes
- Pure additive change. No migrations, no schema changes, no DB writes, no asset additions — all 6 PNGs already shipped. Verified by listing `public/badges/` against `imagePath` values in `BADGES[]`.
- All 6 badges use existing condition types (`band_seen_named`, `bands_seen_stage_min`, `bands_seen_stages_min`); no engine changes required. Idea 6's plural-form `bands_seen_stages_min` (added earlier the same day) is exercised in production for the first time by `bullhead-heat`.
- Inside jokes / proper names preserved per-locale where culturally meaningful: "Osmar" (Gutalax), "Amon Amarth" (Wackinger Viking), "Mad Max" (Wasteland Warrior), "Bullhead" (Bullhead Heat). The user's intent that `Bullhead` is a **proper noun** (name of the flaming sculpture) — not a translatable common noun — is honored: only "Heat" is localized.

---

## 2026-05-13 (Idea 6: multi-stage / multi-genre badge conditions)

### Added
- **4 new plural-form `BadgeCondition` variants** in `src/services/badges/types.ts`:
  - `bands_picked_stages_min` — `{ stages: string[]; count: number }`
  - `bands_picked_genres_min` — `{ genres: string[]; count: number }`
  - `bands_seen_stages_min` — `{ stages: string[]; count: number }`
  - `bands_seen_genres_min` — `{ genres: string[]; count: number }`
  All four use set-membership (OR-combined within the array). A pick/seen-band counts toward the threshold if its `stage` (or `genre`) is included in the configured array; total matches must reach `count`. Single-element arrays behave identically to the existing singular conditions; empty arrays are never earned for `count > 0`; bands with `genre = null` are skipped in the `*_genres_min` variants.
- **4 new `evaluateBadge` case branches** in `src/services/badges/engine.ts` — each is a one-line `Set` membership filter for O(1) lookup. No changes to `BadgeContext`, `buildBadgeContext`, or any repository: the data the new branches need (`ctx.pickedBands`, `ctx.seenBands`) is already in scope.
- **18 new test cases** across 4 test groups in `src/__tests__/badges.test.ts` (`evaluateBadge — bands_{picked,seen}_{stages,genres}_min (Idea 6)`). Total badge tests grew from 36 → 54, all passing.
- **CONDITION EXAMPLES** block in `src/services/badges/registry.ts` extended with prose-style entries for all 4 new types (Infield Rat / Extreme Devotee / etc. examples) matching the existing comment style.

### Changed
- **`docs/ai-wiki/badges.md`** — Bumped condition-type count 22 → 26. Added full documentation sections for the 4 new types under "BAND PICKS" and "BANDS SEEN" (with semantics, single-element equivalence, empty-array behavior, null-genre handling). Added 4 new rows to the cheat-sheet table. Bumped Last updated.

### Architectural Notes
- This is an additive change — every existing badge in `BADGES[]` (e.g. `death-metal`, `power-metal`, `party-metal`, all stage-min badges) keeps working unchanged. No registry migration, no DB migration, no asset changes.
- TS exhaustiveness on the `BadgeCondition` discriminated union is preserved: `tsc --noEmit` passes after the edit. The `switch` in `evaluateBadge` covers every union variant.
- Semantic decision recorded in `FUTURE_IDEAS.md`: **OR-within-the-array, not AND-across-stages**. "Saw 5 bands across Faster ∪ Harder" means any combination summing to 5; we do **not** also require ≥1 from each stage. A future `*_across_all_stages_min` variant would be a separate condition if ever needed.
- The plural-form pattern (Option A from the design table) is preferred over widening existing fields (`stage: string | string[]`) because it preserves discriminated-union narrowing in the engine and keeps the call site readable (singular = 1, plural = many). The pattern extends naturally to future multi-day or multi-country set-membership badges.
- **Idea 6** is now marked `implemented` in `FUTURE_IDEAS.md` and can be removed from that file in a follow-up cleanup pass.

---

## 2026-05-13 (Badge: roots — Sepultura farewell witness)

### Added
- **`roots` badge** — "Roots, Bloody Roots". Awarded via `band_seen_named: 'Sepultura'`, year 2026. Sepultura plays HAR6 on Day 3 (Friday, July 31, 19:00–20:30) and is on their farewell tour, so this badge commemorates witnessing the goodbye of a legendary Brazilian metal act. Image already present at `public/badges/badge_roots.png`. Internal "Dani" reference in the description is an inside joke for the vira-latas.

### Changed
- **`src/services/badges/registry.ts`** — Appended the `roots` BadgeConfig after `alestorm` (both are `band_seen_named` festival-2026 badges, grouped together).
- **`src/i18n/Badges_br.json`, `Badges_en.json`, `Badges_es.json`, `Badges_de.json`** — Added `badgeRoots` (label, kept as "Roots, Bloody Roots" in all 4 languages per request — it's a song title) and `badgeRootsDescription` (translated description "You saw the farewell of an amazing band, right Dani?" into BR/EN/ES/DE).
- **`docs/ai-wiki/badges.md`** — Bumped inventory count 28 → 29; expanded "Festival 2026" section 7 → 8 entries with the `roots` line referencing the Sepultura HAR6 slot.

### Architectural Notes
- The `roots` condition uses `band_seen_named` (exact case-sensitive match on `Band.name`), the same pattern as `alestorm`. The badge is automatically earned once Sepultura's `end_time` passes and the user has not opted out via the "didn't see" toggle.
- Distinct from any future `groove-metal` genre badge (Sepultura's genre is `Groove Metal` in `supabase/seed/bands.ts`): this badge is band-specific, tied to the farewell-tour narrative rather than the genre.

---

## 2026-05-13 (Docs: badge paths + Party Metal context)

### Changed
- **badges.md** — Refreshed the `party-metal` inventory line to reflect that the genre now belongs to exactly 2 bands (Alestorm + Airbourne), so the badge is a "see both" objective for Day 4. Added a new "Genres present in lineup with NO corresponding badge" section explicitly noting that `Pirate Metal` has no badge (only `Mr. Hurley und die Pulveraffen` carries it). Fixed stale `src/services/badges.ts` path to `src/services/badges/registry.ts`. Bumped Last updated.
- **CLAUDE.md** — Fixed badge section to point at `src/services/badges/registry.ts` (was `src/services/badges.ts`/`src/lib/badges.ts` — both old paths). Expanded i18n note from "br + en" to "br, en, es, de" matching the actual file layout.

### Architectural Notes
- The `party-metal` badge being calibrated to exactly the existing Party-Metal band count is intentional going forward — adding a 3rd Party Metal band to the lineup would make the badge easier to earn without code changes; check this when curating future lineups.

### Changed
- **lineup.md** — Two slot swaps and two genre updates:
  - **Day 3:** Emperor (Black Metal) ↔ Sepultura (Groove Metal). Sepultura now headlines HAR6 (Harder 19:00–20:30); Emperor moves to LOU19 (Louder 22:45–00:00*).
  - **Day 4:** Triptykon (Black / Doom Metal) ↔ Alestorm. Alestorm now plays FAS16 (Faster 19:15–20:45); Triptykon moves to LOU26 (Louder 20:45–22:00).
  - **Alestorm:** genre changed from `Pirate Metal` to `Party Metal`.
  - **Airbourne:** genre changed from `Hard Rock` to `Party Metal`.
- **supabase/seed/bands.ts** — Mirrored all four changes from lineup.md. 173-row total unchanged. Verified no UNIQUE(stage, start_time, name) collisions.

### Architectural Notes
- Band image URLs follow the band when they swap slots, not the slot.
- Badge impact (verified against `src/services/badges/registry.ts`):
  - `party-metal` badge (`bands_seen_genre_min: 'Party Metal', count: 2`) is now perfectly calibrated: exactly 2 bands carry this genre — `Alestorm` (FAS16 Day 4, 19:15–20:45) and `Airbourne` (HAR11 Day 4, 21:00–22:30). The badge effectively requires seeing both. Slots don't overlap, so it's reachable in one Day-4 evening.
  - There is **no** `pirate-metal` badge. The only Pirate Metal band remaining (`Mr. Hurley und die Pulveraffen`, WAK17 Day 3) is not referenced by any badge. The `alestorm` badge uses `band_seen_named` against the band name `Alestorm`, not the genre — unaffected by the genre change.

---

## 2026-05-13 (Seed: bands.ts destructive guarantees hardened)

### Changed
- **supabase/seed/bands.ts** — Rewrote the `seed()` runner to make the destructive replace-all behavior provably correct:
  - Prints existing row count, target Supabase URL, and the full cascade impact (`user_picks`, `user_missed_bands`, `live_band_test_config.band_id`) before doing anything.
  - 5-second abort window (Ctrl-C) before the first DELETE; skip with `--force` for CI/scripts.
  - DELETE filter changed from `.not('id', 'is', null)` to `.gte('start_time', '1900-01-01T00:00:00Z')` — semantically equivalent (matches every row, since `start_time` is `NOT NULL`) but explicit about intent and never confuses the postgrest planner.
  - Post-DELETE verification: aborts if the table is not empty.
  - Post-INSERT verification: aborts if row count doesn't equal `bands.length` (173).
  - File header docs the full destructive contract: which tables cascade, which set null, which records get lost, when not to run it.

### Architectural Notes
- All FKs that reference `bands.id` are accounted for: `user_picks` (CASCADE), `user_missed_bands` (CASCADE), `live_band_test_config.band_id` (SET NULL). No other tables reference `bands.id`, so DELETE cannot be blocked by FK violations.
- The `bands` UNIQUE constraint is `(stage, start_time, name)` — verified that all 173 seed rows have distinct tuples on those three columns, so re-seeding never collides with itself.

---

## 2026-05-13 (Seed: bands.ts rebuilt from lineup.md)

### Changed
- **supabase/seed/bands.ts** — Full rewrite to mirror `docs/ai-wiki/lineup.md` exactly. 173 bands seeded (192 listed in lineup.md minus 19 slots whose band name is literally `TBD`). Slot start/end times pulled directly from `docs/ai-wiki/stages.md` Slot IDs. Bands with `Band Status: TBD` keep their name but use a `PLACEHOLDER` image URL (8 rows). Bands with `Genre: TBD` use a `Generic Metal` fallback genre (42 rows = 38 unique bands, plus recurring acts like `Sir Henry Hot Memorial` ×4 and `Wacken Firefighters` ×2). Each band row is annotated with its Slot ID for cross-reference.

### Architectural Notes
- The fallback genre constant `TBD_GENRE = 'Generic Metal'` lives at the top of `bands.ts` — if the policy for unresolved genres changes, edit that single constant.
- Dropped Slot IDs (band name = TBD, 19 total): Day 1 — `HBA7`, `WAS1`, `WAS2`, `WAS3`, `WAK2`; Day 2 — `WET13`, `WET14`, `WET15`, `WET16`, `HBA13`, `HBA14`, `HBA15`, `WAS8`, `WAS9`, `WAK8`, `WAK9`; Day 4 — `HBA29`, `WAK23`, `WAS23`.
- Name corrections from previous bands.ts to match lineup.md exactly: `Alien Rockin' Explosion` → `Alien Rockin Explosion`, `Broken by the Scream` → `Broken By The Scream`, `Tuxedoo` → `tuXedoo`, `Of Mice & Men` → `Of Mice and Men`, `Sventevith` → `Misþyrming & Nergal`, `Dieter Maschine Birr` → `Dieter "Maschine" Birr`, `Cowgirls From Hell DJ Team` → `Cowgirls From Hell`.
- `WAS26 President` flipped to `Band Status: TBD` in lineup.md → now uses PLACEHOLDER image while keeping `Metal` genre.

---

## 2026-05-13 (Lineup: Day 4 Saturday reorganization — corrected algorithm)

### Changed
- **lineup.md** — Rewrote Day 4 (Saturday, 1 August 2026) band assignments using the corrected importance-rank algorithm from the official Wacken 2026 Saturday poster. Group A (Faster, Harder, Louder = 18 slots) is exhausted completely with bands #1–#18 before any Group B assignment begins. Group B (W.E.T., Headbangers, Wackinger, Wasteland, Jungle = 30 slots) receives bands #19–#45. 45 bands mapped to 48 slots; 3 slots remain TBD (HBA29, WAK22, WAS23). Slot IDs corrected to match stages.md (previous Day 4 used wrong IDs such as HAR16–HAR21, FAS21–FAS34, etc.). Summary updated to 75 CONFIRMED · 94 TBD · 169 total.

### Architectural Notes
- Day 4 Group A headliners: Sabaton → FAS18, Powerwolf → HAR12, Arch Enemy → LOU27. Group A completely absorbs the top 18 importance-ranked bands, meaning all three Louder stage closers (Arch Enemy, Alestorm, Nevermore) are in Group A, not Group B.
- Group B last-slot headliners: Dritte Wahl → WET35, Einherjer → HBA35, Finsterforst → WAK28, Fit For An Autopsy → WAS29, Focus. → JUN8.
- Wacken Firefighters and Sir Henry Hot Memorial appear on both Day 1/2/3 and Day 4 — these are recurring daily acts; they are intentionally kept in all days they appear.

---

## 2026-05-13 (Lineup: Day 3 Friday reorganization — corrected algorithm)

### Changed
- **lineup.md** — Rewrote Day 3 (Friday, 31 July 2026) band assignments using the corrected importance-rank algorithm from the official Wacken 2026 Friday poster. Group A (Faster, Harder, Louder — 17 slots) filled completely first, then Group B (W.E.T., Headbangers, Wackinger, Wasteland, Welcome to the Jungle — 30 slots). All 47 bands placed across 47 Day 3 slots with correct `stages.md` slot IDs (FAS8–FAS12, HAR4–HAR7, LOU13–LOU20, WET23–WET29, HBA22–HBA28, WAK15–WAK21, WAS15–WAS22, JUN5).

### Architectural Notes
- Group A headliner chain: Judas Priest→FAS12, In Flames→HAR7, Running Wild→LOU20; Saxon→FAS11, Emperor→HAR6, Sepultura→LOU19.
- Group B headliner chain: Chaosbay→WET29, Crematory→HBA28, Cruachan→WAK21, Cursed Abyss→WAS22, Deafheaven→JUN5 (only slot).

---

## 2026-05-13 (Wiki: Stages/Lineup Split)

### Added
- **stages.md** (new) — Authoritative reference for the 8 Wacken 2026 stages: stage table (name, abbreviation, category, UI color, hex), stage pairing rule (Harder↔Faster, W.E.T.↔Headbangers physical adjacency), reference keys (stage abbreviations, day codes D1–D4, overnight codes D1n–D4n, slot confirmation status), slot ID scheme (range per stage), all stage schedule grids (start/end times per slot per day for all 8 stages), how stages link to bands (Band type mapping, bands.ts field table), maintenance guides for confirming slot times and adding new slots.

### Changed
- **lineup.md** — Removed stage schedules, reference keys, stage pairing rule, and slot ID scheme (all moved to stages.md). Now focused exclusively on band assignments. Added cross-references to stages.md via Slot IDs throughout. Maintenance guide updated to link out to stages.md for slot and schedule operations.
- **glossary.md** — Added 7 new terms: `Band Assignment`, `Stage`, `Stage Category`, `Stage Pairing`, `Stage Schedule`, `Slot ID`. Updated existing `Band` entry to clarify stage is a string attribute (not a foreign key). Updated `Stage Color` entry with CSS variable detail and reference to stages.md.
- **index.md** — Added "Festival Content" section to Quick Navigation with links to both stages.md and lineup.md. Updated Domain Overview to clarify stage is not a DB entity. Added Stage Colors and Band Seed rows to Key Files table. Updated last edited date.

### Architectural Notes
- Stage is **not a DB entity**: `Band.stage` is a plain string. All stage metadata (colors, schedules, pairing) lives in source constants and wiki docs, not in the database.
- The Slot ID scheme (e.g. `FAS1`, `HAR7`) is the link between `stages.md` (times) and `lineup.md` (bands). When updating either file, keep Slot IDs consistent across both.
- `stageColors.ts` returns CSS variable tokens (`var(--stage-faster)`), not raw hex values; hex lives in `index.css`.

---

## 2026-05-12 (Planning: remaining test stages moved to FUTURE_IDEAS)

### Changed
- `FUTURE_IDEAS.md` — added Ideas 3, 4, 5: unit tests for IDB layer (`lib/db.ts`), hook logic (pure memoized computations), and component/page integration; migrated from `UNIT_TEST_PLAN.md` Stages 4–6 plus the Vitest config threshold block and `fake-indexeddb` requirement.
- `UNIT_TEST_PLAN.md` deleted — completed stages (1–3) are recorded in this changelog; remaining stages (4–6) are now tracked in `FUTURE_IDEAS.md` as Ideas 3–5.

### Architectural Notes
- No code or schema changes in this entry; purely planning/housekeeping.

---

## 2026-05-12 (UNIT_TEST_PLAN Stage 3)

### Added
- `src/__tests__/picksRepository.test.ts` — 26 tests for `toggle()` (online/offline/error), `flushOfflineQueue()` (empty queue, dedup, upsert/delete routing), and `syncCrewFromRemote()`
- `src/__tests__/presenceRepository.test.ts` — 11 tests for `setCampingStatus()` (online/offline), `isTimeWithinMetalPlaceWindow()` (time-range boundary), and `validateAndAutoCheckout()`
- `src/__tests__/announcementsRepository.test.ts` — 7 tests for online post, offline queue, and `flushPendingAnnouncements()`
- `src/__tests__/bandsRepository.test.ts` — 3 tests for `checkAndApplyCacheVersion()` (match/mismatch/no-data)
- `src/__tests__/missedRepository.test.ts` — 4 tests for mark/unmark online and offline

### Architectural Notes
- UNIT_TEST_PLAN Stage 3 complete: 51 new tests, 355 total, 0 failures.
- Mock pattern: `vi.hoisted()` required when vi.mock factory references named mock instances (Vitest hoisting constraint).
- Supabase fluent chains (`.delete().eq().eq()`, `.insert().select().single()`) required explicit nested vi.fn() chains.
- `navigator.onLine` overridden via `Object.defineProperty` with `configurable: true` for per-test reset.

---

## 2026-05-12 (UNIT_TEST_PLAN Stage 2)

### Added
- `src/__tests__/bandTime.test.ts` — 14 tests for `bandDay()` and `formatTime()` from `services/bandTime.ts`; covers CEST rollback boundary (04:00 CEST / 02:00 UTC), midnight crossover, and padding edge cases
- `src/__tests__/bandFilter.test.ts` — 14 tests for `filterBands()` from `services/bandFilter.ts`; covers day/stage/genre/query/upcoming filters, boundary conditions, and combined interactions
- `src/__tests__/scheduleFilterStorage.test.ts` — 12 tests for `loadStoredFilters`/`saveStoredFilters`; covers missing key, corrupted JSON, round-trip, and `query` strip-on-save behavior
- `src/__tests__/deduplicatePickQueue.test.ts` — 8 tests for `deduplicatePickQueue()` from `repositories/picks.ts`; covers keepLast semantics, cross-band/user independence, and empty input
- `src/__tests__/attendees.test.ts` — 8 tests for `computeAttendees()` from `services/attendees.ts`; covers grouping, hydration, missing-crew fallback label, and alphabetical sort
- `src/__tests__/stageColors.test.ts` — 30 tests for `services/stageColors.ts`; covers all 8 stage CSS variable tokens and unknown-stage fallback
- `src/__tests__/i18n.test.ts` — 13 tests for `lib/i18n.ts`; covers br/en/es/de lookup, missing-key fallback, placeholder interpolation, and out-of-provider error

### Architectural Notes
- UNIT_TEST_PLAN Stage 2 complete: 99 new tests, 304 total, 0 failures.
- Key discovery: `stageColors.ts` returns CSS variable strings (`var(--stage-faster)`), not raw hex values — hex lives in `index.css`.
- Key discovery: `t()` function lives inside the `useI18n` hook and requires React context; i18n tests use `renderHook` with a bare `I18nContext.Provider` wrapper.
- Key discovery: `scheduleFilterStorage` never persists `query` to localStorage — stripped on save, reset to `''` on load.

---

## 2026-05-12 (UNIT_TEST_PLAN Stage 1)

### Changed
- Extracted `filterBands(bands, filters, now)` from `SchedulePage.tsx` into `src/services/bandFilter.ts` (pure function, exported)
- Extracted `loadStoredFilters()` / `saveStoredFilters()` from `SchedulePage.tsx` into `src/services/scheduleFilterStorage.ts`
- Extracted `computeAttendees(picks, crewUsers)` from `useBandAttendees.ts` into `src/services/attendees.ts`; exported `BandAttendee` and `AttendeeMap` types
- Exported `deduplicatePickQueue(ops)` as a named pure function from `src/repositories/picks.ts`; `flushOfflineQueue` calls it internally
- Exported `countPicks` as a named pure function from `src/hooks/usePickCounts.ts`
- Rewrote `schedule.test.ts` to import `bandDay`/`formatTime` from real source files instead of duplicating helpers

### Architectural Notes
- UNIT_TEST_PLAN Stage 1 complete: all five low-risk pure function extractions done. No behavior changes. 205 tests pass.
- New testable surface: `bandFilter.ts`, `scheduleFilterStorage.ts`, `attendees.ts`, `deduplicatePickQueue`, `countPicks` are all now importable by unit tests without mounting hooks or pages.

---

## 2026-05-12 (Badge System Refactor)

### Changed
- `src/services/badges.ts` (deleted) — Monolithic 576-line file split into a `src/services/badges/` folder
- `src/services/badges/types.ts` (new) — All 4 type definitions: `BadgeBand`, `BadgeCondition`, `BadgeConfig`, `BadgeContext`
- `src/services/badges/engine.ts` (new) — Pure evaluation logic: `festivalLocalHour` helper, `buildBadgeContext`, `evaluateBadge`, `getEarnedBadges`
- `src/services/badges/registry.ts` (new) — `BADGES[]` array with all 26 badge definitions and the condition-examples developer reference comment block
- `src/services/badges/index.ts` (new) — Barrel re-export preserving all existing `from '…/services/badges'` import paths unchanged
- `docs/ai-wiki/badges.md` — Updated Key Files table to reflect new folder structure

### Architectural Notes
- All four consumers (`badges.test.ts`, `missed.test.ts`, `BadgesDisplay.tsx`, `AssignBadgeModal.tsx`) required zero import changes — the barrel index maintains backward compatibility
- Dependency order is strictly: `types.ts` ← `engine.ts` + `registry.ts` ← `index.ts` (no circular deps)

---

## 2026-05-12 (Password Recovery Flow)

### Added
- `src/pages/ResetPasswordPage.tsx` — New public page at `/reset-password`; listens for Supabase `PASSWORD_RECOVERY` auth event; two password fields (new + confirm) with mismatch validation; calls `supabase.auth.updateUser({ password })` on submit; navigates to `/now` on success; falls back to `getSession()` on page refresh
- i18n keys for forgot-password and reset-password in all 4 languages (`AuthPage_br.json`, `AuthPage_en.json`, `AuthPage_es.json`, `AuthPage_de.json`): `forgotPassword`, `forgotPasswordConfirm`, `sendResetLink`, `sendingResetLink`, `resetLinkSent`, `cancelAction`, `resetPasswordTitle`, `resetPasswordSubtitle`, `newPassword`, `confirmPassword`, `passwordsDoNotMatch`, `resetPasswordAction`, `resetPasswordLoading`, `resetPasswordSuccess`, `resetPasswordNoSession`

### Changed
- `src/pages/LoginPage.tsx` — Added "Forgot password?" link below login form; clicking it reveals an inline 3-step panel: `idle` → `confirm` (email input + Are you sure?) → `sent` (green confirmation); calls `supabase.auth.resetPasswordForEmail()` with `redirectTo: ${origin}/reset-password`
- `src/pages/AuthPage.module.css` — Added `.linkButton`, `.forgotBox`, `.forgotQuestion`, `.forgotActions`, `.buttonSecondary`, `.forgotSent` classes for the forgot-password panel and success state
- `src/App.tsx` — Added public `/reset-password` route (no `PrivateRoute` wrapper)
- `docs/ai-wiki/flows/authentication.md` — Added "Flow: Password Recovery" section (full timeline, Supabase token mechanics, Cassio in-joke note, localization key list); updated Triggers (3 entries), Relevant Source Files (added `ResetPasswordPage.tsx`, i18n files), `onAuthStateChange` events (added `PASSWORD_RECOVERY`), Route Guards (documented public routes), Known Limitations (removed stale "no password reset UI" item, added recovery-link single-use caveat)

### Architectural Notes
- `/reset-password` must be a **public route** — the user arrives unauthenticated from the email link; `PrivateRoute` would redirect them to `/login` before the recovery session is established
- The `PASSWORD_RECOVERY` `onAuthStateChange` event fires only once per tab (when the URL hash token is first exchanged); the `getSession()` fallback handles page refreshes
- "Cassio" is intentionally hard-coded in all 4 language files as a permanent in-joke and must never be replaced with a generic placeholder
- No schema changes required — Supabase manages the recovery token entirely server-side

---

## 2026-05-12 (Phases 13–15: Wiki Documentation Roadmap)

### Added (User Flows — Phase 13)
- **flows/offline-pick-sync.md** (13.C) — Complete queue mechanics: 13-store IDB structure, `OfflinePickOp` shape, online happy path, offline behavior with PendingChip, keepLast dedup algorithm, worked example (5 toggles T=0:10–T=0:30 → 1 Supabase call), sync trigger (login + 'online' event), error recovery table, realtime catch-up after reconnect, 5 edge cases (mid-write offline, concurrent sessions, deleted band, partial flush, large queue), known limitations (no enqueue-time dedup, no backoff, no TTL, `navigator.onLine` unreliability)
- **flows/authentication.md** (13.D) — Login/signup flows, custom IndexedDB auth storage adapter (`getItem`/`setItem`/`removeItem` via `loadSession`/`saveSession`), `handle_new_user()` trigger details and `coalesce()` fix, `useAuth()` lifecycle, session persistence scenarios (PWA open offline, token expiry, concurrent sessions), route guards (`PrivateRoute`), registration gate, test user creation, RLS policy table, offline scenarios, known limitations (no email verification, no password reset, hard-coded godlike email)

### Added (ADRs — Phase 14)
- **decisions/supabase-as-sync-target.md** (14.A) — Decision to use Supabase for auth + DB + realtime + edge functions; alternatives rejected (Firebase NoSQL mismatch, custom Node infra cost, PocketBase no hosted tier, CouchDB no auth); tradeoffs accepted (vendor lock-in, trigger complexity, RLS debugging)
- **decisions/custom-hooks-events-no-redux.md** (14.B) — Decision to use custom hooks + window events instead of Redux/Zustand/Context; rationale (IDB as source of truth requires out-of-React mutation notification); hook lifecycle pattern; when NOT to use (multi-step forms, complex derived state); tradeoffs (no time-travel debugging, no cross-tab sync)
- **decisions/workbox-caching-strategy.md** (14.C) — NetworkFirst for Supabase (24h cache, freshness priority), CacheFirst for Wacken band images (30-day TTL, opaque CORS caching with `statuses: [0, 200]`), precaching for app shell (versioned filenames, `autoUpdate`, `skipWaiting`+`clientsClaim`); alternatives considered; cache invalidation mechanics

### Changed (Glossary — Phase 15.A)
- **glossary.md** expanded from ~100 to 140+ terms: added 40+ new terms covering offline pick lifecycle, keepLast semantics, opaque responses, precache, NetworkFirst, CacheFirst, StaleWhileRevalidate, cache TTL, Service Worker lifecycle, autoUpdate, clientsClaim, content hash, flushPending, draft announcement, server-assigned ID, JWT, refresh token, custom auth storage adapter, handle_new_user trigger, coalesce() fix, security definer, auth state events, LivePlan status, applyLiveBandTestOverride, CrewLiveGroup, Metal Place Window, validateAndAutoCheckout, soft/hard conflict, 3-conflict banner, vendor lock-in, set_user_role RPC, wipeAllLocalData, CacheVersionCheck, emitSyncComplete, graceful degradation, reading path

### Changed (Index — Phase 15.B)
- **index.md** updated: Quick Navigation now lists all 19 wiki documents (11 core + 1 badges + 5 flows + 5 decisions); added "Architectural Decisions" section; 7 reading paths by role (First-Time Engineer, Badge Developer, Offline Expert, Auth & User Management, Announcements/Moderation, Architecture Decision Context, Live Now Page); `Recommended Reading Order` section replaced by detailed `Reading Paths`; `Last Edited` updated to 2026-05-12

### Architectural Notes
- `offline_picks` queue entry `id` format is `${userId}:${bandId}:<crypto-uuid>` — unique even for repeated same-band toggles
- `flushPending()` for announcements replaces draft IDs (crypto.randomUUID client-side) with server-assigned IDs on successful flush
- `handle_new_user()` uses `ON CONFLICT DO UPDATE` to handle re-run (e.g., test user recreation) without overwriting existing roles (except for godlike email)
- Service Worker `CacheFirst` for cross-origin images requires `cacheableResponse: { statuses: [0, 200] }` to cache opaque CORS responses
- Reading paths provide role-based navigation into the wiki, reducing onboarding time from 2–3 days to 30 min–3 hours

---

## 2026-05-11 (Badge Asset Wiring)

### Added
- Wired five badge assets into `BADGES`: `bbq-king-2026`, `dreamer`, `jagger-king`, `live-beast`, and `total-kaput-2026`.
- Added badge localization keys for Brazilian Portuguese, English, Spanish, and German.

### Changed
- Updated the badge inventory to 28 active badges and documented `dreamer` as a persisted 30-pick milestone.
- Updated the `dreamer` badge display copy to use the "I'm Tripping" / "Tô doidão" concept across locales.
- Removed the unused `badge_camping_mob.png` test asset from the active badge asset folder.

### Architectural Notes
- `dreamer` uses the existing `persist: true` badge mechanism so it remains earned after the user later changes picks.
- The new honor badges use the existing `assigned` condition and godlike assignment flow.

## 2026-05-11 (Phase 13.B)

### Added (User Flows)
- **flows/live-now.md** — Live band display: time model (festival-local CEST), current/next band selection algorithm, conflict severity (hard >15min / soft ≤15min), crew grouping (by band → camping → metal place → lost), presence states (camping, metal place time window, auto-checkout), godlike test mode (splice virtual band at now), realtime presence updates (~3s), edge cases (band ends at now, multiple picks both current, timezone wrapping, stale offline state), performance memoization, known limitations (hard-coded CEST, no auto-seen tracking), future improvements

---

## 2026-05-11 (Phase 13.A)

### Added (User Flows)
- **flows/announcements.md** — Complete post lifecycle: happy path (online), offline queueing & flushing, realtime propagation to other users, soft-delete with RLS enforcement, moderation (manager/godlike), edge cases (post-delete race, blocked posters, flaky network, retry idempotency), known issues (blocked poster RLS missing, no dedup on retry), future improvements

---

## 2026-05-11 (Continued)

### Added (Features & Systems)
- **badges.md** — Badge system: 22+ condition types (Wacken history, profile, arrival, band picks/seen, location, assigned), current 30 badges, step-by-step guide to add new badges, localization (4 languages), testing patterns, edge cases, persist vs. conditional badge semantics

### Architectural Discoveries
- IndexedDB has 13 object stores (data + queues + config)
- Queue stores are separate from data stores (offline_picks distinct from user_picks)
- Deduplication groups by (user_id, band_id) and keeps only last action
- Realtime subscriptions are per-hook and clean up on unmount
- Auth session persisted to IndexedDB via custom Supabase storage adapter
- Event emitters (window events) used instead of Redux/Context for state updates
- BandSync runs once on init, not re-run on reconnect (band list immutable)
- Cache version bump wiped all local data, used for lineup invalidation
- Each repository exposes a public interface with sync + queue flush methods
- Workbox caching strategy: NetworkFirst for Supabase, CacheFirst for band images

### Structure
- `/flows/` folder created for user flow documentation
- `/decisions/` folder created for architectural decision records
- Template established for flow documents (Purpose, Trigger, Happy Path, Offline Behavior, Sync Behavior, Source Files, Diagrams, Edge Cases)

---

## 2026-05-11 (Initial Session)

### Added (Core Architecture)
- **index.md** — Navigation hub, system diagram, architecture principles, reading order
- **architecture.md** — 4-layer design, data flows (online/offline/realtime), repositories, offline behavior, sync mechanisms
- **domain-model.md** — Entities (User, Band, UserPick, UserPresence, Announcement, etc.), relationships, business rules by role
- **offline-first.md** — Golden rule (IDB primary), queue design, deduplication mechanics, example lifetimes, guarantees per data type, Service Worker caching
- **sync-engine.md** — Sync orchestration (4 components), queue flush flow, realtime subscription flow, app init flow, key sync functions, error handling, monitoring
- **routes.md** — All 6 routes, page components, navigation flows (login → /now, browse → pick, post announcement), error handling per route
- **testing.md** — Unit/integration/offline testing, manual test scenarios (offline pick/announcement/dedup), testing offline behavior, badge/time logic tests
- **glossary.md** — 100+ terms: architecture, database, React, auth, data, sync, UI, time, badge, role, testing

---

---

**Last updated:** 2026-05-15

---

## 2026-05-15

### Added
- **Melon badge** — new `assigned`-type badge added to `src/services/badges/registry.ts` with slug `melon`, asset `/badges/badge_melon.png`, and i18n keys `badgeMelon` / `badgeMelonDescription`
- **Melon badge i18n** — name ("Melon", untranslated) and description translated in all 4 language files: `Badges_br.json`, `Badges_en.json`, `Badges_es.json`, `Badges_de.json`
- **Badge fullscreen zoom** — magnifying glass button (top-right of the badge circle in the detail modal) opens a fullscreen overlay; the badge scales to `min(80vmin, 420px)` with a blurred dark backdrop and spring entrance animation; clicking anywhere closes it; `isFullscreen` state in `BadgesDisplay` resets when the parent modal closes

### Changed
- **Admin panel action buttons** — replaced generic `.secondaryAction` modifier with semantic per-action CSS classes in `ProfilePage.module.css`: `.actionPromote` (blue), `.actionFriend` (amber), `.actionBadge` (purple), `.actionUnblock` (orange); `.secondaryAction` kept as a no-op for backward compatibility
- **GodlikeAdminPanel** — wired new semantic button classes; role chip moved inside the user info block for better layout; avatar size reduced to 36px
- **ManagerAdminPanel** — wired `.actionUnblock` class on the unblock button
- **badges.md** — corrected `BadgeModal.tsx` reference to `BadgesDisplay.tsx`; added "Badge Detail Modal & Fullscreen Zoom" section documenting the new interaction; updated manual testing checklist
- **vira-lata-ds.html** — added zoom button to badge detail modal demo; added fullscreen overlay section with live preview

---

## 2026-05-16

### Added
- GodlikeAdminPanel: "Test Quack" section with a 15-second local cooldown DuckButton that dispatches a quack toast (band: Queen) after cooldown — no database write
- DuckQuackEventDetail: added optional `bandName` field to allow direct bandName override in test scenarios
- DuckToast: uses `detail.bandName` if present, skips IndexedDB lookup

---

## 2026-05-16 (exp/cluster — Live page avatar cluster + themed bottom sheet)

### Added
- `src/components/now/LiveCardSheet.tsx` — new bottom sheet component opened when any live page group card is tapped; receives `group: CrewLiveGroup` and renders an atmospheric header (colour-matched to card type), a "Here now" section (pulsing live dot per member), and a "Heading next" section (stage-coloured next-band pill per member with `plan.nextBand`); state lives at `RightNowPage` level so only one sheet is open at a time
- `src/components/now/LiveCardSheet.module.css` — full CSS module for the sheet; all 4 card-type colour variants driven by `--sheet-*` CSS variables injected inline; slide-up entrance (280ms `cubic-bezier(0.32, 0.72, 0, 1)`); backdrop fade-in (200ms); pulsing `@keyframes livePulse` on the live dot
- `public/vira-lata-ds.html` — added `ClusterRow` and `LiveCardSheet` component sections with live interactive previews of all 4 card types (band/metal_place/camping/lost); component count updated 18 → 20

### Changed
- `src/components/now/CrewGroupsSection.tsx` — replaced always-visible `memberList` / `CrewMember` pills with new `ClusterRow` sub-component (stacked `Avatar` circles, max 5 + overflow count + per-kind count label); all 4 `groupCard` article elements are now tappable (`onClick`, `cursor: pointer`) and receive a new `onGroupSelect` prop; `skipButton` `onClick` uses `e.stopPropagation()` to prevent card tap propagation; removed unused `truncateDisplayName` and `CrewMember` helpers
- `src/pages/RightNowPage.tsx` — adds `activeGroup: CrewLiveGroup | null` state; passes `onGroupSelect={setActiveGroup}` to `CrewGroupsSection`; renders `<LiveCardSheet>` at page root when `activeGroup !== null`
- `src/pages/RightNowPage.module.css` — added cluster styles: `.clusterRow`, `.clusterAvatars`, `.clusterAvatar` (stacked overlap via negative `margin-left: -8px` + `border: 2px solid var(--bg-surface)`), `.clusterOverflow`, `.clusterCount`
- `src/i18n/RightNowPage_{br,en,es,de}.json` — added 6 new keys: `metalPlaceCountLabel`, `campingCountLabel`, `lostCountLabel`, `hereNowSection`, `headingNextSection`, `noUpcomingPicks`

### Architectural Notes
- Member classification in the sheet is based on `plan.nextBand` not presence: all members in a group are already "here now" by definition (CrewGroupsSection only puts a member in a group when that is their current plan). The "Here now" / "Heading next" split reflects whether they have a next band queued, not whether they've arrived.
- `groupAccentColor()` helper centralises the colour mapping: band → `stageColor(stage)`, metal_place → `rgba(217, 119, 6, 1)`, camping → `var(--signal-ok)`, lost → `var(--signal-lost)`. Sheet CSS variables are injected as inline style, keeping the CSS module free of card-type conditionals.
- `activeGroup` state at page level mirrors the pattern used by `BandDetailModal` on `PopularPage` — consistent architecture, clean z-index (sheet is `position: fixed`, covers BottomNav).

---

## 2026-05-24 (offline assigned badges)

### Changed
- **`assign-badge` Edge Function** (`supabase/functions/assign-badge/index.ts`) — after writing `users.special_badges`, the function now also calls `supabase.auth.admin.updateUserById(targetUserId, { user_metadata: { special_badges: updated } })` to mirror the array into `auth.users.raw_user_meta_data.special_badges`. Applies for both assign AND revoke actions.
- **`BadgesDisplay.tsx`** — `assignedBadges` is now read from `user.user_metadata?.special_badges ?? []` instead of a hardcoded `[]`, making assigned badges available offline from the Supabase JS client's localStorage session cache.
- **`BadgesDisplay.tsx`** — `isCurrentUserFriend` is now resolved from the already-loaded `crewUsers` IDB store (`crewUsers.find(u => u.id === user.id)?.is_friend === true`) instead of a hardcoded `false`; no extra network call.
- **`BadgesDisplay.tsx`** — drift detection added: if DB `special_badges` differs from `user_metadata.special_badges`, syncs via one-shot `updateUser({ special_badges })` (superseded by drift-loop fix above).
- **`docs/ai-wiki/badges.md`** — updated `assigned` condition "How it works" steps to document the metadata mirroring; added "Offline behavior" and "Drift detection" notes to the `assigned` section; added new Edge Case #6 ("Assigned Badges Work Offline") covering the full offline guarantee, drift scenario, and `isCurrentUserFriend` IDB read; updated `BadgeContext.assignedBadges` comment; updated footer.

### Architectural Notes
- `assign-badge` Edge Function is now the single writer for both `users.special_badges` (the DB source of truth) and `auth.users.raw_user_meta_data.special_badges` (the offline-accessible cache mirror). The two must stay in sync through this function only.
- The drift detection in `BadgesDisplay` is a safety net, not the primary sync path. Primary sync happens immediately in the Edge Function. Drift is only expected when a badge was assigned while the recipient was offline.
- `isCurrentUserFriend` reading from IDB (`crew_users` store) is consistent with the architecture rule: UI reads come from IndexedDB, not directly from Supabase.
