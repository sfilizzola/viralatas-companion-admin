import { useState, useEffect } from 'react'
import { FunctionCard } from '../../components/FunctionCard/FunctionCard'
import { Toggle } from '../../components/Toggle/Toggle'
import { useFeedback } from '../../hooks/useFeedback'
import styles from '../sections.module.css'

export function MetalPlaceTest() {
  const { feedback, show } = useFeedback()
  const [testMode, setTestMode] = useState(false)
  const [radius, setRadius] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: fetch metal_place_config from Supabase + subscribe realtime
    setLoading(false)
  }, [])

  async function handleToggle(val: boolean) {
    setTestMode(val)
    // TODO: update metal_place_config.test_mode in Supabase
    show('success', `Metal Place test mode ${val ? 'on' : 'off'} (stub)`)
  }

  async function handleSave() {
    // TODO: update metal_place_config zone radius in Supabase
    show('success', `Zone radius set to ${radius}m (stub)`)
  }

  return (
    <FunctionCard
      id="A-04"
      title="Metal Place Test"
      description="Toggle metal place test mode and configure the test zone radius."
      status={loading ? 'loading' : testMode ? 'active' : 'off'}
    >
      <Toggle checked={testMode} onChange={handleToggle} label="Test mode" />
      <div className={styles.inputRow}>
        <input
          className={styles.monoInput}
          type="number"
          placeholder="radius (m)"
          value={radius}
          onChange={e => setRadius(e.target.value)}
          disabled={!testMode}
          min={1}
        />
        <button className="btn-primary" onClick={handleSave} disabled={!testMode || !radius}>
          Save →
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
