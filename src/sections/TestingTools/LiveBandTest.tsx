import { useState, useEffect } from 'react'
import { FunctionCard } from '../../components/FunctionCard/FunctionCard'
import { Toggle } from '../../components/Toggle/Toggle'
import { useFeedback } from '../../hooks/useFeedback'
import styles from '../sections.module.css'

export function LiveBandTest() {
  const { feedback, show } = useFeedback()
  const [testMode, setTestMode] = useState(false)
  const [bandId, setBandId] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: fetch live_band_test_config from Supabase + subscribe realtime
    setLoading(false)
  }, [])

  async function handleToggle(val: boolean) {
    setTestMode(val)
    // TODO: update live_band_test_config.test_mode in Supabase
    show('success', `Test mode ${val ? 'on' : 'off'} (stub)`)
  }

  async function handleSetBand() {
    if (!bandId.trim()) return
    // TODO: update live_band_test_config.band_id in Supabase
    show('success', `Band set to "${bandId}" (stub)`)
  }

  return (
    <FunctionCard
      id="A-03"
      title="Live Band Test"
      description="Configure which band is 'live now' for testing presence and alerts."
      status={loading ? 'loading' : testMode ? 'active' : 'off'}
    >
      <Toggle checked={testMode} onChange={handleToggle} label="Test mode" />
      <div className={styles.inputRow}>
        <input
          className={styles.monoInput}
          type="text"
          placeholder="band-id"
          value={bandId}
          onChange={e => setBandId(e.target.value)}
          disabled={!testMode}
        />
        <button className="btn-primary" onClick={handleSetBand} disabled={!testMode || !bandId.trim()}>
          Set Band →
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
