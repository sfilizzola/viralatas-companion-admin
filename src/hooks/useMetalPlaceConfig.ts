import { useState, useEffect, useRef } from 'react'
import {
  getMetalPlaceConfig,
  normaliseMetalPlace,
  METAL_PLACE_DEFAULTS,
  type MetalPlaceData,
} from '../lib/db/metalPlaceConfig'
import { subscribeToRow } from '../lib/db/realtime'

interface UseMetalPlaceConfigResult {
  saved: MetalPlaceData
  draft: MetalPlaceData
  loading: boolean
  isDirty: boolean
  setDraft: React.Dispatch<React.SetStateAction<MetalPlaceData>>
}

export function useMetalPlaceConfig(): UseMetalPlaceConfigResult {
  const [saved, setSaved] = useState<MetalPlaceData>(METAL_PLACE_DEFAULTS)
  const [draft, setDraft] = useState<MetalPlaceData>(METAL_PLACE_DEFAULTS)
  const [loading, setLoading] = useState(true)

  // Ref lets the realtime handler check whether the user has unsaved edits
  // without needing the handler to be re-created on every draft change.
  const savedRef = useRef<MetalPlaceData>(METAL_PLACE_DEFAULTS)
  useEffect(() => { savedRef.current = saved }, [saved])

  const isDirty = JSON.stringify(draft) !== JSON.stringify(saved)

  useEffect(() => {
    getMetalPlaceConfig().then(({ data }) => {
      if (data) {
        setSaved(data)
        setDraft(data)
      }
      setLoading(false)
    })

    return subscribeToRow<{ festival_day: number | null; start_time: string; end_time: string }>(
      'metal_place_config',
      1,
      (row) => {
        const v = normaliseMetalPlace(row)
        const prevSaved = savedRef.current
        setSaved(v)
        // Don't stomp over unsaved local edits
        setDraft((prev) => {
          const wasDirty = JSON.stringify(prev) !== JSON.stringify(prevSaved)
          return wasDirty ? prev : v
        })
      },
    )
  }, [])

  return { saved, draft, loading, isDirty, setDraft }
}
