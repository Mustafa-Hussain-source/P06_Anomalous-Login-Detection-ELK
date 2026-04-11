import { Navigate, Route, Routes } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { Layout } from './components/Layout'
import { AlertTriagePage } from './pages/AlertTriagePage'
import { AccountPage } from './pages/AccountPage'
import { ContainmentPage } from './pages/ContainmentPage'
import { DashboardPage } from './pages/DashboardPage'
import { DetectionCenterPage } from './pages/DetectionCenterPage'
import { EvidencePage } from './pages/EvidencePage'
import { EventsPage } from './pages/EventsPage'
import { IngestionHealthPage } from './pages/IngestionHealthPage'
import { InvestigationGraphPage } from './pages/InvestigationGraphPage'
import { LoginPage } from './pages/LoginPage'
import { MitigationsPage } from './pages/MitigationsPage'
import { ReportsPage } from './pages/ReportsPage'
import { SeedDatabasePage } from './pages/SeedDatabasePage'
import { SettingsPolicyPage } from './pages/SettingsPolicyPage'
import { SimulationPage } from './pages/SimulationPage'
import { api } from './lib/api'

const AUTH_STORAGE_KEY = 'sentinelauth-auth-user'

function App() {
  const [authDisplayName, setAuthDisplayName] = useState<string | null>(() => window.localStorage.getItem(AUTH_STORAGE_KEY))
  const isAuthenticated = useMemo(() => Boolean(authDisplayName), [authDisplayName])

  const loginSuccess = (displayName: string) => {
    setAuthDisplayName(displayName)
    window.localStorage.setItem(AUTH_STORAGE_KEY, displayName)
    void api.startTraffic().catch(() => undefined)
  }

  const logout = () => {
    setAuthDisplayName(null)
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage onLoginSuccess={loginSuccess} />}
      />

      <Route element={isAuthenticated ? <Layout authUser={authDisplayName} /> : <Navigate to="/login" replace />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/account" element={<AccountPage authUser={authDisplayName} onLogout={logout} />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/mitigations" element={<MitigationsPage />} />
        <Route path="/evidence" element={<EvidencePage />} />
        <Route path="/simulate" element={<SimulationPage />} />
        <Route path="/triage" element={<AlertTriagePage />} />
        <Route path="/detection" element={<DetectionCenterPage />} />
        <Route path="/containment" element={<ContainmentPage />} />
        <Route path="/settings" element={<SettingsPolicyPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/seed-db" element={<SeedDatabasePage />} />
        <Route path="/graph" element={<InvestigationGraphPage />} />
        <Route path="/ingestion" element={<IngestionHealthPage />} />
        <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/login'} replace />} />
      </Route>
    </Routes>
  )
}

export default App
