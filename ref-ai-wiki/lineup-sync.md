# Lineup Sync — Non-Destructive Operator Tooling

## Purpose

Diff `supabase/seed/bands.ts` against `public.bands` by stable `slot_id`, preview changes (UPDATE / INSERT / DELETE), and optionally apply them **without** wiping `user_picks` or `user_missed_bands`. Use for mid-festival lineup edits: name fixes, time shifts, genre/image updates, new slots, canceled slots.

For catastrophic refresh (full table replace), use destructive `npm run seed:bands` or `npm run festival:reset -- --with-bands`.

## Relevant Source Files

| File | Role |
|------|------|
| `supabase/seed/bands-sync.ts` | Main sync tool — dry-run plan + `--apply` |
| `supabase/seed/bands-move.ts` | Pick transfer when band relocates slot (`--from` / `--to`) |
| `supabase/seed/bands.ts` | Seed source of truth; exports `assertSeedIntegrity`, `bands`, `SLOT_ID_RE` |
| `supabase/seed/bands-backfill-slot-id.ts` | One-time slot_id bootstrap — UPDATE only, picks preserved |
| `supabase/migrations/20260524000000_bands_slot_id_add.sql` | Adds NULLable `slot_id` + index |
| `supabase/migrations/20260524000001_bands_slot_id_lock.sql` | NOT NULL + UNIQUE; drops old composite UNIQUE |
| `supabase/seed/seed-shared.ts` | Shared env loader, service client, `cache_version` bump |

### slot_id bootstrap (before lock migration)

```bash
npm run seed:bands:backfill-slot-id          # dry-run — match by stage+time+name
npm run seed:bands:backfill-slot-id -- --apply
npx supabase db push                         # lock migration only
```

**Never** use `seed:bands --force` for bootstrap — DELETE+INSERT wipes all picks.

## When to Run

- After editing `bands.ts` for any field other than a deliberate slot identity change.
- After Wacken announces a `TDB MTB` representative (UPDATE bucket).
- When adding or removing a slot row in the seed file.
- **Not** when the band should keep picks but move to a different slot — run `seed:bands:move` first, then sync.

Requires `.env.local` with `VITE_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (laptop operator; never on client).

## Flag Matrix

| Command | Flag | Effect |
|---------|------|--------|
| `seed:bands:sync` | (none) | Dry-run — prints plan, writes nothing |
| `seed:bands:sync` | `--apply` | Execute plan; bump `cache_version` |
| `seed:bands:sync` | `--json` | Machine-readable plan (combinable with `--apply`) |
| `seed:bands:move` | `--from <slot>` | Source slot (required) |
| `seed:bands:move` | `--to <slot>` | Destination slot (required) |
| `seed:bands:move` | `--apply` | Execute pick transfer + delete source row |
| `seed:bands:backfill-slot-id` | (none) | Dry-run slot_id bootstrap on NULL rows |
| `seed:bands:backfill-slot-id` | `--apply` | UPDATE slot_id only — picks preserved |

## Execution Sequence (`seed:bands:sync`)

1. Load env; fail if service role key missing.
2. Run `assertSeedIntegrity(bands)` — 187 rows, unique `slot_id`, regex `^(HAR|FAS|LOU|WET|HBA|WAS|WAK|JUN)\d+$`.
3. Load DB rows; abort if any `slot_id IS NULL` (remediation: `npm run seed:bands:backfill-slot-id -- --apply` — preserves picks).
4. Build plan: INSERT (seed only), DELETE (DB only), UPDATE (field diffs on shared slots).
5. Compute pick impact for DELETE bucket.
6. Print plan (or JSON).
7. If `--apply`: UPDATE → INSERT → DELETE with post-condition checks; bump `app_config.cache_version`.

Bucket order minimizes risk: non-destructive updates first, additive inserts second, deletes last.

## Worked Examples

| Scenario | Steps |
|----------|-------|
| Time tweak on FAS1 | Edit `start_time`/`end_time` in `bands.ts` → `npm run seed:bands:sync` → review → `npm run seed:bands:sync -- --apply` |
| TDB MTB → real band | Update `name` + `image_url` in seed + lineup.md → sync dry-run shows 1 UPDATE → `--apply` (picks preserved) |
| New slot JUN1 | Add row to `bands.ts` + lineup.md → sync shows INSERT → `--apply` |
| Canceled slot removed | Delete row from seed → dry-run shows DELETE + pick impact → `--apply` only if pick loss acceptable |
| Band relocates slot, picks follow | Edit seed for new slot metadata → `seed:bands:move -- --from FAS1 --to LOU3 --apply` → `seed:bands:sync -- --apply` |

## Verifying Phase 24 / lineup changes (no writes)

**Production has no Supabase point-in-time restore.** Use these checks before and after any `--apply` — they do not modify data.

### 1. Local (codebase)

```bash
rtk npm run build
rtk npm test
```

Both must be green before touching prod.

### 2. Sync dry-run (prod, read-only)

```bash
rtk npm run seed:bands:sync
```

| Outcome | Meaning |
|---------|---------|
| Exit 0, **empty plan** (0 UPDATE / INSERT / DELETE) | DB matches `bands.ts` — schema + lineup aligned |
| UPDATE rows listed | Seed differs from DB — review diffs; `--apply` updates in place (**picks preserved** on UPDATE) |
| DELETE rows + pick impact > 0 | **Stop** — applying would wipe picks for those bands |
| Abort: NULL `slot_id` | Run `seed:bands:backfill-slot-id -- --apply` first (not destructive seed) |

Optional machine output: `rtk npm run seed:bands:sync -- --json`

### 3. SQL sanity (Supabase SQL editor)

```sql
-- slot_id integrity
SELECT count(*) AS total,
       count(*) FILTER (WHERE slot_id IS NULL) AS null_slot_id,
       count(DISTINCT slot_id) AS distinct_slot_ids
FROM public.bands;

-- sample spot-check
SELECT slot_id, name, stage, start_time
FROM public.bands
WHERE slot_id IN ('FAS1', 'HAR13', 'WET2')
ORDER BY slot_id;

-- pick count (note before/after if you run --apply)
SELECT count(*) AS user_picks FROM public.user_picks;
```

Expected after Phase 24: `total = 187`, `null_slot_id = 0`, `distinct_slot_ids = 187`.

### 4. App smoke (manual)

1. Open app logged in → `/schedule` loads all bands.
2. Pick one band → note name.
3. Hard refresh (or close/reopen PWA).
4. Pick still on — confirms `band_id` FK still valid.
5. Optional: second browser — pick count updates on Realtime.

### 5. When testing a seed edit end-to-end

1. Edit `bands.ts` (+ `lineup.md` if needed).
2. `seed:bands:sync` dry-run — confirm **exactly** the change you expect.
3. Note `SELECT count(*) FROM user_picks` **before** `--apply`.
4. `seed:bands:sync -- --apply`
5. Re-run dry-run → empty plan.
6. Pick count unchanged (unless DELETE bucket was used).
7. App smoke above.

For future risky work, clone to a **staging Supabase project** with a separate `.env.local` before prod.

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| NULL `slot_id` in DB | Sync aborts; run `seed:bands:backfill-slot-id -- --apply` (not destructive seed) |
| Change `slot_id` in seed vs DB | Shows DELETE + INSERT (picks lost on old slot) — use `seed:bands:move` if picks should follow |
| User picked both source and destination in move | Dedup: delete source pick; user keeps destination pick |
| Second `--apply` with no seed changes | Empty plan; no writes |
| Partial apply failure | Post-condition abort; re-run is idempotent |
| Clients online during sync | `bands` not realtime; clients refresh on next load via `cache_version` mismatch |

## Cross-References

- [Band Lineup](lineup.md) — Human-editable source; stable identity section
- [Supabase Schema](supabase-schema.md) — `public.bands` DDL with `slot_id`
- [Festival Reset](festival-reset.md) — Destructive sibling; `--with-bands` still uses `seed:bands`
- Design spec: `docs/superpowers/specs/2026-05-20-non-destructive-lineup-sync-design.md`

## Open Questions

- CI-triggered sync deferred (service role in operator `.env.local` only).
- No audit log of sync runs in v1.
