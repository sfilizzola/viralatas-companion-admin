import styles from '../sections.module.css'
import { LiveBandTest } from './LiveBandTest'
import { FeatureFlags } from './FeatureFlags'

export function TestingTools() {
  return (
    <div>
      <div className={styles.sectionHeader}>
        <h1 className={styles.sectionTitle}>Live Tests</h1>
        <p className={styles.sectionDesc}>
          Configure live band presence, test modes, and feature flags.
        </p>
      </div>
      <div className={styles.cardGrid}>
        <LiveBandTest />
        <FeatureFlags />
      </div>
    </div>
  )
}
