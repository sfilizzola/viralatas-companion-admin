import { useState } from 'react'
import { FunctionCard } from '../../components/FunctionCard/FunctionCard'
import { useFeedback } from '../../hooks/useFeedback'
import styles from '../sections.module.css'

// TODO: populate from companion app badge definitions
const BADGE_OPTIONS = [
  { value: '', label: 'Select a badge…' },
  { value: 'stub_badge_1', label: 'Stub Badge 1 (TBD)' },
  { value: 'stub_badge_2', label: 'Stub Badge 2 (TBD)' },
]

export function TestBadges() {
  const { feedback, show } = useFeedback()
  const [badgeType, setBadgeType] = useState('')
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [loading, setLoading] = useState(false)

  async function handleAdd() {
    if (!badgeType) return
    setLoading(true)
    // TODO: insert into user_badge_history for godlike user
    await new Promise(r => setTimeout(r, 400))
    setLoading(false)
    show('success', `Badge "${badgeType}" (${year}) added (stub)`)
  }

  return (
    <FunctionCard
      id="D-01"
      title="Test Badges"
      description="Add test badges to the godlike user's account to verify badge rendering and conditions."
      status={loading ? 'loading' : 'ready'}
    >
      <select
        className={styles.monoSelect}
        value={badgeType}
        onChange={e => setBadgeType(e.target.value)}
      >
        {BADGE_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <div className={styles.inputRow}>
        <input
          className={styles.monoInput}
          type="number"
          placeholder="year"
          value={year}
          onChange={e => setYear(e.target.value)}
          min={2020}
          max={2099}
        />
        <button
          className="btn-primary"
          onClick={handleAdd}
          disabled={loading || !badgeType}
        >
          Add Badge →
        </button>
      </div>
      {feedback && (
        <p className={feedback.type === 'success' ? styles.feedbackOk : styles.feedbackErr}>
          {feedback.message}
        </p>
      )}
    </FunctionCard>
  )
}
