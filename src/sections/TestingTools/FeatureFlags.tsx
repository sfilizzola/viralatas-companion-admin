import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { FunctionCard } from '../../components/FunctionCard/FunctionCard'
import type { CardStatus } from '../../components/FunctionCard/FunctionCard'
import { Toggle } from '../../components/Toggle/Toggle'
import { useFeedback } from '../../hooks/useFeedback'
import styles from '../sections.module.css'
import local from './FeatureFlags.module.css'

export function FeatureFlags() {
  const { feedback, show } = useFeedback()
  const [duckEnabled, setDuckEnabled] = useState(true)
  const [registrationEnabled, setRegistrationEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [fetchFailed, setFetchFailed] = useState(false)

  useEffect(() => {
    async function fetchFlags() {
      const { data, error } = await supabase
        .from('app_settings')
        .select('duck_enabled, registration_enabled')
        .limit(1)
        .single()

      if (error || !data) {
        setFetchFailed(true)
        // Default-on: a fetch failure must never silently disable features
        setDuckEnabled(true)
        setRegistrationEnabled(true)
      } else {
        setDuckEnabled(data.duck_enabled)
        setRegistrationEnabled(data.registration_enabled)
      }
      setLoading(false)
    }
    fetchFlags()
  }, [])

  async function handleDuckToggle(val: boolean) {
    const prev = duckEnabled
    setDuckEnabled(val)
    const { error } = await supabase
      .from('app_settings')
      .update({ duck_enabled: val, updated_at: new Date().toISOString() })
    if (error) {
      setDuckEnabled(prev)
      show('error', 'Failed to update duck flag — check connection')
    } else {
      show('success', `Duck notifications ${val ? 'enabled' : 'disabled'} globally`)
    }
  }

  async function handleRegistrationToggle(val: boolean) {
    const prev = registrationEnabled
    setRegistrationEnabled(val)
    const { error } = await supabase
      .from('app_settings')
      .update({ registration_enabled: val, updated_at: new Date().toISOString() })
    if (error) {
      setRegistrationEnabled(prev)
      show('error', 'Failed to update registration flag — check connection')
    } else {
      show('success', `User registration ${val ? 'enabled' : 'disabled'} globally`)
    }
  }

  function cardStatus(): CardStatus {
    if (loading) return 'loading'
    if (fetchFailed) return 'error'
    if (!duckEnabled || !registrationEnabled) return 'off'
    return 'active'
  }

  return (
    <FunctionCard
      id="A-05"
      title="Feature Flags"
      description="Toggle features globally. Changes propagate to all users on their next app load."
      status={cardStatus()}
    >
      <div className={local.flagRow}>
        <span className={local.flagLabel}>Duck notifications</span>
        <span className={local.flagKey}>duck_enabled</span>
        <Toggle checked={duckEnabled} onChange={handleDuckToggle} disabled={loading} />
      </div>
      <div className={local.divider} />
      <div className={local.flagRow}>
        <span className={local.flagLabel}>User registration</span>
        <span className={local.flagKey}>registration_enabled</span>
        <Toggle checked={registrationEnabled} onChange={handleRegistrationToggle} disabled={loading} />
      </div>
      {feedback && (
        <p className={feedback.type === 'success' ? styles.feedbackOk : styles.feedbackErr}>
          {feedback.message}
        </p>
      )}
    </FunctionCard>
  )
}
