import styles from '../sections.module.css'
import { TestQuack } from './TestQuack'
import { TestPush } from './TestPush'
import { LiveBandTest } from './LiveBandTest'
import { FeatureFlags } from './FeatureFlags'

export function TestingTools() {
  return (
    <div>
      <div className={styles.sectionHeader}>
        <h1 className={styles.sectionTitle}>Testing Tools</h1>
        <p className={styles.sectionDesc}>
          Trigger events, configure test modes, and validate features.
        </p>
      </div>
      <div className={styles.cardGrid}>
        <TestQuack />
        <TestPush />
        <LiveBandTest />
        <FeatureFlags />
      </div>
    </div>
  )
}
