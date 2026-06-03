import { FunctionCard } from '../../components/FunctionCard/FunctionCard'
import styles from '../sections.module.css'

export function ManageServants() {
  return (
    <FunctionCard
      id="D-01"
      title="Manage Servants"
      description="View and manage users registered in the app. Operations TBD after consulting Supabase schema."
      status="off"
      statusLabel="TBD"
      fullWidth
    >
      <p className={styles.metaLabel}>
        Connect to Supabase and consult the companion app schema to define available operations.
      </p>
    </FunctionCard>
  )
}
