import { useState, useEffect, useRef } from 'react'
import { FunctionCard } from '../../components/FunctionCard/FunctionCard'
import { useFeedback } from '../../hooks/useFeedback'
import { supabase } from '../../lib/supabase'
import styles from './MetalPlaceConfig.module.css'
import sectionStyles from '../sections.module.css'

interface MetalPlaceData {
  festival_day: number | null
  start_time: string
  end_time: string
}

const DEFAULTS: MetalPlaceData = { festival_day: null, start_time: '18:00', end_time: '06:00' }

function normalise(row: { festival_day: number | null; start_time: string; end_time: string }): MetalPlaceData {
  return {
    festival_day: row.festival_day ?? null,
    start_time: (row.start_time ?? '18:00').slice(0, 5),
    end_time: (row.end_time ?? '06:00').slice(0, 5),
  }
}

const DAYS: Array<{ value: number | null; label: string }> = [
  { value: null, label: '—' },
  { value: 1, label: 'Day 1' },
  { value: 2, label: 'Day 2' },
  { value: 3, label: 'Day 3' },
  { value: 4, label: 'Day 4' },
]

export function MetalPlaceConfig() {
  const { feedback, show } = useFeedback()
  const [saved, setSaved] = useState<MetalPlaceData>(DEFAULTS)
  const [draft, setDraft] = useState<MetalPlaceData>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const savedRef = useRef<MetalPlaceData>(DEFAULTS)
  useEffect(() => { savedRef.current = saved }, [saved])

  const isDirty = JSON.stringify(draft) !== JSON.stringify(saved)

  useEffect(() => {
    supabase
      .from('metal_place_config')
      .select('festival_day, start_time, end_time')
      .eq('id', 1)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          const v = normalise(data)
          setSaved(v)
          setDraft(v)
        }
        setLoading(false)
      })

    const channel = supabase
      .channel('metal_place_config_watch')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'metal_place_config', filter: 'id=eq.1' },
        (payload) => {
          const v = normalise(payload.new as Parameters<typeof normalise>[0])
          const prevSaved = savedRef.current
          setSaved(v)
          setDraft(prev => {
            const wasDirty = JSON.stringify(prev) !== JSON.stringify(prevSaved)
            return wasDirty ? prev : v
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function handleSave() {
    if (!isDirty || saving) return
    setSaving(true)

    const { data: { session } } = await supabase.auth.getSession()

    const { error } = await supabase
      .from('metal_place_config')
      .update({
        festival_day: draft.festival_day,
        start_time: draft.start_time,
        end_time: draft.end_time,
        updated_by: session?.user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1)

    setSaving(false)

    if (error) {
      show('error', `Save failed — ${error.message}`)
    } else {
      setSaved(draft)
      show('success', 'Config saved.')
    }
  }

  let status: 'loading' | 'active' | 'off' = 'off'
  if (loading) status = 'loading'
  else if (draft.festival_day !== null) status = 'active'

  return (
    <FunctionCard
      id="B-02"
      title="Metal Place Config"
      description="Configure the festival day and check-in time window."
      status={status}
    >
      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>Festival Day</span>
        <div className={styles.dayStrip}>
          {DAYS.map(({ value, label }) => (
            <button
              key={value ?? 'none'}
              type="button"
              className={`${styles.dayBtn} ${draft.festival_day === value ? styles.dayBtnActive : ''}`}
              onClick={() => setDraft(d => ({ ...d, festival_day: value }))}
              disabled={loading}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.timeRow}>
        <div className={styles.timeField}>
          <span className={styles.fieldLabel}>Start</span>
          <input
            type="time"
            className={sectionStyles.monoInput}
            value={draft.start_time}
            onChange={e => setDraft(d => ({ ...d, start_time: e.target.value }))}
            disabled={loading}
          />
        </div>
        <span className={styles.timeSep}>→</span>
        <div className={styles.timeField}>
          <span className={styles.fieldLabel}>End</span>
          <input
            type="time"
            className={sectionStyles.monoInput}
            value={draft.end_time}
            onChange={e => setDraft(d => ({ ...d, end_time: e.target.value }))}
            disabled={loading}
          />
        </div>
      </div>

      <button
        className="btn-primary"
        onClick={handleSave}
        disabled={!isDirty || saving || loading}
      >
        {saving ? 'Saving…' : 'Save →'}
      </button>

      {feedback && (
        <p className={feedback.type === 'success' ? sectionStyles.feedbackOk : sectionStyles.feedbackErr}>
          {feedback.message}
        </p>
      )}
    </FunctionCard>
  )
}
