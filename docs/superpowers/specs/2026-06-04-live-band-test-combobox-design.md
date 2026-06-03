# Live Band Test — Full Wiring + BandCombobox

**Date:** 2026-06-04  
**Status:** Approved  
**Card:** A-03 · Live Band Test (`src/sections/TestingTools/LiveBandTest.tsx`)

---

## Context

The `LiveBandTest` card is currently a stub — all Supabase operations are `TODO` comments and the band input is a plain text field that accepts a UUID string. The goal is to wire it fully and replace the text input with a searchable combobox that lists bands sorted by pick count.

---

## What We're Building

Two deliverables:

1. **`BandCombobox` component** — `src/components/BandCombobox/` — a reusable searchable dropdown for band selection.  
2. **`LiveBandTest` card rewrite** — full Supabase read/write + realtime subscription, using `BandCombobox`.

---

## Data Layer

### 1. Bands with pick counts (single query)

```typescript
const { data } = await supabase
  .from('bands')
  .select('id, name, user_picks(count)')
  .order('name')
```

PostgREST returns each band with `user_picks: [{ count: number }]`. The client merges and sorts by count descending:

```typescript
type BandOption = { id: string; name: string; pickCount: number }

const bands: BandOption[] = data
  .map(b => ({ id: b.id, name: b.name, pickCount: b.user_picks[0]?.count ?? 0 }))
  .sort((a, b) => b.pickCount - a.pickCount)
```

### 2. `live_band_test_config` — read + realtime

On mount, fetch the single config row (`id = 1`):

```typescript
supabase.from('live_band_test_config').select('enabled, band_id').eq('id', 1).single()
```

Subscribe realtime so changes from other tabs/sessions reflect instantly:

```typescript
supabase.channel('live_band_test_config')
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'live_band_test_config' }, handler)
  .subscribe()
```

### 3. Write operations

Two separate `UPDATE` calls, each only touching its column:

| Action | SQL |
|--------|-----|
| Toggle `enabled` | `UPDATE live_band_test_config SET enabled = $val WHERE id = 1` |
| Set `band_id` | `UPDATE live_band_test_config SET band_id = $uuid WHERE id = 1` |

---

## BandCombobox Component

**Location:** `src/components/BandCombobox/BandCombobox.tsx` + `BandCombobox.module.css`

### Props

```typescript
interface BandComboboxProps {
  bands: BandOption[]        // pre-sorted by pickCount desc
  value: string | null       // currently selected band_id
  onChange: (id: string) => void
  disabled?: boolean
}
```

### Behaviour

| Interaction | Result |
|-------------|--------|
| Click / focus input | Dropdown opens, full list shown |
| Type characters | List filters case-insensitively, matching anywhere in name |
| `↑` / `↓` arrow keys | Navigate highlighted item |
| `Enter` | Select highlighted item, close dropdown |
| `Escape` | Close dropdown, restore display value, no change |
| Click outside | Close dropdown |
| Click an item | Select it, close dropdown |

### Display

- **Input closed + value selected:** `"Slipknot (162 picks)"`
- **Input open (typing):** raw query text; list filters live
- **No match:** `No bands match "<query>"` hint below input
- **Selected item in list:** amber `◆` prefix, accent colour
- **Pick count:** right-aligned, dimmed — `162 picks`
- **`disabled`:** entire row dims to `opacity: 0.4`, pointer-events none

### CSS

Extends existing `.monoInput` visual language from `sections.module.css`. New classes in `BandCombobox.module.css`:
- `.dropdown` — absolute-positioned `<ul>`, `max-height: 220px`, scrollable, caramel border
- `.item` — base row style
- `.itemHighlighted` — `rgba(217,123,44,0.15)` bg, caramel text
- `.itemSelected` — `rgba(217,123,44,0.07)` bg, hot-caramel text
- `.pickCount` — right-aligned, `var(--bone-dim)`, 10px

---

## LiveBandTest Card Rewrite

### State

```typescript
const [config, setConfig]      = useState<{ enabled: boolean; bandId: string | null }>({ enabled: false, bandId: null })
const [bands, setBands]        = useState<BandOption[]>([])
const [selectedId, setSelected] = useState<string | null>(null)  // UI selection (may differ from saved config.bandId)
const [loading, setLoading]    = useState(true)
```

`selectedId` tracks what's shown in the combobox. On mount it's initialised from `config.bandId`. Realtime updates sync `config.bandId` but do **not** override `selectedId` (so a mid-edit selection isn't stomped by a remote update). On successful "Set Band" save, `selectedId` and `config.bandId` are in sync again.

### Mount sequence

1. Fetch bands + pick counts → `setBands(sorted)`
2. Fetch `live_band_test_config` row → `setConfig`; set `selectedId` to `config.bandId`
3. Subscribe realtime → on UPDATE, update only `config` state (not `selectedId`)
4. `setLoading(false)`

### Card status

| Condition | Status |
|-----------|--------|
| `loading` | `loading` |
| `config.enabled && config.bandId` | `active` |
| `config.enabled && !config.bandId` | `ready` |
| `!config.enabled` | `off` |

### Controls

```
[Toggle] Test mode
[BandCombobox ─────────────] [Set Band →]
[◆ ACTIVE: Slipknot]          ← shown only when enabled + bandId saved
[feedback message]
```

- "Set Band →" enabled when: `config.enabled && selectedId && selectedId !== config.bandId`
- On "Set Band →" click: `UPDATE band_id`, then `setConfig(prev => ({ ...prev, bandId: selectedId }))`
- On toggle: `UPDATE enabled`, then `setConfig(prev => ({ ...prev, enabled: val }))`; `selectedId` is left unchanged so re-enabling restores the last selection

### Feedback

| Event | Message |
|-------|---------|
| Toggle on | `"Test mode enabled — select a band."` |
| Toggle off | `"Test mode disabled."` |
| Set band success | `"Live band set to \"<name>\"."` |
| Any Supabase error | `"Error: <message>"` (red) |

Uses existing `useFeedback` hook (auto-clears after 4s).

---

## File Changes

| File | Change |
|------|--------|
| `src/components/BandCombobox/BandCombobox.tsx` | New |
| `src/components/BandCombobox/BandCombobox.module.css` | New |
| `src/sections/TestingTools/LiveBandTest.tsx` | Full rewrite (stub → live) |

No new dependencies. No schema migrations.

---

## Edge Cases

| Case | Handling |
|------|----------|
| `band_id` in config not found in bands list | `BandCombobox` value resolves to `null`; input shows placeholder |
| Bands table empty | Combobox shows empty dropdown with "No bands match" hint |
| Realtime update from another tab | `config` state updates; if newly disabled, active strip disappears |
| Toggle off while band is set | `band_id` remains in DB; re-enabling restores it |
| Supabase error on write | Show error feedback; do not update local state |
