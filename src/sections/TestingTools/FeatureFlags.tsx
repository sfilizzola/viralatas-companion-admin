import { useState, useEffect } from 'react'
import { FunctionCard } from '../../components/FunctionCard/FunctionCard'
import { Toggle } from '../../components/Toggle/Toggle'
import { useFeedback } from '../../hooks/useFeedback'
import styles from '../sections.module.css'

export function FeatureFlags() {
  const { feedback, show } = useFeedback()
  const [ducksEnabled, setDucksEnabled] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: fetch feature_flags from Supabase
    setLoading(false)
  }, [])

  async function handleDucksToggle(val: boolean) {
    setDucksEnabled(val)
    // TODO: update feature_flags.duck_notifications_enabled in Supabase
    show('success', `Duck notifications ${val ? 'enabled' : 'disabled'} globally (stub)`)
  }

  return (
    <FunctionCard
      id="A-05"
      title="Feature Flags"
      description="Toggle duck notification feature globally. Affects all users immediately."
      status={loading ? 'loading' : ducksEnabled ? 'active' : 'off'}
    >
      <Toggle
        checked={ducksEnabled}
        onChange={handleDucksToggle}
        disabled={loading}
        label="Duck notifications"
      />
      {feedback && (
        <p className={feedback.type === 'success' ? styles.feedbackOk : styles.feedbackErr}>
          {feedback.message}
        </p>
      )}
    </FunctionCard>
  )
}
