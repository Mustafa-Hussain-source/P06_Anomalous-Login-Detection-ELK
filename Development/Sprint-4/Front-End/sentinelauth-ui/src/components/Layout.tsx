import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Overview', icon: 'dashboard' },
  { to: '/ingestion', label: 'Event Ingestion', icon: 'input' },
  { to: '/detection', label: 'Detection Center', icon: 'biotech' },
  { to: '/triage', label: 'Alert Triage', icon: 'notifications_active' },
  { to: '/containment', label: 'Containment', icon: 'security' },
  { to: '/events', label: 'Events', icon: 'event' },
  { to: '/mitigations', label: 'Mitigations', icon: 'gpp_good' },
  { to: '/evidence', label: 'Evidence Vault', icon: 'folder_shared' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
  { to: '/reports', label: 'Reports', icon: 'analytics' },
  { to: '/seed-db', label: 'Seed DB', icon: 'storage' },
  { to: '/graph', label: 'Graph', icon: 'hub' },
  { to: '/simulate', label: 'Simulations', icon: 'sports_esports' },
]

type LayoutProps = {
  authUser: string | null
}

export function Layout({ authUser }: LayoutProps) {
  return (
    <div className="command-shell">
      <aside className="side-nav">
        <div className="brand-wrap">
          <h1 className="brand-title">SentinelAuth</h1>
          <p className="brand-subtitle">Tactical Command Center</p>
        </div>

        <nav className="side-links" aria-label="Primary">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => (isActive ? 'side-link active' : 'side-link')}
            >
              <span className="material-symbols-outlined side-link-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="side-nav-footer">
          <p className="side-auth-user">Signed in: {authUser || 'unknown'}</p>
          <NavLink to="/account" className="side-account-link">
            <span className="material-symbols-outlined side-link-icon">account_circle</span>
            <span>Account</span>
          </NavLink>
        </div>
      </aside>

      <section className="main-shell">
        <main className="page-wrap">
          <Outlet />
        </main>
      </section>
    </div>
  )
}
