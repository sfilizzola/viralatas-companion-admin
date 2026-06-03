# Flow: Playlist Launch

## Purpose

Documents how a vira-lata opens **Setlist Vira-Latas** (`setlist.viralatas.org`) from `/my-picks` with their picked band names pre-filled, so the external app can preview tracks and generate a personal Spotify playlist.

---

## Trigger

User navigates to `/my-picks` and has **≥ 1 picked band**. The `PlaylistLaunchButton` strip appears when visibility rules pass (see below). User taps the strip → browser opens Setlist Vira-Latas in a new tab.

---

## Happy Path (Online, Connected)

```
User opens /my-picks
        │
        ▼
MyPicksPage renders <PlaylistLaunchButton bands={myBands} userName={displayName} />
        │
        ▼
PlaylistLaunchButton useEffect (on mount / when picks change)
  ├─ Early exit if userId missing or bands.length === 0
  ├─ Parallel fetch:
  │    getPlaylistTesting()  → app_settings.playlist_testing
  │    users.role + users.preferred_language
  ├─ Visibility gate:
  │    hidden if playlist_testing=true AND role=normal
  │    visible if playlist_testing=false OR role in {godlike, manager}
  ├─ Build URLSearchParams:
  │    user_name = displayName.slice(0, 20)
  │    bands     = repeated params (one per band.name)
  │    lang      = br → pt-BR, else en
  └─ setUrl(https://setlist.viralatas.org/launch?...)
        │
        ▼
User taps <a target="_blank" rel="noopener noreferrer">
        │
        ▼
Setlist Vira-Latas /launch
  ├─ Shows track preview from band list
  └─ "Generate" → Spotify playlist for user
```

---

## Offline Behavior (Disconnected)

- **Strip may still render** if the mount-time Supabase reads succeed before going offline.
- **No IndexedDB cache** for `playlist_testing` or user role — each page load re-fetches from Supabase.
- If fetch fails (offline on mount), component catches error and returns `null` (strip hidden).
- Tapping the link when offline fails at the network layer (external app unreachable). No local queue.

This is intentional: the button is a convenience deep-link, not core festival coordination data.

---

## Sync Behavior (Reconnect)

No sync queue. On next `/my-picks` visit while online, `useEffect` re-runs and rebuilds the URL from current picks.

---

## Relevant Source Files

| File | Role |
|------|------|
| `src/components/PlaylistLaunchButton.tsx` | Visibility logic, URL construction, render |
| `src/components/PlaylistLaunchButton.module.css` | Teal full-width strip styles |
| `src/pages/MyPicksPage.tsx` | Mounts component below conflict banner (lines ~257, ~423) |
| `src/lib/appSettings.ts` | `getPlaylistTesting()` / `setPlaylistTesting()` |
| `src/components/profile/GodlikeAdminPanel.tsx` | Godlike toggle for `playlist_testing` flag |
| `supabase/migrations/20260522000000_playlist_testing.sql` | `app_settings.playlist_testing` column |

**Design spec:** `docs/superpowers/specs/2026-05-21-playlist-launch-design.md`

---

## Data Flow Diagram

```
┌─────────────────┐     read on mount      ┌──────────────────┐
│ MyPicksPage     │ ─────────────────────► │ Supabase         │
│ (myBands, name) │                        │ app_settings     │
└────────┬────────┘                        │ users (role,lang)│
         │                                 └────────┬─────────┘
         │ props                                      │
         ▼                                              │
┌─────────────────┐     if visible                     │
│PlaylistLaunch   │ ◄──────────────────────────────────┘
│Button           │
└────────┬────────┘
         │ target="_blank"
         ▼
┌─────────────────┐
│ setlist.        │  External PWA — not part of Companion
│ viralatas.org   │  IndexedDB / Supabase sync
└─────────────────┘
```

---

## Edge Cases

| Case | Behavior |
|------|----------|
| 0 picks | Component returns `null` immediately |
| `playlist_testing=true`, role `normal` | Hidden |
| `playlist_testing=true`, role `manager` or `godlike` | Visible (testing mode) |
| `playlist_testing=false` | Visible to all roles with picks |
| Display name > 20 chars | Truncated in `user_name` param |
| Supabase fetch error | Strip hidden (fail closed) |
| User changes picks while on page | `useEffect` deps `[userId, bands, userName]` rebuild URL |
| Ceremony bands in picks | Included in URL if present in `myBands` array (same as page data) |

---

## Important Hooks / Services / Repositories

- **`getPlaylistTesting()`** — reads singleton `app_settings` row; defaults to `true` on error.
- **`useAuth()`** — provides `session.user.id` for role lookup.
- **`useI18n('MyPicksPage')`** — `generateSetlist`, `generateSetlistSub` label keys.
- **No repository layer** — component calls Supabase directly for role/language (same pattern as duck flag reads).

---

## Open Questions

- When should `playlist_testing` graduate to always-on? Post-graduation removes flag column, role check, and admin toggle — component stays permanently.
- Should band names be URL-encoded beyond `URLSearchParams` defaults? Current impl relies on browser encoding.
- Should the strip show when offline if last-known flag state was cached? Currently no — always requires live read.

---

**Last updated:** 2026-05-22
