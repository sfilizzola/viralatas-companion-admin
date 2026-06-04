import { useState, useEffect, useRef } from 'react'
import { FunctionCard } from '../../components/FunctionCard/FunctionCard'
import { Toggle } from '../../components/Toggle/Toggle'
import { BandCombobox } from '../../components/BandCombobox/BandCombobox'
import { useFeedback } from '../../hooks/useFeedback'
import { useBands } from '../../hooks/useBands'
import { supabase } from '../../lib/supabase'
import styles from '../sections.module.css'

interface LiveBandConfig {
  enabled: boolean
  bandId: string | null
}

export function LiveBandTest() {
  const { feedback, show } = useFeedback()
  const { bands } = useBands()

  const [config, setConfig]           = useState<LiveBandConfig>({ enabled: false, bandId: null })
  const [selectedId, setSelectedId]   = useState<string | null>(null)
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)

  const configRef = useRef<LiveBandConfig>({ enabled: false, bandId: null })
  useEffect(() => { configRef.current = config }, [config])

  useEffect(() => {

    supabase
      .from('live_band_test_config')
      .select('enabled, band_id')
      .eq('id', 1)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          const cfg: LiveBandConfig = { enabled: data.enabled, bandId: data.band_id ?? null }
          setConfig(cfg)
          setSelectedId(cfg.bandId)
        }
        setLoading(false)
      })

    const channel = supabase
      .channel('live_band_test_config_watch')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'live_band_test_config', filter: 'id=eq.1' },
        (payload) => {
          const row = payload.new as { enabled: boolean; band_id: string | null }
          setConfig({ enabled: row.enabled, bandId: row.band_id ?? null })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function handleToggle(val: boolean) {
    if (saving) return
    setSaving(true)

    const { data: { session } } = await supabase.auth.getSession()
    // Turning ON always clears the previous band — forces an explicit 2-step flow
    const patch = val
      ? { enabled: true, band_id: null, updated_by: session?.user.id, updated_at: new Date().toISOString() }
      : { enabled: false, updated_by: session?.user.id, updated_at: new Date().toISOString() }

    const { error } = await supabase
      .from('live_band_test_config')
      .update(patch)
      .eq('id', 1)

    setSaving(false)

    if (error) {
      show('error', `Failed — ${error.message}`)
    } else {
      if (val) {
        setConfig({ enabled: true, bandId: null })
        setSelectedId(null)
      } else {
        setConfig(prev => ({ ...prev, enabled: false }))
      }
      show('success', val ? 'Test mode enabled — select a band.' : 'Test mode disabled.')
    }
  }

  async function handleClearBand() {
    if (saving) return
    setSaving(true)

    const { data: { session } } = await supabase.auth.getSession()
    const { error } = await supabase
      .from('live_band_test_config')
      .update({ band_id: null, updated_by: session?.user.id, updated_at: new Date().toISOString() })
      .eq('id', 1)

    setSaving(false)

    if (error) {
      show('error', `Failed — ${error.message}`)
    } else {
      setConfig(prev => ({ ...prev, bandId: null }))
      setSelectedId(null)
      show('success', 'Live band cleared.')
    }
  }

  async function handleSetBand() {
    if (!selectedId || saving) return
    setSaving(true)

    const { data: { session } } = await supabase.auth.getSession()
    const { error } = await supabase
      .from('live_band_test_config')
      .update({ band_id: selectedId, updated_by: session?.user.id, updated_at: new Date().toISOString() })
      .eq('id', 1)

    setSaving(false)

    if (error) {
      show('error', `Failed — ${error.message}`)
    } else {
      const band = bands.find(b => b.id === selectedId)
      setConfig(prev => ({ ...prev, bandId: selectedId }))
      show('success', `Live band set to "${band?.name ?? selectedId}".`)
    }
  }

  const activeBand = bands.find(b => b.id === config.bandId) ?? null
  const canSetBand = config.enabled && !!selectedId && selectedId !== config.bandId && !saving

  let cardStatus: 'loading' | 'active' | 'ready' | 'off' = 'off'
  if (loading) cardStatus = 'loading'
  else if (config.enabled && config.bandId) cardStatus = 'active'
  else if (config.enabled) cardStatus = 'ready'

  return (
    <FunctionCard
      id="A-01"
      title="Live Band Test"
      description="Configure which band is 'live now' for testing presence and alerts."
      status={cardStatus}
    >
      <Toggle
        checked={config.enabled}
        onChange={handleToggle}
        label="Test mode"
        disabled={loading || saving}
      />

      <div className={styles.inputRow} style={{ opacity: config.enabled ? 1 : 0.4, pointerEvents: config.enabled ? 'auto' : 'none' }}>
        <BandCombobox
          bands={bands}
          value={selectedId}
          onChange={setSelectedId}
          disabled={!config.enabled || loading}
        />
        <button
          className="btn-primary"
          onClick={handleSetBand}
          disabled={!canSetBand}
        >
          {saving ? 'Saving…' : 'Set Band →'}
        </button>
      </div>

      {config.enabled && activeBand && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '6px 10px',
          background: 'rgba(217,123,44,0.08)',
          border: '1px solid rgba(217,123,44,0.25)',
          fontFamily: 'var(--f-mono)', fontSize: 10,
          letterSpacing: '0.06em', color: 'var(--bone-soft)',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--caramel)' }}>◆</span>
            <span>ACTIVE: <span style={{ color: 'var(--caramel)' }}>{activeBand.name}</span></span>
          </span>
          <button
            onClick={handleClearBand}
            disabled={saving}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--bone-dim)',
              fontFamily: 'var(--f-mono)',
              fontSize: 10,
              letterSpacing: '0.08em',
              cursor: 'pointer',
              padding: '0 4px',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--bone)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--bone-dim)')}
          >
            × clear
          </button>
        </div>
      )}

      {feedback && (
        <p className={feedback.type === 'success' ? styles.feedbackOk : styles.feedbackErr}>
          {feedback.message}
        </p>
      )}
    </FunctionCard>
  )
}
