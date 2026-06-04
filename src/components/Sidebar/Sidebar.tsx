import { supabase } from '../../lib/supabase'
import type { Section } from '../../App'
import styles from './Sidebar.module.css'

const NAV_ITEMS: { id: Section; label: string; icon: string; count: number }[] = [
  { id: 'testing',    label: 'Live Tests',       icon: '⚡', count: 2 },
  { id: 'push',       label: 'Push Test',        icon: '◎', count: 2 },
  { id: 'data',       label: 'Data Management',  icon: '⊞', count: 1 },
  { id: 'badges',     label: 'Badge Consolidation', icon: '◈', count: 1 },
  { id: 'users',      label: 'User Management',  icon: '⊙', count: 1 },
]

interface Props {
  activeSection: Section
  onNavigate: (section: Section) => void
  email: string
  connected: boolean
}

export function Sidebar({ activeSection, onNavigate, email, connected }: Props) {
  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoMark}>VL</div>
        <div>
          <span className={styles.logoTitle}>Admin</span>
          <span className={styles.logoSub}>Vira-Latas</span>
        </div>
      </div>

      <div className={styles.connectionStatus}>
        <span className={connected ? styles.dotGreen : styles.dotDim} />
        <span className={styles.connectionLabel}>
          Supabase · {connected ? 'connected' : 'connecting…'}
        </span>
      </div>

      <nav className={styles.nav}>
        <span className={styles.navGroupLabel}>Sections</span>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`${styles.navItem} ${activeSection === item.id ? styles.navItemActive : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
            <span className={styles.navCount}>[{item.count}]</span>
          </button>
        ))}
      </nav>

      <div className={styles.footer}>
        <div className={styles.footerUser}>
          <span className={styles.dotCaramel} />
          <div className={styles.footerUserInfo}>
            <span className={styles.footerEmail}>{email}</span>
            <span className={styles.footerBadge}>Godlike</span>
          </div>
        </div>
        <button className={styles.signOutBtn} onClick={handleSignOut}>
          Sign out
        </button>
      </div>
    </aside>
  )
}
