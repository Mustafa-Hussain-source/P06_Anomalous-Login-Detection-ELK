import { useMemo, useState } from 'react'
import { api } from '../lib/api'
import { usePolling } from '../hooks/usePolling'
import { LogSummaryBar } from '../components/LogSummaryBar'
import { exportLogsPdf } from '../utils/pdfExport'
import type { Mitigation } from '../types'

export function MitigationsPage() {
  const [items, setItems] = useState<Mitigation[]>([])
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const refresh = async () => {
    try {
      const rows = await api.getMitigations(100)
      setItems(rows)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch mitigations')
    }
  }

  usePolling(refresh, 4000)

  const mitigationSummary = useMemo(() => {
    const statusCount = new Map<string, number>()
    const actionCount = new Map<string, number>()

    items.forEach((item) => {
      statusCount.set(item.status, (statusCount.get(item.status) || 0) + 1)
      actionCount.set(item.action, (actionCount.get(item.action) || 0) + 1)
    })

    const topStatus = [...statusCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
    const topAction = [...actionCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
    const success = items.filter((item) => item.status.toLowerCase().includes('success') || item.status.toLowerCase().includes('applied') || item.status.toLowerCase().includes('closed')).length
    const successRate = items.length ? Math.round((success / items.length) * 100) : 0

    return {
      topStatus,
      topAction,
      successRate,
      insight:
        items.length > 0
          ? `${successRate}% of mitigation actions ended in successful/applied states.`
          : 'No mitigation actions yet. Trigger containment workflows to build this log.',
    }
  }, [items])

  const exportPdf = () => {
    setExporting(true)
    exportLogsPdf({
      title: 'Mitigation Log Summary',
      subtitle: 'Audit-ready feed of automated response actions.',
      generatedAt: new Date().toLocaleString(),
      summary: [
        { label: 'Total Actions', value: String(items.length) },
        { label: 'Success Rate', value: `${mitigationSummary.successRate}%` },
        { label: 'Top Status', value: mitigationSummary.topStatus },
        { label: 'Top Action', value: mitigationSummary.topAction },
      ],
      columns: ['Time', 'UC', 'Target', 'Action', 'Status'],
      rows: items.map((item) => [
        new Date(item.timestamp).toLocaleString(),
        item.uc_id,
        item.target_identifier,
        item.action,
        item.status,
      ]),
      fileName: 'sentinelauth-mitigations-summary.pdf',
    })
    setExporting(false)
  }

  return (
    <section>
      <div className="panel-header">
        <h2>Mitigation Controller</h2>
        <p>Audit-ready feed of all automated response actions.</p>
      </div>

      <LogSummaryBar
        title="Mitigation Snapshot"
        insight={mitigationSummary.insight}
        items={[
          { label: 'Total Actions', value: String(items.length) },
          { label: 'Success Rate', value: `${mitigationSummary.successRate}%` },
          { label: 'Top Status', value: mitigationSummary.topStatus },
          { label: 'Top Action', value: mitigationSummary.topAction },
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
              <th>UC</th>
              <th>Target</th>
              <th>Action</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{new Date(item.timestamp).toLocaleString()}</td>
                <td>{item.uc_id}</td>
                <td>{item.target_identifier}</td>
                <td>{item.action}</td>
                <td>{item.status}</td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td colSpan={5}>No mitigations loaded yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
