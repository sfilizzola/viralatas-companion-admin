import styles from '../sections.module.css'
import { TestQuack } from './TestQuack'
import { TestPush } from './TestPush'

export function PushTest() {
  return (
    <div>
      <div className={styles.sectionHeader}>
        <h1 className={styles.sectionTitle}>Push Test</h1>
        <p className={styles.sectionDesc}>
          Send test notifications and validate the full push stack.
        </p>
      </div>
      <div className={styles.cardGrid}>
        <TestQuack />
        <TestPush />
      </div>
    </div>
  )
}
