import { useState } from 'react'
import { usePolling } from '../hooks/usePolling'
import { api } from '../lib/api'
import type { WeeklyReport } from '../types'

export function ReportsPage() {
  const [report, setReport] = useState<WeeklyReport | null>(null)
  const [status, setStatus] = useState('')

  usePolling(async () => {
    try {
      const rows = await api.weeklyReport()
      setReport(rows)
    } catch {
      setStatus('Weekly report fetch failed.')
    }
  }, 7000)

  const exportPayload = async () => {
    const payload = await api.reportExport(100)
    setStatus(`Export payload fetched: events=${payload.events.length} mitigations=${payload.mitigations.length}`)
  }

  return (
    <section>
      <div className="panel-header">
        <h2>Weekly Report Builder</h2>
        <p>Operational report summary and export controls.</p>
      </div>

      <article className="panel">
        <button onClick={exportPayload}>Fetch Export Snapshot</button>
        <span className="sync-meta">{status}</span>
      </article>

      {report && (
        <div className="two-col">
          <article className="panel">
            <h3>Summary</h3>
            <ul className="list">
              <li><span>Generated</span><span>{new Date(report.generated_at).toLocaleString()}</span><span /></li>
              <li><span>Events Total</span><span>{report.events_total}</span><span /></li>
              <li><span>Mitigations Total</span><span>{report.mitigations_total}</span><span /></li>
            </ul>
          </article>

          <article className="panel">
            <h3>Events by Action</h3>
            <ul className="list">
              {Object.entries(report.events_by_action).map(([key, value]) => (
                <li key={key}><span>{key}</span><span>{value}</span><span /></li>
              ))}
            </ul>
          </article>
        </div>
      )}
    </section>
  )
}
