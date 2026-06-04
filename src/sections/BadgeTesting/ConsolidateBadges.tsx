import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { FunctionCard } from '../../components/FunctionCard/FunctionCard'
import { useFeedback } from '../../hooks/useFeedback'
import styles from '../sections.module.css'

type DryRunBadge = {
  slug: string
  imagePath: string
  labelKey: string
}

type DryRunUser = {
  userId: string
  displayName: string
  badges: DryRunBadge[]
}

type DryRunResult = {
  totalBadges: number
  users: DryRunUser[]
}

type Phase = 'idle' | 'dryRunLoading' | 'dryRunDone' | 'confirmOpen' | 'consolidating'

export function ConsolidateBadges() {
  const { feedback, show } = useFeedback()
  const [phase, setPhase] = useState<Phase>('idle')
  const [dryRunResult, setDryRunResult] = useState<DryRunResult | null>(null)

  async function handleDryRun() {
    setPhase('dryRunLoading')
    try {
      const { data, error } = await supabase.functions.invoke('consolidate-year-badges', {
        body: { year: 2026, force: true, dryRun: true },
      })
      if (error) throw error
      setDryRunResult({ totalBadges: data.totalBadges, users: data.users })
      setPhase('dryRunDone')
    } catch (err: unknown) {
      show('error', `Dry run failed — ${err instanceof Error ? err.message : 'unknown error'}`)
      setPhase('idle')
    }
  }

  async function handleConsolidate() {
    setPhase('consolidating')
    try {
      const { data, error } = await supabase.functions.invoke('consolidate-year-badges', {
        body: { year: 2026, force: true, dryRun: false },
      })
      if (error) throw error
      show('success', `Done — ${data.consolidated} badges consolidated`)
    } catch (err: unknown) {
      show('error', `Consolidation failed — ${err instanceof Error ? err.message : 'unknown error'}`)
    } finally {
      setDryRunResult(null)
      setPhase('idle')
    }
  }

  const isLoading = phase === 'dryRunLoading' || phase === 'consolidating'
  const hasDryRun = dryRunResult !== null

  function cardStatus() {
    if (isLoading) return 'loading' as const
    if (hasDryRun) return 'active' as const
    return 'ready' as const
  }

  return (
    <>
      <FunctionCard
        id="D-02"
        title="Consolidate Badges 2026"
        description="Snapshot year-badges for all non-test users into the permanent archive."
        status={cardStatus()}
        fullWidth
      >
        <div className={styles.inputRow}>
          <button
            className="btn-primary"
            onClick={handleDryRun}
            disabled={isLoading}
          >
            Dry Run
          </button>
          <button
            className="btn-primary"
            onClick={() => setPhase('confirmOpen')}
            disabled={!hasDryRun || isLoading}
          >
            Consolidate →
          </button>
        </div>

        {dryRunResult && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p className={styles.metaLabel}>
              Would consolidate {dryRunResult.totalBadges} badges across {dryRunResult.users.length} users
            </p>
            <div style={{
              maxHeight: 320,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              paddingRight: 4,
            }}>
              {dryRunResult.users.map(user => (
                <div key={user.userId} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 6 }}>
                  <span style={{
                    fontFamily: 'var(--f-mono)',
                    fontSize: 11,
                    color: 'var(--bone-soft)',
                    flexShrink: 0,
                    minWidth: 140,
                  }}>
                    {user.displayName}
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {user.badges.map(b => (
                      <span key={b.slug} style={{
                        fontFamily: 'var(--f-mono)',
                        fontSize: 10,
                        letterSpacing: '0.06em',
                        padding: '2px 7px',
                        border: '1px solid var(--rule-slate)',
                        color: 'var(--bone-dim)',
                        background: 'var(--charcoal)',
                      }}>
                        {b.slug}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className={styles.metaLabel} style={{ fontStyle: 'italic' }}>
              Results from last dry run — run again to refresh
            </p>
          </div>
        )}

        {feedback && (
          <p className={feedback.type === 'success' ? styles.feedbackOk : styles.feedbackErr}>
            {feedback.message}
          </p>
        )}
      </FunctionCard>

      {phase === 'confirmOpen' && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(13, 13, 16, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
        }}>
          <div style={{
            background: 'var(--ink-soft)',
            border: '1px solid var(--rule-slate)',
            padding: 28,
            maxWidth: 460,
            width: '90%',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}>
            <p style={{
              fontFamily: 'var(--f-mono)',
              fontSize: 12,
              lineHeight: 1.65,
              color: 'var(--bone-soft)',
            }}>
              This will write frozen badge rows for all non-test users (year 2026). Operation is idempotent — re-running is safe. Confirm?
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                className="btn-primary"
                onClick={() => setPhase('dryRunDone')}
              >
                Cancel
              </button>
              <button
                className="btn-destructive"
                onClick={handleConsolidate}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
