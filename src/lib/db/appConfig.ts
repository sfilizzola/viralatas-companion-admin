import { supabase } from '../supabase'

export async function bumpCacheVersion(): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('app_config')
    .update({ value: new Date().toISOString() })
    .eq('key', 'cache_version')

  return { error: error ? new Error(error.message) : null }
}
