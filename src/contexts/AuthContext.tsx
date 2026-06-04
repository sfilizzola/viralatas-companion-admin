import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

const GODLIKE_EMAIL = import.meta.env.VITE_GODLIKE_EMAIL as string

export type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'unauthorized'; email: string }
  | { status: 'authorized'; email: string; session: Session }

interface AuthContextValue {
  auth: AuthState
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function sessionToState(session: Session | null): AuthState {
  if (!session) return { status: 'unauthenticated' }
  const email = session.user.email ?? ''
  if (email !== GODLIKE_EMAIL) return { status: 'unauthorized', email }
  return { status: 'authorized', email, session }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ status: 'loading' })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuth(sessionToState(session))
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuth(sessionToState(session))
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ auth, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used inside AuthProvider')
  return ctx
}
