import { FunctionCard } from '../../components/FunctionCard/FunctionCard'
import { useFeedback } from '../../hooks/useFeedback'
import styles from '../sections.module.css'

export function TestPush() {
  const { feedback, show } = useFeedback()

  async function handleSend() {
    // TODO: implement — invoke `send-test-push` Edge Function
    show('success', 'Push sent! (stub — not yet implemented)')
  }

  return (
    <FunctionCard
      id="A-02"
      title="Test Push"
      description="Send a test web push notification via the send-test-push Edge Function."
      status={feedback?.type === 'error' ? 'error' : 'ready'}
    >
      {feedback && (
        <p className={feedback.type === 'success' ? styles.feedbackOk : styles.feedbackErr}>
          {feedback.message}
        </p>
      )}
      <button className="btn-primary" onClick={handleSend}>
        Send Push →
      </button>
    </FunctionCard>
  )
}
