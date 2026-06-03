import { useState } from 'react'
import { FunctionCard } from '../../components/FunctionCard/FunctionCard'
import { useFeedback } from '../../hooks/useFeedback'
import styles from '../sections.module.css'

const COOLDOWN_MS = 15_000

export function TestQuack() {
  const { feedback, show } = useFeedback()
  const [cooldown, setCooldown] = useState(false)

  async function handleSend() {
    if (cooldown) return
    setCooldown(true)
    setTimeout(() => setCooldown(false), COOLDOWN_MS)

    // TODO: implement — call Supabase to trigger duck notification
    show('success', 'Quack sent! (stub — not yet implemented)')
  }

  return (
    <FunctionCard
      id="A-01"
      title="Test Quack"
      description="Send a test duck notification to yourself. 15s cooldown between sends."
      status={feedback?.type === 'error' ? 'error' : cooldown ? 'loading' : 'ready'}
      statusLabel={cooldown ? 'Cooldown' : undefined}
    >
      {feedback && (
        <p className={feedback.type === 'success' ? styles.feedbackOk : styles.feedbackErr}>
          {feedback.message}
        </p>
      )}
      <button className="btn-primary" onClick={handleSend} disabled={cooldown}>
        Send Quack →
      </button>
    </FunctionCard>
  )
}
