# Festival Minimap Flow

## Purpose

Document how vira-latas' live positions are derived and displayed on the `/map` screen — a static cartoon map of the Wacken festival grounds with avatar dots placed at each person's current stage, camping, or Metal Place zone.

---

## Trigger

The user taps the glyph F "Pin + bolt" button in the `/now` header (beside the timestamp). This navigates to `/map`, a private route that renders `MapPage` and its `MinimapOverlay` child.

---

## Happy Path (Online, Connected)

1. User taps the glyph F button on `/now`.
2. React Router navigates to `/map` (protected by `PrivateRoute`).
3. `MapPage` mounts and calls `useSocialSnapshot(useNow(30_000))` to get the same `crewGroups` array that `/now` uses.
4. `useSocialSnapshot` returns the latest snapshot from IndexedDB (bands, picks, presence, crew users, config) — no new Supabase reads.
5. `buildPlacements(crewGroups, MINIMAP_ZONES, selfUserId)` converts each group's members into a `Placement[]` array with absolute `xPct`/`yPct` coordinates.
6. `MinimapOverlay` renders `public/infield_map.png` as a base image, then positions one avatar `<button>` per placement as absolutely-positioned children (fractional coordinates scale with the image).
7. The current user's dot (`isSelf`) is rendered last and highlighted with a gold ring — never buried under other dots.
8. Tapping a dot toggles a name pill (single selection); tapping the map or the same dot again dismisses it. The self dot's pill shows by default.
9. `useNow(30_000)` re-fires every 30 seconds, so derived positions shift as bands start and end — matching the clock granularity of `/now`.
10. User taps the back arrow to return to `/now`.

---

## Offline Behavior (Disconnected)

The minimap is fully offline-capable. All inputs to `buildPlacements` come from IndexedDB:

- `crewGroups` derives from cached picks, presence, bands, and crew-user profiles in IndexedDB.
- `public/infield_map.png` is precached by the Service Worker (appears in the Workbox precache manifest after `npm run build`).
- `OfflineBanner` appears at the top of the page when `navigator.onLine` is false.
- A static offline note (`t('offlineNote')`) is also rendered below the header.

Positions shown are the last-known state from IndexedDB — they do not update in real time while offline, but they do not go blank or crash.

---

## Sync Behavior (Reconnect)

No minimap-specific sync logic exists. The minimap is a pure presentation layer over data already managed by the existing sync pipeline:

- When the device comes back online, `runReconnectSync()` (via `SyncOrchestration`) flushes offline queues and pulls latest presence, picks, and crew from Supabase into IndexedDB.
- `useSocialSnapshot` re-reads IndexedDB and emits updated `crewGroups`, which triggers a `MapPage` re-render and updated dot positions within the next `useNow(30_000)` tick.

---

## Relevant Source Files

| File | Role |
|------|------|
| `src/pages/MapPage.tsx` | Route container; calls `useSocialSnapshot`, derives `placements`, handles offline state |
| `src/components/map/MinimapOverlay.tsx` | Presentation-only; renders image + avatar buttons; tap-to-toggle pill |
| `src/components/map/minimapZones.ts` | Single source of zone geometry: `MINIMAP_ZONES`, `stageToZone()`, `groupKindToZone()` |
| `src/services/minimapPlacement.ts` | Pure function `buildPlacements(crewGroups, zones, selfUserId)` |
| `src/services/userColor.ts` | `colorForUserId(id)` — deterministic color per user for initials fallback |
| `src/pages/RightNowPage.tsx` | Glyph F "Pin + bolt" entry button in header; navigates to `/map` |
| `src/i18n/MapPage_{br,en,es,de}.json` | Page strings: `title`, `subtitle`, `back`, `offlineNote`, `loading`, `empty`, `mapAlt` |
| `src/i18n/RightNowPage_{br,en,es,de}.json` | `mapButton` key for the glyph F button label |
| `public/infield_map.png` | Optimized cartoon Wacken infield map (628 KB, precached by SW) |
| `src/App.tsx` | `/map` route behind `PrivateRoute` |
| `src/hooks/useSocialSnapshot.ts` | Shared crew derivation hook; composes IDB caches + `buildSocialSnapshot()` |

---

## Data Flow Diagram

```
RightNowPage (/now)
  └─ glyph F button tap
       └─ navigate("/map")

MapPage
  ├─ useNow(30_000)               → clock tick (same granularity as /now)
  ├─ useSocialSnapshot(now)       → crewGroups[] from IndexedDB
  │     ├─ useCrewUsersCache()    → crew_users IDB store
  │     ├─ usePresenceCache()     → user_presence IDB store
  │     ├─ useAllPicks()          → user_picks IDB store
  │     ├─ useBands()             → bands IDB store
  │     └─ buildSocialSnapshot()  → pure derivation (same as /now)
  ├─ useAuth()                    → selfUserId
  └─ buildPlacements(             → Placement[]
        crewGroups,
        MINIMAP_ZONES,
        selfUserId
     )
          ├─ zoneForGroup()       → stageToZone() | groupKindToZone()
          └─ layoutInBox()        → phyllotaxis (sunflower spiral) coords

MinimapOverlay
  ├─ <img src="/infield_map.png"> → static asset (precached)
  └─ <button> per Placement       → absolute position at xPct/yPct
        ├─ isSelf → gold ring + default name pill
        └─ tap toggle → name pill (single selection)
```

---

## Edge Cases

- **Image load failure** — `MinimapOverlay` listens for `onError` on the `<img>` and replaces it with a flat backdrop `<div role="img">`. Avatar dots still render at their fractional positions over the fallback.
- **Zero placements** — If `crewGroups` is empty (no picks, no presence, no crew), `buildPlacements` returns `[]` and `MapPage` shows `t('empty')` below the overlay.
- **Welcome to the Jungle stage** — `stageToZone('Welcome to the Jungle')` returns `'wasteland'` (Decision 6). The stage shares the Wasteland zone box; no separate artwork region exists.
- **Unknown stage** — Any unrecognized `bands.stage` string falls through `stageToZone` to `'elsewhere'`, landing in the left-margin box where dots never overlap a real stage or camping zone.
- **`is_friend` users** — Friends are absent from camping, Metal Place, and Lost crew groups (inherited from `/now` grouping rules). They appear only in band-stage groups when their picked band is live. No extra filtering happens in `buildPlacements`; the inherited absence is the correct behavior.
- **Dot crowding** — `layoutInBox` uses a phyllotaxis (sunflower-spiral) algorithm with an `INSET` margin so up to ~20 dots in the same zone spread evenly without fully occluding each other. The layout is deterministic (keyed by `userId.localeCompare`) so dots stay stable across re-renders.
- **Self burial** — `buildPlacements` sorts non-self dots before self (`isSelf` last) so the gold-ring self dot is always rendered on top in z-index stacking.

---

## Important Hooks / Services / Repositories

- **`useSocialSnapshot(now)`** — The only data hook in `MapPage`. Reuses the same derivation path as `/now` and live vest, so dot positions are always consistent with what the user sees elsewhere in the app. Source: `src/hooks/useSocialSnapshot.ts`.
- **`buildPlacements(crewGroups, zones, selfUserId)`** — Pure function; no Supabase reads, no side effects. Maps each `CrewLiveGroup` member to a `Placement` with fractional `xPct`/`yPct`. Source: `src/services/minimapPlacement.ts`.
- **`MINIMAP_ZONES`** — Record of 10 `FractionalBox` entries (fractional inset bounding boxes over the map image). Single source of zone geometry — agents must update this file when the map asset changes. Source: `src/components/map/minimapZones.ts`.
- **`stageToZone(stage)`** / **`groupKindToZone(kind)`** — Map stage names and non-band group kinds to zone IDs. Source: `src/components/map/minimapZones.ts`.
- **`colorForUserId(id)`** — Deterministic HSL color for the initials fallback when `avatar_url` is null. Source: `src/services/userColor.ts`.

---

## Open Questions

- Should there be a zoom or pinch-to-zoom gesture on the map image for better readability on small screens?
- Should the minimap be reachable from `/popular` or the bottom nav in a future phase?
- If the map asset (`public/infield_map.png`) is ever updated or replaced, zone boxes in `MINIMAP_ZONES` must be re-tuned — no automated test covers this (visual sign-off only).
