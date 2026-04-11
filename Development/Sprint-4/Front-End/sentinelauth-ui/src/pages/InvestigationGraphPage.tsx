import { useState } from 'react'
import { usePolling } from '../hooks/usePolling'
import { api } from '../lib/api'
import { InvestigationGraphCanvas } from '../components/InvestigationGraphCanvas'
import type { InvestigationGraph } from '../types'

export function InvestigationGraphPage() {
  const [graph, setGraph] = useState<InvestigationGraph>({ nodes: [], edges: [] })
  const [status, setStatus] = useState('')

  usePolling(async () => {
    try {
      const payload = await api.investigationGraph(250)
      setGraph(payload)
    } catch {
      setStatus('Investigation graph fetch failed.')
    }
  }, 7000)

  return (
    <section>
      <div className="panel-header">
        <h2>Investigation Graph View</h2>
        <p>Entity and relationship graph derived from live events.</p>
      </div>

      <div className="kpi-grid">
        <article className="kpi-card"><span>Nodes</span><strong>{graph.nodes.length}</strong></article>
        <article className="kpi-card"><span>Edges</span><strong>{graph.edges.length}</strong></article>
      </div>

      <InvestigationGraphCanvas graph={graph} />

      <p className="sync-meta">{status}</p>

      <div className="table-wrap graph-table-wrap">
        <h3>Relationship Ledger</h3>
        <table>
          <thead>
            <tr>
              <th>Source</th>
              <th>Target</th>
              <th>Label</th>
              <th>Risk</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {graph.edges.slice(0, 120).map((edge) => (
              <tr key={edge.id}>
                <td>{edge.source}</td>
                <td>{edge.target}</td>
                <td>{edge.label}</td>
                <td>{edge.risk_score}</td>
                <td>{new Date(edge.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
