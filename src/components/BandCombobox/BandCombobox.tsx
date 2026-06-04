import { useState, useEffect, useRef, useMemo } from 'react'
import type { BandOption } from '../../lib/types'
import styles from './BandCombobox.module.css'

export type { BandOption }

interface Props {
  readonly bands: BandOption[]
  readonly value: string | null
  readonly onChange: (id: string) => void
  readonly disabled?: boolean
}

export function BandCombobox({ bands, value, onChange, disabled }: Props) {
  const [query, setQuery]               = useState('')
  const [open, setOpen]                 = useState(false)
  const [highlighted, setHighlighted]   = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const rootRef  = useRef<HTMLDivElement>(null)

  const selectedBand = bands.find(b => b.id === value) ?? null

  let displayValue = ''
  if (open) {
    displayValue = query
  } else if (selectedBand) {
    displayValue = `${selectedBand.name} (${selectedBand.pickCount} picks)`
  }

  const filtered = useMemo(() => {
    if (!query.trim()) return bands
    const q = query.toLowerCase()
    return bands.filter(b => b.name.toLowerCase().includes(q))
  }, [bands, query])

  function handleFocus() {
    if (disabled) return
    setQuery('')
    setOpen(true)
    setHighlighted(0)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value)
    setOpen(true)
    setHighlighted(0)
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
      setHighlighted(h => Math.min(h + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted(h => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[highlighted]) selectBand(filtered[highlighted])
    } else if (e.key === 'Escape') {
      setOpen(false)
      setQuery('')
      inputRef.current?.blur()
    }
  }

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
              <li key={band.id}>
                <button
                  type="button"
                  onMouseDown={e => { e.preventDefault(); selectBand(band) }}
                  onMouseEnter={() => setHighlighted(i)}
                  className={`${styles.item} ${isHl ? styles.itemHighlighted : ''} ${isSel && !isHl ? styles.itemSelected : ''}`}
                >
                  <span className={styles.itemName}>
                    {isSel && <span className={styles.selectedMark}>◆</span>}
                    {band.name}
                  </span>
                  <span className={styles.pickCount}>{band.pickCount} picks</span>
                </button>
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
