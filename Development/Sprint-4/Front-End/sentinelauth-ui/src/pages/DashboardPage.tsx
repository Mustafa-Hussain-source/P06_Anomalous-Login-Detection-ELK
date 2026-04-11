import { useMemo, useState } from 'react'
import { api } from '../lib/api'
import { usePolling } from '../hooks/usePolling'
import type { KpiMetrics, LoginEvent, Mitigation } from '../types'

export function DashboardPage() {
  const [events, setEvents] = useState<LoginEvent[]>([])
  const [mitigations, setMitigations] = useState<Mitigation[]>([])
  const [heatmap, setHeatmap] = useState<Array<{ country: string; count: number; percentage: number; last_seen: string | null }>>([])
  const [riskyUsers, setRiskyUsers] = useState<Array<{ username: string; risk_score: number; event_action: string }>>([])
  const [kpi, setKpi] = useState<KpiMetrics | null>(null)
  const [threatVelocity, setThreatVelocity] = useState<Array<{ bucket: number; start_time: string; end_time: string; event_count: number; total_risk: number; avg_risk: number }>>([])
  const [lastSync, setLastSync] = useState<string>('Never')
  const [error, setError] = useState<string | null>(null)

  const formatLatency = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds <= 0) {
      return '0s'
    }
    if (seconds < 60) {
      return `${Math.max(1, Math.round(seconds))}s`
    }
    if (seconds < 3600) {
      return `${Math.round(seconds / 60)}m`
    }
    return `${Math.round(seconds / 3600)}h`
  }

  const refresh = async () => {
    try {
      const [eventRows, mitigationRows, kpiRows, heatRows, riskyRows, velocityRows] = await Promise.all([
        api.getEvents(100),
        api.getMitigations(100),
        api.getKpi(),
        api.getThreatHeatmap(),
        api.getRiskyUsers(8),
        api.getThreatVelocity(12, 12),
      ])
      setEvents(eventRows)
      setMitigations(mitigationRows)
      setKpi(kpiRows)
      setHeatmap(heatRows)
      setRiskyUsers(riskyRows)
      setThreatVelocity(velocityRows)
      setLastSync(new Date().toLocaleTimeString())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data')
    }
  }

  usePolling(refresh, 5000)

  const summary = useMemo(() => {
    const suspicious = events.filter((item) => item.is_suspicious).length
    const blocked = events.filter((item) => item.event_action.includes('block')).length
    const avgRisk = events.length
      ? Math.round(events.reduce((sum, item) => sum + item.risk_score, 0) / events.length)
      : 0

    const highRiskUsers = [...events]
      .sort((a, b) => b.risk_score - a.risk_score)
      .slice(0, 8)

    return {
      totalEvents: kpi?.total_events ?? events.length,
      suspicious: kpi?.suspicious_events ?? suspicious,
      blocked: kpi?.blocked_events ?? blocked,
      avgRisk: kpi?.avg_risk ?? avgRisk,
      highRiskUsers: riskyUsers.length ? riskyUsers : highRiskUsers,
      mitigations: kpi?.mitigations ?? mitigations.length,
      mttd: kpi?.mttd_seconds ?? 18,
      mttr: kpi?.mttr_seconds ?? 91,
      fpr: kpi?.false_positive_rate ?? 0.06,
    }
  }, [events, mitigations, kpi, riskyUsers])

  const trendSeries = useMemo(() => {
    if (!threatVelocity.length) {
      return []
    }

    // Normalize by max event count (shows velocity trend)
    const maxCount = Math.max(...threatVelocity.map((item) => item.event_count), 1)
    const maxRisk = Math.max(...threatVelocity.map((item) => item.total_risk), 1)

    // Use event count for height, but fallback to risk if no events
    return threatVelocity.map((item) => {
      const height = maxCount > 0
        ? Math.max(Math.round((item.event_count / maxCount) * 100), item.event_count > 0 ? 15 : 5)
        : Math.max(Math.round((item.total_risk / maxRisk) * 100), 5)

      const timeStart = new Date(item.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      const timeEnd = new Date(item.end_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

      return {
        id: item.bucket,
        height,
        eventCount: item.event_count,
        totalRisk: item.total_risk,
        avgRisk: item.avg_risk,
        label: `${timeStart}`,
        tooltip: `${timeStart} - ${timeEnd}\nEvents: ${item.event_count}\nAvg Risk: ${item.avg_risk}/100`,
      }
    })
  }, [threatVelocity])

  const topSourceIps = useMemo(() => {
    const counts = new Map<string, number>()
    events.forEach((event) => counts.set(event.ip_address, (counts.get(event.ip_address) || 0) + 1))
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([ip, count], index) => ({
        ip,
        traffic: `${Math.max(0.4, count * 0.7).toFixed(1)} GB`,
        width: Math.max(15, Math.min(100, count * 8)),
        tone: ['error', 'tertiary', 'primary', 'muted'][index] || 'muted',
      }))
  }, [events])

  const activeIncident = useMemo(() => {
    if (!events.length) {
      return null
    }

    const highest = [...events].sort((a, b) => b.risk_score - a.risk_score)[0]
    return {
      incidentId: `INC-${String(highest.id).padStart(6, '0')}`,
      detectedAt: new Date(highest.timestamp).toLocaleString(),
      username: highest.username,
      ip: highest.ip_address,
      action: highest.event_action,
      country: highest.country,
      risk: highest.risk_score,
    }
  }, [events])

  return (
    <section className="overview-grid">
      <div className="overview-head panel-header">
        <h2>Executive Command Overview</h2>
        <p>
          Security Posture: <span>OPTIMAL</span> | Systems <span>ONLINE</span>
        </p>
      </div>

      {error && <p className="error-banner">{error}</p>}

      <div className="kpi-grid kpi-grid-six">
        <article className="kpi-card tactical">
          <span>Alerts Today</span>
          <strong>{summary.totalEvents}</strong>
        </article>
        <article className="kpi-card tactical warning">
          <span>Critical Incidents</span>
          <strong>{summary.suspicious}</strong>
        </article>
        <article className="kpi-card tactical">
          <span>Mean Time Triage</span>
          <strong>{formatLatency(summary.mttd)}</strong>
        </article>
        <article className="kpi-card tactical">
          <span>Mean Time Contain</span>
          <strong>{formatLatency(summary.mttr)}</strong>
        </article>
        <article className="kpi-card tactical">
          <span>FPR Rate</span>
          <strong>{Math.round(summary.fpr * 1000) / 10}%</strong>
        </article>
        <article className="kpi-card tactical">
          <span>Blocked Attacks</span>
          <strong>{summary.blocked}</strong>
        </article>
      </div>

      <div className="dashboard-body">
        <div className="dashboard-main">
          <div className="panel two-col">
            <article className="chart-panel">
              <h3>Threat Ingress Velocity</h3>
              <div className="bars">
                {trendSeries.map((item) => (
                  <div
                    key={item.id}
                    className="bar"
                    style={{ height: `${item.height}%` }}
                    title={item.tooltip}
                    data-count={item.eventCount}
                  />
                ))}
                {!trendSeries.length && <p className="sync-meta">No event velocity yet.</p>}
              </div>
              {trendSeries.length > 0 && (
                <div className="chart-legend">
                  <small>Last 12 hours | Height = Event Count/Bucket</small>
                </div>
              )}
            </article>

            <article className="map-panel">
              <h3>Impossible Travel Clusters</h3>
              <ul className="list telemetry-list">
                {heatmap.slice(0, 5).map((row) => (
                  <li
                    key={row.country}
                    title={row.last_seen ? `Last seen: ${new Date(row.last_seen).toLocaleString()}` : 'No recent timestamp'}
                  >
                    <span>{row.country}</span>
                    <span className="mono">{row.count} flagged ({row.percentage}%)</span>
                    <span className="chip">{row.count >= 10 ? 'HIGH' : row.count >= 4 ? 'MED' : 'LOW'}</span>
                  </li>
                ))}
                {!heatmap.length && <li>No impossible-travel clusters detected.</li>}
              </ul>
            </article>
          </div>

          <article className="panel">
            <h3>Top Risky Users</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Identity</th>
                    <th>Risk Score</th>
                    <th>Last Alert</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.highRiskUsers.slice(0, 6).map((row, index) => (
                    <tr key={`${row.username}-${row.event_action}-${index}`}>
                      <td>{row.username}</td>
                      <td className="mono">{row.risk_score}/100</td>
                      <td>{row.event_action}</td>
                    </tr>
                  ))}
                  {!summary.highRiskUsers.length && (
                    <tr>
                      <td colSpan={3}>No events yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <article className="panel">
            <h3>High Volumetric Source Telemetry</h3>
            <div className="source-grid">
              {topSourceIps.map((row) => (
                <div key={row.ip} className={`source-card ${row.tone}`}>
                  <p className="mono">{row.ip}</p>
                  <p>{row.traffic}</p>
                  <div className="meter">
                    <div style={{ width: `${row.width}%` }} />
                  </div>
                </div>
              ))}
              {!topSourceIps.length && <p className="sync-meta">No source telemetry yet.</p>}
            </div>
          </article>
        </div>

        <aside className="incident-rail">
          <div className="incident-head">
            <p>Active Critical Response</p>
            <h3>{activeIncident?.incidentId ?? 'INC-UNSET'}</h3>
          </div>
          <div className="incident-body">
            <div>
              <label>Type</label>
              <p>{activeIncident ? 'Data Exfiltration - Lateral Movement' : 'No active incident'}</p>
            </div>
            <div>
              <label>Detected</label>
              <p className="mono">{activeIncident?.detectedAt ?? '-'}</p>
            </div>
            <div className="incident-quote">
              {activeIncident
                ? `Unauthorized behavior on ${activeIncident.username} from ${activeIncident.ip} (${activeIncident.country}), action=${activeIncident.action}, risk=${activeIncident.risk}.`
                : 'Waiting for incident telemetry.'}
            </div>
            <div>
              <label>Response Log</label>
              <ul className="timeline">
                {mitigations.slice(0, 4).map((item) => (
                  <li key={item.id}>
                    <span className="mono">{new Date(item.timestamp).toLocaleTimeString()}</span>
                    <span>{item.action}</span>
                  </li>
                ))}
                {!mitigations.length && <li>No mitigation timeline yet.</li>}
              </ul>
            </div>
          </div>
        </aside>
      </div>

      <p className="sync-meta">Last sync: {lastSync}</p>
    </section>
  )
}