import { useState } from 'react'
import { AuthProvider, useAuthContext } from './contexts/AuthContext'
import { AuthGate } from './components/AuthGate/AuthGate'
import { Sidebar } from './components/Sidebar/Sidebar'
import { useSupabaseStatus } from './hooks/useSupabaseStatus'
import { TestingTools } from './sections/TestingTools'
import { PushTest } from './sections/PushTest'
import { DataManagement } from './sections/DataManagement'
import { BadgeTesting } from './sections/BadgeTesting'
import { UserManagement } from './sections/UserManagement'
import styles from './App.module.css'

export type Section = 'testing' | 'push' | 'data' | 'badges' | 'users'

function AdminShell() {
  const { auth, signOut } = useAuthContext()
  const supabaseStatus = useSupabaseStatus()
  const [activeSection, setActiveSection] = useState<Section>('testing')

  if (auth.status !== 'authorized') return null

  return (
    <div className={styles.shell}>
      <Sidebar
        activeSection={activeSection}
        onNavigate={setActiveSection}
        email={auth.email}
        connected={supabaseStatus === 'connected'}
        onSignOut={signOut}
      />
      <main className={styles.main}>
        <div className={styles.content}>
          {activeSection === 'testing' && <TestingTools />}
          {activeSection === 'push'    && <PushTest />}
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
    <AuthProvider>
      <AuthGate>
        <AdminShell />
      </AuthGate>
    </AuthProvider>
  )
}
