import { supabase } from '../supabase'

/**
 * Subscribe to UPDATE events on a single row identified by id=1.
 * Returns a cleanup function — call it in useEffect's return.
 */
export function subscribeToRow<T>(
  table: string,
  id: number,
  onUpdate: (row: T) => void,
): () => void {
  const channel = supabase
    .channel(`${table}_row_${id}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table, filter: `id=eq.${id}` },
      (payload) => onUpdate(payload.new as T),
    )
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}
