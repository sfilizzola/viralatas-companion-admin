# Festival Reset

## Purpose

Document the `npm run festival:reset` operator script — a one-shot tool to clear pre-festival activity (badges, announcements, presence check-ins, moderation history) and optionally re-seed the bands table with the finalized lineup. Run once at festival start so live counts, badges, and the announcement mural reflect Wacken itself rather than two months of pre-game.

**Warning:** This project's Supabase plan has **no point-in-time restore**. `--with-bands` CASCADE-wipes all `user_picks` with no undo. Agents must not run this on production without explicit operator confirmation. See `.claude/context/production-database.md`.

---

## Relevant Source Files

- `supabase/seed/festival-reset.ts` — The script. Single-file, Node-only, runs via `tsx`.
- `supabase/seed/bands.ts` — Delegated to when `--with-bands` is passed.
- `supabase/migrations/20260504000006_cache_version.sql` — Defines `public.app_config` with the `cache_version` row that the script bumps.
- `src/repositories/bands.ts` — Client-side counterpart (`invalidateCacheForAllUsers`) used by the godlike "Reset all data" UI button. The script writes to the same row but does NOT call this function (which also wipes the operator's local IndexedDB — irrelevant for a Node process).
- `docs/superpowers/specs/2026-05-18-festival-reset-design.md` — Full design rationale, edge cases, risk table.

---

## When to Run

Once, in the days leading up to Wacken 2026 (festival starts 2026-07-29). The script is destructive and has no undo. Typical sequence:

1. Days before the festival: finalize `docs/ai-wiki/lineup.md` and `docs/ai-wiki/stages.md` with the official lineup.
2. Update `supabase/seed/bands.ts` from those wiki pages.
3. From a laptop on the same Wi-Fi/account that has `.env.local` configured: `npm run festival:reset -- --with-bands --force`.
4. The crew opens the app; clients invalidate cached state and pull the fresh lineup.

---

## Flag Matrix

| Command | Behavior |
|---|---|
| `npm run festival:reset` | State-only wipe (badges + announcements + blocked + presence + cache bump). 5-second countdown. No band changes. |
| `npm run festival:reset -- --with-bands` | State wipe **then** bands re-seed using the finalized lineup. |
| `npm run festival:reset -- --dry-run` | Pre-flight summary only. Writes nothing. Countdown skipped. Compatible with `--with-bands` (shows what bands.ts would do without invoking it). |
| `npm run festival:reset -- --force` | Skip the 5-second countdown. Combinable with `--with-bands`. |

Flags are commutative. `--dry-run` always overrides write semantics: it shows the plan but performs no writes (including no bands re-seed).

---

## Scope Guard

### Wiped (intended)

| Target | Mechanism |
|---|---|
| `public.announcements` (all rows) | `DELETE` |
| `public.blocked_posters` (all rows) | `DELETE` |
| `public.user_presence` (all rows) | `DELETE` |
| `public.users.special_badges` (all users) | `UPDATE … SET special_badges = '{}'` |
| `auth.users.raw_user_meta_data.achieved_badge_slugs` | Key removed via `auth.admin.updateUserById` |
| `auth.users.raw_user_meta_data.crew_earned_badge_slugs` | Key removed |
| `auth.users.raw_user_meta_data.location_visits` | Key removed |
| `public.app_config` row `key='cache_version'` | Bumped (not deleted) to fresh ISO timestamp |
| `public.bands` (only with `--with-bands`) | Replaced via `bands.ts --force` |
| `public.user_picks` (only with `--with-bands`) | CASCADE from bands wipe |
| `public.user_missed_bands` (only with `--with-bands`) | CASCADE from bands wipe |
| `public.user_badge_history` | **Never touched** — year archive survives reset |

### Preserved (never touched)

| Target | Note |
|---|---|
| `public.users` rows themselves | Only the `special_badges` column is cleared; row stays |
| `public.users` columns: `role`, `display_name`, `email`, `avatar_url`, `country`, `is_friend`, etc. | All preserved |
| `auth.users` rows themselves | Only metadata is patched; row never deleted |
| `auth.users.raw_user_meta_data.wacken_years` | Preserved (profile data, not festival state) |
| `auth.users.raw_user_meta_data.wacken_arrival_day` | Preserved (user re-declares only if they want to) |
| Push subscription fields in `user_metadata` | Preserved (no key on the strip list) |
| Every other `user_metadata` key | Preserved by design — see "Positive-strip pattern" below |
| `public.metal_place_config` | Godlike sets fresh values before festival |
| `public.live_band_test_config` | Godlike sets fresh values before festival |
| `public.bands` (without `--with-bands`) | Untouched |
| `public.user_picks` (without `--with-bands`) | Untouched |
| `public.user_badge_history` | **Never touched** — consolidated year badges are permanent archive |

---

## Execution Sequence

1. Load `.env.local`; require `VITE_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Hard-fail if either is missing.
2. Pre-flight summary — print row counts for all affected tables and number of users carrying persistent badge metadata keys.
3. 5-second countdown (skipped by `--force`; never shown in `--dry-run`).
4. `DELETE FROM public.announcements` + post-condition assert (`count == 0`).
5. `DELETE FROM public.blocked_posters` + post-condition assert.
6. `DELETE FROM public.user_presence` + post-condition assert.
7. `UPDATE public.users SET special_badges = '{}'` + post-condition assert (no users with non-empty `special_badges`).
8. Paginated `auth.admin.listUsers()` + `auth.admin.updateUserById()` to strip three keys per user. Tracks `stripped` / `skipped (no relevant keys)` / `failed` counts. Failures don't abort the run; they're surfaced at the end and cause a non-zero exit code.
9. Bump `public.app_config` row `key='cache_version'` to `new Date().toISOString()`. If the row is missing, log a warning but don't fail.
10. **If `--with-bands`:** spawn `npx tsx supabase/seed/bands.ts --force` as a subprocess. Subprocess stdout/stderr is inherited so the operator sees its banner directly.
11. Final summary. If `--with-bands` was NOT passed, print a reminder to seed bands separately. Exit 0 unless metadata strip had failures.

---

## Realtime and Cache Invalidation

Two mechanisms drive client convergence after a reset:

**Realtime publications.** `announcements`, `user_presence`, `user_picks` have realtime enabled. The `DELETE`s in steps 4, 6, and (via `--with-bands` cascade) push `postgres_changes` events to every connected client within a few seconds, mutating their IndexedDB caches.

**Cache version bump.** Badges and `users.special_badges` don't have their own realtime publications. The `app_config.cache_version` bump in step 9 forces the `CacheVersionCheck` component (`src/repositories/bands.ts` → `checkAndApplyCacheVersion`) to detect a mismatch on the next app load and wipe local IndexedDB, triggering a fresh re-fetch.

---

## Positive-Strip Pattern (Why It Matters)

The script removes only three named keys from `auth.users.raw_user_meta_data` (`achieved_badge_slugs`, `crew_earned_badge_slugs`, `location_visits`) — but rebuilds the metadata object by copying the existing object and `delete`-ing those keys (positive strip). It does NOT construct a fresh object containing only an allow-list of keys.

The reason: `auth.admin.updateUserById(id, { user_metadata })` **replaces** the metadata object entirely. If a future phase adds a new metadata key (e.g. `notif_push_endpoint`, `wacken_2027_plans`), an allow-list pattern would silently drop it. The positive-strip pattern means the script touches exactly what it intends to and remains correct as the metadata schema grows.

If you add a new persistent badge key in the future, add it to the `PERSISTENT_BADGE_METADATA_KEYS` constant in `festival-reset.ts`. That constant is the single source of truth for what counts as "persistent badge state".

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| `.env.local` missing the service role key | Hard-fail with `Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY` before any writes |
| Empty database | All steps run, all return 0 affected rows, cache_version still bumps, exits 0 |
| `auth.admin.listUsers` paginates past 1 page | Loop continues until a page returns fewer than `AUTH_LIST_PAGE_SIZE` users (defensive, bounded at 1000 iterations) |
| Single user's `updateUserById` fails | Logged; loop continues with other users; non-zero exit code at end |
| Re-run after a successful run | Pre-flight shows zeros, all wipes are no-ops, no errors; metadata strip skips every user (no relevant keys) |
| `app_config` row missing | Bump returns 0 rows; warning printed; script still exits 0 (data wipe succeeded; clients catch up on natural reload) |
| `--with-bands` invoked but `lineup.md` data is broken | State wipes still complete; bands re-seed exits non-zero; festival-reset propagates the exit code |

---

## Safety Rails

- Requires `SUPABASE_SERVICE_ROLE_KEY` — never present in client bundles, only in operator `.env.local`.
- 5-second countdown with a destructive-intent banner (skippable only via explicit `--force`).
- `--dry-run` shows everything that would happen without writing.
- Every `DELETE`/`UPDATE` has a post-condition assertion that aborts the run on failure.
- The script never deletes rows from `auth.users` or `public.users` themselves — only their badge state.

---

## Why a Script, Not a Godlike UI Button

The existing godlike "Reset all data" button (`src/components/profile/GodlikeAdminPanel.tsx`) only bumps `cache_version` — it does not wipe production data. Adding a "Festival Reset" button there would:

- Create permanent in-product surface area for a one-time operation (risk of accidental tap from a phone at the festival).
- Require a new Edge Function because `auth.users` writes need the service role key, which the browser must never see.
- Duplicate logic with the existing seed-script pattern (`bands.ts`, `test-users.ts`).

The script approach matches the seed-script idiom already established in `supabase/seed/`, keeps the destructive operation gated behind a laptop with the right `.env.local`, and adds zero UI surface.

---

## Data Flow Diagram

```
operator laptop
     │
     ▼
npm run festival:reset [--with-bands] [--dry-run] [--force]
     │
     ▼
supabase/seed/festival-reset.ts
     │  (service-role key)
     ▼
Supabase
  ├── public.announcements        DELETE all
  ├── public.blocked_posters      DELETE all
  ├── public.user_presence        DELETE all
  ├── public.users                UPDATE special_badges = '{}'
  ├── auth.users (raw_user_meta_data)
  │       strip: achieved_badge_slugs, crew_earned_badge_slugs, location_visits
  │       keep:  wacken_years, wacken_arrival_day, push subs, all other keys
  ├── public.app_config           BUMP cache_version (ISO timestamp)
  └── (optional) public.bands     replaced via bands.ts
                                  └─ CASCADE → user_picks + user_missed_bands

Connected clients
  ├── Realtime: announcements/user_presence/user_picks DELETEs push immediately
  └── On next app load: CacheVersionCheck detects mismatch → wipe IndexedDB → refetch
```

---

## Cross-References

- `docs/ai-wiki/supabase-schema.md` — Full table DDL and RLS policies for everything wiped/preserved (including the `public.app_config` row this script bumps).
- `docs/ai-wiki/badges.md` — Explains what `achieved_badge_slugs` and `crew_earned_badge_slugs` mean, plus the `persist: true` semantics that this script intentionally undoes.
- `docs/ai-wiki/sync-engine.md` — `CacheVersionCheck` mechanics; how clients react to the bump on next app load.
- `docs/ai-wiki/lineup-sync.md` — Non-destructive lineup sync; daily-use sibling to this script.
- `docs/ai-wiki/testing.md` — Manual seed-script catalog; this script lives alongside `seed:bands` / `seed:bands:sync` / `seed:test-users` / `seed:live-now`.
- `docs/ai-wiki/glossary.md` — `Festival Reset` and `Cache Version` entries.
- `docs/superpowers/specs/2026-05-18-festival-reset-design.md` — The full design doc (problem statement, alternatives considered, risk assessment).

---

## Open Questions

- **Bundling with `--with-bands` by default?** Today the bands re-seed is opt-in. If we observe the operator forgetting `--with-bands` at festival start, consider flipping the default — but at the cost of every test/staging run also CASCADE-wiping `user_picks`.
- **Push-subscription handling.** Push subscription fields in `auth.users.raw_user_meta_data` are preserved by the positive-strip pattern. If the festival ever needs to invalidate stale push endpoints (e.g. users who reinstalled the PWA), that needs a separate operation — this script intentionally does not touch them.
- **Future persistent-badge keys.** The `PERSISTENT_BADGE_METADATA_KEYS` constant is the single source of truth for the strip list. There is no automated reminder to extend it when a new persistent-badge key is introduced; the badge author has to remember. A lint rule or a registry-derived constant would harden this.
- **Multi-festival reuse.** The script wipes 2026 state without any year-awareness. For Wacken 2027, decide whether `wacken_arrival_day` (currently preserved as profile data) should reset too, or whether the 2027 reset should additionally null out `wacken_arrival_day` so users re-declare each year.
