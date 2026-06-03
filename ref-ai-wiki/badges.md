# Badge System

## Purpose

Badges are a reward and identity system for vira-latas. They recognize achievement (attended 5+ Wackens), identity (country-based, arrival timing), and memorable moments (saw specific band, crowdsurfed). Badges are earned automatically based on conditions or assigned manually by godlike users for inside jokes.

**Design philosophy**: Badges should be fun, non-intrusive, and mostly automatic. They celebrate the vira-latas' experiences without creating pressure or toxicity.

---

## Key Files

| File | Purpose |
|---|---|
| `src/services/badges/types.ts` | `BadgeBand`, `BadgeCondition`, `BadgeConfig`, `BadgeContext` type definitions |
| `src/services/badges/engine.ts` | `buildBadgeContext`, `evaluateBadge`, `getEarnedBadges` — pure evaluation logic |
| `src/services/badges/stackLayout.ts` | Vest collapsed **chaotic** scatter — `buildStackPoses`, `stackStyle`, anti-bury placement math |
| `src/services/badges/neatStackLayout.ts` | Vest collapsed **neat** row — `buildNeatStackPoses`, scale-down sizing, 0°–5° rotation |
| `src/services/badges/registry.ts` | `BADGES[]` array — all badge definitions + condition-examples reference |
| `src/services/badges/index.ts` | Barrel re-export — preserves all existing `from '…/services/badges'` import paths |
| `src/services/badges/badgeContextBuilder.ts` | `buildBadgeContextFromSocialSnapshot()` / `buildBadgeContextFromSnapshot()` — IDB snapshot + pre-built **social snapshot** → `BadgeContext` |
| `src/services/badges/persistMetadata.ts` | `mergedPersistedBadgeSlugs`, `persistMetadataPatch` — dual-key persist for crew location badges |
| `src/services/socialSnapshot.ts` | Pure `buildSocialSnapshot()` — shared crew derivation for `/now` and live vest (Phase 31) |
| `src/services/livePreview.ts` | `deriveUserBadgeLocation`, `crewLocationCountsFromGroups`, `computeCrewLocationCounts` — consumed by `buildSocialSnapshot()` |
| `src/hooks/useSocialSnapshot.ts` | Shared IDB load + `buildSocialSnapshot()`; feeds `/now` and live vest |
| `src/hooks/useSocialSnapshotSpecs.ts` | `useCrewUsersCache`, `usePresenceCache` cache keys + loaders |
| `src/hooks/useBadgePersist.ts` | Persist-metadata writes only (`auth.updateUser` best-effort); display reads crew IDB |
| `src/hooks/useBadgeContext.ts` | Composer — `useSocialSnapshot` + `useMissedBands` + `useBadgePersist` |
| `src/repositories/users.ts` | `syncCrew()` — writes **crew profile cache** incl. `special_badges`; hydrates auth metadata on reconnect |
| `src/__tests__/badges.test.ts` | Condition engine + registry integration tests |
| `src/__tests__/persistMetadata.test.ts` | Persist metadata merge/write tests |
| `src/__tests__/stackLayout.test.ts` | Vest chaotic scatter layout unit tests |
| `src/__tests__/neatStackLayout.test.ts` | Vest neat row layout unit tests |
| `src/__tests__/useBadgeContext.test.ts` | Hook tests for context build, location counts, and refresh |
| `public/badges/` | Badge PNG images (96×96 px recommended) |
| `src/i18n/Badges_br.json` | Brazilian Portuguese labels + descriptions |
| `src/i18n/Badges_en.json` | English labels + descriptions |
| `src/i18n/Badges_es.json` | Spanish labels + descriptions (if available) |
| `src/i18n/Badges_de.json` | German labels + descriptions (if available) |
| `src/components/BadgesDisplay.tsx` | Vest-stack patches presentation (collapsed + expanded), detail modal, fullscreen zoom |
| `src/components/BadgeHistorySection.tsx` | Collapsible Previously Achieved archive (U2), grouped by `festival_year` |
| `src/components/profile/ConsolidateBadgesSection.tsx` | Godlike year consolidation panel + confirm modal |
| `src/services/badges/currentFestivalYear.ts` | `getCurrentFestivalYear()`, `isLiveVestBadge()` — live vest year filter |
| `src/repositories/badgeHistoryRepository.ts` | IDB read + Supabase pull; `consolidateYear()` Edge Function invoke |
| `src/hooks/useUserBadgeHistory.ts` | IDB-first badge history; sync on profile mount / reconnect |
| `src/lib/db/badgeHistory.ts` | IndexedDB replace-all for current user on sync |
| `src/components/ProfilePage.tsx` | Patches section + admin assign-badge UI |
| `src/lib/patchesBackground.ts` | Per-device patches grid background preference (localStorage) |
| `src/lib/patchesLayout.ts` | Per-device collapsed vest layout preference — `chaotic` \| `neat` (localStorage) |
| `src/components/profile/PatchesBackgroundPicker.tsx` | Fabric swatch selector in Edit profile |
| `src/components/profile/PatchesLayoutToggle.tsx` | I1 icon toggle (scatter vs stack) beside swatches in Edit profile |

---

## Patches Vest Stack (Variant C)

The patches UI uses a **collapsed vest stack** by default (fixed **112 px** height, max-width **480 px**) so large collections (15–22+ badges) do not dominate `/now` or `/profile`. Unified on both routes via `<BadgesDisplay user={user} />`; the deprecated `heading` prop is ignored — kicker + count render internally.

### Layout constants

| State | Patch size | Container | Interaction |
|---|---|---|---|
| **Collapsed** | 48 px (`.stackPatchImg`) | `.vestStack` — fixed 112 px, `overflow: hidden` | Non-interactive `<div>` patches (`pointer-events: none`, `aria-hidden`) |
| **Expanded** | 48 px (`.patchImg`) | `.vestStack.vestSpread.patchesGrid` — 4-col grid, auto height | Clickable `<button>` → detail modal + fullscreen zoom |

### Collapsed chaotic (default)

- **Scatter:** `buildStackPoses()` in `stackLayout.ts` radiates badges from vest center via a golden-angle spiral (`stackPoseDraft`) with hash jitter; overlap is capped at **50%** of the smaller patch (`STACK_MAX_OVERLAP`).
- **Reseed:** `scatterSeed` is random on mount and regenerated on **Close vest** — each collapse produces a new pile layout.
- **Rotation:** ±55° (`(h % 111) - 55`) plus a tiny per-index twist; scale 0.88–0.99.
- **Anti-bury:** if a new patch would overlap an existing one by more than **50%** of the smaller badge diameter (`STACK_MAX_OVERLAP` in `stackLayout.ts`), up to 24 deterministic nudge attempts run before placement (pixel-accurate check via `stackPixelDist` / `stackMinCenterDistPx`).
- **Glow:** only unacknowledged badges animate (`badgeGlow` on `.glowing`); no idle wobble or hover motion when collapsed.
- **Background:** user `data-bg` preference (`patchesBackground.ts`) applies to `.vestStack[data-bg=…]` — same variants as expanded (`none`, `grid`, `steel`, `indigo`, `leather`).

### Collapsed neat (opt-in)

- **Toggle:** `PatchesLayoutToggle` in Edit profile (icon-only I1 — scattered dots vs overlapping circles); preference in `patchesLayout.ts` (`viralatas:patches-layout`, default `chaotic`).
- **Row stack:** `buildNeatStackPoses()` in `neatStackLayout.ts` — horizontal flex row, all badges visible (no AvatarCluster cap).
- **Sizing:** patch px scales down as count grows (48 px → floor 28 px) with ~35% overlap; horizontal scroll fallback if still wider than 480 px at min size.
- **Rotation:** deterministic **0°–5°** per slug (`hashSlug(slug) % 6`); no reseed on **Close vest**.
- **Routes:** preference applies on `/profile` and `/now`; control UI profile-only.

### Expanded

- **Layout:** 4-column grid, 48 px patches, same `data-bg` battle-vest background.
- **Animation:** `settlePatch` keyframe with stagger (`42 ms × index` via `--settle-i`).
- **Interaction:** tap patch → detail modal; magnifying glass → fullscreen overlay. Acknowledging a glowing badge clears glow via `localStorage['badgeAcknowledged']`.
- **Collapse:** **Close vest** reshuffles `scatterSeed` (chaotic only) and returns to vest stack.

### Header & i18n

| Key | EN copy | Role |
|---|---|---|
| `patchesKicker` | PATCHES | Mono uppercase kicker |
| `patchesSpread` | Open vest | Shown when collapsed |
| `patchesCollapse` | Close vest | Shown when expanded |

Count suffix: `· {earned.length}` inline in kicker. Toggle exposes `aria-expanded`.

### Key CSS classes (`BadgesDisplay.module.css`)

| Class | Purpose |
|---|---|
| `.patchesHeader` | Kicker + count + vest toggle row |
| `.vestStack` | Collapsed/expanded shell; height fixed when not `.vestSpread` |
| `.vestStackMeadow` | Absolute scatter canvas (collapsed chaotic) |
| `.vestNeat` / `.vestNeatRow` | Horizontal neat stack (collapsed neat) |
| `.patchBtn.patchStackItem` | Chaotic collapsed patch — absolute, CSS vars `--stack-left/top/rot/scale` |
| `.patchBtn.patchNeatItem` | Neat collapsed patch — flex item, inline px size + rotation |
| `.patchGridItem` | Expanded patch — `settlePatch` animation |
| `.vestSpread` | Grid mode overrides on `.vestStack` |

### Accessibility

- `aria-expanded` on vest toggle; `aria-label` per patch when expanded; collapsed patches `aria-hidden`.
- `prefers-reduced-motion` disables `settlePatch` and reduces glow to static filter.

### Design comparison canvas

Layout variants A–D were compared in a local HTML canvas before shipping Variant C (pre–artifact-layout; not retained in prototype archive).

---

## Patches Grid Background Preference

The patches grid background is a **per-device visual preference**, not a synced user setting. Each vira-lata can pick one of four backdrops for their patches collection.

| Value | Texture | When to use |
|---|---|---|
| `none` | Transparent — sits directly on the page | Minimal, framerless look |
| `grid` | Sunken black with fine crosshatch | Subtle texture without color shift |
| `steel` | Dark indigo battle-vest denim (default) | Anchors the patches in a vest aesthetic |
| `indigo` | Brighter washed denim | Higher contrast, more vibrant |
| `leather` | Dark cordovan with pebbled grain | Black-leather metal jacket vibe |

**Why localStorage and not Supabase / IndexedDB:**
- Pure cosmetic — no other vira-lata is affected
- Per-device is the correct semantics for theming
- Zero network round-trip — toggling must feel instant even at Wacken with no signal
- Avoids polluting `user_metadata` and the `users` table with view-state

**Mechanism:**
1. `PatchesBackgroundPicker` writes `localStorage['viralatas:patches-bg']` and dispatches `viralatas:patches-bg-changed` (CustomEvent with the new value in `detail`).
2. `BadgesDisplay` listens for the event and applies `data-bg={value}` on both collapsed `.vestStack` and expanded `.vestSpread.patchesGrid`.
3. CSS in `BadgesDisplay.module.css` keys each variant off the `data-bg` attribute. Switching is instant; no re-mount.

If `localStorage` is unavailable (private mode, SSR), `loadPatchesBackground()` falls back to `DEFAULT_PATCHES_BG = 'steel'` and `savePatchesBackground` silently no-ops while still firing the event so the in-memory state updates for the session.

---

## Patches Layout Preference (Phase 28)

Collapsed vest layout is a **per-device visual preference** (`chaotic` | `neat`), stored in `localStorage['viralatas:patches-layout']` with event `viralatas:patches-layout-changed`. Same offline-first rationale as vest color.

**Mechanism:**
1. `PatchesLayoutToggle` (Edit profile, beside fabric swatches) writes preference and dispatches the event.
2. `BadgesDisplay` listens and branches collapsed render: `buildStackPoses` vs `buildNeatStackPoses`.
3. Expanded grid unchanged; chaotic reseed on collapse unchanged when mode is chaotic.

**i18n (aria only):** `patchesLayout`, `layoutChaotic`, `layoutNeat` in `ProfilePage_*.json`.

---

## Year-Badge Archive & Consolidation (Phase 29)

After Wacken ends, godlike operators run **Consolidar badges YYYY** (Profile → Godlike Powers) to snapshot each vira-lata's earned **year-badges** into `user_badge_history`. Test vira-latas (`is_test_user = true`) are excluded. Re-runs are idempotent (`UNIQUE (user_id, festival_year, slug)`).

### Live vest vs archive

| Surface | Badges shown |
|---|---|
| Live vest (`BadgesDisplay`) | Evergreen (`!year`) + `year === getCurrentFestivalYear()` |
| Previously Achieved (`BadgeHistorySection`) | Frozen rows from `user_badge_history` by year desc |

After consolidation + `festival:reset`, year-badges appear **only** in Previously Achieved — not on the live vest.

### Consolidation window

Run after `isFestivalEnded()` and before the next `npm run festival:reset`. Godlike bypass: time override past last band end **or** confirm-modal `force: true`.

### Client data flow

`/profile` → `useUserBadgeHistory` → IDB first → Supabase pull when online → `BadgeHistorySection` (hidden when empty). Tap archive patch → `BadgeDetailModal` with `showDescription={false}` `showZoom={false}`.

**U2 layout (locked):** Flat `repeat(4, 48px)` grid per year — no denim vest shell. Mono collapsible header + Oswald `Wacken {year}` headings. Patches at 88% opacity (trophy shelf, not live vest). Year chip: red enamel diamond (24 px @ 48 px patch), same language as live `.yearChip`. Reference: `docs/superpowers/prototypes/badge-history/index.html` scenario U2 (local).

**Godlike archive preview (dev):** Godlike Powers → Test Badges → *Archive preview (local)*. Seeds IndexedDB only; per-device flag pauses history sync until *Clear preview*.

---

## Badge Detail Modal & Fullscreen Zoom

### Detail Modal

Tapping any earned badge **while the vest is open** opens a detail modal via the `<Modal>` component. The modal shows:
- The badge image (136 px) inside a 145 px circular spotlight (`radial-gradient` black)
- The badge name (display font, uppercase)
- The badge description (muted text)
- Year diamond chip (38 px, red enamel) — only on historical badges with a `year` field
- A small **magnifying glass button** (26 px, top-right of the circle) to enter fullscreen

### Fullscreen Zoom

Clicking the magnifying glass (`🔍`) renders a fullscreen overlay (`position: fixed; inset: 0`) with:
- The badge image scaled to `min(80vmin, 420px)` — fills the screen on mobile while capping at 420 px on desktop
- A blurred dark backdrop (`backdrop-filter: blur(12px)`) for a display-case feel
- A spring entrance animation (`cubic-bezier(0.16, 1, 0.3, 1)`) for the badge image
- A decorative ✕ mark fixed to the top-right as a visual affordance
- Click anywhere (the whole overlay is a `<button>`) or close the parent modal to dismiss

**State:** `isFullscreen` lives in `BadgesDisplay` alongside `selectedSlug`. Closing the parent modal also resets `isFullscreen` to prevent stale fullscreen state.

---

## BadgeConfig Structure

```typescript
type BadgeConfig = {
  slug: string;                    // Unique identifier (kebab-case)
  imagePath: string;               // Public path: /badges/badge_*.png
  labelKey: string;                // i18n key for badge name
  descriptionKey: string;          // i18n key for explanation
  condition: BadgeCondition;       // Evaluation rule
  year?: number;                   // Historical Wacken year (e.g., 2026 for 2026 badges)
  persist?: boolean;               // If true, badge recorded permanently once earned
};
```

### Field Details

**slug** (Required)
- Unique kebab-case identifier
- Used internally and in user_metadata
- Example: `'mud-survivor'`, `'death-metal'`

**imagePath** (Required)
- Public path to PNG badge image
- Format: `/badges/badge_{slug}.png`
- Dimensions: 96×96 px (displays at 40px on mobile)
- Background: transparent (required for dark theme)
- Example: `/badges/badge_mud-warrior.png`

**labelKey / descriptionKey** (Required)
- i18n keys from `src/i18n/Badges_*.json`
- Format: `badge{CamelCase}` and `badge{CamelCase}Description`
- Must exist in **all 4 languages** (br, en, es, de)
- Example keys: `badgeMudSurvivor`, `badgeMudSurvivorDescription`

**condition** (Required)
- One of 26+ BadgeCondition types (see below)
- Evaluated against BadgeContext on every profile load
- Example: `{ type: 'country_is', country: 'br' }`

**year** (Optional)
- Wacken edition year (e.g., `2026`)
- Displayed as a small year pill in badge grid
- Use for festival-specific badges (memorial badges, location badges, "saw X band in 2026")
- Omit for permanent/historical badges (country badges, veteran badges)

**persist** (Optional, default false)
- If `true`, badge slug is permanently recorded in `user.user_metadata.achieved_badge_slugs`
- Once earned, the badge appears forever, even if the condition later becomes false
- Example use: "visited Metal Place" (earned once, kept forever)
- Example non-persist: "picked a band" (changes as user modifies picks)

---

## BadgeCondition Types (34 Total)

### WACKEN HISTORY — Attendance Records

#### `wacken_years_exactly`
User attended **only** the listed years (no other editions allowed).

```typescript
{ type: 'wacken_years_exactly', years: [2026] }
```
**Use case**: First-timer badge (only attended 2026, not 2022–2025)
**Example badge**: `puppy` (only 2026)
**Why exclusive**: Prevents "first-timer" badge from applying to veterans

#### `wacken_years_includes`
User attended **all** listed years (may have attended others).

```typescript
{ type: 'wacken_years_includes', years: [2023, 2025] }
```
**Use case**: Survived notorious years (2023 had mud, 2025 had weather)
**Example badge**: `mud-survivor` (attended both 2023 AND 2025, plus maybe 2022/2026)

#### `wacken_years_count_min`
User has attended **at least N** Wacken editions total.

```typescript
{ type: 'wacken_years_count_min', count: 5 }
```
**Use case**: Veteran milestones (5+, 10+, etc.)
**Example badges**: `5-wackens` (≥5), `10-wackens` (≥10)

#### `wacken_attended_in_year`
User attended a **specific edition** (useful for anniversary badges).

```typescript
{ type: 'wacken_attended_in_year', year: 2016 }
```
**Use case**: 10-year anniversary badge for those who were at Wacken 2016
**Example**: `decade-club` badge
**Why separate**: Allows time-based commemorative badges

---

### PROFILE ATTRIBUTES — User Metadata

#### `country_is`
User's registered country matches the given ISO code.

```typescript
{ type: 'country_is', country: 'br' }
```
**Use case**: Country pride badges
**Example badges**: `pais-tropical` (br), `deutscher` (de), `belga` (be)
**ISO codes supported**: `'br'`, `'de'`, `'us'`, `'be'`, `'co'`, `'es'`

---

### ARRIVAL TIMING — Camping Coordination

#### `wacken_arrived_before`
User's arrival day sorts **before** the given day in the camping-open order.

```typescript
{ type: 'wacken_arrived_before', day: 'tue-jul28' }
```
**Arrival order**: `sun-jul26` → `mon-jul27` → `tue-jul28` → `wed-jul29` → `thu-plus`

**Use case**: Early arrival badges
**Example**: `early-bird` badge for those arriving Sun/Mon/Tue

**Note**: Field name is `wacken_arrival_day` in user_metadata, stored as string like `'wed-jul29'`

#### `wacken_arrived_on`
User's arrival day matches the given day **exactly**.

```typescript
{ type: 'wacken_arrived_on', day: 'sun-jul26' }
```

**Use case**: One unique badge per camping-open day (sun/mon/tue/wed). Each user only ever earns one of the four.
**Example badges (2026)**: `civil-engineers-of-doom` (sun-jul26), `beerforcement` (mon-jul27), `campfire-veteran` (tue-jul28), `spawn-point-infield` (wed-jul29).

**Mutual exclusivity**: For any single value of `wacken_arrival_day` only one of these four badges can be earned. Switching the field in profile re-evaluates the set on next load (these badges are **not** `persist: true` by design — they reflect current self-reported arrival).

---

### BAND PICKS — User's Selections

#### `bands_picked_min`
User has picked **at least N** bands total.

```typescript
{ type: 'bands_picked_min', count: 10 }
```
**Use case**: Collector badges
**Example**: "picked 10+ bands"

#### `band_attendance_min`
**At least one** of the user's picks has N+ crew also attending it.

```typescript
{ type: 'band_attendance_min', count: 10 }
```
**Use case**: Social bonding badge ("you're not alone at your pick")
**Example badge**: `pack-member` (share a band with 10+ crew)

#### `bands_picked_genre_min`
User picked **N+** bands in a specific genre (exact match).

```typescript
{ type: 'bands_picked_genre_min', genre: 'Death Metal', count: 3 }
```
**Use case**: Genre specialization badges
**Example badge**: `death-metal` (picked 3+ Death Metal bands)
**Genre values**: Must match `Band.genre` exactly. After Phase 25 collapse, only **13 canonical labels** exist on band rows (see [domain-model.md](domain-model.md#band) · [ADR: Genre Collapse](decisions/genre-collapse-canonical-labels.md) · `src/services/genreGuide.ts`). Pre-collapse subgenre strings (e.g. `Grindcore`, `Melodic Death Metal`) no longer appear on `Band.genre`.

#### `bands_picked_stage_min`
User picked **N+** bands on a specific stage (exact match).

```typescript
{ type: 'bands_picked_stage_min', stage: 'Faster', count: 8 }
```
**Use case**: Stage loyalty badges
**Stage values**: `'Faster'`, `'Harder'`, `'Louder'`, `'W.E.T.'`, `'Headbangers'`, `'Wasteland'`, `'Wackinger'`, `'Welcome to the Jungle'`

#### `bands_picked_stages_min`
User picked **N+** bands whose `stage` is any of the listed stages — **set membership, OR-combined**.

```typescript
{ type: 'bands_picked_stages_min', stages: ['Faster', 'Harder'], count: 6 }
```
**Use case**: "Corridor" / multi-stage loyalty badges — e.g. *Infield Rat* for hanging around the Faster ↔ Harder pair.
**Semantics**: A pick counts toward the threshold if its `stage` is in the array; the total across the listed stages must reach `count`. Does **not** require ≥1 from each stage (pure OR).
**Single-element** behaves identically to the singular `bands_picked_stage_min`.
**Empty array** is never earned for `count > 0`.

#### `bands_picked_genres_min`
User picked **N+** bands whose `genre` is any of the listed genres — **set membership, OR-combined**.

```typescript
{
  type: 'bands_picked_genres_min',
  genres: ['Death Metal', 'Black Metal', 'Thrash Metal'],
  count: 5,
}
```
**Use case**: Genre-family badges — e.g. *Extreme Picker* across canonical heavy genres.
**Semantics**: Same OR-within-the-array rule as `bands_picked_stages_min`.
**Bands with `genre: null`** are never counted (no string to match).
**Single-element** behaves identically to the singular `bands_picked_genre_min`.

#### `bands_picked_before_hour_min`
User picked **N+** bands whose **CEST start time** is **before** the given hour (0–23).

```typescript
{ type: 'bands_picked_before_hour_min', hour: 14, count: 3 }
```
**Use case**: Morning warrior / night owl badges
**Hour**: Festival-local time (CEST, UTC+2)
**Example**: 3+ bands starting before 14:00 (2 PM)

#### `bands_picked_after_hour_min`
User picked **N+** bands whose **CEST start time** is **at or after** the given hour.

```typescript
{ type: 'bands_picked_after_hour_min', hour: 22, count: 3 }
```
**Use case**: Night owl badges
**Example**: 3+ bands starting at/after 22:00 (10 PM)

#### `band_picked_named`
User picked a band with this **exact name** (case-sensitive).

```typescript
{ type: 'band_picked_named', name: 'Rammstein' }
```
**Use case**: Specific headliner fan badges
**Example badge**: Could be used for legendary bands
**Case-sensitive**: Name must match `Band.name` exactly

---

### BANDS SEEN — After End Time (Not Opted Out)

A band is "seen" when:
1. Current time > band's `end_time`, AND
2. User has NOT opted out via "didn't see" toggle in BandDetailModal

#### `bands_seen_min`
User is credited with having **seen at least N** bands.

```typescript
{ type: 'bands_seen_min', count: 5 }
```
**Use case**: Spectator / festival-goer badges
**Example**: Saw 5+ bands

#### `bands_seen_genre_min`
User **seen N+** bands in a specific genre.

```typescript
{ type: 'bands_seen_genre_min', genre: 'Death Metal', count: 3 }
```
**Use case**: Genre veteran badges
**Example badge**: `death-metal` (seen 3+ Death Metal)

#### `bands_seen_stage_min`
User **seen N+** bands on a specific stage.

```typescript
{ type: 'bands_seen_stage_min', stage: 'Headbangers', count: 4 }
```
**Use case**: Stage devotee badges

#### `bands_seen_stages_min`
User **seen N+** bands whose `stage` is any of the listed stages — **set membership, OR-combined**.

```typescript
{ type: 'bands_seen_stages_min', stages: ['Faster', 'Harder'], count: 6 }
```
**Use case**: "Corridor" devotee badges — e.g. *Infield Rat* once Day 4 is over and the user has racked up 6+ seen bands across the Faster ↔ Harder pair.
**Semantics**: Same OR-within-the-array rule as `bands_picked_stages_min`, but counted against `seenBands` (band end_time has passed AND user did not opt out via "didn't see").
**Single-element** behaves identically to the singular `bands_seen_stage_min`.

#### `bands_seen_genres_min`
User **seen N+** bands whose `genre` is any of the listed genres — **set membership, OR-combined**.

```typescript
{
  type: 'bands_seen_genres_min',
  genres: ['Death Metal', 'Black Metal', 'Thrash Metal'],
  count: 5,
}
```
**Use case**: Genre-family devotee badges — e.g. *Extreme Devotee* across canonical heavy genres.
**Bands with `genre: null`** are never counted.
**Missed opt-outs** (`user_missed_bands`) are correctly excluded — the count operates over `seenBands` which already removes those.

#### `bands_seen_before_hour_min`
User **seen N+** bands whose **CEST start time** is **before** the given hour.

```typescript
{ type: 'bands_seen_before_hour_min', hour: 13, count: 5 }
```
**Use case**: Early-doors badge (up early for morning bands)
**Example badge**: `early-bird` (saw 5+ bands before 1 PM)

#### `bands_seen_after_hour_min`
User **seen N+** bands whose **CEST start time** is **at or after** the given hour.

```typescript
{ type: 'bands_seen_after_hour_min', hour: 23, count: 2 }
```
**Use case**: Midnight survivor badge

#### `band_seen_named`
User is credited with **seeing a specific band** (exact name match).

```typescript
{ type: 'band_seen_named', name: 'Alestorm' }
```
**Use case**: Witnessed legendary performance badges
**Example badge**: `alestorm` (saw Alestorm live)

#### `stage_diversity_min`
User has seen at least 1 band on **N+ distinct stages**.

```typescript
{ type: 'stage_diversity_min', count: 4 }
```
**Use case**: Nomadic explorer badges — reward vira-latas who roam across multiple stages rather than camping at one.
**Semantics**: Counts the number of unique `stage` values in `seenBands`. Duplicate stages don't inflate the count. Ceremony bands are excluded (already filtered from `seenBands`).
**Example badges**: `stage-hopper` (4 distinct stages), `octopus` (all 8 stages)

---

### LOCATION PRESENCE — Camping, Metal Place, Lost

#### `location_visit_count_min`
Badge earned when user has **checked into a location at least N times** (persistent counter).

```typescript
{ type: 'location_visit_count_min', location: 'metal_place', count: 1 }
```
**Locations**: `'camping'`, `'metal_place'`, `'lost'`

**Persistent**: Counter stored in `user_metadata.location_visits`

**Use case**: Visited Metal Place, camped multiple times
**Example badge**: `metal-place-2026` (visited Metal Place ≥1 time)

**How it works**:
1. User toggles location via `/now` page or profile
2. Each location change increments the counter for that location
3. Badge persists even if user later changes location away

#### `weak_skips_min`
Badge earned when user has **committed N+ "I am weak" skips** on `/now` (unpick sticks after the 5s undo window).

```typescript
{ type: 'weak_skips_min', count: 3 }
```

**Counter**: `user_metadata.weak_skips_2026` via `recordCommittedSkip()` — generic schedule-card unpicks do not increment.

**Registry**: Condition and evaluator shipped; **no badge entries yet**. Choose `persist: true` or `false` per badge at author time.

**Refresh**: `auth.updateUser` after commit → `USER_UPDATED` → `useSocialSnapshot` child caches refresh → `BadgesDisplay` re-evaluates.

#### `crew_at_location_min`
Earned when user **is at a location AND N+ crew members are there** (permanent once earned).

```typescript
{ type: 'crew_at_location_min', location: 'camping', count: 15 }
```
**Locations**: `'camping'` or `'lost'` only (not `'metal_place'`)

**Permanent**: Badge slug stored in `user_metadata.crew_earned_badge_slugs` once earned

**Use case**: Crew bonding badges ("15 of us were camping together!")
**Example badges**:
- `bbq-crew` (15+ crew in camping simultaneously)
- `lost-together` (15+ lost souls at once)

**How it works**:
1. `useSocialSnapshot` → `buildSocialSnapshot()` produces crew groups (same path as `/now`), then `buildBadgeContextFromSocialSnapshot()` calls `deriveUserBadgeLocation()` and uses `social.crewLocationCounts`.
2. If user's `currentLocation` matches AND crew count ≥ N, badge is earned.
3. Slug recorded permanently (even if crew later disperses). Crew-location badges write to **both** `achieved_badge_slugs` and `crew_earned_badge_slugs`; reads merge both keys.

---

### ASSIGNED — Godlike Manual Assignment

#### `assigned`
Badge has **no automatic condition**; godlike assigns it manually.

```typescript
{ type: 'assigned' }
```

---

### RATING — Concert score predicates (Phase 34)

Engine capabilities — first registry entries landed 2026-05-29. All counts use bands **eligible at eval time** (`canRateBand` semantics). Context fields populated via `buildRatingStatsSnapshot()` in `badgeContextBuilder`.

#### `bands_rated_min`
```typescript
{ type: 'bands_rated_min', count: 5 }
```
User rated ≥ N eligible bands.

#### `band_rated_score_min`
```typescript
{ type: 'band_rated_score_min', score: 5, name?: string, stage?: string, genre?: string }
```
User score **≥** `score` on a band matching **all** provided filters (AND).

#### `crew_avg_on_picked_band_min`
```typescript
{ type: 'crew_avg_on_picked_band_min', avg: 4, minRaters?: 1 }
```
Crew avg ≥ `avg` on ≥1 band in user's **`seenBands`**. `minRaters` defaults to **1**.

#### `user_rating_avg_min` / `user_rating_avg_max`
```typescript
{ type: 'user_rating_avg_min', avg: 4, minRatings: 3 }
{ type: 'user_rating_avg_max', avg: 2.5, minRatings: 5 }
```
User mean eligible rating ≥ or ≤ threshold when user has ≥ `minRatings` eligible ratings (**required**).

#### `bands_rated_pct_of_seen_min`
```typescript
{ type: 'bands_rated_pct_of_seen_min', pct: 80 }
```
Strict `(ratedSeen × 100) / seenCount >= pct`; **false** when `seenCount === 0`.

**Use case**: Inside-joke badges, merit badges, honor awards

**How it works**:
1. Godlike user opens user's profile
2. Clicks "Assign Badge" button in admin panel
3. Selects badge slug from dropdown (only `assigned` condition badges appear)
4. Badge slug added to `users.special_badges[]` array via the `assign-badge` Edge Function
5. Edge Function mirrors the updated array into `auth.users.raw_user_meta_data.special_badges` via `supabase.auth.admin.updateUserById` — applies for both assign AND revoke
6. Godlike admin calls `usersRepository.syncCrew()` after assign/revoke so **crew profile cache** (`crew_users` IDB) updates immediately
7. Live vest reads `crewUsers.find(me)?.special_badges` — no display-path Supabase fetch

**Offline behavior (Phase 31)**: After reconnect `syncCrew()`, assigned badges and `is_friend` display from **`crew_users` IndexedDB**. Auth metadata is hydrated on reconnect for backward compat; persist-metadata writes remain best-effort online only. Vest renders from IDB without waiting on network.

**Drift hydration (reconnect seam only)**: `usersRepository.syncCrew()` compares DB `special_badges` on the current user's crew row against `user_metadata.special_badges` and fires a one-shot `auth.updateUser` when they differ — not on every vest render.

**Example badges**:
- `mosh-pit` (hit the floor and came back)
- `crowdsurfer` (flew over the crowd)
- `girl-power` (inside joke or achievement)
- `nutella` (glamour/mordomias joke)
- `bbq-king-2026` (BBQ king honor)
- `jagger-king` (Jagger King honor)
- `total-kaput-2026` (festival aftermath honor)
- `melon` (true vira-latas friend not camping with the group)

**Godlike-only**: Non-godlike users cannot assign badges

---

## Current Badges Inventory (71 Total)

### Profile & Social (7)
- `puppy` — First Wacken (2026 only)
- `pack-member` — Shared a picked band with 10+ vira-latas
- `pais-tropical` — Brazil
- `deutscher` — Germany
- `america-fuck-yeah` — USA
- `belga` — Belgium
- `cafetero` — Colombia

### Wacken Veteran (4)
- `og` — Founding member (attended 2022)
- `mud-survivor` — Survived 2023 AND 2025
- `5-wackens` — Attended 5+ editions
- `10-wackens` — Attended 10+ editions

### Festival 2026 (28)
- `early-bird` — Saw 5+ bands before 1 PM (CEST)
- `dreamer` — "I'm Tripping" / 30+ picked bands (persist: true)
- `death-metal` — Saw 3+ Death Metal bands
- `power-metal` — Saw 3+ Power Metal bands
- `party-metal` — Saw 2 Party Metal bands. **In the 2026 lineup the `Party Metal` genre is held by exactly 2 bands: `Airbourne` (FAS15, Day 4, 17:30–18:45 Faster) and `Alestorm` (FAS17, Day 4→5 after midnight, 01:00–02:00 Faster) — so this badge effectively requires seeing both. Both play Faster on Day 4 evening/night; no Harder-stage overlap.**
- `denim-and-leather` — "Denim and Leather". Saw 4+ Heavy Metal bands (`bands_seen_genre_min`).
- `kvlt` — "Kvlt". Saw 4+ Black Metal bands (`bands_seen_genre_min`).
- `wall-of-death` — "Wall of Death". Saw 2+ Thrash Metal bands (`bands_seen_genre_min`).
- `viking-fur` — "Viking Fur". Saw 4+ Folk Metal bands (`bands_seen_genre_min`).
- `slow-and-low` — "Slow and Low". Saw 3+ Doom Metal bands (`bands_seen_genre_min`).
- `breakdown-believer` — "Breakdown Believer". Saw 2+ Metalcore bands (`bands_seen_genre_min`).
- `dad-rock-respect` — "Dad Rock Respect". Saw 3+ Hard Rock bands (`bands_seen_genre_min`).
- `pit-pup` — "Pit Pup". Saw 2+ Punk bands (`bands_seen_genre_min`).
- `alestorm` — Saw Alestorm live (band_seen_named) — distinct from the genre-based `party-metal` above.
- `roots` — "Roots, Bloody Roots" — Saw Sepultura's farewell show (band_seen_named: `Sepultura`, HAR6 Day 3, 19:00–20:30).
- `live-beast` — Saw 22+ bands
- `wacken-firefighters` — Saw the *Wacken Firefighters* (band_seen_named) — they open Day 1 12:00 (WAK1) and return Day 4 12:00 (WAK23) on the Wackinger stage. Tribute to the volunteer brass-band tradition.
- `gutalax` — Saw *Gutalax* (band_seen_named) — `Death Metal` (formerly Goregrind before Phase 25 collapse), Faster Day 3 12:30 (FAS8). Inside-joke description references "Osmar".
- `heavysaurus` — Display label "Mighty Roar". Saw *Heavysaurus* (band_seen_named) — children's metal act tagged `Metal`, Harder Day 4 11:30 (HAR9).
- `wackinger-regular` — Display label "Wackinger Viking". Saw 3+ bands on the Wackinger stage (`bands_seen_stage_min`).
- `wasteland-warrior` — Saw 1+ band on the Wasteland stage (`bands_seen_stage_min`). Low threshold by design — Wasteland is the "you went there at all" badge.
- `bullhead-heat` — "Bullhead Heat" / "Calor do Bullhead" / "Calor del Bullhead" / "Bullhead-Hitze". Loyalty to the flaming bullhead between Faster ↔ Harder: saw 6+ bands across Faster ∪ Harder (`bands_seen_stages_min`, "more than 5" interpreted as strictly > 5).
- `witching-hour` — "Hora das Bruxas". Late-night endurance: saw 4+ bands starting at or after 22:00 CEST (`bands_seen_after_hour_min`).
- `vampire` — "Vampiro". Extreme night owl: saw 8+ bands starting at or after 22:00 CEST (`bands_seen_after_hour_min`). Tiers with `witching-hour`.
- `small-stage-champion` — "Campeão dos Pequenos Palcos". Underground loyalty: saw 6+ bands across W.E.T. ∪ Headbangers stages (`bands_seen_stages_min`).
- `judas-witness` — "Testemunha de Judas". Saw *Judas Priest* (band_seen_named). You stood before the metal gods themselves.
- `stage-hopper` — "Nômade dos Palcos". Saw bands on 4+ distinct stages (`stage_diversity_min`, count: 4). Four stages, four vibes, zero loyalty.
- `octopus` — "Polvo". Saw bands on all 8 distinct stages (`stage_diversity_min`, count: 8; persist: true). All 8 stages conquered — you have no favorites, only victims.

### Weak Skip 2026 (2) — `weak_skips_min`, no persist

Committed `/now` "I am weak" skips only (`user_metadata.weak_skips_2026`). Generic schedule unpicks do not count.

- `weak` — "Fraco" / "Weak". 3+ committed weak skips.
- `weakling-supreme` — "Fraco Supremo" / "Weakling Supreme". 10+ committed weak skips.

### Rating 2026 (3) — `bands_rated_min`, no persist

Eligible band ratings only (`canRateBand` at eval time). Tiers reward growing critic cred.

- `zine-pup` — "Zine Pup". Rated 4+ eligible bands.
- `press-pass` — "Press Pass" / "Passe de Imprensa" / "Pase de Prensa" / "Presseausweis". Rated 12+ eligible bands.
- `pitchfork-paw` — "Pitchfork Paw". Rated 20+ eligible bands.

### Arrival Day 2026 (4) — `wacken_arrived_on`, mutually exclusive

One badge per camping-open day; each user earns exactly one based on `user_metadata.wacken_arrival_day`. Not persistent — reflects the current self-reported arrival.

- `civil-engineers-of-doom` — Arrived **Sunday** (sun-jul26). "Built the camp before civilization existed."
- `beerforcement` — Arrived **Monday** (mon-jul27). "You brought the beer, backup tarp, and emotional support."
- `campfire-veteran` — Arrived **Tuesday** (tue-jul28). "Warm beers, grill smoke, and terrible decisions. Peak Wacken."
- `spawn-point-infield` — Arrived **Wednesday** (wed-jul29). "No warm-up. You spawned directly into the chaos."

### Canonical genres with NO corresponding badge

After Phase 25, every band carries one of **13 canonical genre labels**. Eleven genres now have a `bands_seen_genre_min` badge in the 2026 registry (`death-metal`, `power-metal`, `party-metal`, plus the eight Phase 25 genre badges above). Labels still without a genre badge:

- `Metal`, `Metal Battle` — intentional curation; the badge inventory stays small.

Pre-collapse subgenre strings (Goregrind, Humppa, Horror Punk, Melodic Death Metal, …) were merged into these buckets and **no longer appear** on `Band.genre`. See `src/services/genreGuide.ts` for the full old→new map.

### Merit / Assigned (17)
- `mosh-pit` — Hit the floor, came back (godlike-assigned)
- `crowdsurfer` — Flew over the crowd (godlike-assigned)
- `girl-power` — Metal queen (godlike-assigned)
- `nutella` — Glamour / mordomias (godlike-assigned)
- `bbq-king-2026` — BBQ King 2026 (godlike-assigned)
- `jagger-king` — Jagger King (godlike-assigned)
- `total-kaput-2026` — Total Kaput (godlike-assigned)
- `melon` — True vira-latas friend not camping with the group (godlike-assigned)
- `medic` — "Médico da Matilha" / "Vira-Lata Medic". Held the hair, fetched the water, walked the wounded home (godlike-assigned).
- `smoke-signals` — "Sinais de Fumaça". The pack always found you by the cloud. Wacken's air got a little spicier (godlike-assigned).
- `space-brownie` — "Space Brownie". "It's just a brownie," they said. Two hours later you were debating reality with a tent pole (godlike-assigned).
- `beer-master` — "Mestre da Cerveja". Liquid bread is a food group. You drank Wacken dry and asked for seconds (godlike-assigned).
- `beer-hater` — "Inimigo da Cerveja". Surrounded by oceans of beer and said "no thanks." Wine, shots, caipirinha — anything but that (godlike-assigned).
- `code-wizards` — "Magos do Código". **Honors the builders of the Viralatas app pack** — Companion (find), Setlist Vira-Latas (listen), MoshSplit (pay). Three wizards, three apps, one pack. Godlike-assigned via `users.special_badges[]`. See [Architecture: Viralatas App Pack](architecture.md#viralatas-app-pack-phase-22–23).
- `sun-sacrifice` — "Sun Sacrifice". Forgot the sunscreen; glows like a tomato in a denim vest (godlike-assigned).
- `tactical-nap` — "Tactical Nap". Fell asleep mid-pit, mid-set, or mid-conversation — strategic withdrawal (godlike-assigned).
- `patient-zero` — "Paciente Zero" / "Patient Zero". One minute dancing, next minute pupil check — time is a flat circle (godlike-assigned).
- `alemao-mode` — "Alemão Mode". One song, one announcement, one trembling lip — Alemão would be proud (godlike-assigned).

### Location Presence (5)
- `metal-place-2026` — Visited Metal Place (persist: true)
- `bbq-crew` — 15+ crew camping together (persist: true)
- `lost-together` — 15+ crew lost together (persist: true)
- `full-pack` — All 21 vira-latas in camping at the same time (`crew_at_location_min`, location: camping, count: 21; persist: true). The "everyone showed up" miracle badge.
- `mass-lost` — All 21 vira-latas lost in the infield at the same time (`crew_at_location_min`, location: lost, count: 21; persist: true). Counterpart to `full-pack`.

---

## How to Add a New Badge

### Step 1: Prepare Assets

Create a 96×96 px PNG with **transparent background**.

```bash
# Save to public/badges/ with naming convention
cp design.png public/badges/badge_your-slug.png
```

### Step 2: Add i18n Keys

Add label + description to **all 4 languages**:

**src/i18n/Badges_br.json**
```json
{
  "badgeYourSlug": "Nome em Português",
  "badgeYourSlugDescription": "Descrição em português explicando quando ganha."
}
```

**src/i18n/Badges_en.json**
```json
{
  "badgeYourSlug": "English Name",
  "badgeYourSlugDescription": "English description of when earned."
}
```

Repeat for `Badges_es.json` and `Badges_de.json`.

**Key naming rules**:
- `badge` + PascalCase(slug) + `.json` key
- Example: slug `'death-metal'` → keys `badgeDeathMetal` + `badgeDeathMetalDescription`

### Step 3: Add BadgeConfig to BADGES Array

In `src/services/badges/registry.ts`, append to the `BADGES` array:

```typescript
{
  slug: 'your-slug',
  imagePath: '/badges/badge_your-slug.png',
  labelKey: 'badgeYourSlug',
  descriptionKey: 'badgeYourSlugDescription',
  condition: { /* see BadgeCondition types below */ },
  year: 2026,              // If festival-specific; omit for permanent
  persist: false,          // If badge should be recorded once earned
}
```

### Step 4: Choose a Condition

Pick from the 22+ condition types (see **BadgeCondition Types** section above).

**Examples**:

**Simple metadata-based**:
```typescript
{ type: 'country_is', country: 'fr' }  // French attendee
```

**Band picks**:
```typescript
{ type: 'bands_picked_genre_min', genre: 'Thrash Metal', count: 5 }  // Thrash fan
```

**Wacken history**:
```typescript
{ type: 'wacken_years_includes', years: [2022, 2026] }  // Attended founding year
```

**Assigned only**:
```typescript
{ type: 'assigned' }  // Godlike manual assignment
```

### Step 5: Test Locally

Run unit tests to ensure no regressions:

```bash
npm test -- badges.test.ts
```

Add a test case for your new badge (optional):

```typescript
it('awards badge when condition is met', () => {
  const ctx = buildBadgeContext(authUser(), ['b1'], new Map(), ...);
  const mybadge = { slug: 'your-slug', condition: { /* ... */ } };
  expect(evaluateBadge(mybadge, ctx)).toBe(true);
});
```

### Step 6: Verify Images Exist

```bash
ls public/badges/badge_your-slug.png
# Should return the file path
```

### Step 7: Commit

```bash
git add -A
git commit -m "Add badge: your-slug with condition type"
```

---

## BadgeContext Structure

When evaluating badges, the system builds a `BadgeContext` containing all user data:

```typescript
type BadgeContext = {
  wacken_years: number[];              // [2022, 2025, 2026]
  country: string | null;              // 'br', 'de', etc.
  wacken_arrival_day: string | null;   // 'wed-jul29'
  assignedBadges: string[];            // From crew profile cache (crew_users.special_badges) after sync
  bandsPicked: number;                 // Total picks
  maxAttendanceInPicks: number;         // Highest crew count in any pick
  pickedBands: BadgeBand[];            // Full band details
  seenBands: BadgeBand[];              // Seen = after end_time, not opted-out
  missedBandIds: Set<string>;          // Opted-out via "didn't see" toggle
  locationVisits: Record<string, number>;  // { camping: 3, metal_place: 1 }
  weakSkipCount: number;               // user_metadata.weak_skips_2026 (committed /now skips)
  currentLocation: string | null;      // 'camping', 'metal_place', 'lost', or null (live band / friend)
  crewLocationCounts: Record<string, number>;  // From crewLocationCountsFromGroups — matches /now location cards
  achievedBadgeSlugs: Set<string>;     // Merge of achieved_badge_slugs + crew_earned_badge_slugs
};
```

**Evaluation**: `evaluateBadge(badgeConfig, context)` returns `true` if badge is earned.

---

## Persistence vs. Conditional Badges

### Conditional Badges (persist: false or omitted)
Reflect **current state** — re-evaluated on every profile load.

**Examples**:
- Country badges (changes if user updates country)
- Band picks (changes if user removes picks)
- Current location (changes if user toggles location)

**Behavior**: Show if condition is true now, hide if condition becomes false.

### Persistent Badges (persist: true)
**Recorded permanently** once earned, appear forever.

**Examples**:
- `metal-place-2026` — Visited Metal Place once; recorded forever
- `bbq-crew` — 15 crew camping together once; recorded forever even if crew disperses
- `lost-together` — 15 crew lost together once; recorded forever

**Storage**: Slug stored in `user.user_metadata.achieved_badge_slugs[]` for all persist badges. **`crew_at_location_min` badges also write to `crew_earned_badge_slugs[]`** on first earn; **`useBadgePersist` merges both keys on read** so legacy records in either key still restore the badge. The companion `location_visits` counter (used by `location_visit_count_min`) is also stored in `user_metadata`.

**Why persistent**: Some achievements are historic — you visited Metal Place, the 15 of you were together, those are facts. No takebacks.

**Reset path (operator-only)**: `npm run festival:reset` clears `users.special_badges` (assigned badges) and strips `achieved_badge_slugs`, `crew_earned_badge_slugs`, and `location_visits` from `auth.users.raw_user_meta_data` for every user. This is the *only* sanctioned way to undo persistent-badge state and is intended to be run once at festival start so the live counts and patches reflect the festival itself, not pre-festival exploration. See `docs/ai-wiki/festival-reset.md`. **If a future phase introduces a new persistent-badge metadata key, add it to `PERSISTENT_BADGE_METADATA_KEYS` in `supabase/seed/festival-reset.ts`** — that constant is the single source of truth for the strip list, and the positive-strip pattern intentionally preserves any key it doesn't know about.

**When to use `persist: true`**:
- Location visits (visit once, recorded forever)
- Crew bonding moments (crew together, recorded forever)
- Historic achievements (saw band, attended festival year, arrived early)
- Milestone picks that should remain earned even if the user later removes picks, such as `dreamer`

**When to omit/use `false`**:
- Active state (current location, current picks)
- Metadata that changes (country, language)
- Conditional milestones based on current data

---

## Localization

Badges support **4 languages**: `br` (Portuguese), `en` (English), `es` (Spanish), `de` (German).

**Every badge must have translations in all 4 files**:
- `src/i18n/Badges_br.json`
- `src/i18n/Badges_en.json`
- `src/i18n/Badges_es.json`
- `src/i18n/Badges_de.json`

**Key format**:
- `badge{PascalCase}` for label
- `badge{PascalCase}Description` for description

**Example**:
```
slug: 'mud-survivor'
↓
labelKey: 'badgeMudSurvivor'
descriptionKey: 'badgeMudSurvivorDescription'
```

**Tone**:
- **BR**: Playful, metal culture references, Portuguese idiom
- **EN**: Direct, fun, English idiom
- **ES**: Spanish equivalents (check with Spanish speakers)
- **DE**: German equivalents (check with German speakers)

---

## Testing Badges

### Automated Tests

Run the test suite:

```bash
npm test -- badges.test.ts
```

**Coverage**: 50+ tests covering all 26+ condition types, context building, evaluation logic, edge cases.

**Test structure**:
```typescript
it('awards badge when condition met', () => {
  const ctx = buildBadgeContext(
    authUser({ country: 'br' }),
    [],
    new Map(),
    new Map()
  );
  expect(evaluateBadge(badge({ type: 'country_is', country: 'br' }), ctx)).toBe(true);
});
```

### Manual Testing

1. **Profile Page**: Navigate to `/profile` and view badge grid
2. **Badge Modal**: Click a badge to see full label + description
3. **Zoom to Fullscreen**: Inside the modal, click the magnifying glass icon (top-right of the badge circle) to view the badge full-screen; click anywhere or press Escape to dismiss
4. **Admin Assign**: (Godlike only) Use "Assign Badge" button to test `assigned` condition
5. **Offline**: Reload offline — badges should display from cached user data

### Test Data

Seed scripts can create test users with specific badge triggers:

```bash
npm run seed:test-users  # Creates vira-latas with various badges
```

---

## Edge Cases & Gotchas

### 1. Genre / Stage Name Matching

Conditions like `bands_picked_genre_min` and `bands_picked_stage_min` **require exact string match**.

```typescript
// ✅ Works if band.genre === 'Death Metal'
{ type: 'bands_picked_genre_min', genre: 'Death Metal', count: 3 }

// ❌ Won't work if you write 'death metal' (case mismatch)
```

**Fix**: Check the actual `band.genre` value in the database.

### 2. Hour Comparisons

`bands_picked_before_hour_min` and `bands_picked_after_hour_min` use **festival-local time (CEST, UTC+2)**.

```typescript
// Band starts at 2026-07-29T10:00:00.000Z = 12:00 CEST
// This badge evaluates true:
{ type: 'bands_picked_before_hour_min', hour: 14, count: 1 }  // 12:00 < 14:00 ✓
```

**Key**: Do NOT use UTC hours; use CEST hours (12–23 for typical festival hours).

### 3. Persistent Badges Survive Condition Changes

If `persist: true` and user earned the badge, it **never disappears** even if the underlying data changes.

```typescript
// User was at location with 15+ crew → earned badge, slug recorded
// Later, crew disperses → badge still shows (slug in achieved_badge_slugs)
{ type: 'crew_at_location_min', location: 'camping', count: 15, persist: true }
```

**Design intent**: Some moments are historic — you were there, period.

### 4. "Seen" Requires end_time Passed

A band only counts as "seen" if current time > band's `end_time`.

```typescript
// Band ends at 2026-07-29T23:00:00.000Z
// If now < end_time, badge is NOT earned (even if user watched the whole thing)
{ type: 'bands_seen_min', count: 5 }
```

**Workaround**: For testing, use `useNow()` hook to time-shift the current time.

### 5. Arrival Day Order

`wacken_arrived_before` uses a **specific order**:

```typescript
const arrivalDayOrder = ['sun-jul26', 'mon-jul27', 'tue-jul28', 'wed-jul29', 'thu-plus'];
```

**Valid values**: Only these strings. Do NOT invent new day codes.

**Comparison**: `'wed-jul29'` arrives BEFORE `'thu-plus'` but AFTER `'tue-jul28'`.

### 6. Assigned Badges Work Offline

`useBadgeCache` / `useBadgePersist` load `assignedBadges` from IndexedDB-first snapshot (then reconciles with `users.special_badges` from Supabase). Because the Supabase JS client persists `user_metadata` in localStorage, assigned badges are available offline after the first online visit.

The Edge Function (`assign-badge`) mirrors `users.special_badges` into `auth.users.raw_user_meta_data` for both assign and revoke operations. This ensures the cached session stays in sync after an online assignment.

**Drift scenario**: If an assignment is made while the target user is offline, their `user_metadata` cache will be stale. On next online visit, `useBadgePersist` detects the mismatch and calls `supabase.auth.updateUser({ data: { special_badges } })` once to sync the session cache.

**`isCurrentUserFriend` also reads offline**: `useBadgeCache` determines whether the profile owner is a friend from the already-loaded `crewUsers` IDB store (`crewUsers.find(u => u.id === user.id)?.is_friend === true`). No extra network call is made.

### 7. Assigned Badge Slug vs. Condition

Godlike assigns a badge by adding the **slug** to `users.special_badges[]`.

```typescript
// Godlike assigns 'mosh-pit' badge
// System stores 'mosh-pit' in special_badges array
// Later, evaluateBadge({ condition: { type: 'assigned' } }) checks if 'mosh-pit' is in array

// ✅ Correct
{ slug: 'mosh-pit', condition: { type: 'assigned' } }

// ❌ Wrong (slug doesn't match)
// If you assign 'mosh-pit' but badge slug is 'pit-mosh', evaluation fails
```

---

## Open Questions

1. **Rate badge additions**: How often should new badges be added? What's the retention impact of badge fatigue?
2. **Ephemeral badges**: Should some badges disappear after the festival (e.g., "currently at Metal Place")? Or always persist?
3. **Language coverage**: What if we add Portuguese (European), French, or other languages? i18n expansion plan?
4. **Godlike assignment UI**: Should there be an audit log of who assigned which badge when?
5. **Badge rarity**: Should we track and display badge rarity (% of crew who earned it)?
6. **Animation**: Should newly-earned badges animate or trigger a toast notification?

---

## Quick Reference: Condition Types Cheat Sheet

| Condition Type | Input(s) | Example |
|---|---|---|
| `wacken_years_exactly` | `years: number[]` | `[2026]` → first-timer |
| `wacken_years_includes` | `years: number[]` | `[2023, 2025]` → mud survivor |
| `wacken_years_count_min` | `count: number` | `5` → 5+ Wackens |
| `wacken_attended_in_year` | `year: number` | `2016` → 10-year anniversary |
| `country_is` | `country: string` | `'br'` → Brazil |
| `wacken_arrived_before` | `day: string` | `'wed-jul29'` → early arrival |
| `wacken_arrived_on` | `day: string` | `'sun-jul26'` → arrived exactly Sunday |
| `bands_picked_min` | `count: number` | `10` → picked 10+ |
| `band_attendance_min` | `count: number` | `10` → share pick with 10+ crew |
| `bands_picked_genre_min` | `genre, count` | `'Death Metal', 3` → 3+ Death Metal |
| `bands_picked_stage_min` | `stage, count` | `'Faster', 8` → 8+ Faster stage |
| `bands_picked_stages_min` | `stages, count` | `['Faster', 'Harder'], 6` → 6+ across Faster ∪ Harder |
| `bands_picked_genres_min` | `genres, count` | `['Death Metal', 'Black Metal'], 5` → 5+ across listed genres |
| `bands_picked_before_hour_min` | `hour, count` | `14, 3` → 3+ before 2 PM CEST |
| `bands_picked_after_hour_min` | `hour, count` | `22, 3` → 3+ at/after 10 PM CEST |
| `band_picked_named` | `name: string` | `'Rammstein'` → picked Rammstein |
| `bands_seen_min` | `count: number` | `5` → saw 5+ |
| `bands_seen_genre_min` | `genre, count` | `'Death Metal', 3` → saw 3+ Death Metal |
| `bands_seen_stage_min` | `stage, count` | `'Headbangers', 4` → saw 4+ Headbangers |
| `bands_seen_stages_min` | `stages, count` | `['Faster', 'Harder'], 6` → saw 6+ across the listed stages |
| `bands_seen_genres_min` | `genres, count` | `['Death Metal', 'Black Metal'], 5` → saw 5+ across the listed genres |
| `bands_seen_before_hour_min` | `hour, count` | `13, 5` → saw 5+ before 1 PM |
| `bands_seen_after_hour_min` | `hour, count` | `23, 2` → saw 2+ after 11 PM |
| `band_seen_named` | `name: string` | `'Alestorm'` → saw Alestorm |
| `location_visit_count_min` | `location, count` | `'metal_place', 1` → visited Metal Place |
| `weak_skips_min` | `count` | `3` → committed 3+ "I am weak" skips |
| `crew_at_location_min` | `location, count` | `'camping', 15` → 15+ crew camping |
| `assigned` | (none) | Godlike manual assignment |

---

## Related Files

- **src/services/badges/registry.ts** — `BADGES[]` array and condition-examples reference
- **src/services/badges/engine.ts** — `buildBadgeContext`, `evaluateBadge`, `getEarnedBadges`
- **src/services/badges/types.ts** — Type definitions
- **src/services/badges/index.ts** — Barrel re-export
- **src/services/badges/badgeContextBuilder.ts** — Pure `buildBadgeContextFromSnapshot()`
- **src/services/badges/persistMetadata.ts** — Persist slug merge + auth metadata patch
- **src/services/livePreview.ts** — `computeCrewLocationCounts` (shared with `/now` grouping)
- **src/hooks/useBadgeCache.ts** — IDB snapshot + window events
- **src/hooks/useBadgePersist.ts** — Drift sync + persist recording
- **src/hooks/useBadgeContext.ts** — Thin composer hook
- **src/__tests__/badges.test.ts**, **persistMetadata.test.ts**, **badgeContextBuilder.test.ts**, **socialSnapshot.test.ts**, **useBadgeContext.test.ts**, **useSocialSnapshot.test.ts** — Condition + hook tests
- **src/components/BadgesDisplay.tsx** — Vest-stack patches (collapsed + expanded), detail modal, fullscreen zoom
- **src/components/ProfilePage.tsx** — Patches section + godlike assign UI
- **src/i18n/Badges_*.json** — All 4 language translations
- **public/badges/** — All badge PNG files
- **docs/ai-wiki/changelog.md** — When badges were added/updated

---

**Last updated:** 2026-05-28 — Phase 31: `useSocialSnapshot`, crew profile cache (`special_badges`), IDB-only vest display.
