# Live Band Test — Full Wiring + BandCombobox

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the LiveBandTest stub with a fully wired Supabase card that lets the godlike user pick a live band from a searchable dropdown sorted by pick count.

**Architecture:** A new `BandCombobox` component handles all selection UI (combobox input + filtered dropdown); `LiveBandTest` owns data fetching (bands + config), writes, and realtime subscription. No new dependencies — pure React + Supabase JS SDK + CSS modules.

**Tech Stack:** React 18, TypeScript strict, Supabase JS SDK, CSS modules (existing design tokens in `src/index.css`), Vite dev server.

**Spec:** `docs/superpowers/specs/2026-06-04-live-band-test-combobox-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/components/BandCombobox/BandCombobox.tsx` | **Create** | Searchable combobox — input + filtered dropdown |
| `src/components/BandCombobox/BandCombobox.module.css` | **Create** | Dropdown styles (extends existing design tokens) |
| `src/sections/TestingTools/LiveBandTest.tsx` | **Rewrite** | Data fetching, Supabase writes, realtime, card layout |

---

## Task 1 — `BandCombobox` component

**Files:**
- Create: `src/components/BandCombobox/BandCombobox.tsx`
- Create: `src/components/BandCombobox/BandCombobox.module.css`

### Step 1.1 — Create the CSS module

- [ ] Create `src/components/BandCombobox/BandCombobox.module.css` with this exact content:

```css
/* Wraps input + dropdown together */
.root {
  position: relative;
  flex: 1;
  min-width: 0;
}

.input {
  width: 100%;
  padding: 8px 12px;
  background: var(--charcoal);
  border: 1px solid var(--rule-slate);
  color: var(--bone);
  font-family: var(--f-mono);
  font-size: 12px;
  outline: none;
  transition: border-color 0.15s;
  min-width: 0;
}

.input:focus,
.inputOpen {
  border-color: var(--caramel);
}

.input::placeholder {
  color: var(--bone-dim);
}

.input:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.dropdown {
  position: absolute;
  top: calc(100% + 2px);
  left: 0;
  right: 0;
  max-height: 220px;
  overflow-y: auto;
  background: var(--charcoal);
  border: 1px solid var(--caramel);
  border-top: none;
  list-style: none;
  z-index: 50;
  margin: 0;
  padding: 0;
}

.item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 7px 12px;
  font-family: var(--f-mono);
  font-size: 11px;
  cursor: pointer;
  border-bottom: 1px solid rgba(63, 77, 96, 0.3);
  transition: background 0.1s;
  letter-spacing: 0.02em;
  color: var(--bone);
}

.itemHighlighted {
  background: rgba(217, 123, 44, 0.15);
  color: var(--caramel);
}

.itemSelected {
  background: rgba(217, 123, 44, 0.07);
  color: var(--caramel-hot);
}

.itemName {
  display: flex;
  align-items: center;
  gap: 6px;
}

.selectedMark {
  color: var(--caramel);
  font-size: 9px;
  letter-spacing: 0.1em;
}

.pickCount {
  color: var(--bone-dim);
  font-size: 10px;
  letter-spacing: 0.04em;
  flex-shrink: 0;
  margin-left: 8px;
}

.itemHighlighted .pickCount {
  color: rgba(217, 123, 44, 0.7);
}

.noMatch {
  padding: 10px 12px;
  font-family: var(--f-mono);
  font-size: 11px;
  color: var(--bone-dim);
  letter-spacing: 0.04em;
  background: var(--charcoal);
  border: 1px solid var(--rule-slate);
  border-top: none;
  position: absolute;
  top: calc(100% + 2px);
  left: 0;
  right: 0;
  z-index: 50;
}
```

### Step 1.2 — Create the component

- [ ] Create `src/components/BandCombobox/BandCombobox.tsx` with this exact content:

```tsx
import { useState, useEffect, useRef, useMemo } from 'react'
import styles from './BandCombobox.module.css'

export interface BandOption {
  id: string
  name: string
  pickCount: number
}

interface Props {
  bands: BandOption[]
  value: string | null
  onChange: (id: string) => void
  disabled?: boolean
}

export function BandCombobox({ bands, value, onChange, disabled }: Props) {
  const [query, setQuery]     = useState('')
  const [open, setOpen]       = useState(false)
  const [highlighted, setHl]  = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const rootRef  = useRef<HTMLDivElement>(null)

  const selectedBand = bands.find(b => b.id === value) ?? null

  const displayValue = open
    ? query
    : selectedBand
      ? `${selectedBand.name} (${selectedBand.pickCount} picks)`
      : ''

  const filtered = useMemo(() => {
    if (!query.trim()) return bands
    const q = query.toLowerCase()
    return bands.filter(b => b.name.toLowerCase().includes(q))
  }, [bands, query])

  function handleFocus() {
    if (disabled) return
    setQuery('')
    setOpen(true)
    setHl(0)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value)
    setOpen(true)
    setHl(0)
  }

  function selectBand(band: BandOption) {
    onChange(band.id)
    setQuery('')
    setOpen(false)
    inputRef.current?.blur()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHl(h => Math.min(h + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHl(h => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[highlighted]) selectBand(filtered[highlighted])
    } else if (e.key === 'Escape') {
      setOpen(false)
      setQuery('')
      inputRef.current?.blur()
    }
  }

  // Close on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  return (
    <div ref={rootRef} className={styles.root}>
      <input
        ref={inputRef}
        type="text"
        value={displayValue}
        onFocus={handleFocus}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Search bands…"
        className={`${styles.input} ${open ? styles.inputOpen : ''}`}
      />

      {open && filtered.length > 0 && (
        <ul className={styles.dropdown}>
          {filtered.map((band, i) => {
            const isHl  = i === highlighted
            const isSel = band.id === value
            return (
              <li
                key={band.id}
                onMouseDown={e => { e.preventDefault(); selectBand(band) }}
                onMouseEnter={() => setHl(i)}
                className={`${styles.item} ${isHl ? styles.itemHighlighted : ''} ${isSel && !isHl ? styles.itemSelected : ''}`}
              >
                <span className={styles.itemName}>
                  {isSel && <span className={styles.selectedMark}>◆</span>}
                  {band.name}
                </span>
                <span className={styles.pickCount}>{band.pickCount} picks</span>
              </li>
            )
          })}
        </ul>
      )}

      {open && filtered.length === 0 && (
        <div className={styles.noMatch}>No bands match &ldquo;{query}&rdquo;</div>
      )}
    </div>
  )
}
```

### Step 1.3 — Verify no linter errors

- [ ] Run: `npm run lint 2>&1 | grep BandCombobox`
- Expected: no output (no errors in new files)

### Step 1.4 — Commit

- [ ] Run:
```bash
git add src/components/BandCombobox/
git commit -m "feat: add BandCombobox searchable dropdown component"
```

---

## Task 2 — Rewrite `LiveBandTest`

**Files:**
- Modify: `src/sections/TestingTools/LiveBandTest.tsx` (full replacement)

### Step 2.1 — Replace the file

- [ ] Replace the entire content of `src/sections/TestingTools/LiveBandTest.tsx` with:

```tsx
import { useState, useEffect, useRef } from 'react'
import { FunctionCard } from '../../components/FunctionCard/FunctionCard'
import { Toggle } from '../../components/Toggle/Toggle'
import { BandCombobox, type BandOption } from '../../components/BandCombobox/BandCombobox'
import { useFeedback } from '../../hooks/useFeedback'
import { supabase } from '../../lib/supabase'
import styles from '../sections.module.css'

interface LiveBandConfig {
  enabled: boolean
  bandId: string | null
}

export function LiveBandTest() {
  const { feedback, show } = useFeedback()

  const [config, setConfig]       = useState<LiveBandConfig>({ enabled: false, bandId: null })
  const [bands, setBands]         = useState<BandOption[]>([])
  const [selectedId, setSelected] = useState<string | null>(null)
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)

  // Keep a ref so the realtime handler always sees the latest config
  const configRef = useRef<LiveBandConfig>({ enabled: false, bandId: null })
  useEffect(() => { configRef.current = config }, [config])

  useEffect(() => {
    // 1. Fetch bands with pick counts (single query)
    supabase
      .from('bands')
      .select('id, name, user_picks(count)')
      .then(({ data, error }) => {
        if (!error && data) {
          const sorted: BandOption[] = (data as Array<{
            id: string
            name: string
            user_picks: Array<{ count: number }>
          }>)
            .map(b => ({ id: b.id, name: b.name, pickCount: b.user_picks[0]?.count ?? 0 }))
            .sort((a, b) => b.pickCount - a.pickCount)
          setBands(sorted)
        }
      })

    // 2. Fetch live_band_test_config
    supabase
      .from('live_band_test_config')
      .select('enabled, band_id')
      .eq('id', 1)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          const cfg: LiveBandConfig = { enabled: data.enabled, bandId: data.band_id ?? null }
          setConfig(cfg)
          setSelected(cfg.bandId)
        }
        setLoading(false)
      })

    // 3. Realtime — update config but not selectedId (preserve mid-edit selection)
    const channel = supabase
      .channel('live_band_test_config_watch')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'live_band_test_config', filter: 'id=eq.1' },
        (payload) => {
          const row = payload.new as { enabled: boolean; band_id: string | null }
          setConfig({ enabled: row.enabled, bandId: row.band_id ?? null })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function handleToggle(val: boolean) {
    if (saving) return
    setSaving(true)

    const { data: { session } } = await supabase.auth.getSession()
    const { error } = await supabase
      .from('live_band_test_config')
      .update({ enabled: val, updated_by: session?.user.id, updated_at: new Date().toISOString() })
      .eq('id', 1)

    setSaving(false)

    if (error) {
      show('error', `Failed — ${error.message}`)
    } else {
      setConfig(prev => ({ ...prev, enabled: val }))
      show('success', val ? 'Test mode enabled — select a band.' : 'Test mode disabled.')
    }
  }

  async function handleSetBand() {
    if (!selectedId || saving) return
    setSaving(true)

    const { data: { session } } = await supabase.auth.getSession()
    const { error } = await supabase
      .from('live_band_test_config')
      .update({ band_id: selectedId, updated_by: session?.user.id, updated_at: new Date().toISOString() })
      .eq('id', 1)

    setSaving(false)

    if (error) {
      show('error', `Failed — ${error.message}`)
    } else {
      const band = bands.find(b => b.id === selectedId)
      setConfig(prev => ({ ...prev, bandId: selectedId }))
      show('success', `Live band set to "${band?.name ?? selectedId}".`)
    }
  }

  const activeBand   = bands.find(b => b.id === config.bandId) ?? null
  const canSetBand   = config.enabled && !!selectedId && selectedId !== config.bandId && !saving
  const cardStatus   = loading ? 'loading'
    : config.enabled && config.bandId ? 'active'
    : config.enabled ? 'ready'
    : 'off'

  return (
    <FunctionCard
      id="A-03"
      title="Live Band Test"
      description="Configure which band is 'live now' for testing presence and alerts."
      status={cardStatus}
    >
      <Toggle
        checked={config.enabled}
        onChange={handleToggle}
        label="Test mode"
        disabled={loading || saving}
      />

      <div className={styles.inputRow} style={{ opacity: config.enabled ? 1 : 0.4, pointerEvents: config.enabled ? 'auto' : 'none' }}>
        <BandCombobox
          bands={bands}
          value={selectedId}
          onChange={setSelected}
          disabled={!config.enabled || loading}
        />
        <button
          className="btn-primary"
          onClick={handleSetBand}
          disabled={!canSetBand}
        >
          {saving ? 'Saving…' : 'Set Band →'}
        </button>
      </div>

      {config.enabled && activeBand && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 10px',
          background: 'rgba(217,123,44,0.08)',
          border: '1px solid rgba(217,123,44,0.25)',
          fontFamily: 'var(--f-mono)', fontSize: 10,
          letterSpacing: '0.06em', color: 'var(--bone-soft)',
        }}>
          <span style={{ color: 'var(--caramel)' }}>◆</span>
          <span>ACTIVE: <span style={{ color: 'var(--caramel)' }}>{activeBand.name}</span></span>
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

### Step 2.2 — Check for linter errors

- [ ] Run: `npm run lint 2>&1 | grep -E "LiveBandTest|BandCombobox"`
- Expected: no output

### Step 2.3 — Manual smoke test

- [ ] Run: `npm run dev`
- [ ] Open the admin app → Section A → Live Band Test card
- [ ] Verify initial load: card shows `○ Off`, toggle is off, picker is dimmed
- [ ] Toggle test mode on → feedback "Test mode enabled — select a band."
- [ ] Click picker input → dropdown opens showing bands sorted by pick count
- [ ] Type a few letters (e.g. `meta`) → list filters to Metallica only
- [ ] Press `Enter` → Metallica selected, input shows "Metallica (N picks)"
- [ ] "Set Band →" button becomes enabled
- [ ] Click "Set Band →" → feedback "Live band set to Metallica", ACTIVE strip appears
- [ ] Card status flips to `◆ Active`
- [ ] Toggle test mode off → card shows `○ Off`, active strip disappears
- [ ] Open a second browser tab → toggle in tab 1, verify tab 2 updates via realtime

### Step 2.4 — Commit

- [ ] Run:
```bash
git add src/sections/TestingTools/LiveBandTest.tsx
git commit -m "feat: wire LiveBandTest with Supabase + BandCombobox (card A-03)"
```

---

## Done

After both tasks are committed, the LiveBandTest card is fully functional:
- Bands loaded from Supabase, sorted by pick count
- Searchable dropdown with keyboard navigation
- Toggle + band selection write to `live_band_test_config`
- Realtime subscription keeps both tabs in sync
