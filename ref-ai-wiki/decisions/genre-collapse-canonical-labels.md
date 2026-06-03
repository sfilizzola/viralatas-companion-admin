# ADR: Genre Collapse to 13 Canonical Labels

**Status**: Accepted (Phase 25, 2026-05-24)

**Date**: 2026-05-24

**Deciders**: Product team, engineering lead

---

## Context

The Wacken 2026 lineup seed carried **~93 distinct `genre` strings** on `public.bands` — fine-grained subgenre tags from the official lineup (Melodic Death Metal, Goregrind, Blackgaze, Metal Battle Finland, TBD, etc.).

That granularity created two problems:

1. **Schedule filter UX** — The genre control was a native `<select>` with ~90+ options. On mobile at the festival, scrolling that list is unusable.
2. **Badge / filter consistency** — Badge conditions match `Band.genre` by exact string. Subgenre proliferation made “genre family” badges harder to reason about without adding more condition types.

Options considered:

1. **Keep all subgenre strings; improve UI only** — e.g. searchable combobox, grouped optgroups. Still ~93 labels to maintain; optgroups don’t fix thumb-scrolling on a muddy field.
2. **Add a `genre_group` (or `canonical_genre`) column** — Preserve raw Wacken tag + derived bucket. Requires schema migration, sync/indexedDB shape change, and dual-field logic everywhere genre is shown or filtered.
3. **Collapse in-place: rename `genre` to 13 canonical labels** — Single field, no migration, deploy via existing `seed:bands:sync --apply`. Users lose per-subgenre filter granularity; guide UI explains mapping.
4. **Drop genre entirely** — Simplest data model; loses filter + all genre-based badges.

---

## Decision

**Rename band `genre` values in-place to 13 canonical labels. No new column.**

Canonical set (alphabetical; `Metal Battle` pinned last in filter UI only):

`Black Metal` · `Death Metal` · `Doom Metal` · `Folk Metal` · `Hard Rock` · `Heavy Metal` · `Metal` · `Metal Battle` · `Metalcore` · `Party Metal` · `Power Metal` · `Punk` · `Thrash Metal`

**Source of truth for mapping:**

| Artifact | Role |
|----------|------|
| `src/services/genreGuide.ts` | `GENRE_COLLAPSE_MAP`, `collapseGenre()`, `GENRE_GUIDE`, `CANONICAL_GENRES` |
| [`docs/ai-wiki/genre-collapse-mapping.md`](../ai-wiki/genre-collapse-mapping.md) | Wiki lookup: old tag → canonical label |
| `docs/superpowers/specs/2026-05-24-genre-collapse-design.md` | Phase spec summary table |
| `supabase/seed/bands.ts` + `docs/ai-wiki/lineup.md` | Authoritative band rows after collapse |

**Deploy path:** Edit seed + lineup → `npm run seed:bands:sync` (dry-run) → `--apply`. Zero pick loss — `user_picks` FKs band `id`, not genre string.

**User-facing explanation:** Static genre guide in schedule filter drawer (`GenreGuideCollapsible`) — not computed from live DB (offline-safe). Subgenre proper nouns in guide are not translated; canonical labels and chrome are i18n’d in `SchedulePage_*.json`.

---

## Rationale

### Why in-place rename (not a new column)

✅ **No schema change** — Avoids migration, IndexedDB store changes, and dual-field display logic.

✅ **Reuses Phase 24 sync** — Genre updates are ordinary field updates on existing `slot_id` rows; picks stay attached.

✅ **Single mental model** — UI, badges, and DB all read one string. No “display genre vs filter genre” split.

✅ **Mobile-first** — 13 options enable **pill filters** (replacing native `<select>`), which was the primary UX goal.

### Why 13 buckets (not fewer or many more)

✅ **Matches metal listener categories** — Enough granularity for “I want thrash” vs “I want doom” without Wacken’s tag explosion.

✅ **Badge calibration** — Existing genre badges (`death-metal`, `power-metal`, `party-metal`) stay meaningful after merge counts increase inside buckets.

✅ **Party Metal exception preserved** — Product decision: only Alestorm + Airbourne carry `Party Metal`; `party-metal` badge (count 2) unchanged.

### Why static guide (not live aggregation)

✅ **Offline-first** — Guide ships in the bundle; works with no signal.

✅ **Stable copy** — Explains *policy* (“Grindcore is under Death Metal”), not a dynamic query that shifts if seed edits.

---

## Mapping rules (high level)

Full table → `GENRE_COLLAPSE_MAP` in `src/services/genreGuide.ts`.

| Rule | Example |
|------|---------|
| Exact map entry | `Melodic Death Metal` → `Death Metal` |
| Prefix rule | Any `Metal Battle *` → `Metal Battle` |
| Catch-all | Unknown / TBD / `Generic Metal` / niche tags → `Metal` |
| Locked genre | `Party Metal` — only Alestorm + Airbourne (badge contract) |
| Notable merges | `Pirate Metal` → `Folk Metal`; `Gothic Metal` → `Doom Metal`; `Symphonic Metal` → `Power Metal`; `Grindcore` / `Goregrind` → `Death Metal` |

**Badge threshold review (Phase 25):**

- `death-metal`, `power-metal` — keep count **3** (more bands per bucket after merge; threshold still fair)
- `party-metal` — **unchanged** (genre + count 2)

---

## Consequences

### Positive

✅ Schedule genre filter usable on mobile (pills, ≤13 options)

✅ Seed and DB stay aligned with one canonical vocabulary

✅ Genre guide reduces “where did my subgenre go?” support friction

✅ No pick loss; no migration downtime

### Negative

❌ **Subgenre filter granularity lost** — Cannot filter “Grindcore only”; must use search or accept `Death Metal` bucket.

❌ **Semantic compromise** — Some merges are debatable (e.g. Gothic → Doom, Pirate → Folk). Documented in guide, not per-band on cards.

❌ **Exact-match badges** — Conditions must use canonical strings only; pre-collapse subgenre names in badge config would silently fail.

❌ **Stale localStorage filters** — Users who saved a pre-collapse genre in schedule filter storage get cleared filter (no auto-remap toast in v1).

---

## Tradeoffs accepted

### No `genreGroup` column

**Tradeoff:** Cannot show both “official Wacken tag” and “filter bucket” without re-importing raw tags elsewhere.

**Acceptance:** Official subgenre tags were primarily for filtering, not display identity. Band **name** + **stage/time** carry discovery weight; cards show canonical genre only.

### Doom absorbs Gothic

**Tradeoff:** Gothic Metal fans filtering “Doom” see Gothic bands; pure doom fans see gothic-tagged acts.

**Acceptance:** Chosen in Phase 25 planning; documented in genre guide. Alternative (separate Gothic bucket) would push toward 14+ labels for marginal gain.

### Metal as catch-all

**Tradeoff:** `Metal` bucket is heterogeneous (Industrial, Nu Metal, Progressive, TBD placeholders, Heavysaurus, etc.).

**Acceptance:** Better than 20 one-off canonical labels; `genreGuideMetalNote` footnote in UI explains catch-all intent.

---

## UI decisions (locked in Phase 25)

- Genre filter: **single-select pills** in filter drawer (not native `<select>`)
- Guide: **inline `Collapsible`** below pill row — not nested modal on drawer (z-index / mobile stacking)
- **Out of scope:** per-band “formerly tagged as …”, push notification, blocking banner, guide search

See `public/vira-lata-ds.html` (genre pills + `GenreGuideCollapsible`) and `docs/ai-wiki/routes.md` (/schedule filters).

---

## Implementation references

| File | Purpose |
|------|---------|
| `src/services/genreGuide.ts` | Collapse map + guide data |
| `src/components/BandFilters.tsx` | Genre pills |
| `src/components/GenreGuideCollapsible.tsx` | Inline guide |
| `scripts/apply-genre-collapse.ts` | One-shot seed/lineup rename helper |
| `docs/ai-wiki/domain-model.md` | `Band.genre` invariant |
| `docs/ai-wiki/badges.md` | Genre condition types post-collapse |

---

## Alternatives reconsidered

### Searchable genre combobox (keep ~93 strings)

**Why not:** Still maintains 93-tag operational burden; search is a crutch at Wacken (one hand, glare, gloves). Pills at 13 are faster to tap.

### `bands_picked_genres_min` only (no collapse)

**Why not:** Multi-genre badge conditions exist (Idea 6) but don’t fix filter UX or reduce seed inconsistency. Collapse addresses root data + UI together.

---

## Related decisions

- **Phase 24 — Lineup sync via `slot_id`** — Non-destructive genre renames deploy through `seed:bands:sync`
- **ADR: IndexedDB as Primary Store** — Static guide must work offline
- **`docs/ai-wiki/badges.md`** — Genre conditions use exact canonical strings

---

## Revision history

- **2026-05-24**: Accepted and implemented in Phase 25; prod sync confirmed 0 genre updates needed (DB already aligned), 0 picks affected.

---

**Last updated:** 2026-05-24
