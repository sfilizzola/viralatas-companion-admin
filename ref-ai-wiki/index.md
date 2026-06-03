# Viralatas Companion — Architectural Wiki

**Last Updated**: 2026-05-27 (Phase 30 closed)

## Purpose

This wiki documents the architectural decisions, data flows, and technical patterns in the Viralatas Metaleiros festival companion PWA. It is the single source of truth for system behavior, offline-first guarantees, synchronization semantics, and domain modeling.

## What This App Is

A festival companion PWA for ~20 metal vira-latas attending Wacken Open Air 2026. Core loop:
1. User logs in (via Supabase Auth)
2. Picks bands they want to watch
3. Sees live attendance counts and who's going where (via Realtime)
4. Receives proactive AI alerts powered by Claude
5. Works fully offline after first load (IndexedDB + Service Worker caching)
6. Deep-links to **Setlist Vira-Latas** (Spotify playlist) and **MoshSplit** (expense splits) — satellite PWAs in the [Viralatas App Pack](architecture.md#viralatas-app-pack-phase-22–23)

**Key constraint**: Wacken has terrible signal → entire app must work offline.

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + Vite | Component UI, hot reload |
| Offline Store | IndexedDB v10 (`idb` lib) | Primary source of truth for reads |
| Sync Target | Supabase PostgreSQL + Realtime | Source of truth for auth, persistence, live updates |
| Auth | Supabase Auth | Email/password login; persisted to IndexedDB |
| PWA | Vite PWA Plugin + Workbox | Service Worker, manifest, auto-update, caching |
| State Mgmt | Custom hooks + Event emitters | No Redux/Zustand; window events for IDB changes |
| Type Gen | Supabase CLI | Auto-generated TypeScript from PostgreSQL |

---

## Quick Navigation

### Architecture & Design
- **[Design System](../../public/vira-lata-ds.html)** — Living UI spec: tokens, components, layouts, motion (`public/vira-lata-ds.html`)
- **[Architecture Overview](architecture.md)** — Frontend, offline-first, sync, realtime, PWA
- **[Domain Model](domain-model.md)** — Users, bands, picks, announcements, presence
- **[Offline-First Pattern](offline-first.md)** — IndexedDB primary, sync secondary, queue mechanics
- **[Sync Engine](sync-engine.md)** — Optimistic updates, queue deduplication, offline recovery
- **[Routing & Navigation](routes.md)** — All app routes, page structure, guards

### Data & Backend
- **[Supabase Schema](supabase-schema.md)** — Database tables, RLS policies, migrations, realtime setup
- **[Data Repositories](architecture.md#repositories)** — Data access patterns, sync methods

### Festival Content
- **[Stage Reference](stages.md)** — 8 stages: categories, colors, pairing rules, slot schedules (start/end times per slot per day)
- **[Band Lineup](lineup.md)** — Band assignments by day and stage; cross-references stages.md via Slot IDs

### Features & Mechanics
- **[Badge System](badges.md)** — 22+ condition types, live vest + Previously Achieved archive, year consolidation, how to add badges

### Flows & Behaviors
- **[Flow: Picking a Band](flows/pick-band.md)** — Optimistic write, realtime update, offline fallback
- **[Flow: Offline Pick Sync](flows/offline-pick-sync.md)** — Queue mechanics, deduplication (keepLast), worked example (5 toggles → 1 call), error recovery
- **[Flow: Live Now](flows/live-now.md)** — Time-based band display, crew attendance, conflict detection
- **[Flow: Announcements](flows/announcements.md)** — Posting, realtime sync, moderation, soft-delete
- **[Flow: Authentication](flows/authentication.md)** — Login, signup, trigger, session persistence, test users, RLS
- **[Flow: Duck Quack](flows/duck.md)** — Duck button → cooldown → quack → Realtime in-app DuckToast + Web Push system notification; offline queuing; admin test flows
- **[Flow: Playlist Launch](flows/playlist-launch.md)** — `/my-picks` strip → Setlist Vira-Latas deep-link; `playlist_testing` feature flag; godlike admin toggle
- **[Flow: MoshSplit Balance](flows/moshsplit.md)** — `/profile` balance section → MoshSplit deep-link; Part 1 mock (hidden), Part 2 API (blocked)
- **[Flow: Festival Wrap](flows/festival-wrap.md)** — Post-festival `/wrap` recap (7–8 scroll sections); IDB-only stats; teaser banner + godlike D+1 QA

### Architectural Decisions (ADRs)
- **[ADR: IndexedDB as Primary Store](decisions/indexeddb-primary-store.md)** — Why IDB, not Supabase-primary
- **[ADR: PWA Not Native](decisions/pwa-not-native.md)** — Why web, not React Native/Capacitor
- **[ADR: Supabase as Sync Target](decisions/supabase-as-sync-target.md)** — Why Supabase (auth + DB + realtime), alternatives (Firebase, custom Node)
- **[ADR: Custom Hooks + Window Events](decisions/custom-hooks-events-no-redux.md)** — Why no Redux/Zustand; event-driven IDB state management
- **[ADR: Workbox Caching Strategy](decisions/workbox-caching-strategy.md)** — NetworkFirst (Supabase), CacheFirst (images), precache (app shell)
- **[ADR: Genre Collapse to 13 Canonical Labels](decisions/genre-collapse-canonical-labels.md)** — Why ~93 Wacken subgenre strings became 13 in-place labels (Phase 25)

### Quality, Testing & Reference
- **[Testing Strategy](testing.md)** — Unit tests, integration tests, offline scenarios
- **[Glossary](glossary.md)** — 140+ terms: architecture, auth, sync, flows, caching, roles, badges
- **[Genre collapse mapping](genre-collapse-mapping.md)** — Old Wacken subgenre tag → canonical label (Phase 25 lookup table)
- **[Changelog](changelog.md)** — All wiki modifications, discoveries, corrections

### Operational Tooling
- **[Lineup Sync](lineup-sync.md)** — Non-destructive `seed:bands:sync` and `seed:bands:move`. Dry-run by default; preserves user picks across small lineup edits.
- **[Festival Reset](festival-reset.md)** — `npm run festival:reset` one-shot script: state wipe (announcements, blocked_posters, user_presence, assigned + persistent badges, cache_version bump) with optional bands re-seed via `--with-bands`. Flag matrix, scope guard, edge cases.

---

## Core Architectural Principles

### 1. IndexedDB Is Primary
All UI reads come from IndexedDB first. Never read directly from Supabase in components.

```mermaid
┌──────────┐
│Component │
└────┬─────┘
     │ reads (immediate)
     ▼
┌──────────────┐
│IndexedDB     │
│ (primary)    │
└──────────────┘
     ▲
     │ syncs (eventual)
     │
┌──────────────┐
│Supabase      │
│ (secondary)  │
└──────────────┘
```

### 2. Writes Are Optimistic
Writes to IndexedDB happen immediately. Supabase sync is fire-and-forget; errors queue the operation.

```javascript
// User picks a band
await saveUserPick(pick);  // IndexedDB — immediate
emitPicksChanged();        // Local components see it now

// Meanwhile, async:
if (online) {
  const { error } = await supabase.from('user_picks').upsert(pick);
  if (error) await queuePick(pick);  // Fall back to queue
}
```

### 3. Offline Queue Deduplication
If a user toggles a pick 10 times offline, only the final action is synced.

```javascript
// Queue groups by (user_id, band_id), keeps last action
const groups = new Map<string, { all: Op[]; last: Op }>();
// Sync only last.action
```

### 4. Realtime Subscriptions Auto-Update
When other crew members' picks arrive via Realtime, IndexedDB is updated automatically.

```javascript
supabase
  .channel('pick_counts')
  .on('postgres_changes', { event: 'INSERT', table: 'user_picks' }, 
    (payload) => saveUserPick(payload.new))
  .subscribe();
```

### 5. Event-Driven Updates
Components listen to window events, not polling. No `setInterval`.

```javascript
window.addEventListener('viralatas:picks-changed', () => {
  // Fetch from IDB and re-render
});
```

---

## System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         React Components                      │
│   (RightNowPage, SchedulePage, MyPicksPage, etc.)           │
└──────┬──────────────────────────────────────────────────────┘
       │ reads, dispatches toggles
       ▼
┌─────────────────────────────────────────────────────────────┐
│                     Custom Hooks Layer                        │
│  useAuth, useMyPicks, usePickCounts, useNowData,             │
│  useBandConflicts, useNow (time travel)                      │
└──────┬──────────────────────────────────────────────────────┘
       │ calls, listens to events
       ▼
┌─────────────────────────────────────────────────────────────┐
│              Repository / Service Layer                       │
│  picksRepository, announcementsRepository,                   │
│  presenceRepository, etc. (data access layer)                │
└──────┬──────────────────────────────────────────────────────┘
       │
       ├──────────────────────────────────────────┐
       │ immediate writes + event emit            │
       ▼                                          │
┌──────────────────────┐                  ┌──────▼──────────┐
│  IndexedDB (v10)     │                  │ Window Events   │
│                      │                  │                 │
│  stores:             │                  │ 'picks-changed' │
│  - user_picks        │◄─────────────────│ 'crew-users-...'│
│  - offline_picks     │                  │ 'presence-...'  │
│  - announcements     │                  │ 'announce-...'  │
│  - offline_ann.      │                  │ 'badge-history' │
│  - bands (cache)     │                  └─────────────────┘
│  - crew_users (cache: is_friend, special_badges)│
│  - user_presence     │
│  - offline_presence  │
│  - user_missed_bands │
│  - user_badge_history│
│  - offline_missed    │
└──────────┬───────────┘
           │ async sync (reconnect, 'online' event)
           ▼
┌──────────────────────────────────────────────────────────┐
│  Supabase (PostgreSQL + Realtime)                        │
│                                                            │
│  Tables: users, bands, user_picks, announcements,        │
│          user_presence, user_missed_bands, etc.          │
│                                                            │
│  Realtime: postgres_changes on insert/update/delete      │
└──────────────────────────────────────────────────────────┘
```

---

## Key Files by Concern

| Concern | Files |
|---------|-------|
| **Offline Store** | `src/lib/db.ts`, `src/lib/db/badgeHistory.ts`, `src/repositories/badgeHistoryRepository.ts`, `src/__tests__/` |
| **Badge archive** | `src/hooks/useUserBadgeHistory.ts`, `src/components/BadgeHistorySection.tsx`, `src/components/profile/ConsolidateBadgesSection.tsx`, `supabase/functions/consolidate-year-badges/` |
| **Live vest / social snapshot** | `src/hooks/useSocialSnapshot.ts`, `src/services/socialSnapshot.ts`, `src/hooks/useBadgeContext.ts` (Phase 31) |
| **Sync Engine** | `src/repositories/bands.ts`, `src/repositories/picks.ts`, `src/repositories/announcements.ts`, `src/lib/syncCoordinator.ts` |
| **Realtime** | `src/lib/realtimeSync.ts`, `src/hooks/usePickCounts.ts`, `src/hooks/useBandAttendees.ts` |
| **Auth** | `src/lib/supabase.ts`, `src/hooks/useAuth.ts`, `src/pages/LoginPage.tsx` |
| **Time System** | `src/hooks/useNow.ts`, `src/services/time.ts`, `src/services/bandTime.ts` |
| **App Shell** | `src/App.tsx` (route setup), `src/components/BottomNav.tsx`, `src/components/PrivateRoute.tsx` |
| **PWA** | `vite.config.ts` (Workbox setup), `public/manifest.json`, Service Worker auto-generated |
| **Stage Colors** | `src/services/stageColors.ts`, `src/index.css` (CSS custom properties) |
| **Band Seed** | `supabase/seed/bands.ts`, `docs/ai-wiki/lineup.md`, `docs/ai-wiki/stages.md` |
| **Duck / Push** | `src/repositories/duck.ts`, `src/hooks/useDuckQuack.ts`, `src/hooks/useDuckNotifications.ts`, `src/lib/pushSubscription.ts`, `src/components/DuckButton.tsx`, `src/components/DuckToast.tsx`, `src/workers/sw.ts`, `supabase/functions/send-duck-push/index.ts`, `supabase/functions/send-test-push/index.ts` |
| **App Pack integrations** | `src/components/PlaylistLaunchButton.tsx`, `src/components/profile/MoshSplitSection.tsx`, `src/lib/appSettings.ts` (`playlist_testing`) |

---

## Domain Overview

### Entities
- **User**: Email, display name, role (normal/manager/godlike), Wacken years, country, arrival day
- **Band**: Name, stage (string), time window, genre, image URL — stage is an attribute, not a foreign key
- **UserPick**: User → Band relationship (many-to-many)
- **Announcement**: Text posts with author, creation time, soft-delete support
- **UserPresence**: Camping status, Metal Place check-in status
- **UserMissedBand**: Bands user marked as "didn't watch" (for badges)
- **UserBadgeHistory**: Frozen year-badge rows after godlike consolidation (Phase 29); survives `festival:reset`

> **Stage is not a DB entity.** Each `Band` record stores `stage: string`. Stage metadata (colors, schedules, pairing rules) lives in `docs/ai-wiki/stages.md` and in source constants (`stageColors.ts`, `SchedulePage.tsx`). Band assignments per slot live in `docs/ai-wiki/lineup.md`.

### Relationships
```
User (1) ──┬─→ (∞) UserPick ←─ (∞) Band
           ├─→ (∞) Announcement
           ├─→ (1) UserPresence
           ├─→ (∞) UserMissedBand
           └─→ (∞) UserBadgeHistory
```

---

## Offline Guarantees

| Operation | Online | Offline |
|-----------|--------|---------|
| **Pick band** | IndexedDB + Supabase | IndexedDB + offline queue |
| **View picks** | IndexedDB | IndexedDB |
| **See crew** | Realtime + IndexedDB | IndexedDB only (stale) |
| **Post announcement** | IndexedDB + Supabase | IndexedDB + pending queue |
| **View announcements** | Realtime + IndexedDB | IndexedDB only (stale) |
| **Conflict alerts** | Run offline (cached logic) | Run offline (cached logic) |

**Sync happens**: On app init, `navigator.onLine === true`, on `'online'` event, or manual trigger.

---

## Important Patterns

### Pattern: Optimistic Write
```typescript
// In picksRepository.toggle()
await saveUserPick(pick);      // IndexedDB immediately
if (!navigator.onLine) {
  await queuePick(pick, 'add'); // Queue for later sync
  return;
}
const { error } = await supabase.from('user_picks').upsert(pick);
if (error) await queuePick(pick, 'add'); // Fallback to queue
```

### Pattern: Realtime Auto-Sync
```typescript
// In usePickCounts.ts — via src/lib/realtimeSync.ts
return subscribePostgresChanges('pick_counts', [
  {
    filter: { event: 'INSERT', table: 'user_picks' },
    handler: async (payload) => {
      await saveUserPick(payload.new as UserPick);  // IndexedDB
      // components listening to PICKS_CHANGED_EVENT re-render
    },
  },
]);
```

### Pattern: Queue Deduplication
```typescript
// In picksRepository.flushOfflineQueue()
const groups = new Map<string, { all: Op[]; last: Op }>();
// Group by user_id:band_id, keep only last action
for (const { all, last } of groups.values()) {
  const { error } = await supabase.from('user_picks')
    [last.action === 'add' ? 'upsert' : 'delete'](...);
  if (!error) {
    await Promise.all(all.map(op => removeFromOfflineQueue(op.id)));
  }
}
```

---

## Reading Paths

### Path 1: First-Time Engineer (2–3 hours)
Start here to understand the full system before touching any code.

1. [Architecture Overview](architecture.md) — 4-layer design, data flow, key files
2. [Domain Model](domain-model.md) — Entities, relationships, role rules
3. [Offline-First Pattern](offline-first.md) — The golden rule (IDB primary)
4. [Flow: Picking a Band](flows/pick-band.md) — See offline-first in action end-to-end
5. [Sync Engine](sync-engine.md) — Queue mechanics, startup sync, realtime
6. [Supabase Schema](supabase-schema.md) — Tables, RLS, triggers, realtime config

---

### Path 2: Badge Developer (45 min)
Adding or modifying badges.

1. [Badge System](badges.md) — All condition types, how to add, localization, testing
2. [Domain Model](domain-model.md) — `user_missed_bands`, `special_badges`, user profile fields
3. [Glossary](glossary.md) — Badge-specific terms (condition, slug, assigned, seen)

---

### Path 3: Offline Expert / Debugging Sync (1 hour)
Investigating sync failures, queue corruption, or data inconsistency.

1. [Sync Engine](sync-engine.md) — Sync orchestration, queue flush flow, error handling
2. [Flow: Offline Pick Sync](flows/offline-pick-sync.md) — Worked example, edge cases, keepLast semantics
3. [Offline-First Pattern](offline-first.md) — Guarantees per data type, failure modes
4. [Glossary](glossary.md) — Queue, dedup, keepLast, flush, wipeAllLocalData

---

### Path 4: Auth & User Management (30 min)
Adding auth features, debugging login issues, understanding roles.

1. [Flow: Authentication](flows/authentication.md) — Full login/signup/trigger/RLS flow
2. [Supabase Schema](supabase-schema.md) — `users` table, RLS policies, `handle_new_user`
3. [Glossary](glossary.md) — JWT, refresh token, custom auth storage, trigger latency

---

### Path 5: Announcements / Moderation (30 min)
Working on the mural board, soft-delete, or blocking.

1. [Flow: Announcements](flows/announcements.md) — Full post lifecycle, offline queue, moderation
2. [Domain Model](domain-model.md) — `announcements`, `blocked_posters`, role-based rules
3. [Glossary](glossary.md) — Soft delete, pending queue, server-assigned ID, draft

---

### Path 6: Architecture Decision Context (1 hour)
Understanding the "why" behind key technical choices.

1. [ADR: IndexedDB as Primary Store](decisions/indexeddb-primary-store.md)
2. [ADR: Supabase as Sync Target](decisions/supabase-as-sync-target.md)
3. [ADR: Custom Hooks + Window Events](decisions/custom-hooks-events-no-redux.md)
4. [ADR: Workbox Caching Strategy](decisions/workbox-caching-strategy.md)
5. [ADR: PWA Not Native](decisions/pwa-not-native.md)
6. [ADR: Genre Collapse to 13 Canonical Labels](decisions/genre-collapse-canonical-labels.md)

---

### Path 7: Live Now Page (45 min)
Understanding or debugging the `/now` page, crew groups, time system.

1. [Flow: Live Now](flows/live-now.md) — Band time model, crew grouping, Metal Place, conflicts
2. [Architecture Overview](architecture.md) — `useNowData`, `livePreview.ts`, `bandTime.ts`
3. [Glossary](glossary.md) — LivePlan, CrewLiveGroup, Metal Place Window, CEST

---

### Path 8: Duck & Web Push (30 min)
Understanding or debugging the duck button, DuckToast, push subscriptions, or `send-duck-push`.

1. [Flow: Duck Quack](flows/duck.md) — Full lifecycle: button → cooldown → quack → DuckToast + Web Push
2. [Domain Model](domain-model.md) — `DuckQuack`, `PushSubscription` entity sections
3. [Sync Engine](sync-engine.md) — `DuckSync` (offline queue flush) in startup flow

---

### Path 9: App Pack Integrations (30 min)
Understanding Setlist and MoshSplit deep-links, feature flags, and offline boundaries.

1. [Architecture: Viralatas App Pack](architecture.md#viralatas-app-pack-phase-22–23) — Three-app ecosystem, integration rules
2. [Flow: Playlist Launch](flows/playlist-launch.md) — Setlist strip, `playlist_testing` flag
3. [Flow: MoshSplit Balance](flows/moshsplit.md) — Profile balance section, Part 1/2 status
4. [Routing: /my-picks and /profile](routes.md) — Where components mount

---

## Open Questions

- **Rate limiting**: Are offline queues ever sized? What if a user picks 100+ bands offline?
- **Conflict resolution**: What happens if user is offline, another user deletes a band from the DB?
- **Cache invalidation**: How are stale announcements purged from IndexedDB?
- **Realtime fallback**: If Realtime is down, does the app still work? (Answer: Yes, it reads IndexedDB)

---

## Contributing to This Wiki

When you discover new information or fix an error:

1. Update the relevant `.md` file in `docs/ai-wiki/`
2. Add an entry to [changelog.md](changelog.md) with date and summary
3. If adding a new flow, create `flows/name.md` following the template below
4. If documenting a decision, create `decisions/name.md`

### Where related project memory lives

`CLAUDE.md` and two sibling locations supplement this wiki without duplicating it:

- **`.claude/context/`** — On-demand reference material loaded by Claude when a task needs it (RTK command catalog, stage lineup snapshot, badge contract, LLM alert prompt rules, `handle_new_user` auth-trigger contract, key technical decisions, the 8-section wiki page template). These files document operational rules and procedures.
- **`.claude/agents/`** — Specialized subagent definitions (`wiki-curator`, `phase-closer`, `migration-validator`, `edge-function-reviewer`, `badge-author`, `offline-sync-auditor`, `pwa-auditor`). Each agent is invoked for a specific class of change and reads `CLAUDE.md` plus its own system prompt.

This wiki remains the source of truth for **system behavior** — offline-first guarantees, sync semantics, domain modeling, flows, and ADRs. The `.claude/` tree is the source of truth for **how Claude works on the codebase**. Wiki pages should not restate `.claude/context/` content; they should link to source files and explain the *why*.

### Template: Flow Documents

```markdown
# Flow: [Name]

## Purpose
Brief description of what the user is doing.

## Trigger
When does this flow happen?

## Happy Path
Step-by-step what happens online.

## Offline Behavior
What changes when offline?

## Sync Behavior (Reconnect)
What happens when reconnecting?

## Relevant Source Files
- File paths with key lines

## Data Flow Diagram
ASCII or mermaid diagram

## Edge Cases
- Lists of things that could go wrong
```

---

## Quick Reference: All Event Types

Window events emitted from `src/lib/db.ts`:
- `'viralatas:picks-changed'` — user_picks or offline_picks updated
- `'viralatas:crew-users-changed'` — crew_users cache updated
- `'viralatas:presence-changed'` — user_presence or offline_presence updated
- `'viralatas:announcements-changed'` — announcements or pending_announcements updated
- `'viralatas:metal-place-config-changed'` — metal_place_config updated
- `'viralatas:live-band-test-config-changed'` — live_band_test_config updated
- `'viralatas:missed-changed'` — user_missed_bands or offline_missed_bands updated
- `'viralatas:badge-history-changed'` — user_badge_history cache updated

Window events dispatched by hooks/components (not from db.ts):
- `'viralatas:duck-quack'` (CustomEvent `{ detail: { bandId: string } }`) — emitted by `useDuckNotifications` when a Realtime INSERT arrives on `duck_quacks`; consumed by `DuckToast`
- `'viralatas:sync-complete'` — emitted by `App.tsx` when offline picks/presence/announcements flush

---

**Last edited**: 2026-05-28 — Phase 31 social snapshot unification, crew profile cache
