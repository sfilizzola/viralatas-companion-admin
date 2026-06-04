import { FunctionCard } from '../../components/FunctionCard/FunctionCard'
import { useFeedback } from '../../hooks/useFeedback'
import { useMetalPlaceConfig } from '../../hooks/useMetalPlaceConfig'
import { setMetalPlaceConfig } from '../../lib/db/metalPlaceConfig'
import { useState } from 'react'
import styles from './MetalPlaceConfig.module.css'
import sectionStyles from '../sections.module.css'

const DAYS: Array<{ value: number | null; label: string }> = [
  { value: null, label: '—' },
  { value: 1, label: 'Day 1' },
  { value: 2, label: 'Day 2' },
  { value: 3, label: 'Day 3' },
  { value: 4, label: 'Day 4' },
]

export function MetalPlaceConfig() {
  const { feedback, show } = useFeedback()
  const { saved, draft, loading, isDirty, setDraft } = useMetalPlaceConfig()
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!isDirty || saving) return
    setSaving(true)
    const { error } = await setMetalPlaceConfig(draft)
    setSaving(false)

    if (error) {
      show('error', `Save failed — ${error.message}`)
    } else {
      show('success', 'Config saved.')
    }
  }

  // Keep the saved value in scope so the status reflects server truth
  let status: 'loading' | 'active' | 'off' = 'off'
  if (loading) status = 'loading'
  else if (saved.festival_day !== null) status = 'active'

  return (
    <FunctionCard
      id="C-02"
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
