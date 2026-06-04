import { useState, useEffect } from 'react'
import { FunctionCard } from '../../components/FunctionCard/FunctionCard'
import type { CardStatus } from '../../components/FunctionCard/FunctionCard'
import { Toggle } from '../../components/Toggle/Toggle'
import { useFeedback } from '../../hooks/useFeedback'
import { getAppSettings, updateAppSetting } from '../../lib/db/appSettings'
import styles from '../sections.module.css'
import local from './FeatureFlags.module.css'

export function FeatureFlags() {
  const { feedback, show } = useFeedback()
  const [duckEnabled, setDuckEnabled] = useState(true)
  const [registrationEnabled, setRegistrationEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [fetchFailed, setFetchFailed] = useState(false)

  useEffect(() => {
    getAppSettings().then(({ data, error }) => {
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
    })
  }, [])

  async function handleDuckToggle(val: boolean) {
    const prev = duckEnabled
    setDuckEnabled(val)
    const { error } = await updateAppSetting('duck_enabled', val)
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
    const { error } = await updateAppSetting('registration_enabled', val)
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
      id="A-02"
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
