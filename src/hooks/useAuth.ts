import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

const GODLIKE_EMAIL = import.meta.env.VITE_GODLIKE_EMAIL as string

export type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'unauthorized'; email: string }
  | { status: 'authorized'; email: string; session: Session }

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState(sessionToState(session))
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(sessionToState(session))
    })

    return () => subscription.unsubscribe()
  }, [])

  return state
}

function sessionToState(session: Session | null): AuthState {
  if (!session) return { status: 'unauthenticated' }
  const email = session.user.email ?? ''
  if (email !== GODLIKE_EMAIL) return { status: 'unauthorized', email }
  return { status: 'authorized', email, session }
}
