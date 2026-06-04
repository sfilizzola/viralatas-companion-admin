import { supabase } from '../supabase'

export interface MetalPlaceData {
  festival_day: number | null
  start_time: string
  end_time: string
}

export const METAL_PLACE_DEFAULTS: MetalPlaceData = {
  festival_day: null,
  start_time: '18:00',
  end_time: '06:00',
}

export function normaliseMetalPlace(row: {
  festival_day: number | null
  start_time: string
  end_time: string
}): MetalPlaceData {
  return {
    festival_day: row.festival_day ?? null,
    start_time: (row.start_time ?? '18:00').slice(0, 5),
    end_time: (row.end_time ?? '06:00').slice(0, 5),
  }
}

async function getAuditUserId(): Promise<string | undefined> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user.id
}

export async function getMetalPlaceConfig(): Promise<{ data: MetalPlaceData | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('metal_place_config')
    .select('festival_day, start_time, end_time')
    .eq('id', 1)
    .single()

  if (error || !data) return { data: null, error: new Error(error?.message ?? 'No data') }
  return { data: normaliseMetalPlace(data), error: null }
}

export async function setMetalPlaceConfig(
  patch: MetalPlaceData,
): Promise<{ error: Error | null }> {
  const userId = await getAuditUserId()
  const { error } = await supabase
    .from('metal_place_config')
    .update({
      festival_day: patch.festival_day,
      start_time: patch.start_time,
      end_time: patch.end_time,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1)

  return { error: error ? new Error(error.message) : null }
}
