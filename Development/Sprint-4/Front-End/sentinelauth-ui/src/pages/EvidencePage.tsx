import { useMemo, useState } from 'react'
import { api } from '../lib/api'
import { usePolling } from '../hooks/usePolling'
import { LogSummaryBar } from '../components/LogSummaryBar'
import { exportLogsPdf } from '../utils/pdfExport'
import type { EvidenceRecord } from '../types'

export function EvidencePage() {
  const [records, setRecords] = useState<EvidenceRecord[]>([])
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const refresh = async () => {
    try {
      const rows = await api.getEvidence(100)
      setRecords(rows)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch evidence')
    }
  }

  usePolling(refresh, 5000)

  const evidenceSummary = useMemo(() => {
    const ucCount = new Map<string, number>()
    const failed = records.filter((row) => String(row.status ?? '').toLowerCase().includes('fail') || String(row.status ?? '').toLowerCase().includes('error')).length

    records.forEach((row) => {
      const uc = String(row.uc_id ?? 'N/A')
      ucCount.set(uc, (ucCount.get(uc) || 0) + 1)
    })

    const topUc = [...ucCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
    const coverage = records.filter((row) => row.action || row.event).length

    return {
      topUc,
      failed,
      coverage,
      insight:
        records.length > 0
          ? `${coverage}/${records.length} records include actionable evidence fields (event/action).`
          : 'No evidence records available. Run detections or simulations to populate the vault.',
    }
  }, [records])

  const exportPdf = () => {
    setExporting(true)
    exportLogsPdf({
      title: 'Evidence Vault Summary',
      subtitle: 'Runtime evidence and fallback forensic records.',
      generatedAt: new Date().toLocaleString(),
      summary: [
        { label: 'Total Records', value: String(records.length) },
        { label: 'Top UC', value: evidenceSummary.topUc },
        { label: 'Failures', value: String(evidenceSummary.failed) },
        { label: 'Actionable Records', value: String(evidenceSummary.coverage) },
      ],
      columns: ['Time', 'UC', 'Event', 'Action', 'Status'],
      rows: records.map((row) => [
        row.timestamp ? new Date(String(row.timestamp)).toLocaleString() : '-',
        String(row.uc_id ?? '-'),
        String(row.event ?? '-'),
        String(row.action ?? '-'),
        String(row.status ?? '-'),
      ]),
      fileName: 'sentinelauth-evidence-vault-summary.pdf',
    })
    setExporting(false)
  }

  return (
    <section>
      <div className="panel-header">
        <h2>Evidence Vault</h2>
        <p>Sprint-4 runtime evidence and fallback records.</p>
      </div>

      <LogSummaryBar
        title="Evidence Snapshot"
        insight={evidenceSummary.insight}
        items={[
          { label: 'Total Records', value: String(records.length) },
          { label: 'Top UC', value: evidenceSummary.topUc },
          { label: 'Failures', value: String(evidenceSummary.failed) },
          { label: 'Actionable', value: String(evidenceSummary.coverage) },
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
              <th>Event</th>
              <th>Action</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map((row, index) => (
              <tr key={`${row.timestamp || 'na'}-${index}`}>
                <td>{row.timestamp ? new Date(String(row.timestamp)).toLocaleString() : '-'}</td>
                <td>{String(row.uc_id ?? '-')}</td>
                <td>{String(row.event ?? '-')}</td>
                <td>{String(row.action ?? '-')}</td>
                <td>{String(row.status ?? '-')}</td>
              </tr>
            ))}
            {!records.length && (
              <tr>
                <td colSpan={5}>No evidence loaded yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
