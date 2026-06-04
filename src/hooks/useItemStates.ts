import { useState, useCallback } from 'react'

/**
 * Per-item state machine for lists where each row has independent async status
 * (e.g., a list of users each with their own loading/sent/error state).
 *
 * Replaces ad-hoc Map<Id, State> useState patterns.
 */
export function useItemStates<K, S>() {
  const [states, setStates] = useState<Map<K, S>>(new Map())

  const set = useCallback((key: K, state: S) => {
    setStates((prev) => new Map(prev).set(key, state))
  }, [])

  const remove = useCallback((key: K) => {
    setStates((prev) => {
      const next = new Map(prev)
      next.delete(key)
      return next
    })
  }, [])

  const get = useCallback((key: K, map: Map<K, S>): S | undefined => {
    return map.get(key)
  }, [])

  return { states, set, remove, get }
}
