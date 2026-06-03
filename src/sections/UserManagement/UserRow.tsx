import { useState } from 'react'
import type { Servant } from './servantTypes'
import styles from './ManageServants.module.css'

interface Props {
  servant: Servant
  isCurrentUser: boolean
  onToggleFriend: (userId: string) => Promise<void>
  onToggleManager: (userId: string) => Promise<void>
  onToggleBlocked: (userId: string) => Promise<void>
  onDelete: (userId: string) => Promise<void>
  onError: (msg: string) => void
}

function getInitials(displayName: string | null, email: string): string {
  if (displayName) {
    const words = displayName.trim().split(/\s+/)
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase()
    }
    return displayName.slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

function getAvatarClass(servant: Servant): string {
  if (servant.is_test_user) return styles.avTest
  if (servant.role === 'godlike') return styles.avGodlike
  if (servant.role === 'manager') return styles.avManager
  return styles.avNormal
}

function getRoleTagClass(role: Servant['role']): string {
  if (role === 'godlike') return styles.rtGodlike
  if (role === 'manager') return styles.rtManager
  return styles.rtNormal
}

function getRoleLabel(role: Servant['role']): string {
  if (role === 'godlike') return 'Godlike'
  if (role === 'manager') return 'Manager'
  return 'Vira-lata'
}

export function UserRow({ servant, isCurrentUser, onToggleFriend, onToggleManager, onToggleBlocked, onDelete, onError }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isGodlike = servant.role === 'godlike'
  const isManager = servant.role === 'manager'
  const isFriend = servant.is_friend ?? false
  const isBlocked = servant.is_blocked
  const displayName = servant.display_name ?? servant.email
  const initials = getInitials(servant.display_name, servant.email)

  async function handleToggleFriend() {
    try {
      await onToggleFriend(servant.id)
    } catch (e) {
      onError((e as Error).message ?? 'Failed to update friend status')
    }
  }

  async function handleToggleManager() {
    if (isGodlike) return
    try {
      await onToggleManager(servant.id)
    } catch (e) {
      onError((e as Error).message ?? 'Failed to update role')
    }
  }

  async function handleToggleBlocked() {
    if (isGodlike) return
    try {
      await onToggleBlocked(servant.id)
    } catch (e) {
      onError((e as Error).message ?? 'Failed to update blocked status')
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await onDelete(servant.id)
    } catch (e) {
      onError((e as Error).message ?? 'Failed to delete user')
      setDeleting(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className={`${styles.strip} ${styles.stripConfirm}`}>
        <div className={styles.segAvatar}>
          <div className={`${styles.avatar} ${getAvatarClass(servant)}`} style={{ opacity: 0.4 }}>
            {initials}
          </div>
        </div>
        <div className={styles.segConfirm}>
          <span className={styles.confirmWho}>{displayName}</span>
          <span className={styles.confirmMsg}>Permanently delete all data?</span>
          <span className={styles.confirmSpacer} />
          <button
            className={styles.confirmCancel}
            onClick={() => setConfirming(false)}
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            className={styles.confirmDelete}
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.strip}>
      {/* Avatar */}
      <div className={styles.segAvatar}>
        <div className={`${styles.avatar} ${getAvatarClass(servant)}`}>
          {servant.avatar_url ? (
            <img
              src={servant.avatar_url}
              alt={initials}
              className={styles.avatarImg}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : initials}
        </div>
      </div>

      {/* Identity */}
      <div className={styles.segIdentity}>
        <div className={styles.idName}>
          {displayName}
          {servant.is_test_user && <span className={styles.testDot} title="test user" />}
        </div>
        <div className={styles.idEmail}>{servant.email}</div>
      </div>

      {/* Role */}
      <div className={styles.segRole}>
        <span className={`${styles.roleTag} ${getRoleTagClass(servant.role)}`}>
          {getRoleLabel(servant.role)}
        </span>
      </div>

      {/* Badge count */}
      <div className={styles.segBadges}>
        <span className={`${styles.badgeNum} ${servant.badge_count === 0 ? styles.badgeNumZero : ''}`}>
          {servant.badge_count}
        </span>
        <span className={styles.badgeLbl}>badges</span>
      </div>

      {/* Manager toggle */}
      <div className={styles.segToggle}>
        <div className={`${styles.tglBar} ${isManager || isGodlike ? styles.tglBarOn : styles.tglBarOff}`} />
        <button
          className={`${styles.segToggleInner} ${
            isManager || isGodlike ? styles.toggleOn : styles.toggleOff
          } ${isGodlike ? styles.toggleDisabled : ''}`}
          onClick={handleToggleManager}
          disabled={isGodlike}
          aria-label={`Toggle manager role for ${displayName}`}
          aria-pressed={isManager || isGodlike}
          role="switch"
        >
          <span className={`${styles.tglLbl} ${isManager || isGodlike ? styles.tglLblOn : styles.tglLblOff}`}>
            Manager
          </span>
          <span className={`${styles.tglVal} ${isManager || isGodlike ? styles.tglValOn : styles.tglValOff}`}>
            {isManager || isGodlike ? 'YES' : 'NO'}
          </span>
        </button>
      </div>

      {/* Friend toggle */}
      <div className={styles.segToggle}>
        <div className={`${styles.tglBar} ${isFriend ? styles.tglBarOn : styles.tglBarOff}`} />
        <button
          className={`${styles.segToggleInner} ${isFriend ? styles.toggleOn : styles.toggleOff} ${
            isCurrentUser ? styles.toggleDisabled : ''
          }`}
          onClick={isCurrentUser ? undefined : handleToggleFriend}
          disabled={isCurrentUser}
          aria-label={`Toggle friend status for ${displayName}`}
          aria-pressed={isFriend}
          role="switch"
        >
          <span className={`${styles.tglLbl} ${isFriend ? styles.tglLblOn : styles.tglLblOff}`}>
            Friend
          </span>
          <span className={`${styles.tglVal} ${isFriend ? styles.tglValOn : styles.tglValOff}`}>
            {isFriend ? 'YES' : 'NO'}
          </span>
        </button>
      </div>

      {/* Blocked toggle */}
      <div className={styles.segToggle}>
        <div className={`${styles.tglBar} ${isBlocked ? styles.tglBarBlocked : styles.tglBarOff}`} />
        <button
          className={`${styles.segToggleInner} ${isBlocked ? styles.toggleBlocked : styles.toggleOff} ${
            isGodlike ? styles.toggleDisabled : ''
          }`}
          onClick={isGodlike ? undefined : handleToggleBlocked}
          disabled={isGodlike}
          aria-label={`Toggle blocked status for ${displayName}`}
          aria-pressed={isBlocked}
          role="switch"
        >
          <span className={`${styles.tglLbl} ${isBlocked ? styles.tglLblBlocked : styles.tglLblOff}`}>
            Blocked
          </span>
          <span className={`${styles.tglVal} ${isBlocked ? styles.tglValBlocked : styles.tglValOff}`}>
            {isBlocked ? 'YES' : 'NO'}
          </span>
        </button>
      </div>

      {/* Delete */}
      <div className={styles.segDel}>
        <button
          className={`${styles.btnDel} ${isCurrentUser ? styles.btnDelHidden : ''}`}
          onClick={() => setConfirming(true)}
          aria-label={`Delete ${displayName}`}
          tabIndex={isCurrentUser ? -1 : 0}
        >
          ✕
        </button>
      </div>
    </div>
  )
}
