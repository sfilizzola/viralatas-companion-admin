import styles from '../sections.module.css'
import { ManageServants } from './ManageServants'

export function UserManagement() {
  return (
    <div>
      <div className={styles.sectionHeader}>
        <h1 className={styles.sectionTitle}>User Management</h1>
        <p className={styles.sectionDesc}>
          View and manage users registered in the Vira-Latas app.
        </p>
      </div>
      <div className={styles.cardGrid}>
        <ManageServants />
      </div>
    </div>
  )
}
