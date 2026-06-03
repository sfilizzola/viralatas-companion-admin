# ADR: IndexedDB as Primary Store

**Status**: Accepted

**Date**: 2026-05

**Deciders**: Product team, engineering lead

---

## Context

The app must work fully offline at Wacken (terrible cellular signal in rural area, 170k+ attendees). Users need to browse schedule, pick bands, post announcements, and check crew presence without connectivity.

Options considered:
1. **Supabase (server) as primary** — Real-time consistency, no offline, fetch on-demand
2. **IndexedDB as primary, Supabase as sync target** — Offline-first, eventual consistency
3. **In-memory cache + localStorage** — Simpler, but unstructured, no transactions
4. **SQLite (via sql.js)** — Structured, but slow, file I/O complexity

---

## Decision

**Use IndexedDB as primary store. Supabase is sync target (secondary).**

All UI reads come from IndexedDB first. Writes go to IndexedDB immediately (optimistic), then Supabase asynchronously.

---

## Rationale

### Why IndexedDB Primary

✅ **Offline browsing**: Fully functional without network. Band schedule, crew attendance, past announcements all available.

✅ **Persistence**: Survives browser close, app restart, power loss (unlike in-memory).

✅ **Structured queries**: Supports indexes, ranges, cursors. Can filter bands by stage/time without loading all.

✅ **Transactions**: Multiple writes are atomic (all-or-nothing). Example: replacing crew picks is transactional.

✅ **Large capacity**: 50MB+ in most browsers. Sufficient for 78 bands + 20 users + 6 months of announcements.

✅ **No external dependency**: Built into browsers, no npm package required for core functionality.

✅ **Async API**: Non-blocking, plays well with React effects.

### Why NOT Supabase Primary

❌ **Requires network**: Can't browse offline.

❌ **Realtime latency**: 3-5s typical for Realtime updates, not instant.

❌ **Cost**: Every read is an API call; Supabase free tier has limitations.

❌ **Battery**: Network calls drain battery; offline-first uses less power.

### Why NOT localStorage Primary

❌ **Unstructured**: Key-value pairs, no queries.

❌ **Small capacity**: 5-10MB typical, insufficient for band images + full lineup.

❌ **Synchronous API**: Blocks main thread on reads.

❌ **No transactions**: Multiple writes can partially complete on crash.

### Why NOT SQLite (sql.js)

❌ **Slow**: SQL.js runs in-memory JS, not native. 10-100x slower than IndexedDB.

❌ **Large bundle**: sql.js wasm binary is 500KB+ gzipped.

❌ **File I/O**: Still need IndexedDB or localStorage to persist; adds complexity.

---

## Consequences

### Positive

✅ App works fully offline (core requirement met)
✅ Instant UI updates (no network latency)
✅ Battery efficient (fewer network calls)
✅ No external dependency (IndexedDB is standard)
✅ Can handle slow/unreliable networks gracefully
✅ User data persists across sessions

### Negative

❌ **Eventual consistency**: Offline data can be stale by hours
❌ **Queue complexity**: Must manage offline operations and sync logic
❌ **Storage limit**: ~50MB per domain (rare, but exhaustion possible)
❌ **Browser dependency**: IndexedDB is browser-only (not Node.js compatible for testing; mitigated with vitest mock)
❌ **Conflict resolution**: No built-in merge strategy for conflicting edits
❌ **Privacy concern**: User data stored unencrypted on device (mitigated: Supabase validates session)

---

## Tradeoffs Accepted

### Eventual Consistency
**Tradeoff**: Offline crew attendance may be hours old.
**Acceptance**: OK for a small group + entertainment use. Unacceptable for financial/safety-critical apps.

### Queue Management
**Tradeoff**: Must implement offline queue, dedup, retry logic.
**Acceptance**: Codebase already abstracts this in `repositories/`. ~200 LoC per repo.

### Storage Quota
**Tradeoff**: If user has extremely poor network and makes 1000+ picks offline, quota may be exceeded.
**Acceptance**: Rare for small group. Cache version bump clears all data as mitigation.

### Unencrypted Storage
**Tradeoff**: IndexedDB is not encrypted. Session tokens visible to devtools.
**Acceptance**: Session tokens validated server-side. App assumes trusted device (festival attendance, known users).

---

## Implementation Details

### Object Stores (Collections)
- `bands` — Schedule cache (immutable, fetched once)
- `crew_users` — Member profiles (name, avatar, cached from Supabase)
- `user_picks` — User's picks (synced with Supabase)
- `offline_picks` — Picks made offline, awaiting sync
- `announcements` — Posted messages (synced with Supabase)
- `pending_announcements` — Posts made offline
- `user_presence` — Crew location status
- `offline_presence` — Presence changes offline
- `user_missed_bands` — Bands user watched
- `offline_missed_bands` — Marks offline
- `session` — Supabase auth token (custom persistence)
- `meta` — Cache version, invalidation trigger

### Sync Pattern
1. **Write**: saveUserPick() → IndexedDB (optimistic)
2. **Emit**: Window event so components re-render
3. **Sync**: Async Supabase call (fire-and-forget)
4. **Queue**: If offline or error, enqueue to offline_picks
5. **Reconnect**: flushOfflineQueue() on 'online' event

### Data Freshness
- **App init**: Full sync from Supabase (bands, crew, picks, announcements)
- **Realtime**: Supabase postgres_changes subscriptions auto-update IndexedDB
- **Offline**: Stale by last sync time (hours/days possible)
- **Reconnect**: Fresh sync of crew data within ~30s

---

## Alternatives Reconsidered

### Hybrid: IndexedDB Primary + Server Cache Headers

**Approach**: IndexedDB primary, but listen to Supabase cache headers for invalidation.

**Why not**: IndexedDB doesn't support HTTP headers. Would need manual polling. Adds complexity without benefit.

### Hybrid: IndexedDB + Service Worker Cache

**Approach**: IndexedDB for structured data, Service Worker for assets (images, CSS, JS).

**Decision**: Implemented. Workbox caching for assets (30-day TTL for band images), separate from IndexedDB sync.

### Hybrid: Local-first Sync Engine (CRDT)

**Approach**: Use Yjs or Automerge for multi-user conflict resolution.

**Why not**: Overkill for small group. No multi-user simultaneous edits expected (users don't co-author picks). Trade complexity for feature not needed.

---

## Monitoring & Alerts

1. **IndexedDB quota exceeded**: Log error, alert user "Storage full, please clear app cache"
2. **Sync failures**: Retry on next 'online'; notify user if >3 consecutive failures
3. **Realtime outage**: Fall back to polling (manual sync); notify user

---

## Related Decisions

- **ADR: Supabase as Sync Target** — Why Supabase specifically (auth + DB + realtime in one)
- **ADR: PWA Not Native** — Why web (no app store, instant updates), which enables this offline-first approach

---

## Revision History

- **2026-05**: Initial decision, accepted based on project requirements

---

**Last updated:** 2026-05-11
