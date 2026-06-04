# Companion App Agent Prompt — `consolidate-year-badges` EF Update

> Paste this entire file into the companion app agent. It is self-contained.

---

## Task

Update the `consolidate-year-badges` Edge Function to support a `dryRun` mode. The function must be backward-compatible: existing callers that omit `dryRun` must behave exactly as before.

**File to edit:** `supabase/functions/consolidate-year-badges/index.ts`

---

## What to change

### 1. Update `ConsolidateRequest` type

Add `dryRun?: boolean`:

```typescript
type ConsolidateRequest = {
  year?: number;
  force?: boolean;
  dryRun?: boolean;
};
```

### 2. Add new response types

Add these types alongside the existing `ConsolidateResponse`:

```typescript
interface DryRunBadgeEntry {
  slug: string;
  imagePath: string;
  labelKey: string;
}

interface DryRunUserEntry {
  userId: string;
  displayName: string;
  badges: DryRunBadgeEntry[];
}

interface DryRunResponse {
  dryRun: true;
  totalBadges: number;
  processedUsers: number;
  skipped: number;
  users: DryRunUserEntry[];
}
```

Also update `ConsolidateResponse` to add `dryRun: false`:

```typescript
type ConsolidateResponse = {
  dryRun: false;
  processedUsers: number;
  savedBadges: number;
  skipped: number;
  errors: string[];
};
```

### 3. Parse `dryRun` from the request body

After the existing `const force = body.force === true;` line, add:

```typescript
const dryRun = body.dryRun === true;
```

### 4. Add dry-run accumulators before the user loop

Before the `const result: ConsolidateResponse = { ... }` block, add:

```typescript
const dryRunUsers: DryRunUserEntry[] = [];
let dryRunTotalBadges = 0;
```

### 5. Branch inside the user loop

The existing loop processes each user, calls `supabase.auth.admin.getUserById`, builds badge context, filters earned badges, then upserts. Modify the section **after** `const earned = getEarnedBadges(ctx).filter((badge) => badge.year === year)` to branch on `dryRun` before the upsert:

```typescript
if (earned.length === 0) {
  result.skipped += 1;
  continue;
}

if (dryRun) {
  dryRunUsers.push({
    userId: row.id,
    displayName: authData.user.email?.split('@')[0] ?? row.id,
    badges: earned.map((b) => ({
      slug: b.slug,
      imagePath: b.imagePath,
      labelKey: b.labelKey,
    })),
  });
  dryRunTotalBadges += earned.length;
  continue; // skip upsert entirely
}

// --- existing upsert logic below — do not change ---
const rows = earned.map((badge) => ({
  user_id: row.id,
  festival_year: year,
  slug: badge.slug,
  image_path: badge.imagePath,
  label_key: badge.labelKey,
}));

const { error: upsertError } = await supabase
  .from('user_badge_history')
  .upsert(rows, { onConflict: 'user_id,festival_year,slug' });

if (upsertError) {
  result.errors.push(`${row.id}: ${upsertError.message}`);
  continue;
}

result.savedBadges += rows.length;
```

### 6. Return different shapes after the loop

Replace the existing `return new Response(JSON.stringify(result), ...)` at the end with:

```typescript
if (dryRun) {
  const dryRunResult: DryRunResponse = {
    dryRun: true,
    totalBadges: dryRunTotalBadges,
    processedUsers: result.processedUsers,
    skipped: result.skipped,
    users: dryRunUsers,
  };
  return new Response(JSON.stringify(dryRunResult), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

return new Response(JSON.stringify({ ...result, dryRun: false }), {
  status: 200,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});
```

---

## What NOT to change

- Do not change the auth flow (JWT validation + godlike role check)
- Do not change how bands, picks, missed bands, presence, or users are fetched
- Do not change the `isFestivalEndedServer` gate logic
- Do not change the `buildServerBadgeContext` or `getEarnedBadges` calls
- Do not change the upsert logic (only skip it when `dryRun: true`)
- Existing callers that send `{ year, force }` without `dryRun` continue to work exactly as before (`dryRun` defaults to `false`)

---

## Verification

After deploying, test with curl using a godlike session token:

**Dry run (should return preview, write nothing):**
```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/consolidate-year-badges \
  -H "Authorization: Bearer <session-token>" \
  -H "Content-Type: application/json" \
  -d '{"year":2026,"force":true,"dryRun":true}'
```
Expected shape:
```json
{
  "dryRun": true,
  "totalBadges": 47,
  "processedUsers": 18,
  "skipped": 3,
  "users": [
    {
      "userId": "...",
      "displayName": "username",
      "badges": [{ "slug": "death-metal", "imagePath": "...", "labelKey": "..." }]
    }
  ]
}
```

**Real run (idempotent — safe to run):**
```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/consolidate-year-badges \
  -H "Authorization: Bearer <session-token>" \
  -H "Content-Type: application/json" \
  -d '{"year":2026,"force":true,"dryRun":false}'
```
Expected shape:
```json
{
  "dryRun": false,
  "processedUsers": 18,
  "savedBadges": 47,
  "skipped": 3,
  "errors": []
}
```

**Backward-compat check (existing companion app call — must still work):**
```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/consolidate-year-badges \
  -H "Authorization: Bearer <session-token>" \
  -H "Content-Type: application/json" \
  -d '{"year":2026,"force":true}'
```
Expected: same shape as real run above (no `dryRun` field in request → treated as `false`).
