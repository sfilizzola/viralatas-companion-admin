# Consolidate Badges — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `ConsolidateBadges` card to the Badge Testing section that lets the godlike user dry-run and then execute year-badge consolidation for all non-test users (year 2026).

**Architecture:** Single new component `ConsolidateBadges.tsx` wired to the existing `consolidate-year-badges` Edge Function (companion app), which must already be deployed with `dryRun` support before this card is used. No new hooks, no new CSS files, no new dependencies.

**Spec:** `docs/superpowers/specs/2026-06-04-consolidate-badges-design.md`

---

## Design Decisions (resolved in grilling session 2026-06-04)

| Decision | Choice | Reason |
|---|---|---|
| Deploy order | Companion EF deploys **first** | EF without `dryRun` would silently write on Dry Run click |
| EF auth | Already uses `SUPABASE_SERVICE_ROLE_KEY` internally — no admin-app change | Confirmed from EF source |
| Confirm step | Native `window.confirm()` | Consistent with `CacheReset`; no new CSS needed |
| `dryRunResult` after success | **Cleared** — forces re-run of dry run before next consolidation | Enforces preview-before-commit every time |
| Dry run error → | `idle` (clear everything) | Nothing useful to show without results |
| Consolidation error → | `dryRunDone` (dry run result still valid) | No need to force redundant re-run to retry the write |
| Card width | `fullWidth` | Scrollable user list needs room |
| `displayName` | `email.split('@')[0]` from `authData.user.email` (already fetched in EF loop) | Simplest; no extra DB query |
| Response disambiguation | `dryRun: boolean` in both response shapes | Explicit, no ambiguity |
| Count field | `savedBadges` (not `consolidated` — spec naming error) | Matches existing `ConsolidateBadgesResult` type |
| Partial EF errors | Surface as `"{savedBadges} saved, {errors.length} user(s) failed"` | Silent partial failure is dangerous in archiving |
| Dry-run user list | Only users with ≥1 badge; include `processedUsers` + `skipped` top-level | Noise-free list with full summary context |
| Card ID | `D-02` (not `C-02` as spec says — `C-02` is already taken by MetalPlaceConfig) | Follows D-* prefix for Badge Testing section |

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/sections/BadgeTesting/ConsolidateBadges.tsx` | **Create** | Full card — state machine, EF invocations, results area |
| `src/sections/BadgeTesting/index.tsx` | **Edit** | Add `<ConsolidateBadges />` to the card grid |

---

## Task 1 — Create `ConsolidateBadges.tsx`

**File:** `src/sections/BadgeTesting/ConsolidateBadges.tsx`

### Step 1.1 — Create the component

- [ ] Create `src/sections/BadgeTesting/ConsolidateBadges.tsx` with this exact content:

```tsx
import { useState } from 'react'
import { FunctionCard } from '../../components/FunctionCard/FunctionCard'
import { useFeedback } from '../../hooks/useFeedback'
import { supabase } from '../../lib/supabase'
import styles from '../sections.module.css'

type Phase = 'idle' | 'dryRunLoading' | 'dryRunDone' | 'consolidating'

interface DryRunBadge {
  slug: string
  imagePath: string
  labelKey: string
}

interface DryRunUser {
  userId: string
  displayName: string
  badges: DryRunBadge[]
}

interface DryRunResponse {
  dryRun: true
  totalBadges: number
  processedUsers: number
  skipped: number
  users: DryRunUser[]
}

interface ConsolidateResponse {
  dryRun: false
  processedUsers: number
  savedBadges: number
  skipped: number
  errors: string[]
}

export function ConsolidateBadges() {
  const { feedback, show } = useFeedback()
  const [phase, setPhase] = useState<Phase>('idle')
  const [dryRunResult, setDryRunResult] = useState<DryRunResponse | null>(null)

  async function handleDryRun() {
    setPhase('dryRunLoading')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await supabase.functions.invoke('consolidate-year-badges', {
        body: { year: 2026, force: true, dryRun: true },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      if (res.error) throw new Error(res.error.message)
      const data = res.data as DryRunResponse & { error?: string }
      if (data.error) throw new Error(data.error)
      setDryRunResult(data)
      setPhase('dryRunDone')
    } catch (err) {
      setPhase('idle')
      show('error', err instanceof Error ? err.message : 'Dry run failed')
    }
  }

  async function handleConsolidate() {
    const confirmed = window.confirm(
      'This will write frozen badge rows for all non-test users (year 2026). Operation is idempotent — re-running is safe. Confirm?'
    )
    if (!confirmed) return

    setPhase('consolidating')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await supabase.functions.invoke('consolidate-year-badges', {
        body: { year: 2026, force: true, dryRun: false },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      if (res.error) throw new Error(res.error.message)
      const data = res.data as ConsolidateResponse & { error?: string }
      if (data.error) throw new Error(data.error)

      const hasErrors = data.errors?.length > 0
      const msg = hasErrors
        ? `Done — ${data.savedBadges} saved, ${data.errors.length} user(s) failed`
        : `Done — ${data.savedBadges} badges consolidated`

      setDryRunResult(null)
      setPhase('idle')
      show(hasErrors ? 'error' : 'success', msg)
    } catch (err) {
      setPhase('dryRunDone')
      show('error', err instanceof Error ? err.message : 'Consolidation failed')
    }
  }

  const isLoading = phase === 'dryRunLoading' || phase === 'consolidating'
  const cardStatus = isLoading ? 'loading' : phase === 'dryRunDone' ? 'active' : 'ready'

  return (
    <FunctionCard
      id="D-02"
      title="Consolidate Badges 2026"
      description="Snapshot year-badges for all non-test users into the permanent archive."
      status={cardStatus}
      fullWidth
    >
      <div className={styles.inputRow}>
        <button
          className="btn-primary"
          onClick={handleDryRun}
          disabled={isLoading}
        >
          {phase === 'dryRunLoading' ? 'Running…' : 'Dry Run'}
        </button>
        <button
          className="btn-primary"
          onClick={handleConsolidate}
          disabled={phase !== 'dryRunDone'}
        >
          {phase === 'consolidating' ? 'Consolidating…' : 'Consolidate →'}
        </button>
      </div>

      {dryRunResult && (
        <div className={styles.dryRunResults}>
          <p className={styles.metaLabel}>
            Would consolidate <strong>{dryRunResult.totalBadges}</strong> badges
            across <strong>{dryRunResult.users.length}</strong> users
            {dryRunResult.skipped > 0 && ` (${dryRunResult.skipped} with no year badges skipped)`}
          </p>
          <div className={styles.dryRunList}>
            {dryRunResult.users.map(u => (
              <div key={u.userId} className={styles.dryRunRow}>
                <span className={styles.dryRunUser}>{u.displayName}</span>
                <span className={styles.dryRunBadges}>
                  {u.badges.map(b => (
                    <span key={b.slug} className={styles.badgeTag}>{b.slug}</span>
                  ))}
                </span>
              </div>
            ))}
          </div>
          <p className={styles.metaNote}>Results from last dry run — run again to refresh</p>
        </div>
      )}

      {feedback && (
        <p className={feedback.type === 'success' ? styles.feedbackOk : styles.feedbackErr}>
          {feedback.message}
        </p>
      )}
    </FunctionCard>
  )
}
```

### Step 1.2 — Add missing CSS classes to `sections.module.css`

- [ ] Read `src/sections/sections.module.css` to find the end of the file
- [ ] Append the following classes (do not duplicate if already present):

```css
/* ConsolidateBadges dry-run results */
.dryRunResults {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}

.dryRunList {
  max-height: 320px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border: 1px solid var(--rule-slate);
  padding: 8px;
}

.dryRunRow {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 4px 0;
  border-bottom: 1px solid rgba(63, 77, 96, 0.25);
  flex-wrap: wrap;
}

.dryRunRow:last-child {
  border-bottom: none;
}

.dryRunUser {
  font-family: var(--f-mono);
  font-size: 11px;
  color: var(--bone);
  min-width: 120px;
  flex-shrink: 0;
}

.dryRunBadges {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.badgeTag {
  font-family: var(--f-mono);
  font-size: 10px;
  color: var(--caramel);
  background: rgba(217, 123, 44, 0.08);
  border: 1px solid rgba(217, 123, 44, 0.25);
  padding: 1px 6px;
  letter-spacing: 0.04em;
}

.metaNote {
  font-family: var(--f-mono);
  font-size: 10px;
  color: var(--bone-dim);
  letter-spacing: 0.04em;
  margin: 0;
}
```

### Step 1.3 — Verify no linter errors

- [ ] Run: `rtk lint 2>&1 | grep ConsolidateBadges`
- Expected: no output (no errors in new file)

### Step 1.4 — Commit

- [ ] Run:
```bash
rtk git add src/sections/BadgeTesting/ConsolidateBadges.tsx src/sections/sections.module.css && rtk git commit -m "feat: add ConsolidateBadges card (D-02) with dry-run and confirm flow"
```

---

## Task 2 — Wire into `BadgeTesting/index.tsx`

**File:** `src/sections/BadgeTesting/index.tsx`

### Step 2.1 — Add the import and render the card

- [ ] Edit `src/sections/BadgeTesting/index.tsx`:

```tsx
import styles from '../sections.module.css'
import { TestBadges } from './TestBadges'
import { ConsolidateBadges } from './ConsolidateBadges'

export function BadgeTesting() {
  return (
    <div>
      <div className={styles.sectionHeader}>
        <h1 className={styles.sectionTitle}>Badge Consolidation</h1>
        <p className={styles.sectionDesc}>
          Add test badges to verify badge rendering and unlock conditions.
        </p>
      </div>
      <div className={styles.cardGrid}>
        <TestBadges />
        <ConsolidateBadges />
      </div>
    </div>
  )
}
```

### Step 2.2 — Verify no linter errors

- [ ] Run: `rtk lint 2>&1 | grep -E "BadgeTesting|ConsolidateBadges"`
- Expected: no output

### Step 2.3 — Manual smoke test

- [ ] Run: `npm run dev`
- [ ] Open admin app → Badge Consolidation section
- [ ] Verify `ConsolidateBadges` card renders with `● Ready` status, two buttons visible
- [ ] Verify "Consolidate →" button is disabled (greyed out)
- [ ] Click "Dry Run" → status changes to `◌ Loading`, button shows "Running…"
- [ ] After response: results area appears, "Consolidate →" button becomes enabled
- [ ] Summary line shows `"Would consolidate N badges across M users (X with no year badges skipped)"`
- [ ] User rows show email prefixes + badge slug tags
- [ ] Click "Consolidate →" → native confirm dialog appears
- [ ] Click "Cancel" → dialog closes, stays in `dryRunDone`, results still visible
- [ ] Click "Consolidate →" again → confirm → success banner appears, results area disappears, "Consolidate →" re-disables

### Step 2.4 — Commit

- [ ] Run:
```bash
rtk git add src/sections/BadgeTesting/index.tsx && rtk git commit -m "feat: register ConsolidateBadges in BadgeTesting section"
```

---

## Task 3 — Companion app deploy guide

> **Do this before testing in production.** The `consolidate-year-badges` Edge Function must support the `dryRun` parameter before the admin app card is used. See `COMPANION.md` in this repo for the full prompt to paste into the companion app agent.

### Step 3.1 — Deploy the companion app EF

- [ ] In the companion app repo, apply the changes described in `COMPANION.md`
- [ ] Open a PR, merge it, and wait for the Supabase EF to deploy automatically
  - Or deploy manually: `supabase functions deploy consolidate-year-badges`

### Step 3.2 — Verify the updated EF with curl

- [ ] Get a fresh godlike session token from the browser (DevTools → Application → Local Storage → supabase token)
- [ ] Run a dry-run smoke test:
```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/consolidate-year-badges \
  -H "Authorization: Bearer <session-token>" \
  -H "Content-Type: application/json" \
  -d '{"year":2026,"force":true,"dryRun":true}'
```
- [ ] Confirm response shape: `{ "dryRun": true, "totalBadges": N, "processedUsers": N, "skipped": N, "users": [...] }`
- [ ] Confirm no rows were written to `user_badge_history` (query the table)

### Step 3.3 — Verify real consolidation response shape

- [ ] Run a real consolidation (safe — idempotent):
```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/consolidate-year-badges \
  -H "Authorization: Bearer <session-token>" \
  -H "Content-Type: application/json" \
  -d '{"year":2026,"force":true,"dryRun":false}'
```
- [ ] Confirm response shape: `{ "dryRun": false, "processedUsers": N, "savedBadges": N, "skipped": N, "errors": [] }`

---

## Done

After all tasks are committed and the EF is deployed:
- Dry Run previews all non-test users + their year-2026 badges without writing anything
- Consolidate → is gated behind Dry Run having run at least once in the session
- Native confirm prevents accidental real consolidation
- Partial EF errors are surfaced in the feedback banner
- Re-running consolidation is always safe (idempotent upsert)
