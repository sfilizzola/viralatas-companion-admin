# Routes & Navigation

## Purpose

Document all app routes, their purpose, access control, and key components.

---

## Relevant Source Files

- `src/App.tsx` — Route definitions (React Router setup)
- `src/components/PrivateRoute.tsx` — Auth guard component
- `src/components/BottomNav.tsx` — Navigation tabs
- `src/pages/*.tsx` — Page components (8 routes incl. `/wrap`)

---

## Route Map

```
/login               → LoginPage (public)
/register            → RegisterPage (public)
/now                 → RightNowPage (protected) ← landing page after auth
/schedule            → LineupPage (protected) — `LineupPage.tsx`; URL unchanged
/my-picks            → MyWackenPage (protected) — `MyWackenPage.tsx`; URL unchanged
/popular             → PopularPage (protected)
/announcements       → AnnouncementsPage (protected)
/map                 → MapPage (protected) — live vira-lata minimap; reached via glyph F on /now
/profile             → ProfilePage (protected)
/wrap                → WrapPage (protected) — festival recap; no festival-ended route gate
/*                   → Redirect to /now
```

---

## Public Routes

### /login

**Component**: `src/pages/LoginPage.tsx`

**Purpose**: User signs in with email/password

**Features**:
- Email + password inputs
- "Sign up" link
- Error message display
- Loading state
- Persists session to IndexedDB

**Flow**:
1. User enters email/password
2. Calls `supabase.auth.signInWithPassword()`
3. Session persisted to IndexedDB via custom storage adapter
4. useAuth hook detects session
5. Redirect to `/now`

**Offline**: Cannot login offline (requires Supabase Auth).

---

### /register

**Component**: `src/pages/RegisterPage.tsx`

**Purpose**: User creates account

**Features**:
- Email + password inputs
- Email confirmation (if configured)
- "Already have account?" link
- Error handling
- Password strength hints

**Flow**:
1. User enters email/password
2. Calls `supabase.auth.signUp()`
3. Trigger `handle_new_user()` creates `users` table row
4. Auth state updated
5. Session persisted to IndexedDB
6. Redirect to `/now`

**Server-side**:
- Database trigger `handle_new_user()` runs:
  - Sets role='godlike' for sfilizzola@gmail.com
  - Sets role='normal' for everyone else
  - Sets preferred_language from metadata (default 'br')

---

## Protected Routes

All protected routes require authentication. Guarded by `<PrivateRoute>` component:

```typescript
// src/components/PrivateRoute.tsx
export default function PrivateRoute({ children }: Props) {
  const { session, loading } = useAuth();

  if (loading) return <LoadingSpinner />;  // Hydrating session from IDB
  if (!session) return <Navigate to="/login" />;
  return children;
}
```

**How it works**:
1. Check if session exists in IndexedDB (via useAuth hook)
2. While loading (first check), show spinner
3. If no session, redirect to login
4. If session exists, render protected component

---

### /now (RightNowPage)

**Component**: `src/pages/RightNowPage.tsx`

**Alias**: Landing page after login (default route)

**Purpose**: Live view of what band is happening now, what the user and crew are watching

**Key Features**:
- **Current/Next band for user** — What the user picked that's happening now/next
- **Crew grid** — Where everyone is (camping vs. Metal Place)
- **Live attendance** — Other users watching the same band
- **Conflict warnings** — If user picked overlapping bands
- **Time travel** (godlike only) — Jump to different festival day/time for testing
- **Offline banner** — Show when offline
- **Latest announcement banner** — Most recent mural post

**Data Flows**:
- `useAuth()` — Current user
- `useNow()` — Current time (with godlike override)
- `useNowData()` — Current band for user + next
- `usePickCounts()` — Live attendance per band
- `useMyPicks()` — User's picks
- `useBandConflicts()` — Overlapping bands

**Realtime**:
- Subscribed to user_picks changes (attendance updates)
- Subscribed to user_presence changes (crew location)
- Subscribed to announcements changes (latest post)

---

### /schedule (LineupPage)

**Component**: `src/pages/LineupPage.tsx` (i18n namespace `SchedulePage`; CSS `SchedulePage.module.css`)

**Purpose**: Browse full band lineup with filters

**Key Features**:
- **Full band grid** — All bands across 4 days, 8 stages
- **Filters**:
  - By stage (Faster, Harder, Louder, W.E.T., etc.)
  - By genre — 13 canonical labels as single-select pills (+ inline genre guide in filter drawer; see Phase 25)
  - By day (Wed, Thu, Fri, Sat)
  - By time (hour range)
  - By search (band name, substring)
- **Band card** — Shows:
  - Name, stage, time
  - Current attendance count
  - User's pick status (checked/unchecked)
  - Stage color indicator
  - Pending chip if offline
- **Band detail modal** — On tap:
  - Full band info
  - Genre, stage, time window
  - User's attendance
  - Crew attendance breakdown (avatars)
  - Conflict warnings
  - "Não vi essa banda" toggle

**Offline**: Fully functional (cached bands + cached attendance).

---

### /my-picks (MyWackenPage)

**Component**: `src/pages/MyWackenPage.tsx` (i18n namespace `MyPicksPage`)

**Purpose**: User's personal schedule (only bands they picked)

**Key Features**:
- **Grouped by day** — Upcoming → optional **already played today** divider → ended inline (A2); no Saw / Didn't See footer
- **Attendance** — Ended rows: Attended/Missed chip + teal/amber stripe; opt-out via band modal
- **Conflict chips** — Upcoming rows only; header conflict/overlap counts exclude ended picks
- **Conflict banner** — If 3+ upcoming conflicts, warning at top
- **Coach banner** — `MyWackenCoachBanner` when ≥1 ended pick; dismiss once via `localStorage` (`viralatas:my-wacken-ended-coach-dismissed`)
- **Playlist Launch strip** — `PlaylistLaunchButton` (post-festival / non-active festival). See [Flow: Playlist Launch](flows/playlist-launch.md).
- **Offline** — IndexedDB-first; pending pick chips; playlist strip needs online flag read on mount

**Data Flows**:
- `useMyPicks()` — User's picked band IDs
- `useBandConflicts()` — Overlap detection
- `useNow()` — Highlight current/past/future bands
- `usePickCounts()` — Live attendance on detail modal
- `PlaylistLaunchButton` — Direct Supabase read for `playlist_testing` + user role (not IndexedDB)

---

### /popular (PopularPage)

**Purpose**: Bands sorted by crew popularity (total picks)

**Key Features**:
- **Ranking** — Bands sorted by attendance count (descending)
- **Avatar clusters** — Show up to N users picking this band
  - Avatars grouped by crew member
  - Tooltip on hover with name + count
- **Band card** — Same as /schedule
- **Detail modal** — Same as /schedule

**Offline**: Shows cached attendance (stale if offline for hours).

---

### /announcements (AnnouncementsPage)

**Component**: `src/pages/AnnouncementsPage.tsx`

**Purpose**: Mural-style announcement board

**Key Features**:
- **Text input** — Post a message (max ~500 chars, enforced in UI)
- **Announcement grid** — Cards in reverse chronological order
  - Avatar + author name + role chip
  - Text content
  - Timestamp (formatted as "5 min ago", "2h ago", "DD/MM")
  - Delete button (author + manager+)
  - Reply button (future feature)
- **Soft moderation**:
  - Manager can soft-delete other users' posts
  - Posts marked deleted are hidden (soft-delete timestamp set)
- **Offline queue**:
  - Posts made offline queued to pending_announcements
  - Show "⏳ Pending" chip until synced
  - On reconnect, flushed to Supabase

**Realtime**:
- New posts appear within ~3s
- Deleted posts disappear (soft-delete via Realtime)

**Offline**:
- Fully functional
- Pending posts visible locally until synced

---

### /map (MapPage)

**Component**: `src/pages/MapPage.tsx`

**Purpose**: Live minimap showing vira-latas' current positions on the Wacken festival grounds as avatar dots over `public/infield_map.png`.

**Access**: Protected (`PrivateRoute`). Not in the bottom nav — reached via the glyph F "Pin + bolt" button in the `/now` header.

**Data**: `useSocialSnapshot(useNow(30_000))` → IndexedDB only (same `crewGroups` derivation as `/now`). No new schema, no new sync.

**Placement**: Derived by `buildPlacements(crewGroups, MINIMAP_ZONES, selfUserId)` in `src/services/minimapPlacement.ts`. Each member's zone is determined by `stageToZone()` / `groupKindToZone()`. Layout within each zone uses a deterministic phyllotaxis (sunflower-spiral) algorithm.

**Self highlight**: Current user's dot has a gold ring, is rendered last (never buried), and shows its name pill by default.

**Tap**: Tap any dot to toggle its name pill (single selection); tap map or same dot to dismiss (reverts to self pill).

**Offline**: Fully offline — map image precached by Service Worker; placement derived from IndexedDB cache.

**Flow wiki**: `docs/ai-wiki/flows/festival-minimap.md`

---

### /wrap (WrapPage)

**Component**: `src/pages/WrapPage.tsx`

**Purpose**: Post-festival personal recap — A2 Vest Chronicle (welcome + stat sections + optional assigned patches + vest pile + thanks finale; 7–8 scroll sections)

**Access**: Protected (`PrivateRoute`). **No** `isFestivalEnded()` route gate — always reachable when logged in.

**Data**: `useFestivalWrapStats` → IndexedDB only (same snapshot as badges).

**Discovery**: `WrapTeaserBanner` on `/now` and `/profile` after festival ends.

**Exit**: Finale section CTA **Back to the App** → `/now`; patches section **Open vest** → `/profile?vest=open#vest`.

**Flow wiki**: `docs/ai-wiki/flows/festival-wrap.md`

---

### /profile (ProfilePage)

**Component**: `src/pages/ProfilePage.tsx`

**Purpose**: User profile, account settings, admin controls

**Sections**:

#### Profile Header
- Avatar (56px)
- Display name
- Email (read-only)
- Role chip (color-coded: blue=manager, gold=godlike)
- Country flag (if set)
- Years at Wacken (grid of clickable years 2005-2026)
- Arrival day (picker, for badge tracking)

#### Edit Profile (Collapsible)
- Display name (text input)
- Avatar URL (text input)
- Language toggle (BR 🇧🇷 | EN 🇬🇧)
- Country dropdown
- Years at Wacken (multi-select)
- Arrival day picker

#### Patches (Live Vest)
- **`BadgesDisplay`** — collapsed vest stack (chaotic scatter or neat row) + expanded 4-col grid
- Live badges only: evergreen + current festival year (`isLiveVestBadge()`)
- Tap expanded patch → detail modal + fullscreen zoom
- Per-device vest color + layout preferences (localStorage)

#### Previously Achieved (Phase 29)
- **`BadgeHistorySection`** — collapsible archive below live vest; hidden when IDB history empty
- U2 layout: flat `repeat(4, 48px)` grid per year, Oswald `Wacken {year}` headings, red enamel diamond year chips (24 px)
- Tap archive patch → `BadgeDetailModal` (label + year chip only; no description/zoom)
- Offline after first profile sync (`useUserBadgeHistory` → IDB first)

#### Conflicts (Collapsible)
- List of band conflicts in user's picks
- Organized by severity (soft/hard)
- Quick-access to /my-picks

#### MoshSplit (Collapsible, Phase 23)
- **`MoshSplitSection`** — placed after Conflicts, before Edit Profile
- Shows net balance from MoshSplit (`split.viralatas.org`) when user has an account
- Four states: `loading`, `not_found` (hidden), `settled`, `active` (owes/owed)
- CTA opens `https://split.viralatas.org` in new tab
- **Part 1:** mock data; `ACTIVE_MOCK = not_found` → section invisible in production
- **Part 2:** real API via `VITE_MOSHSPLIT_TOKEN` + user email (blocked on API docs)
- See [Flow: MoshSplit Balance Section](flows/moshsplit.md)

#### Time Travel (Godlike only, Collapsible)
- Current time display
- Quick-jump chips: D-1 (day before), D1-D4 (each festival day), D+1 (day after)
- Tap to override `useNow()` (stored in localStorage)
- Button to clear override

#### Godlike Admin Panel (Godlike only, Collapsible)
- **Band lineup** — Button to "Refresh from Wacken" (calls seed script)
- **Playlist feature toggle** — Flip `app_settings.playlist_testing` between Testing (godlike/manager only) and Live (all vira-latas). Mirrors duck toggle pattern.
- **Duck feature toggle** — Enable/disable duck quacks globally
- **Metal Place config**:
  - Festival day (picker)
  - Start time (HH:MM input)
  - End time (HH:MM input)
  - Save button
- **Live band test**:
  - Enable toggle
  - Band picker (select from lineup)
  - Save button
- **Cache management**:
  - Button to "Clear local cache" (wipeAllLocalData)
  - Button to bump cache version (forces refresh)
- **Badge consolidation** (Phase 29):
  - **`ConsolidateBadgesSection`** — year selector, force checkbox, gate until `isFestivalEnded()`
  - Confirm modal → `consolidate-year-badges` Edge Function
- **Test badges** — assign badges + **Archive preview (local)** (seeds IDB without Supabase)
- **Announce** — Post announcement as godlike (future)

#### Manager Admin Panel (Manager+ only, Collapsible)
- **Blocked posters** — List of blocked users
  - Show: name, blocked_at, unblock button
- **Moderation actions** — (Future: review reported posts)

#### Sign Out (Pill Button at Bottom)
- Clears session from IndexedDB
- Clears Supabase auth
- Redirect to /login

---

## Navigation (BottomNav)

**Component**: `src/components/BottomNav.tsx`

**6 tabs** (always visible on protected routes):
1. **Now** → /now (icon: clock)
2. **Schedule** → /schedule (icon: calendar)
3. **My Picks** → /my-picks (icon: heart filled)
4. **Popular** → /popular (icon: trending up)
5. **Mural** → /announcements (icon: chat)
6. **Profile** → /profile (icon: user)

**Active state**: Filled icon + highlight

**Offline**: Fully accessible, all pages work offline.

---

## Navigation Flows

### User Login → /now

```
LoginPage
  ↓ (enter credentials)
  ↓ supabase.auth.signInWithPassword()
  ↓ useAuth() detects session
  ↓ navigate('/now')
RightNowPage
```

### Browse Schedule → Pick Band

```
LineupPage
  ↓ (apply filters, search)
  ↓ tap BandCard
BandDetailModal opens
  ↓ (tap pick/unpick button)
  ↓ picksRepository.toggle()
  ↓ [optimistic write to IDB]
  ↓ useMyPicks() + usePickCounts() hooks re-render
  ↓ Detail modal shows updated state
  ↓ (close modal)
LineupPage updates with new counts
```

### View My Picks → See Conflicts

```
MyWackenPage loads
  ↓ useMyPicks() fetches from IDB
  ↓ useBandConflicts() detects overlaps
  ↓ Conflict chips rendered on band cards
  ↓ 3+ conflicts → banner shown
  ↓ tap conflict chip
  ↓ highlight conflicting bands
```

### Post Announcement (Online)

```
AnnouncementsPage
  ↓ (type message)
  ↓ tap "Post" button
  ↓ announcementsRepository.post()
  ↓ [optimistic write to IDB]
  ↓ emitAnnouncementsChanged()
  ↓ Post appears in feed immediately
  ↓ [async: Supabase upsert]
  ↓ Realtime broadcasts to crew
  ↓ Others see post within ~3s
```

### Post Announcement (Offline)

```
AnnouncementsPage (offline)
  ↓ (type message)
  ↓ tap "Post" button
  ↓ announcementsRepository.post()
  ↓ [optimistic write to IDB]
  ↓ [enqueue to pending_announcements]
  ↓ Post appears with "⏳ Pending" chip
  ↓ [online event fires]
  ↓ announcementsRepository.flushPending()
  ↓ [async: Supabase upsert]
  ↓ Pending chip disappears
  ↓ [SyncToast: "✓ Synced announcement"]
```

---

## Error Handling by Route

| Route | Error | Behavior |
|-------|-------|----------|
| /login | Invalid email | Show error message |
| /login | Wrong password | Show error message |
| /register | Email exists | Show error message |
| /register | Weak password | Show error message |
| /schedule | Load bands fails | Offline? Show cached. Online? Retry. |
| /my-picks | Load picks fails | Offline? Show cached. Online? Retry. |
| /announcements | Post offline | Queue to pending_announcements |
| /announcements | Sync fails | Retry on next 'online' |
| /profile | Save profile fails | Show error, suggest retry |
| /profile | Delete cache fails | Show error, suggest clear browser storage |

---

## Open Questions

- Should there be a /settings route separate from /profile?
- Should /announcements have a search/filter for finding specific posts?
- Should /my-picks show bands user has already missed (after the fact)?
- Should there be a /crew or /people page showing all vira-latas + their status?

---

**Last updated:** 2026-05-27 — Phase 29 Previously Achieved archive + godlike consolidate on `/profile`
