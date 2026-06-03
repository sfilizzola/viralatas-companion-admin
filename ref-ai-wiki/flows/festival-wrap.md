# Flow: Festival Wrap (`/wrap`)

## Purpose

After Wacken ends, each vira-lata gets a private scrollable recap at `/wrap` — personal stats first, 1–2 vira-latas highlights at the end. All numbers are computed client-side from IndexedDB; no LLM prose; no schema change.

---

## Trigger

- **Discovery:** Post-festival teaser banner on `/now` and `/profile` when `isFestivalEnded(now(), bands)` and not dismissed.
- **Direct access:** `/wrap` is always reachable when logged in (no festival-ended route gate — godlike QA and bookmarking).

---

## Happy Path (Online, Connected)

1. User logs in; IndexedDB already holds bands, picks, missed marks, crew users, presence.
2. User taps teaser banner (or navigates to `/wrap` directly).
3. `useFestivalWrapStats` composes `useSocialSnapshot` + `useAllRatingsCache` (same IDB cells as `/now` and live vest; no Supabase stats reads).
4. `buildFestivalWrapStats()` delegates to `buildBadgeContextFromSocialSnapshot` + `buildRatingStatsSnapshot` + `getEarnedBadges` + crew helpers.
5. `WrapPage` renders a welcome gate, stat sections (optional **Ratings** after Chaos, optional assigned-patches section), patches vest pile, and a closing thanks gate — **7–9** full-viewport scroll sections with progress dots.
6. **Patches** section CTA **Open vest** links to `/profile?vest=open#vest` where `BadgesDisplay` shows the full collection.
7. **Finale** thanks section signs off with Wacken 2027 (Rain or Shine) and CTA **Back to the App** → `/now`.

---

## Offline Behavior (Disconnected)

- Stats read entirely from IndexedDB after first load — page works fully offline.
- Teaser dismiss uses `localStorage` key `viralatas:wrap-dismissed-2026` (per device, no sync).
- No wrap stats queue or Supabase dependency.

---

## Sync Behavior (Reconnect)

- Wrap stats refresh when underlying IDB data changes (picks, missed, presence, crew events) via `useSocialSnapshot` cache cells — same as badges and `/now`.
- No dedicated wrap sync layer.

---

## Relevant Source Files

| File | Role |
|------|------|
| `src/services/festivalWrap.ts` | Pure `buildFestivalWrapStats()` + types |
| `src/services/ratingStats.ts` | Pure `buildRatingStatsSnapshot()` — wrap + badge context |
| `src/hooks/useAllRatingsCache.ts` | Read-only crew-wide ratings IDB cell |
| `src/hooks/useFestivalWrapStats.ts` | Composes `useSocialSnapshot` + `useAllRatingsCache` + `useMissedBands` |
| `src/hooks/useSocialSnapshot.ts` | Shared IDB load + `buildSocialSnapshot()` (Phase 31) |
| `src/hooks/useWrapTeaserVisible.ts` | Teaser gate: `isFestivalEnded(now(), bands)` + dismiss |
| `src/lib/wrapDismiss.ts` | `viralatas:wrap-dismissed-2026` helpers |
| `src/pages/WrapPage.tsx` | Welcome + stat sections + patches + finale thanks; scroll-snap; IntersectionObserver progress |
| `src/components/wrap/WrapProgress.tsx` | Fixed progress dots (7–9 depending on optional Ratings + Assigned) |
| `src/components/wrap/WrapTeaserBanner.tsx` | Variant B discovery bar |
| `src/pages/RightNowPage.tsx` / `ProfilePage.tsx` | Teaser mount + time-override reactivity |
| `src/components/profile/TimeTravelSection.tsx` | Godlike wrap QA disclaimer |
| `src/services/time.ts` | `isFestivalEnded()`, `now()`, time override event |
| `src/__tests__/festivalWrap.test.ts` | Stats edge cases |
| `src/__tests__/wrapDismiss.test.ts` | Dismiss key round-trip |

---

## Data Flow Diagram

```
User → /wrap
  → useFestivalWrapStats(userId)
    → useSocialSnapshot (IndexedDB: picks, bands, crew, presence, configs)
    → useAllRatingsCache (IndexedDB: user_band_ratings)
    → buildFestivalWrapStats(idbSnap, userId, authUser, social, allRatings)
      → buildBadgeContextFromSocialSnapshot (seen/picked/skipped semantics)
      → buildRatingStatsSnapshot (personal + crew rating highlights)
      → getEarnedBadges / computeBandOverlaps / crew Jaccard
  → WrapPage (presentation only)
```

Teaser path:

```
/now or /profile
  → useWrapTeaserVisible()
    → loadBands() from IDB
    → isFestivalEnded(now(), bands) && !isWrapDismissed()
  → WrapTeaserBanner → Link /wrap
```

---

## Edge Cases

| Case | Behavior |
|------|----------|
| Zero picks | Friendly empty state — not a broken multi-section layout |
| Friend user (`is_friend`) | `locationVisitsTotal === null` — location stats never rendered |
| Sparse missed data | Skip count may be 0; page still shows picks/seen |
| Godlike D+1 time travel | Teaser appears without reload; `/wrap` always open |
| Dismiss teaser | `viralatas:wrap-dismissed-2026` suppresses banner only |
| Ceremony picks | Excluded from picked/seen stats (badge engine parity) |

---

## Important Hooks / Services / Repositories

- **`buildFestivalWrapStats`** — single stats builder; must not duplicate badge seen-band logic.
- **`useSocialSnapshot`** — shared IDB + social snapshot loader; wrap hook does not call persist side effects.
- **`isFestivalEnded`** — shared with Phase 29 consolidation gate; uses `now()` for godlike override.

---

## Gating Table

| Surface | `isFestivalEnded(now(), bands)`? | Notes |
|---------|----------------------------------|-------|
| Teaser on `/now`, `/profile` | **Yes** | Plus `!isWrapDismissed()` |
| Route `/wrap` | **No** | Direct URL always when logged in |

---

## Open Questions

- Percentile rank copy (v2) — optional when crew size is small.
- Public share URL / server snapshot — out of scope v1.
- Duck quack stats — not in IndexedDB.

---

## Acceptance Criteria (Phase 30)

- [x] A2 scroll-snap recap: welcome gate + stat sections (epigraphs) + optional assigned patches + patches vest + finale thanks (7–8 sections, 7–9 progress dots)
- [x] Teaser Variant B on `/now` and `/profile`
- [x] Stats match badge engine semantics
- [x] Offline after first IDB load
- [x] Teaser gated; `/wrap` route open anytime
- [x] Godlike D+1 + Time Travel disclaimer (4 locales)
- [x] **vira-latas** copy in all locales (user-approved section phrases)
- [x] Friend users hide location stats
- [x] Empty picks friendly state
- [x] Open vest → `/profile?vest=open#vest`; finale CTA → `/now`
- [x] Design System documents wrap anatomy

---

**Last updated:** 2026-05-28 — Phase 31: `useFestivalWrapStats` uses `useSocialSnapshot` (replaces `useBadgeCache`).
