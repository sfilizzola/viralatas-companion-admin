import { useState, useEffect } from 'react'
import { getLiveBandConfig, type LiveBandConfig } from '../lib/db/liveBandConfig'
import { subscribeToRow } from '../lib/db/realtime'

const INITIAL: LiveBandConfig = { enabled: false, bandId: null }

export function useLiveBandConfig(): { config: LiveBandConfig; loading: boolean } {
  const [config, setConfig] = useState<LiveBandConfig>(INITIAL)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLiveBandConfig().then(({ data }) => {
      if (data) setConfig(data)
      setLoading(false)
    })

    return subscribeToRow<{ enabled: boolean; band_id: string | null }>(
      'live_band_test_config',
      1,
      (row) => setConfig({ enabled: row.enabled, bandId: row.band_id ?? null }),
    )
  }, [])

  return { config, loading }
}
