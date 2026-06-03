import styles from '../sections.module.css'
import { CacheReset } from './CacheReset'
import { MetalPlaceConfig } from './MetalPlaceConfig'

export function DataManagement() {
  return (
    <div>
      <div className={styles.sectionHeader}>
        <h1 className={styles.sectionTitle}>Data Management</h1>
        <p className={styles.sectionDesc}>
          Manage cache, data state, and festival configuration across all clients.
        </p>
      </div>
      <div className={styles.cardGrid}>
        <CacheReset />
        <MetalPlaceConfig />
      </div>
    </div>
  )
}
