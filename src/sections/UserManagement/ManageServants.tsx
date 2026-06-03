import { FunctionCard } from '../../components/FunctionCard/FunctionCard'
import { UserList } from './UserList'
import { useServants } from './useServants'
import { useFeedback } from '../../hooks/useFeedback'
import sectionStyles from '../sections.module.css'

export function ManageServants() {
  const { servants, loading, error, currentUserId, toggleFriend, toggleManager, toggleBlocked, deleteUser } = useServants()
  const { feedback, show } = useFeedback()

  const statusLabel = loading ? 'Loading' : error ? 'Error' : `${servants.length} Users`
  const status = loading ? 'loading' : error ? 'error' : 'ready'

  return (
    <FunctionCard
      id="D-01"
      title="Servants of Metal"
      description="Registered users. Manage roles, friend status, and remove non-godlike accounts."
      status={status}
      statusLabel={statusLabel}
      fullWidth
    >
      {feedback && (
        <p className={feedback.type === 'error' ? sectionStyles.feedbackErr : sectionStyles.feedbackOk}>
          {feedback.type === 'error' ? '▲' : '●'} {feedback.message}
        </p>
      )}
      <UserList
        servants={servants}
        loading={loading}
        error={error}
        currentUserId={currentUserId}
        onToggleFriend={toggleFriend}
        onToggleManager={toggleManager}
        onToggleBlocked={toggleBlocked}
        onDelete={deleteUser}
        onError={(msg) => show('error', msg)}
      />
    </FunctionCard>
  )
}
