import { useState, useEffect, useCallback } from 'react'
import { FunctionCard } from '../../components/FunctionCard/FunctionCard'
import { supabase } from '../../lib/supabase'
import styles from './PushTest.module.css'

interface PushUser {
  id: string
  display_name: string | null
  email: string
}

type RowState =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'sent' }
  | { type: 'no_sub' }
  | { type: 'error'; reason: string }

const ROW_CLEAR_MS = 5_000

export function TestPush() {
  const [users, setUsers]     = useState<PushUser[]>([])
  const [fetching, setFetching] = useState(true)
  const [fetchErr, setFetchErr] = useState<string | null>(null)
  const [rowStates, setRowStates] = useState<Map<string, RowState>>(new Map())

  useEffect(() => {
    supabase
      .from('users')
      .select('id, display_name, email, push_subscriptions!inner(user_id)')
      .eq('is_test_user', false)
      .then(({ data, error }) => {
        if (error) {
          setFetchErr(error.message)
        } else if (data) {
          setUsers(
            (data as Array<{ id: string; display_name: string | null; email: string }>)
              .map(u => ({ id: u.id, display_name: u.display_name, email: u.email }))
          )
        }
        setFetching(false)
      })
  }, [])

  const setRow = useCallback((userId: string, state: RowState) => {
    setRowStates(prev => new Map(prev).set(userId, state))
  }, [])

  async function handleSend(user: PushUser) {
    const current = rowStates.get(user.id)
    if (current?.type === 'loading') return

    setRow(user.id, { type: 'loading' })

    const { data, error } = await supabase.functions.invoke('send-test-push', {
      body: { targetUserId: user.id },
    })

    if (error) {
      setRow(user.id, { type: 'error', reason: error.message })
    } else if (data?.error === 'no_subscription') {
      setRow(user.id, { type: 'no_sub' })
    } else if (data?.sent > 0) {
      setRow(user.id, { type: 'sent' })
    } else {
      const reason = data?.errors?.[0] ?? 'unknown error'
      setRow(user.id, { type: 'error', reason })
    }

    setTimeout(() => {
      setRowStates(prev => {
        const next = new Map(prev)
        next.delete(user.id)
        return next
      })
    }, ROW_CLEAR_MS)
  }

  function rowStatusLabel(state: RowState | undefined): { text: string; cls: string } {
    if (!state || state.type === 'idle') return { text: '', cls: styles.rowStatusIdle }
    if (state.type === 'loading') return { text: '◌ sending…', cls: styles.rowStatusIdle }
    if (state.type === 'sent')    return { text: '✓ sent', cls: styles.rowStatusSent }
    if (state.type === 'no_sub') return { text: '⚠ no sub', cls: styles.rowStatusNoSub }
    return { text: `✕ ${state.reason}`, cls: styles.rowStatusError }
  }

  let cardStatus: 'loading' | 'ready' | 'error' = 'ready'
  if (fetching) cardStatus = 'loading'
  else if (fetchErr) cardStatus = 'error'

  return (
    <FunctionCard
      id="B-02"
      title="Test Push"
      description="Send a targeted test push to any real user with a registered subscription."
      status={cardStatus}
      fullWidth
    >
      {fetching && (
        <div className={styles.skeleton}>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className={styles.skeletonRow}
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      )}

      {fetchErr && (
        <div className={styles.stateRow} style={{ color: '#f87171' }}>
          ▲ Failed to load subscribers — {fetchErr}
        </div>
      )}

      {!fetching && !fetchErr && users.length === 0 && (
        <div className={styles.stateRow}>
          ○ No real users with push subscriptions found.
        </div>
      )}

      {!fetching && !fetchErr && users.length > 0 && (
        <div className={styles.subList}>
          <div className={styles.colBar}>
            <div className={styles.colH}>User</div>
            <div className={styles.colH} style={{ textAlign: 'right' }}>Status</div>
            <div className={styles.colH} />
          </div>

          {users.map(user => {
            const state = rowStates.get(user.id)
            const { text, cls } = rowStatusLabel(state)
            const isLoading = state?.type === 'loading'
            const label = user.display_name ?? user.email

            return (
              <div key={user.id} className={styles.subRow}>
                <span className={styles.rowName} title={user.email}>
                  {label}
                </span>
                <span className={`${styles.rowStatus} ${cls}`}>{text}</span>
                <button
                  className={styles.rowBtn}
                  onClick={() => handleSend(user)}
                  disabled={isLoading}
                >
                  {isLoading ? '…' : 'Send →'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </FunctionCard>
  )
}
