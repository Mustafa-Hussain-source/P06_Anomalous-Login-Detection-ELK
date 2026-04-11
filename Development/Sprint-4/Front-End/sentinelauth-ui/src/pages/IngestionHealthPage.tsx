import { useState } from 'react'
import { usePolling } from '../hooks/usePolling'
import { api } from '../lib/api'
import type { IngestionHealth } from '../types'

export function IngestionHealthPage() {
  const [health, setHealth] = useState<IngestionHealth | null>(null)

  usePolling(async () => {
    const payload = await api.ingestionHealth()
    setHealth(payload)
  }, 5000)

  return (
    <section>
      <div className="panel-header">
        <h2>Event Ingestion Health</h2>
        <p>Pipeline and indexing health from backend service checks.</p>
      </div>

      {health ? (
        <div className="kpi-grid">
          <article className="kpi-card"><span>Status</span><strong>{health.status}</strong></article>
          <article className="kpi-card"><span>Pipeline</span><strong>{health.pipeline}</strong></article>
          <article className="kpi-card"><span>Events</span><strong>{health.event_count}</strong></article>
          <article className="kpi-card"><span>Mitigations</span><strong>{health.mitigation_count}</strong></article>
          <article className="kpi-card"><span>Restrictions</span><strong>{health.restriction_count}</strong></article>
          <article className="kpi-card"><span>Last Checked</span><strong>{new Date(health.last_checked).toLocaleTimeString()}</strong></article>
        </div>
      ) : (
        <p className="sync-meta">Loading ingestion health...</p>
      )}
    </section>
  )
}
