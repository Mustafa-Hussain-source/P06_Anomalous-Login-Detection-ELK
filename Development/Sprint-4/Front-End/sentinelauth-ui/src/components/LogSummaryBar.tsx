type SummaryItem = {
  label: string
  value: string
}

type LogSummaryBarProps = {
  title: string
  insight: string
  items: SummaryItem[]
  onExportPdf: () => void
  exporting?: boolean
}

export function LogSummaryBar({ title, insight, items, onExportPdf, exporting = false }: LogSummaryBarProps) {
  return (
    <div className="log-summary-bar">
      <div className="log-summary-head">
        <h3>{title}</h3>
        <p>{insight}</p>
      </div>

      <div className="log-summary-metrics">
        {items.map((item) => (
          <div key={item.label} className="log-metric-chip">
            <span>{item.label}</span>
            <strong title={item.value}>{item.value}</strong>
          </div>
        ))}
      </div>

      <div className="log-summary-actions">
        <button type="button" onClick={onExportPdf} disabled={exporting}>
          {exporting ? 'Exporting...' : 'Export PDF'}
        </button>
      </div>
    </div>
  )
}
