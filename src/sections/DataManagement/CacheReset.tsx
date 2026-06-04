import { useState } from 'react'
import { FunctionCard } from '../../components/FunctionCard/FunctionCard'
import { useFeedback } from '../../hooks/useFeedback'
import { bumpCacheVersion } from '../../lib/db/appConfig'
import styles from '../sections.module.css'

export function CacheReset() {
  const { feedback, show } = useFeedback()
  const [loading, setLoading] = useState(false)
  const [lastReset, setLastReset] = useState<string | null>(null)

  async function handleReset() {
    if (!confirm('Bump the cache version? All main app clients will re-fetch.')) return
    setLoading(true)
    const { error } = await bumpCacheVersion()
    setLoading(false)

    if (error) {
      show('error', `Failed — ${error.message}`)
      return
    }

    const ts = new Date().toISOString()
    setLastReset(ts)
    show('success', 'Cache version bumped — all clients will invalidate.')
  }

  return (
    <FunctionCard
      id="C-01"
      title="Cache Reset"
      description="Increment the Supabase cache version counter. All main app clients detect the bump and re-fetch fresh data."
      status={loading ? 'loading' : 'ready'}
    >
      {lastReset && (
        <p className={styles.metaLabel}>Last reset: {lastReset}</p>
      )}
      {feedback && (
        <p className={feedback.type === 'success' ? styles.feedbackOk : styles.feedbackErr}>
          {feedback.message}
        </p>
      )}
      <button className="btn-primary" onClick={handleReset} disabled={loading}>
        {loading ? 'Resetting…' : 'Reset Cache →'}
      </button>
    </FunctionCard>
  )
}
