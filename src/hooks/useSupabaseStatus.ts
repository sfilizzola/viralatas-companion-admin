import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type SupabaseStatus = 'checking' | 'connected' | 'error'

export function useSupabaseStatus(): SupabaseStatus {
  const [status, setStatus] = useState<SupabaseStatus>('checking')

  useEffect(() => {
    supabase
      .from('app_config')
      .select('key')
      .limit(1)
      .then(({ error }) => {
        setStatus(error ? 'error' : 'connected')
      })
  }, [])

  return status
}
