import styles from '../sections.module.css'
import { TestBadges } from './TestBadges'

export function BadgeTesting() {
  return (
    <div>
      <div className={styles.sectionHeader}>
        <h1 className={styles.sectionTitle}>Badge Testing</h1>
        <p className={styles.sectionDesc}>
          Add test badges to verify badge rendering and unlock conditions.
        </p>
      </div>
      <div className={styles.cardGrid}>
        <TestBadges />
      </div>
    </div>
  )
}
