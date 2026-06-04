import { supabase } from '../supabase'

export interface LiveBandConfig {
  enabled: boolean
  bandId: string | null
}

async function getAuditUserId(): Promise<string | undefined> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user.id
}

export async function getLiveBandConfig(): Promise<{ data: LiveBandConfig | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('live_band_test_config')
    .select('enabled, band_id')
    .eq('id', 1)
    .single()

  if (error || !data) return { data: null, error: new Error(error?.message ?? 'No data') }
  return { data: { enabled: data.enabled, bandId: data.band_id ?? null }, error: null }
}

export async function setLiveBandConfig(
  patch: Partial<{ enabled: boolean; bandId: string | null }>,
): Promise<{ error: Error | null }> {
  const userId = await getAuditUserId()
  const update: Record<string, unknown> = {
    updated_by: userId,
    updated_at: new Date().toISOString(),
  }
  if (patch.enabled !== undefined) update.enabled = patch.enabled
  if (patch.bandId !== undefined) update.band_id = patch.bandId

  const { error } = await supabase
    .from('live_band_test_config')
    .update(update)
    .eq('id', 1)

  return { error: error ? new Error(error.message) : null }
}
