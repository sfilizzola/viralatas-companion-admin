# Genre Collapse — Old → New Mapping

**Phase:** 25 · **Status:** Complete  
**Last updated:** 2026-05-24

This page is the **lookup table** for “what happened to my old genre tag?”  
For **why** we collapsed genres, see [ADR: Genre Collapse](decisions/genre-collapse-canonical-labels.md).

---

## Source of truth (code)

| Artifact | What it holds |
|----------|----------------|
| [`src/services/genreGuide.ts`](../../src/services/genreGuide.ts) | `GENRE_COLLAPSE_MAP` (old → canonical), `collapseGenre()`, in-app `GENRE_GUIDE` |
| This wiki page | Human-readable mirror of the map (keep in sync when editing seed) |

**Runtime rules** (not every old string is listed explicitly):

1. **Exact match** in `GENRE_COLLAPSE_MAP` → mapped canonical label  
2. **Prefix** `Metal Battle` → `Metal Battle` (all country variants, e.g. `Metal Battle Finland`)  
3. **Anything else** → `Metal` (fallback via `collapseGenre()`)

---

## Quick view — canonical ← absorbed tags

| Canonical label | Old tags merged into it |
|-----------------|-------------------------|
| **Heavy Metal** | Traditional Heavy Metal, Speed Metal, Neoclassical Metal |
| **Black Metal** | Black / Doom Metal, Black Metal (Bathory tribute), Black Metal / Grindcore, Blackgaze, Post-Black Metal, Viking Metal |
| **Death Metal** | Death Metal / Grindcore, Melodic Death Metal, Goregrind, Grindcore, Deathcore |
| **Thrash Metal** | Crossover Thrash, Crossover Metal |
| **Power Metal** | Symphonic Metal |
| **Folk Metal** | Folk / Brass Metal, Folk, Pirate Metal, Ska / Reggae Metal, Humppa |
| **Doom Metal** | Gothic Metal, Gothic / Industrial Metal, Sludge Metal, Post-Metal, Stoner Rock, Occult Rock |
| **Metalcore** | Melodic Hardcore |
| **Hard Rock** | AOR, AOR / Hard Rock, Rock, Medieval Rock, Alternative Rock |
| **Punk** | Punk Rock, Punk Metal, Horror Punk, Folk Punk |
| **Party Metal** | *(unchanged — only Alestorm + Airbourne)* |
| **Metal Battle** | Any string starting with `Metal Battle` |
| **Metal** | TBD, Generic Metal, Children's Metal, Alternative Metal, Industrial Metal, Industrial / Gothic, Groove Metal, Nu Metal, Rap Metal, Progressive Metal, Visual Kei Metal, Dark Electronic, Orchestral / Film Music, and any unlisted tag |

---

## Full lookup — old tag → canonical label

Sorted alphabetically by **old** genre string.

| Old genre (pre–Phase 25) | Became (canonical) |
|--------------------------|-------------------|
| AOR | Hard Rock |
| AOR / Hard Rock | Hard Rock |
| Alternative Metal | Metal |
| Alternative Rock | Hard Rock |
| Black / Doom Metal | Black Metal |
| Black Metal | Black Metal |
| Black Metal (Bathory tribute) | Black Metal |
| Black Metal / Grindcore | Black Metal |
| Blackgaze | Black Metal |
| Children's Metal | Metal |
| Crossover Metal | Thrash Metal |
| Crossover Thrash | Thrash Metal |
| Dark Electronic | Metal |
| Death Metal | Death Metal |
| Death Metal / Grindcore | Death Metal |
| Deathcore | Death Metal |
| Doom Metal | Doom Metal |
| Folk | Folk Metal |
| Folk / Brass Metal | Folk Metal |
| Folk Metal | Folk Metal |
| Folk Punk | Punk |
| Generic Metal | Metal |
| Goregrind | Death Metal |
| Gothic / Industrial Metal | Doom Metal |
| Gothic Metal | Doom Metal |
| Grindcore | Death Metal |
| Groove Metal | Metal |
| Hard Rock | Hard Rock |
| Heavy Metal | Heavy Metal |
| Horror Punk | Punk |
| Humppa | Folk Metal |
| Industrial / Gothic | Metal |
| Industrial Metal | Metal |
| Medieval Rock | Hard Rock |
| Melodic Death Metal | Death Metal |
| Melodic Hardcore | Metalcore |
| Metal | Metal |
| Metal Battle * | Metal Battle |
| Metalcore | Metalcore |
| Neoclassical Metal | Heavy Metal |
| Nu Metal | Metal |
| Occult Rock | Doom Metal |
| Orchestral / Film Music | Metal |
| Party Metal | Party Metal |
| Pirate Metal | Folk Metal |
| Post-Black Metal | Black Metal |
| Post-Metal | Doom Metal |
| Power Metal | Power Metal |
| Progressive Metal | Metal |
| Punk | Punk |
| Punk Metal | Punk |
| Punk Rock | Punk |
| Rap Metal | Metal |
| Rock | Hard Rock |
| Ska / Reggae Metal | Folk Metal |
| Sludge Metal | Doom Metal |
| Speed Metal | Heavy Metal |
| Stoner Rock | Doom Metal |
| Symphonic Metal | Power Metal |
| TBD | Metal |
| Thrash Metal | Thrash Metal |
| Traditional Heavy Metal | Heavy Metal |
| Viking Metal | Black Metal |
| Visual Kei Metal | Metal |
| *(any other string)* | Metal |

`*` Prefix rule: `Metal Battle Finland`, `Metal Battle Germany`, etc. → **Metal Battle**

---

## Examples

| You used to filter by… | Filter / card shows… |
|------------------------|----------------------|
| Melodic Death Metal | Death Metal |
| Goregrind | Death Metal |
| Pirate Metal | Folk Metal |
| Gothic Metal | Doom Metal |
| Symphonic Metal | Power Metal |
| Groove Metal | Metal |
| Metal Battle Finland | Metal Battle |
| TBD / Generic Metal | Metal |

---

## Related pages

- [Domain model — Band.genre](domain-model.md#band)
- [ADR: Genre Collapse](decisions/genre-collapse-canonical-labels.md) — decision rationale
- [Lineup](lineup.md) — band rows use canonical genres only
- [Badges](badges.md) — genre conditions match canonical strings exactly
- [Phase 25 history](phases-history.md) — deliverables and acceptance criteria

**Implementation spec (outside ai-wiki):** [`docs/superpowers/specs/2026-05-24-genre-collapse-design.md`](../superpowers/specs/2026-05-24-genre-collapse-design.md)
