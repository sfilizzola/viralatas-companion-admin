# ADR: Supabase as Sync Target

**Status**: Accepted

**Date**: 2026-05

**Deciders**: Product team, engineering lead

---

## Context

The app needs a sync backend to:
1. **Authenticate users** — email/password, session management, JWT
2. **Persist data** — band picks, announcements, presence, user profiles
3. **Enable realtime updates** — crew attendance counts visible within ~3 seconds
4. **Host edge functions** — Claude API calls for LLM alerts (API key must never touch the client)
5. **Enforce access control** — users can only modify their own data; crew reads are allowed

Options considered:
1. **Supabase** — PostgreSQL + Auth + Realtime + Edge Functions in one hosted service
2. **Firebase (Firestore)** — NoSQL + Auth + Realtime + Cloud Functions
3. **Custom Node.js API + PostgreSQL** — Full control, maximum flexibility
4. **PocketBase** — SQLite-backed BaaS, self-hosted
5. **CouchDB + PouchDB** — Native offline sync, document DB

The backend is **secondary** to IndexedDB (the primary store). The backend's job is persistence, auth, and broadcasting changes to other clients, not serving the UI directly.

---

## Decision

**Use Supabase (PostgreSQL + Auth + Realtime + Edge Functions) as the sync target and auth provider.**

---

## Rationale

### Why Supabase

✅ **Single service for four needs**: Auth, database, realtime, and edge functions — all in one. No multi-service orchestration, no separate auth vendor, no separate functions host.

✅ **PostgreSQL**: Relational DB with migrations, RLS, foreign keys, views, triggers. Schema is version-controlled in `supabase/migrations/`. Full SQL expressiveness.

✅ **Row-Level Security (RLS)**: Access control enforced at the database level. User can only insert/delete their own picks (`auth.uid() = user_id`). No need for server-side validation middleware.

✅ **Realtime via postgres_changes**: Subscribe to table-level INSERT/UPDATE/DELETE events. Used for crew attendance (live pick counts), presence, announcements, and config changes. ~3s latency.

✅ **Edge Functions (Deno)**: Serverless functions for Claude API calls. API key is server-side only. No Express.js infrastructure to maintain.

✅ **Supabase CLI**: Auto-generates TypeScript types from schema. No hand-written DTO classes.

✅ **Free tier**: Sufficient for ~20 users and a short festival. Paid plan available if needed.

✅ **Auth session management**: Handles JWT issuance, refresh tokens, expiry. The app uses a custom storage adapter to persist sessions to IndexedDB.

✅ **Migrations source of truth**: `supabase/migrations/*.sql` are the canonical schema. Migrations run in order, are versioned, and are reproducible on any Supabase project.

---

## Alternatives Considered

### Firebase (Firestore)

**Pros**: Strong offline SDKs (Firestore offline persistence), Google reliability, mature ecosystem.

**Cons**:
- ❌ NoSQL: No joins, no complex queries, no foreign key constraints. Hard to model relational data (picks join bands).
- ❌ No SQL triggers: The `handle_new_user()` trigger approach would require Cloud Functions on every write.
- ❌ Realtime uses a different pricing model (reads per day) — more expensive at scale.
- ❌ Edge Functions require Cloud Functions v2; more setup than Supabase Edge Functions.
- ❌ TypeScript types not auto-generated from schema.

**Verdict**: Rejected. NoSQL mismatch with relational data model.

---

### Custom Node.js API + PostgreSQL

**Pros**: Maximum control, no vendor lock-in, any schema or auth flow.

**Cons**:
- ❌ **Infrastructure to maintain**: Deploy, monitor, scale a Node server. Costs money even idle.
- ❌ **Auth implementation**: JWT issuance, refresh tokens, session storage all custom. Security risk.
- ❌ **No built-in realtime**: Must add WebSockets or polling on top of HTTP API.
- ❌ **No CLI tooling**: No auto-generated types, no migration runner, no local dev server with instant reset.
- ❌ **Time-to-ship**: 2-3x longer to build (no SDK, no RLS, no realtime out of the box).

**Verdict**: Rejected. Too much infrastructure for a ~20-user festival app.

---

### PocketBase

**Pros**: Single binary, SQLite-backed, built-in auth, realtime, admin UI.

**Cons**:
- ❌ **Self-hosted only**: Must run on a VPS or container. No free hosted tier.
- ❌ **No Edge Functions**: Claude API calls would require a separate service.
- ❌ **Less TypeScript integration**: No CLI-generated types; manual type definitions.
- ❌ **Smaller community/ecosystem**: Less documentation and tooling than Supabase.
- ❌ **SQLite limitations**: Write concurrency limits; not recommended for >10 concurrent writes.

**Verdict**: Rejected. No hosted tier + no edge functions.

---

### CouchDB + PouchDB

**Pros**: Native offline sync (CouchDB protocol), document DB, multi-master replication.

**Cons**:
- ❌ **Self-hosted CouchDB**: Same infra concerns as custom Node.js.
- ❌ **No auth out of the box**: Would need separate auth service.
- ❌ **No SQL**: Document model, no joins.
- ❌ **No Realtime subscriptions**: Would need custom WebSocket layer.
- ❌ **Conflict resolution is complex**: CouchDB multi-master allows conflicting revisions that must be manually resolved.

**Verdict**: Rejected. Native sync is appealing but the infra + NoSQL + no auth push it out.

---

## Consequences

### Positive

✅ One service to sign up for, one SDK to install (`@supabase/supabase-js`)
✅ PostgreSQL migrations are version-controlled and deterministic
✅ RLS enforces access control server-side — no middleware bugs
✅ Realtime subscriptions deliver crew pick changes in ~3s
✅ JWT auto-refresh handled by Supabase client SDK
✅ Edge Functions deploy with `supabase functions deploy` — no infra
✅ Free tier covers the festival (20 users, 78 bands, 4 days)
✅ Auto-generated TypeScript types from schema (`supabase gen types`)

### Negative

❌ **Vendor lock-in**: Supabase-specific APIs. Migrating to a different backend requires rewriting all Supabase calls.
❌ **Learning curve**: PostgreSQL migrations, RLS policies, and trigger syntax are unfamiliar to JavaScript-only developers.
❌ **RLS complexity**: Wrong policies silently deny reads (hard to debug). Must test RLS carefully.
❌ **Realtime requires network**: If Supabase Realtime is down or flaky, attendance counts are stale. App degrades gracefully (reads from IndexedDB) but no live updates.
❌ **Edge Function cold start**: First invocation after idle can take 1-2s. Claude alert edge function may have a noticeable delay.
❌ **Free tier limits**: 500MB database, 2GB bandwidth, 50k active users/month. Not an issue for 20 users.

---

## Tradeoffs Accepted

### Vendor Lock-In
**Tradeoff**: All auth, DB, realtime, and functions calls use Supabase-specific APIs.
**Acceptance**: Acceptable for a festival companion app. Supabase is open-source (PostgREST + GoTrue + Realtime). Self-hosting is possible if needed. Migration cost is real but bounded.

### Eventual Consistency on Realtime Outage
**Tradeoff**: If Supabase Realtime is unavailable, crew picks are stale until the next sync trigger.
**Acceptance**: App still fully functional (reads IndexedDB). Stale data is acceptable for a festival.

### Trigger Complexity
**Tradeoff**: `handle_new_user()` trigger adds a hidden server-side step on signup. A bug in the trigger caused a production issue (`coalesce()` fix).
**Acceptance**: The trigger is documented, fixed, and protected by a migration. Complexity is contained.

### RLS Debugging Difficulty
**Tradeoff**: Silent RLS denials are hard to diagnose without the Supabase dashboard.
**Acceptance**: RLS policies are simple and well-tested. The risk is low for a small schema.

---

## Implementation Details

### Client Configuration

```typescript
// src/lib/supabase.ts
export const supabase = createClient<Database>(url, key, {
  auth: {
    persistSession: true,
    storage: customIndexedDBStorage,  // Custom adapter, not localStorage
  },
});
```

### Realtime Subscriptions

Used for live data across 4 tables:

| Table | Hook | Events | Purpose |
|-------|------|--------|---------|
| `user_picks` | `usePickCounts`, `useBandAttendees` | INSERT, DELETE | Crew pick counts |
| `user_presence` | `usePresenceRealtime` | * | Crew location status |
| `metal_place_config` | `useMetalPlaceConfig` | * | Festival config |
| `live_band_test_config` | `useLiveBandTestConfig` | * | Test mode config |

### Edge Functions

One function deployed for badge assignment:
- `assign-badge` — Called by godlike to add a badge slug to `users.special_badges[]`

Claude API calls are also via Edge Functions (`src/services/alerts.ts` → HTTP POST to Supabase Functions endpoint).

---

## Related Decisions

- **ADR: IndexedDB as Primary Store** — Why Supabase is secondary (sync target), not primary
- **ADR: PWA Not Native** — Why web is the right deployment model for this backend choice
- **ADR: Custom Hooks + Event Emitters** — How frontend state is managed without Supabase as primary

---

## Revision History

- **2026-05**: Initial decision, accepted based on project requirements

---

**Last updated:** 2026-05-12
