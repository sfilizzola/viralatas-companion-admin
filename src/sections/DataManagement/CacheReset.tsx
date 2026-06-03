import { useState } from 'react'
import { FunctionCard } from '../../components/FunctionCard/FunctionCard'
import { useFeedback } from '../../hooks/useFeedback'
import styles from '../sections.module.css'

export function CacheReset() {
  const { feedback, show } = useFeedback()
  const [loading, setLoading] = useState(false)
  const [lastReset, setLastReset] = useState<string | null>(null)

  async function handleReset() {
    if (!confirm('Bump the cache version? All main app clients will re-fetch.')) return
    setLoading(true)
    // TODO: increment cache_version counter in Supabase
    // e.g. supabase.rpc('increment_cache_version')
    await new Promise(r => setTimeout(r, 500)) // stub delay
    const ts = new Date().toISOString()
    setLastReset(ts)
    setLoading(false)
    show('success', 'Cache version bumped — all clients will invalidate.')
  }

  return (
    <FunctionCard
      id="B-01"
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
