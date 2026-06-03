import styles from '../sections.module.css'
import { CacheReset } from './CacheReset'

export function DataManagement() {
  return (
    <div>
      <div className={styles.sectionHeader}>
        <h1 className={styles.sectionTitle}>Data Management</h1>
        <p className={styles.sectionDesc}>
          Manage cache and data state across all clients.
        </p>
      </div>
      <div className={styles.cardGrid}>
        <CacheReset />
      </div>
    </div>
  )
}
