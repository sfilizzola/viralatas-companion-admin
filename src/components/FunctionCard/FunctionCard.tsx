import styles from './FunctionCard.module.css'

export type CardStatus = 'ready' | 'active' | 'off' | 'loading' | 'error'

interface Props {
  id: string
  title: string
  description: string
  status?: CardStatus
  statusLabel?: string
  children?: React.ReactNode
  fullWidth?: boolean
}

const STATUS_CONFIG: Record<CardStatus, { symbol: string; label: string; className: string }> = {
  ready:   { symbol: '●', label: 'Ready',   className: styles.statusReady },
  active:  { symbol: '◆', label: 'Active',  className: styles.statusActive },
  off:     { symbol: '○', label: 'Off',     className: styles.statusOff },
  loading: { symbol: '◌', label: 'Loading', className: styles.statusLoading },
  error:   { symbol: '▲', label: 'Error',   className: styles.statusError },
}

export function FunctionCard({ id, title, description, status = 'ready', statusLabel, children, fullWidth }: Props) {
  const s = STATUS_CONFIG[status]
  return (
    <div className={`${styles.card} ${fullWidth ? styles.fullWidth : ''}`}>
      <div className={styles.cardHeader}>
        <span className={styles.cardId}>{id}</span>
        <span className={`${styles.cardStatus} ${s.className}`}>
          {s.symbol} {statusLabel ?? s.label}
        </span>
      </div>
      <h2 className={styles.cardTitle}>{title}</h2>
      <p className={styles.cardDescription}>{description}</p>
      {children && <div className={styles.cardControls}>{children}</div>}
    </div>
  )
}
