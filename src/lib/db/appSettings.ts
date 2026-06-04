import { supabase } from '../supabase'

export interface AppSettings {
  duck_enabled: boolean
  registration_enabled: boolean
}

export async function getAppSettings(): Promise<{ data: AppSettings | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('duck_enabled, registration_enabled')
    .limit(1)
    .single()

  if (error || !data) return { data: null, error: new Error(error?.message ?? 'No data') }
  return { data: { duck_enabled: data.duck_enabled, registration_enabled: data.registration_enabled }, error: null }
}

export async function updateAppSetting(
  key: keyof AppSettings,
  value: boolean,
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('app_settings')
    .update({ [key]: value, updated_at: new Date().toISOString() })

  return { error: error ? new Error(error.message) : null }
}
