import type { Servant } from './servantTypes'
import { UserRow } from './UserRow'
import styles from './ManageServants.module.css'

interface Props {
  servants: Servant[]
  loading: boolean
  error: string | null
  currentUserId: string | null
  onToggleFriend: (userId: string) => Promise<void>
  onToggleManager: (userId: string) => Promise<void>
  onToggleBlocked: (userId: string) => Promise<void>
  onDelete: (userId: string) => Promise<void>
  onError: (msg: string) => void
}

export function UserList({
  servants,
  loading,
  error,
  currentUserId,
  onToggleFriend,
  onToggleManager,
  onToggleBlocked,
  onDelete,
  onError,
}: Props) {
  if (loading) {
    return (
      <div className={styles.stateRow}>
        <span className={styles.spinnerDot} />
        <span className={styles.stateMsg}>Loading servants…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.stateRow}>
        <span className={`${styles.stateMsg} ${styles.stateMsgError}`}>
          ▲ {error}
        </span>
      </div>
    )
  }

  if (servants.length === 0) {
    return (
      <div className={styles.stateRow}>
        <span className={styles.stateMsg}>No users found.</span>
      </div>
    )
  }

  return (
    <div className={styles.stripList}>
      {/* Column headers */}
      <div className={styles.colBar}>
        <div className={`${styles.colH} ${styles.colHAvatar}`} />
        <div className={`${styles.colH} ${styles.colHIdentity}`}>Identity</div>
        <div className={`${styles.colH} ${styles.colHRole}`}>Role</div>
        <div className={`${styles.colH} ${styles.colHBadges}`}>Badges</div>
        <div className={`${styles.colH} ${styles.colHMgr}`}>Manager</div>
        <div className={`${styles.colH} ${styles.colHFriend}`}>Friend</div>
        <div className={`${styles.colH} ${styles.colHBlocked}`}>Blocked</div>
        <div className={`${styles.colH} ${styles.colHDel}`}>Del</div>
      </div>

      {/* Rows */}
      {servants.map(servant => (
        <UserRow
          key={servant.id}
          servant={servant}
          isCurrentUser={servant.id === currentUserId}
          onToggleFriend={onToggleFriend}
          onToggleManager={onToggleManager}
          onToggleBlocked={onToggleBlocked}
          onDelete={onDelete}
          onError={onError}
        />
      ))}
    </div>
  )
}
