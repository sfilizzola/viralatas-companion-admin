import { useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import styles from './AuthGate.module.css'

interface Props {
  children: React.ReactNode
}

export function AuthGate({ children }: Props) {
  const auth = useAuth()

  if (auth.status === 'loading') {
    return (
      <div className={styles.loading}>
        <span className={styles.loadingDot} />
      </div>
    )
  }

  if (auth.status === 'authorized') {
    return <>{children}</>
  }

  return <LoginScreen unauthorized={auth.status === 'unauthorized'} />
}

function LoginScreen({ unauthorized }: { unauthorized: boolean }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError(error.message)
  }

  return (
    <div className={styles.loginView}>
      <div className={styles.loginPanel}>
        <div className={styles.loginHeader}>
          <div className={styles.logoMark}>VL</div>
          <div>
            <strong>Admin Console</strong>
            <span>Vira-Latas · Restricted</span>
          </div>
        </div>

        <form className={styles.loginBody} onSubmit={handleSubmit}>
          {unauthorized && (
            <div className={styles.errorBanner}>
              Access denied. This account is not authorised.
            </div>
          )}
          {error && (
            <div className={styles.errorBanner}>{error}</div>
          )}

          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className={styles.loginBtn} disabled={loading}>
            {loading ? 'Authenticating…' : 'Sign in'}
          </button>

          <p className={styles.loginNote}>
            Protected by <span>Supabase Auth</span>
          </p>
        </form>
      </div>
    </div>
  )
}
