import styles from '../sections.module.css'
import { ConsolidateBadges } from './ConsolidateBadges'

export function BadgeTesting() {
  return (
    <div>
      <div className={styles.sectionHeader}>
        <h1 className={styles.sectionTitle}>Badge Consolidation</h1>
        <p className={styles.sectionDesc}>
          Snapshot year-badges for all non-test users into the permanent archive.
        </p>
      </div>
      <div className={styles.cardGrid}>
        <ConsolidateBadges />
      </div>
    </div>
  )
}
