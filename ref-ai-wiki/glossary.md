# Glossary

## Purpose

Vocabulary and terminology used throughout the codebase and documentation.

---

## Core Concepts

### Vira-lata
Portuguese: Stray dog, mutt. In this context, a member of the Viralatas Metaleiros group attending Wacken. Used in user-facing copy instead of "crew" or "member".

### Wacken Open Air 2026
Annual metal music festival in northern Germany, July 29 - Aug 1, 2026. ~170k attendees across 8 stages.

### Band
A musical act performing on one stage at one time slot. 78+ bands total. Each `Band` record carries its own `stage: string` field — there is no separate Stage entity in the database.

### Band Assignment
The mapping of a specific band name to a slot on a specific stage and day. Tracked in `docs/ai-wiki/lineup.md`. Separate from the slot schedule (start/end times), which lives in `docs/ai-wiki/stages.md`.

### Stage
One of 8 named performance venues at Wacken 2026: Faster, Harder, Louder, W.E.T., Headbangers, Wasteland, Wackinger, Welcome to the Jungle. Stored as a plain string on each `Band` record — not a separate DB entity. Full reference in `docs/ai-wiki/stages.md`.

### Stage Category
Grouping of stages by physical location: Main Infield (Faster, Harder, Louder), Outside Infield (W.E.T., Headbangers), Specialized (Wasteland, Wackinger, Welcome to the Jungle).

### Stage Pairing
Physical adjacency between two stages that share interleaved ~15 min gaps. Paired pairs: Harder↔Faster, W.E.T.↔Headbangers. Means a band ending on stage A at HH:45 reliably signals stage B starts at HH+1:00. Used for conflict resolution.

### Stage Schedule
The grid of slot start/end times for a given stage and day. Lives in `docs/ai-wiki/stages.md`. Separate from band assignments (who plays each slot), which live in `docs/ai-wiki/lineup.md`.

### Slot ID
Unique identifier for a time slot, combining stage abbreviation + sequential number (e.g. `FAS1`, `HAR7`). Global across all days. Used to cross-reference slot times (in `stages.md`) with band assignments (in `lineup.md`).

### Pick
User's decision to watch a band. Not a commitment, just an interest marker.

### Presence
User's current location/state: camping (in the campground) or at_metal_place (at the festival).

### Conflict (Band Conflict)
Two or more of a user's picks overlap in time. Can be "soft" (10-30 min overlap, doable) or "hard" (major overlap, impossible).

---

## Architecture & Pattern Terms

### Offline-First
App works fully without network. IndexedDB (local) is primary store, Supabase is sync target.

### Optimistic Write
Data written to IndexedDB immediately (user sees change now), Supabase sync happens async.

### Queue (Offline Queue)
Stores operations (pick/unpick/announce/presence) made offline, synced when online. Deduped on flush.

### Deduplication
When flushing queue, group operations by (user_id, band_id), keep only the final action. Avoids redundant sync calls.

### Realtime Subscription
Live connection to Supabase PostgreSQL. Receives `postgres_changes` events (INSERT/UPDATE/DELETE) for tables. Auto-updates IndexedDB.

### Realtime Channel
Named subscription (e.g., `supabase.channel('pick_counts')`). Can subscribe to multiple tables.

### Event Emitter
Window event dispatched when IndexedDB changes. Components listen via `window.addEventListener('viralatas:picks-changed', ...)`.

### Sync
Process of pushing offline queue to Supabase and fetching crew data. Happens on startup and 'online' event.

### Cache Version
String compared on every login: client-side value (in IndexedDB `meta` store, key `'cache_version'`) vs server-side value (in `public.app_config` row `key='cache_version'`). If they differ, `wipeAllLocalData()` clears every IndexedDB store except `session` and forces a fresh fetch. Bumped server-side by the godlike "Reset all data" admin button or by `npm run festival:reset` (see `docs/ai-wiki/festival-reset.md`). Used when the band lineup changes or pre-festival state needs invalidating.

---

## Database & Storage Terms

### IndexedDB (IDB)
Browser database API. Stores JSON objects, survives app restart, persists offline. Used as primary store.

### Supabase
Backend-as-a-service. Provides PostgreSQL database, Auth, Realtime, Edge Functions.

### PostgreSQL
Relational database used by Supabase.

### Row-Level Security (RLS)
PostgreSQL feature. Enforces access control at query time. Only authenticated users + RLS policies control access.

### Migration
SQL file defining schema changes (new tables, columns, indexes). Source of truth for DB structure.

### Soft Delete
Record marked as deleted (deleted_at timestamp) but not removed from DB. Example: announcements.

### Foreign Key
Column referencing another table's ID. Enforces referential integrity.

### Composite Key
Primary key made of multiple columns. Example: user_picks(user_id, band_id).

### Index
Database structure for fast lookups. Example: user_picks has index on user_id for fast "get all picks for user".

---

## React & Frontend Terms

### Hook
React function that adds state/effects to components. Examples: useState, useEffect, useAuth, useMyPicks.

### Component
Reusable React UI element. Example: BandCard, Modal, Button.

### Page
Top-level component for a route. Example: RightNowPage, SchedulePage.

### State
Data that changes over time. Managed by React (useState) or hooks.

### Effect
Side effect (fetch data, subscribe to events) run during component lifecycle. Example: useEffect.

### Event Listener
Function called when window event fires. Example: `window.addEventListener('viralatas:picks-changed', handler)`.

### Prop (Property)
Input to a component. Example: `<BandCard band={band} onPick={handler} />`.

### Controlled Component
Component whose state is managed by parent (props). Example: Input with value={state} onChange={handler}.

### Modal
UI overlay component. Example: BandDetailModal.

---

## Auth & User Terms

### Session
Auth state after successful login. Persisted to IndexedDB, validated server-side.

### User Role
Permission level: normal (base), manager (moderation), godlike (admin).

### Test User
User with is_test_user=true. Created for development/testing. Togglable by godlike.

### Display Name
User-chosen name, shown to crew. Different from email.

### Avatar
User's profile picture URL. Fetched from Gravatar or uploaded.

### Preferred Language
User's chosen UI language: 'br' (Portuguese), 'en' (English), 'es' (Spanish), 'de' (German).

### Country
User's home country. Used for country-based badges.

### Wacken Years
Array of festival years attended. Example: [2018, 2019, 2022]. Used for "veteran" badges.

### Arrival Day
Date user arrives at festival. Used for "early bird" / "late arrival" badges.

---

## Data Terms

### Entity
Real-world object modeled in database. Examples: User, Band, UserPick.

### Relationship
Connection between entities. Example: User has many UserPicks.

### Invariant
Business rule that must always be true. Example: "Only one presence row per user".

### State (Data State)
Current value of data. Example: User has picked band X (state: true) or not (state: false).

### Eventual Consistency
Data is consistent eventually, not immediately. Example: Offline pick is inconsistent until synced.

### Stale Data
Data that's out-of-date. Example: Crew attendance cached 1 hour ago.

---

## Sync & Queue Terms

### Offline Queue
Stores operations made while offline. Examples: offline_picks, offline_announcements.

### Queue Flush
Process of syncing all queued operations to Supabase. Happens on 'online' event.

### Flushed Count
Number of operations successfully synced during a flush.

### Queue Dedup
Grouping queue operations by (user_id, band_id), keeping only the last action.

### Online Event
Browser event fired when navigator.onLine becomes true. Triggers sync.

### Navigator.onLine
Browser API. True if network available, false if offline. Not 100% reliable.

---

## UI & UX Terms

### OfflineBanner
Component showing "🚫 Offline" message. Helps user understand why things won't sync.

### PendingChip
Visual indicator (small "⏳" badge) showing item is queued, not yet synced.

### SyncToast
Notification appearing after sync completes. Example: "✓ Synced 3 items".

### Bottom Nav
6-tab navigation bar (Now, Schedule, My Picks, Popular, Mural, Profile).

### BandCard
Reusable component showing band info: name, stage, time, attendance, pick status. Optional corner weekday ghost (`showDayLabel`) on schedule/ranked variants when day context is mixed.

### BandDetailModal
Full-screen or overlay modal with detailed band info, conflict warnings, attendance breakdown.

### Avatar Cluster
Group of user avatars shown together. Example: "5 users picking this band".

### Conflict Chip
Visual indicator on band card showing it overlaps with another pick.

### Conflict Banner
Large warning banner on /my-picks if user has 3+ conflicts.

### Weak skip (“I am weak”)
User taps **souFraco** on `/now` to unpick their current live band with a 5s undo toast. A **committed weak skip** is counted only when the unpick sticks after undo expires — stored in `user_metadata.weak_skips_2026`. Generic unpicks (schedule card, detail modal, conflict resolver) never increment this counter.

### Generic unpick
Removing a pick through any path other than the `/now` weak-skip button (card toggle, band detail, conflict resolver).

### Stage Color
CSS custom property mapped to each stage. Example: Faster (`var(--stage-faster)` / `#2980b9` blue), Harder (`var(--stage-harder)` / `#e67e22` orange). Defined in `src/index.css`; resolved to token strings by `stageColors.ts`. Full color table in `docs/ai-wiki/stages.md`.

---

## Time Terms

### Festival Day
1-4, corresponding to July 29 - Aug 1, 2026.

### Current Band
Band that's playing now (start_time <= now <= end_time).

### Next Band
User's next pick after current.

### Time Window
Band's performance duration (start_time to end_time).

### Overlap
Two bands' time windows intersect. Example: Band A 18:30-19:30, Band B 19:00-20:00 overlap by 30 min.

### Time Travel
Godlike ability to override current time in test mode. Stored in localStorage, used by useNow().

### Test Mode
Enabled when time travel or live band test override is active. Used for development.

---

## Badge Terms

### Badge
Achievement indicator shown on user's profile. Example: "3+ Wacken years".

### Badge Condition
Rule determining if badge is unlocked. Example: `{ type: 'wacken_years_min', value: 3 }`.

### Unlocked Badge
Condition met, badge shown in color.

### Locked Badge
Condition not met, badge shown grayscale.

### Badge Slug
Unique ID for a badge. Example: 'wacken_veteran'.

### Characteristic Badge
Badge based on user characteristics (country, years, arrival). Examples: "Belgian", "Early Bird".

### Seen Badge
Badge based on bands watched (from user_missed_bands table).

### Special Badge
Godlike-assigned joke badges. Example: "Metal Warrior".

---

## Role Terms

### Normal (Role)
Base user role. Can pick bands, post announcements, see crew.

### Manager (Role)
Can do everything normal users can, plus soft-delete other users' posts.

### Godlike (Role)
Admin role. Full access: edit config, time travel, assign badges, clear cache.

### Permission
Ability granted by role. Example: manager has "block_poster" permission.

---

## Testing Terms

### Unit Test
Test of single function or component in isolation.

### Integration Test
Test of multiple components working together. Example: full auth flow.

### Offline Scenario Test
Manual testing with network disabled.

### Deduplication Test
Verify queue dedup logic (5 toggles → 1 sync call).

### Realtime Test
Verify Realtime subscription updates IndexedDB correctly.

---

## Other Terms

### Godlike
Playful term for admin. Reference to metal mythology (godlike powers). Also the name of the role.

### Vira-latas
Plural of vira-lata. The group name.

### Metal Place
Special check-in status during festival. User is "at the festival" (not camping). Controlled by godlike config.

### Mural
Announcements board. "Mural-style" suggests public, visible to all.

### Crew
Group of vira-latas attending together. Internally called "crew", externally "vira-latas".

---

## Flow-Specific Terms (Phase 13)

### Offline Pick Lifecycle
The complete sequence of events for a pick made without network: optimistic IDB write → enqueue to offline_picks → 'online' event → flushOfflineQueue() → Supabase upsert/delete → queue entry removed.

### keepLast Semantics
Deduplication strategy used during offline queue flush. For a group of operations with the same (user_id, band_id), only the chronologically last action is synced to Supabase. All queue entries are removed from IDB after a successful sync.

### Opaque Response
HTTP response from a cross-origin request without CORS headers. Status code and body are inaccessible to the Service Worker. Workbox can cache opaque responses with `cacheableResponse: { statuses: [0, 200] }`. Used for Wacken band images.

### Registration Gate
`app_settings.registration_enabled` flag (boolean). When false, `/register` redirects to `/login`. Controlled by godlike in the admin panel. Prevents public sign-ups after initial onboarding.

### Profile Verification Retry
Post-signup or post-login loop (up to 3–4 attempts with increasing delays) that confirms the `public.users` row exists before navigating to `/now`. Covers PostgreSQL trigger latency.

### Trigger Latency
The delay between `auth.users` insertion and `handle_new_user()` trigger completing the `public.users` insert. Typically <100ms on production Supabase. Profile verification retry compensates for this.

### Precache
Workbox technique. At Service Worker install time, a manifest of app shell files (JS, CSS, HTML, fonts) is downloaded and stored in the browser cache. These files are served instantly from cache on future requests, enabling offline use. Filenames include content hashes so each deploy creates new cached entries.

### NetworkFirst
Workbox caching strategy: fetch from network first; if network fails (offline, timeout), serve from HTTP cache. Used for Supabase API calls. Prioritizes freshness; cache is a fallback.

### CacheFirst
Workbox caching strategy: serve from HTTP cache first; if not cached, fetch from network and cache the response. Used for Wacken band images and app shell. Prioritizes speed; network is a fallback.

### StaleWhileRevalidate
Workbox strategy: serve cached response immediately, then fetch from network and update cache in background. Not used in this app (NetworkFirst is used for Supabase instead to avoid serving stale auth tokens).

### Cache TTL (Time-To-Live)
Maximum age of a cached HTTP response before Workbox considers it expired and re-fetches. Supabase cache: 24 hours. Band images: 30 days.

### Service Worker Lifecycle
Installation → Waiting → Activation → Controlling. `registerType: 'autoUpdate'` triggers automatic installation and activation of new Service Worker versions. `skipWaiting` causes the new SW to activate without waiting for old tabs to close.

### autoUpdate
Vite PWA `registerType` option. When a new Service Worker is detected, it automatically installs and activates. The user may see a brief reload prompt or silent auto-refresh depending on the implementation.

### clientsClaim
Service Worker API. After activation, the new SW takes control of all open tabs immediately, without waiting for a page reload. Combined with `skipWaiting` to ensure new code is served instantly.

### Content Hash (filename)
Build-time fingerprint appended to JS/CSS/font filenames (e.g., `main-Dkj3as9.js`). Ensures new builds produce new filenames, enabling aggressive caching of old filenames (they never change) and automatic cache invalidation of new builds.

### FlushPending (Announcements)
`announcementsRepository.flushPending()` — processes pending_announcements offline queue. For each queued announcement, inserts into Supabase. On success, replaces the draft ID (crypto.randomUUID) with the server-assigned ID. Returns flush count for SyncToast.

### Draft Announcement
An announcement created locally (IDB) before server confirmation. Has a client-generated `id` (crypto.randomUUID). Replaced by the server-assigned `id` once successfully inserted into Supabase.

### Server-Assigned ID
The UUID assigned by Supabase on INSERT, replacing the client-generated draft ID. After flush, the announcement in IDB is updated to use the server ID for future operations (e.g., delete).

### JWT (JSON Web Token)
Supabase issues JWTs as auth tokens. Included in the `Authorization` header of all API requests. RLS policies evaluate `auth.uid()` from the JWT. JWTs expire (default 1 hour) and are auto-refreshed by the Supabase client.

### Refresh Token
Long-lived credential that lets the Supabase client obtain a new JWT after expiry without requiring re-login. Stored in IndexedDB via the custom auth storage adapter.

### Custom Auth Storage Adapter
The `storage` option in `createClient()` that replaces Supabase's default `localStorage` persistence. This app uses a custom async adapter that reads/writes to IndexedDB (`session` store) so the auth session survives PWA restarts and is not cleared by browser privacy settings.

### handle_new_user Trigger
PostgreSQL `AFTER INSERT ON auth.users` trigger that creates a corresponding `public.users` row. Sets role (`godlike` for `sfilizzola@gmail.com`, `normal` for all others), `preferred_language` (from metadata, default `'br'`), `is_test_user` (from metadata, default `false`), and display name.

### coalesce() Fix
The bug fix in migration `20260504000005`. The original trigger used `raw_user_meta_data->>'is_test_user' = 'true'` which evaluates to `NULL` when the field is absent, violating the NOT NULL constraint on `is_test_user`. Fixed with `coalesce(..., false)`.

### security definer
PostgreSQL trigger/function attribute. Runs the function with the privileges of the function's owner (typically `postgres`) rather than the calling user. Required for `handle_new_user()` to insert into `public.users` on behalf of a new user (who doesn't exist yet during the trigger).

### SIGNED_IN / SIGNED_OUT / TOKEN_REFRESHED
Supabase `onAuthStateChange` event types. `SIGNED_IN` fires on login/registration. `SIGNED_OUT` fires on logout. `TOKEN_REFRESHED` fires when the JWT is automatically refreshed. All update `useAuth()` state.

### LivePlan
Data type returned by `findLivePlan()`. Contains `status` (`'current'`, `'next'`, `'empty'`, `'lost'`) and `band` (current band, next band, or null). Used by `/now` page to display what each crew member is watching.

### LivePlan Status
- `current` — User is watching a band right now (start_time ≤ now < end_time)
- `next` — User has a pick starting in the future
- `empty` — User has no picks or all picks are in the past
- `lost` — User has a next pick but is marked as camping (not en route)

### applyLiveBandTestOverride
Function that splices a "virtual" version of a test band into the bands array with start/end times shifted to wrap `now`. Enables godlike time testing without changing real schedule data.

### CrewLiveGroup
Grouped view of crew members for the `/now` page. Types: `band` (members watching a specific band), `camping` (members in camp), `metal_place` (members at festival), `lost` (no active status).

### Metal Place Window
Time period defined by `metal_place_config` (festival day + hours) during which the Metal Place check-in is active. Outside this window, `is_at_metal_place` is ignored and users are routed to camping/lost groups. Auto-checkout fires when the window ends.

### validateAndAutoCheckout
`presenceRepository` method that clears `is_at_metal_place` when the metal place window has ended. Called on every `metalPlaceConfig` or `now` change for the current user.

### Soft Conflict
Band overlap of ≤15 minutes (≤ `HARD_CONFLICT_THRESHOLD_MS = 900_000`). Considered doable — user can leave one show early to catch the other.

### Hard Conflict
Band overlap of >15 minutes. Considered impossible to attend both fully. Shown as a more prominent warning in `/my-picks`.

### 3-Conflict Banner
Warning banner shown on `/my-picks` when the user has 3 or more overlapping bands. Alerts the user to a heavily conflicted schedule.

### Vendor Lock-In
Dependency on a specific service or SDK that would require significant rewriting to remove. Accepted tradeoff for Supabase (PostgreSQL + Auth + Realtime in one) given the festival's short operational window.

### Row-Level Security (RLS)
See Database & Storage Terms. Each table has RLS enabled. Access rules are SQL policies enforced at query time. Examples: `auth.uid() = user_id` for writes, `to authenticated` for reads.

### set_user_role RPC
Supabase remote procedure call (`supabase.rpc('set_user_role', ...)`) used by managers/godlike to change another user's role. Implemented as a PostgreSQL function to bypass RLS (normal UPDATE on `users` is restricted to own row).

### wipeAllLocalData
Function in `src/lib/db.ts` that clears all IndexedDB stores (except `session`). Called when `CacheVersionCheck` detects a cache version mismatch. Triggers full re-sync from Supabase on next app init.

### CacheVersionCheck
`App.tsx` sync component. On login, fetches the `public.app_config` row with `key='cache_version'` from Supabase and compares its `value` to the locally-stored version (IndexedDB `meta` store). If mismatch, calls `wipeAllLocalData()` to force a fresh sync. Prevents stale band data after lineup changes or after a festival reset.

### Festival Reset
The `npm run festival:reset` operator script (`supabase/seed/festival-reset.ts`). One-shot pre-festival wipe: deletes every row in `public.announcements`, `public.blocked_posters`, and `public.user_presence`; clears `public.users.special_badges` for every user; strips `achieved_badge_slugs`, `crew_earned_badge_slugs`, and `location_visits` from `auth.users.raw_user_meta_data` via positive-strip; bumps `public.app_config.cache_version` so connected clients invalidate IndexedDB on next load. Optionally chains the bands re-seed via `--with-bands`. Flags: `--dry-run` (preview), `--force` (skip 5s countdown), `--with-bands` (cascade-replace lineup). Destructive, no undo. Full contract: `docs/ai-wiki/festival-reset.md`.

### Positive-Strip Pattern
The pattern used by `festival-reset.ts` to remove specific keys from `auth.users.raw_user_meta_data` without losing unrelated keys. The script copies the existing metadata object and `delete`s only the three known persistent-badge keys, then writes the result back via `supabase.auth.admin.updateUserById(id, { user_metadata })`. Since that admin call **replaces** the metadata object entirely, an allow-list ("only keep these keys") would silently drop any future metadata key (push subscriptions, future-year Wacken state, etc.); the positive-strip pattern is forward-compatible by construction.

### emitSyncComplete
Function that dispatches a `viralatas:sync-complete` event after a successful offline queue flush. `SyncToast` listens for this event to show "✓ Synced N items".

### Graceful Degradation
Design principle: when network or a service is unavailable, the app provides reduced but functional behavior rather than failing entirely. Example: Realtime down → stale IndexedDB data still shows; offline → picks queue instead of fail.

### Reading Path
Navigation guide in the wiki index recommending which documents to read first based on reader role (new engineer, badge developer, offline expert, etc.).

---

**Last updated:** 2026-05-18 — corrected the Cache Version / CacheVersionCheck entries to reference `public.app_config` (not the non-existent `public.meta`); added Festival Reset and Positive-Strip Pattern entries.
