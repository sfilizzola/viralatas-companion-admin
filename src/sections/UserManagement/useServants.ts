import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import type { Servant } from './servantTypes'

interface UseServantsResult {
  servants: Servant[]
  loading: boolean
  error: string | null
  currentUserId: string | null
  toggleFriend: (userId: string) => Promise<void>
  toggleManager: (userId: string) => Promise<void>
  toggleBlocked: (userId: string) => Promise<void>
  deleteUser: (userId: string) => Promise<void>
}

export function useServants(): UseServantsResult {
  const [servants, setServants] = useState<Servant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      const myId = user?.id ?? null
      if (!cancelled) setCurrentUserId(myId)

      // Fetch users, blocked_posters, and push_subscriptions in parallel.
      // Note: push_subscriptions RLS is "own only" — we only get rows the
      // currently-authenticated user can see. For the godlike admin this means
      // their own row is definitive; for all other users has_push = null (unknown).
      const [usersResult, blockedResult, pushResult] = await Promise.all([
        supabase
          .from('users')
          .select('id, email, display_name, avatar_url, role, is_friend, is_test_user, special_badges')
          .order('created_at', { ascending: false }),
        supabase
          .from('blocked_posters')
          .select('user_id'),
        supabase
          .from('push_subscriptions')
          .select('user_id'),
      ])

      if (cancelled) return

      if (usersResult.error) {
        setError(usersResult.error.message)
        setLoading(false)
        return
      }

      // Build a Set of blocked user IDs (blocked by anyone — admin sees all)
      const blockedSet = new Set<string>(
        (blockedResult.data ?? []).map((r: { user_id: string }) => r.user_id)
      )

      // Build a Set of user IDs with confirmed push subscriptions (RLS-limited)
      const pushSet = new Set<string>(
        (pushResult.data ?? []).map((r: { user_id: string }) => r.user_id)
      )

      const mapped: Servant[] = (usersResult.data ?? []).map((row: Record<string, unknown>) => {
        const specialBadges = row.special_badges
        const badgeCount = Array.isArray(specialBadges) ? specialBadges.length : 0
        const rowId = row.id as string

        // Determine push status: confirmed true, confirmed false (own user only), or null (unknown)
        let hasPush: boolean | null
        if (pushSet.has(rowId)) {
          hasPush = true
        } else if (rowId === myId) {
          hasPush = false
        } else {
          hasPush = null
        }

        return {
          id: rowId,
          email: (row.email as string) ?? '',
          display_name: (row.display_name as string | null) ?? null,
          avatar_url: (row.avatar_url as string | null) ?? null,
          role: (row.role as 'normal' | 'manager' | 'godlike') ?? 'normal',
          is_friend: (row.is_friend as boolean | null) ?? null,
          is_test_user: (row.is_test_user as boolean) ?? false,
          is_blocked: blockedSet.has(rowId),
          badge_count: badgeCount,
          has_push: hasPush,
        }
      })

      setServants(mapped)
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [])

  const toggleFriend = useCallback(async (userId: string) => {
    setServants(prev => {
      const servant = prev.find(s => s.id === userId)
      if (!servant) return prev
      return prev.map(s =>
        s.id === userId ? { ...s, is_friend: !(s.is_friend ?? false) } : s
      )
    })

    const current = servants.find(s => s.id === userId)
    if (!current) return

    const newVal = !(current.is_friend ?? false)

    const { error: updateError } = await supabase
      .from('users')
      .update({ is_friend: newVal })
      .eq('id', userId)

    if (updateError) {
      setServants(prev =>
        prev.map(s => s.id === userId ? { ...s, is_friend: current.is_friend } : s)
      )
      throw new Error(updateError.message)
    }
  }, [servants])

  const toggleManager = useCallback(async (userId: string) => {
    const current = servants.find(s => s.id === userId)
    if (!current || current.role === 'godlike') return

    const newRole: 'normal' | 'manager' = current.role === 'manager' ? 'normal' : 'manager'

    setServants(prev =>
      prev.map(s => s.id === userId ? { ...s, role: newRole } : s)
    )

    const { error: updateError } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)
      .neq('role', 'godlike')

    if (updateError) {
      setServants(prev =>
        prev.map(s => s.id === userId ? { ...s, role: current.role } : s)
      )
      throw new Error(updateError.message)
    }
  }, [servants])

  const toggleBlocked = useCallback(async (userId: string) => {
    const current = servants.find(s => s.id === userId)
    if (!current || current.role === 'godlike') return

    const newBlocked = !current.is_blocked

    // optimistic
    setServants(prev =>
      prev.map(s => s.id === userId ? { ...s, is_blocked: newBlocked } : s)
    )

    if (newBlocked) {
      const { data: { user } } = await supabase.auth.getUser()
      const { error: insertError } = await supabase
        .from('blocked_posters')
        .insert({ user_id: userId, blocked_by: user?.id })

      if (insertError) {
        setServants(prev =>
          prev.map(s => s.id === userId ? { ...s, is_blocked: current.is_blocked } : s)
        )
        throw new Error(insertError.message)
      }
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { error: deleteError } = await supabase
        .from('blocked_posters')
        .delete()
        .eq('user_id', userId)
        .eq('blocked_by', user?.id)

      if (deleteError) {
        setServants(prev =>
          prev.map(s => s.id === userId ? { ...s, is_blocked: current.is_blocked } : s)
        )
        throw new Error(deleteError.message)
      }
    }
  }, [servants])

  const deleteUser = useCallback(async (userId: string) => {
    const prevIdx = servants.findIndex(s => s.id === userId)
    if (prevIdx === -1) return
    const prev = servants[prevIdx]

    setServants(ss => ss.filter(s => s.id !== userId))

    const { error: fnError } = await supabase.functions.invoke('delete-user', {
      body: { userId },
    })

    if (fnError) {
      setServants(ss => [
        ...ss.slice(0, prevIdx),
        prev,
        ...ss.slice(prevIdx),
      ])
      throw new Error(fnError.message ?? 'Failed to delete user')
    }
  }, [servants])

  return { servants, loading, error, currentUserId, toggleFriend, toggleManager, toggleBlocked, deleteUser }
}
