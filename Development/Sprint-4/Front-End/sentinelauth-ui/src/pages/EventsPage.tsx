import { useMemo, useState } from 'react'
import { api } from '../lib/api'
import { usePolling } from '../hooks/usePolling'
import { LogSummaryBar } from '../components/LogSummaryBar'
import { exportLogsPdf } from '../utils/pdfExport'
import type { LoginEvent } from '../types'

type EventFilter = 'all' | 'suspicious' | 'high_risk' | 'blocked' | 'failures'

export function EventsPage() {
  const [events, setEvents] = useState<LoginEvent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<string>('Never')
  const [exporting, setExporting] = useState(false)
  const [eventFilter, setEventFilter] = useState<EventFilter>('all')

  const refresh = async () => {
    try {
      const rows = await api.getEvents(100)
      setEvents(rows)
      setLastSync(new Date().toLocaleTimeString())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events')
    }
  }

  const syncLogsNow = async () => {
    setSyncing(true)
    await refresh()
    setSyncing(false)
  }

  usePolling(refresh, 4000)

  const eventMatchesFilter = (event: LoginEvent) => {
    if (eventFilter === 'suspicious') {
      return event.is_suspicious
    }
    if (eventFilter === 'high_risk') {
      return event.risk_score >= 80
    }
    if (eventFilter === 'blocked') {
      return /block|restricted|lock|revoke/i.test(event.event_action)
    }
    if (eventFilter === 'failures') {
      return /failure|invalid|mfa_challenge|required/i.test(event.event_action)
    }
    return true
  }

  const filteredEvents = useMemo(() => events.filter((event) => eventMatchesFilter(event)), [events, eventFilter])

  const eventSummary = useMemo(() => {
    const suspicious = filteredEvents.filter((event) => event.is_suspicious).length
    const highRisk = filteredEvents.filter((event) => event.risk_score >= 80).length
    const countryCount = new Map<string, number>()
    filteredEvents.forEach((event) => {
      countryCount.set(event.country, (countryCount.get(event.country) || 0) + 1)
    })
    const topCountry = [...countryCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

    return {
      suspicious,
      highRisk,
      topCountry,
      insight:
        suspicious > 0
          ? `${suspicious} suspicious events detected. Prioritize high-risk users and blocked actions.`
          : 'No suspicious events in current feed. Continue monitoring for anomalies.',
    }
  }, [filteredEvents])

  const exportPdf = () => {
    setExporting(true)
    exportLogsPdf({
      title: 'Events Log Summary',
      subtitle: 'Latest login events from backend decisioning.',
      generatedAt: new Date().toLocaleString(),
      summary: [
        { label: 'Total Logs', value: String(filteredEvents.length) },
        { label: 'Suspicious', value: String(eventSummary.suspicious) },
        { label: 'High Risk (>=80)', value: String(eventSummary.highRisk) },
        { label: 'Top Country', value: eventSummary.topCountry },
      ],
      columns: ['Time', 'User', 'Action', 'Risk', 'Country', 'IP'],
      rows: filteredEvents.map((event) => [
        new Date(event.timestamp).toLocaleString(),
        event.username,
        event.event_action,
        String(event.risk_score),
        event.country,
        event.ip_address,
      ]),
      fileName: 'sentinelauth-events-log-summary.pdf',
    })
    setExporting(false)
  }

  return (
    <section>
      <div className="panel-header panel-header-row">
        <div>
          <h2>Live Events</h2>
          <p>Latest login events from backend decisioning.</p>
        </div>
        <div className="panel-header-actions">
          <button type="button" onClick={syncLogsNow} disabled={syncing}>
            {syncing ? 'Syncing...' : 'Sync Logs'}
          </button>
        </div>
      </div>

      <p className="sync-meta">Last synced: {lastSync}</p>

      <article className="panel seed-filter-panel">
        <div className="seed-filter-group">
          <span className="sync-meta">Event filter</span>
          <div className="button-row">
            <button className={eventFilter === 'all' ? 'seed-filter-active' : ''} onClick={() => setEventFilter('all')}>All</button>
            <button className={eventFilter === 'suspicious' ? 'seed-filter-active' : ''} onClick={() => setEventFilter('suspicious')}>Suspicious</button>
            <button className={eventFilter === 'high_risk' ? 'seed-filter-active' : ''} onClick={() => setEventFilter('high_risk')}>High Risk</button>
            <button className={eventFilter === 'blocked' ? 'seed-filter-active' : ''} onClick={() => setEventFilter('blocked')}>Blocked</button>
            <button className={eventFilter === 'failures' ? 'seed-filter-active' : ''} onClick={() => setEventFilter('failures')}>Failures</button>
          </div>
        </div>
      </article>

      <LogSummaryBar
        title="Events Snapshot"
        insight={eventSummary.insight}
        items={[
          { label: 'Total Logs', value: String(filteredEvents.length) },
          { label: 'Suspicious', value: String(eventSummary.suspicious) },
          { label: 'High Risk', value: String(eventSummary.highRisk) },
          { label: 'Top Country', value: eventSummary.topCountry },
        ]}
        onExportPdf={exportPdf}
        exporting={exporting}
      />

      {error && <p className="error-banner">{error}</p>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>User</th>
              <th>Action</th>
              <th>Risk</th>
              <th>Country</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.map((event) => (
              <tr key={event.id}>
                <td>{new Date(event.timestamp).toLocaleString()}</td>
                <td>{event.username}</td>
                <td>{event.event_action}</td>
                <td>{event.risk_score}</td>
                <td>{event.country}</td>
                <td>{event.ip_address}</td>
              </tr>
            ))}
            {!filteredEvents.length && (
              <tr>
                <td colSpan={6}>No events loaded yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
