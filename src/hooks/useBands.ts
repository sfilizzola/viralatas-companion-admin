import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { BandOption } from '../lib/types'

export function useBands(): { bands: BandOption[]; loading: boolean } {
  const [bands, setBands] = useState<BandOption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('bands')
      .select('id, name, user_picks(count)')
      .then(({ data, error }) => {
        if (!error && data) {
          const sorted: BandOption[] = (data as Array<{
            id: string
            name: string
            user_picks: Array<{ count: number }>
          }>)
            .map(b => ({ id: b.id, name: b.name, pickCount: b.user_picks[0]?.count ?? 0 }))
            .sort((a, b) => b.pickCount - a.pickCount)
          setBands(sorted)
        }
        setLoading(false)
      })
  }, [])

  return { bands, loading }
}
