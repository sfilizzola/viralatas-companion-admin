import styles from '../sections.module.css'
import { TestBadges } from './TestBadges'
import { ConsolidateBadges } from './ConsolidateBadges'

export function BadgeTesting() {
  return (
    <div>
      <div className={styles.sectionHeader}>
        <h1 className={styles.sectionTitle}>Badge Testing</h1>
        <p className={styles.sectionDesc}>
          Add test badges to your account or snapshot year-badges for all non-test users.
        </p>
      </div>
      <div className={styles.cardGrid}>
        <TestBadges />
        <ConsolidateBadges />
      </div>
    </div>
  )
}
