import { useState, useCallback } from 'react'

export type FeedbackState = { type: 'success' | 'error'; message: string } | null

export function useFeedback(ttl = 5000) {
  const [feedback, setFeedback] = useState<FeedbackState>(null)

  const show = useCallback((type: 'success' | 'error', message: string) => {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), ttl)
  }, [ttl])

  const clear = useCallback(() => setFeedback(null), [])

  return { feedback, show, clear }
}
