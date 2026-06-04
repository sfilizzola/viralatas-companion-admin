import { useState, useEffect } from 'react'
import { FunctionCard } from '../../components/FunctionCard/FunctionCard'
import { BandCombobox } from '../../components/BandCombobox/BandCombobox'
import { useFeedback } from '../../hooks/useFeedback'
import { useBands } from '../../hooks/useBands'
import { supabase } from '../../lib/supabase'
import styles from '../sections.module.css'

const COOLDOWN_MS = 15_000

export function TestQuack() {
  const { feedback, show } = useFeedback()
  const { bands, loading } = useBands()

  const [selectedId, setSelectedId]         = useState<string | null>(null)
  const [recipientCount, setRecipientCount] = useState<number | null>(null)
  const [countLoading, setCountLoading]     = useState(false)
  const [sending, setSending]               = useState(false)
  const [cooldown, setCooldown]             = useState(false)

  useEffect(() => {
    if (!selectedId) {
      setRecipientCount(null)
      return
    }
    let cancelled = false
    setCountLoading(true)

    async function fetchCount() {
      const { data: { session } } = await supabase.auth.getSession()
      const { count } = await supabase
        .from('user_picks')
        .select('*', { count: 'exact', head: true })
        .eq('band_id', selectedId)
        .neq('user_id', session?.user.id ?? '')
      if (!cancelled) {
        setRecipientCount(count ?? null)
        setCountLoading(false)
      }
    }

    fetchCount()
    return () => { cancelled = true }
  }, [selectedId])

  async function handleSend() {
    if (!selectedId || sending || cooldown) return
    setSending(true)

    const { data: { session } } = await supabase.auth.getSession()
    const { error } = await supabase
      .from('duck_quacks')
      .insert({ user_id: session?.user.id, band_id: selectedId })

    setSending(false)

    if (error) {
      show('error', `Failed — ${error.message}`)
      return
    }

    const band = bands.find(b => b.id === selectedId)
    const countStr = recipientCount !== null ? ` (${recipientCount} pickers notified)` : ''
    show('success', `Quack sent — ${band?.name ?? selectedId}${countStr}`)

    setCooldown(true)
    setTimeout(() => setCooldown(false), COOLDOWN_MS)
  }

  const canSend = !!selectedId && !sending && !cooldown && !loading

  let cardStatus: 'loading' | 'ready' | 'active' | 'error' = 'ready'
  if (loading) cardStatus = 'loading'
  else if (feedback?.type === 'error') cardStatus = 'error'
  else if (cooldown || sending) cardStatus = 'active'

  return (
    <FunctionCard
      id="B-01"
      title="Test Quack"
      description="Fire a real duck quack as godlike — triggers send-duck-push for all pickers of the selected band."
      status={cardStatus}
      statusLabel={sending ? 'Firing…' : cooldown ? 'Cooldown' : undefined}
    >
      <BandCombobox
        bands={bands}
        value={selectedId}
        onChange={id => { setSelectedId(id); setRecipientCount(null) }}
        disabled={loading || sending || cooldown}
      />

      {selectedId && !countLoading && recipientCount !== null && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 10px',
          background: recipientCount === 0
            ? 'rgba(192,30,30,0.08)'
            : 'rgba(217,123,44,0.08)',
          border: `1px solid ${recipientCount === 0 ? 'rgba(192,30,30,0.25)' : 'rgba(217,123,44,0.20)'}`,
          fontFamily: 'var(--f-mono)',
          fontSize: 10,
          letterSpacing: '0.06em',
          color: recipientCount === 0 ? '#f87171' : 'var(--bone-soft)',
        }}>
          <span style={{ color: recipientCount === 0 ? '#f87171' : 'var(--caramel)' }}>
            {recipientCount === 0 ? '⚠' : '▶'}
          </span>
          {recipientCount === 0
            ? 'NO PICKERS — NOBODY RECEIVES IT'
            : `${recipientCount} USER${recipientCount === 1 ? '' : 'S'} WILL BE NOTIFIED`}
        </div>
      )}

      {selectedId && countLoading && (
        <div style={{
          padding: '5px 10px',
          fontFamily: 'var(--f-mono)',
          fontSize: 10,
          letterSpacing: '0.06em',
          color: 'var(--bone-dim)',
        }}>
          ◌ Counting pickers…
        </div>
      )}

      {feedback && (
        <p className={feedback.type === 'success' ? styles.feedbackOk : styles.feedbackErr}>
          {feedback.message}
        </p>
      )}

      <button
        className="btn-primary"
        onClick={handleSend}
        disabled={!canSend}
      >
        {sending ? 'Firing…' : cooldown ? 'Cooldown…' : 'Send Quack →'}
      </button>
    </FunctionCard>
  )
}
