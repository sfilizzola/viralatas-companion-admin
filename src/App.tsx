import { useState } from 'react'
import { AuthGate } from './components/AuthGate/AuthGate'
import { Sidebar } from './components/Sidebar/Sidebar'
import { useAuth } from './hooks/useAuth'
import { useSupabaseStatus } from './hooks/useSupabaseStatus'
import { TestingTools } from './sections/TestingTools'
import { DataManagement } from './sections/DataManagement'
import { BadgeTesting } from './sections/BadgeTesting'
import { UserManagement } from './sections/UserManagement'
import styles from './App.module.css'

export type Section = 'testing' | 'data' | 'badges' | 'users'

function AdminShell() {
  const auth = useAuth()
  const supabaseStatus = useSupabaseStatus()
  const [activeSection, setActiveSection] = useState<Section>('testing')

  if (auth.status !== 'authorized') return null
  const email = auth.email

  return (
    <div className={styles.shell}>
      <Sidebar
        activeSection={activeSection}
        onNavigate={setActiveSection}
        email={email}
        connected={supabaseStatus === 'connected'}
      />
      <main className={styles.main}>
        <div className={styles.content}>
          {activeSection === 'testing' && <TestingTools />}
          {activeSection === 'data'    && <DataManagement />}
          {activeSection === 'badges'  && <BadgeTesting />}
          {activeSection === 'users'   && <UserManagement />}
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthGate>
      <AdminShell />
    </AuthGate>
  )
}
