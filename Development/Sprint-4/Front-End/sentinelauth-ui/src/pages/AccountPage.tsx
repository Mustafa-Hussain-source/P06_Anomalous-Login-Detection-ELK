type AccountPageProps = {
  authUser: string | null
  onLogout: () => void
}

function getShiftLabel(currentHour: number) {
  if (currentHour >= 6 && currentHour < 12) {
    return 'Morning Watch'
  }

  if (currentHour >= 12 && currentHour < 17) {
    return 'Afternoon Watch'
  }

  if (currentHour >= 17 && currentHour < 21) {
    return 'Evening Watch'
  }

  return 'Night Watch'
}

export function AccountPage({ authUser, onLogout }: AccountPageProps) {
  const name = authUser || 'Unknown Analyst'
  const shiftLabel = getShiftLabel(new Date().getHours())

  return (
    <section>
      <div className="panel-header">
        <h2>Analyst Profile</h2>
        <p>Identity, access, tooling posture, and incident response preferences for SentinelAuth operations.</p>
      </div>

      <div className="kpi-grid kpi-grid-six account-kpi-grid">
        <article className="kpi-card"><span>Role</span><strong>SOC Analyst</strong></article>
        <article className="kpi-card"><span>Tier</span><strong>L2 Response</strong></article>
        <article className="kpi-card"><span>Shift</span><strong>{shiftLabel}</strong></article>
        <article className="kpi-card"><span>Open Cases</span><strong>7</strong></article>
        <article className="kpi-card"><span>MTTD Goal</span><strong>2m</strong></article>
        <article className="kpi-card"><span>MFA</span><strong>Enforced</strong></article>
      </div>

      <div className="two-col account-grid-main">
        <article className="panel account-profile-card">
          <h3>Identity & Access</h3>
          <ul className="list account-list">
            <li><span>Display Name</span><strong>{name}</strong><span className="chip">active</span></li>
            <li><span>Primary Username</span><strong>26100015</strong><span className="sync-meta">Auth DB</span></li>
            <li><span>Access Domain</span><strong>Global SOC</strong><span className="chip">rw</span></li>
            <li><span>Clearance</span><strong>Internal Restricted</strong><span className="chip">L2</span></li>
          </ul>

          <h3>Notification Channels</h3>
          <ul className="list account-list">
            <li><span>PagerDuty</span><strong>Connected</strong><span className="chip">P1 + P2</span></li>
            <li><span>Email Escalation</span><strong>Enabled</strong><span className="sync-meta">30 min SLA</span></li>
            <li><span>Slack War-Room</span><strong>#soc-incident-bridge</strong><span className="chip">live</span></li>
          </ul>
        </article>

        <article className="panel account-profile-card">
          <h3>Operational Profile</h3>
          <ul className="list account-list">
            <li><span>Default Queue</span><strong>Identity Compromise</strong><span className="chip">priority</span></li>
            <li><span>Playbook Bundle</span><strong>UC-012 to UC-020</strong><span className="sync-meta">auto-loaded</span></li>
            <li><span>Session Hygiene</span><strong>Auto-lock 15m</strong><span className="chip">strict</span></li>
            <li><span>API Token Posture</span><strong>Healthy</strong><span className="chip">rotating</span></li>
          </ul>

          <h3>Analyst Actions</h3>
          <div className="button-row account-actions">
            <button type="button" className="seed-btn seed-btn-primary">Rotate API Token</button>
            <button type="button" className="seed-btn seed-btn-edit">View Audit Trail</button>
            <button type="button" className="seed-btn seed-btn-remove" onClick={onLogout}>Logout</button>
          </div>
        </article>
      </div>

      <article className="panel account-timeline-panel">
        <h3>Recent Analyst Activity</h3>
        <ul className="list account-list">
          <li><span>14:03</span><strong>Closed containment ticket CT-2026-091</strong><span className="sync-meta">entity: Malicious Entity</span></li>
          <li><span>13:51</span><strong>Promoted event 568 to in_review</strong><span className="sync-meta">triage pipeline</span></li>
          <li><span>13:18</span><strong>Adjusted detection threshold for impossible travel</strong><span className="sync-meta">rule: impossible_travel</span></li>
          <li><span>12:55</span><strong>Generated evidence export snapshot</strong><span className="sync-meta">for weekly report</span></li>
        </ul>
      </article>
    </section>
  )
}
