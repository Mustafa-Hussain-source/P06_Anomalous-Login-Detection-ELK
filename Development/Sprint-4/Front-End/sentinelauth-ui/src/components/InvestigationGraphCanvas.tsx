import { useMemo, useState } from 'react'
import type { InvestigationEdge, InvestigationGraph } from '../types'
import { buildGraphLayout, edgeColor, nodeColor } from '../lib/investigationGraph'

type InvestigationGraphCanvasProps = {
  graph: InvestigationGraph
}

const GRAPH_WIDTH = 1080
const GRAPH_HEIGHT = 560
const MALICIOUS_RISK_FLOOR = 55

function connectionPath(sourceX: number, sourceY: number, targetX: number, targetY: number): string {
  const midpointX = (sourceX + targetX) / 2
  const bend = Math.max(26, Math.abs(sourceX - targetX) * 0.12)
  return `M ${sourceX} ${sourceY} C ${midpointX - bend} ${sourceY}, ${midpointX + bend} ${targetY}, ${targetX} ${targetY}`
}

function formatTimestamp(value: string): string {
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) {
    return value
  }
  return new Date(parsed).toLocaleString()
}

function riskLevel(score: number): 'low' | 'medium' | 'high' {
  if (score >= 80) {
    return 'high'
  }
  if (score >= 55) {
    return 'medium'
  }
  return 'low'
}

export function InvestigationGraphCanvas({ graph }: InvestigationGraphCanvasProps) {
  const [minRisk, setMinRisk] = useState(MALICIOUS_RISK_FLOOR)
  const [actionFilter, setActionFilter] = useState('all')
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)

  const model = useMemo(
    () => buildGraphLayout(graph, { width: GRAPH_WIDTH, height: GRAPH_HEIGHT, minRisk, action: actionFilter }),
    [graph, minRisk, actionFilter],
  )

  const nodeById = useMemo(() => new Map(model.nodes.map((node) => [node.id, node])), [model.nodes])

  const neighborNodeIds = useMemo(() => {
    if (!selectedNodeId) {
      return new Set<string>()
    }

    const neighbors = new Set<string>([selectedNodeId])
    model.edges.forEach((edge) => {
      if (edge.source === selectedNodeId) {
        neighbors.add(edge.target)
      } else if (edge.target === selectedNodeId) {
        neighbors.add(edge.source)
      }
    })
    return neighbors
  }, [model.edges, selectedNodeId])

  const selectedNode = selectedNodeId ? nodeById.get(selectedNodeId) || null : null
  const selectedEdge: InvestigationEdge | null = selectedEdgeId
    ? model.edges.find((edge) => edge.id === selectedEdgeId) || null
    : null

  const visibleEdgeCount = model.edges.length
  const selectedNodeConnections = selectedNode
    ? model.edges.filter((edge) => edge.source === selectedNode.id || edge.target === selectedNode.id).length
    : 0

  const highlightedNodeCount = neighborNodeIds.size

  return (
    <div className="graph-page-stack">
      <article className="panel graph-control-panel">
        <div className="graph-controls-head">
          <h3>Graph Controls</h3>
          <span className="chip">{visibleEdgeCount} edges visible</span>
        </div>

        <div className="graph-controls-row">
          <label>
            Minimum Risk
            <input
              type="range"
              min={MALICIOUS_RISK_FLOOR}
              max={100}
              step={5}
              value={minRisk}
              onChange={(event) => setMinRisk(Number(event.target.value))}
            />
          </label>

          <label>
            Action
            <select value={actionFilter} onChange={(event) => setActionFilter(event.target.value)}>
              <option value="all">All actions</option>
              {model.actionLabels.map((action) => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => {
              setMinRisk(MALICIOUS_RISK_FLOOR)
              setActionFilter('all')
              setSelectedNodeId(null)
              setSelectedEdgeId(null)
            }}
          >
            Reset View
          </button>
        </div>
      </article>

      <div className="graph-layout">
        <article className="panel graph-canvas-panel">
          <h3>Entity Relationship Map</h3>
          <svg className="investigation-graph" viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`} role="img" aria-label="Investigation graph">
            <defs>
              <pattern id="graph-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(120, 148, 175, 0.13)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect x="0" y="0" width={GRAPH_WIDTH} height={GRAPH_HEIGHT} fill="url(#graph-grid)" />

            {model.edges.map((edge) => {
              const source = nodeById.get(edge.source)
              const target = nodeById.get(edge.target)
              if (!source || !target) {
                return null
              }

              const isSelected = edge.id === selectedEdgeId
              const isNeighborFocus = selectedNodeId ? edge.source === selectedNodeId || edge.target === selectedNodeId : true
              return (
                <path
                  key={edge.id}
                  d={connectionPath(source.x, source.y, target.x, target.y)}
                  className="graph-edge"
                  stroke={edgeColor(edge.risk_score)}
                  strokeWidth={isSelected ? 3 : 1 + edge.risk_score / 40}
                  opacity={isNeighborFocus ? 0.72 : 0.16}
                  onClick={() => {
                    setSelectedEdgeId(edge.id)
                    setSelectedNodeId(null)
                  }}
                />
              )
            })}

            {model.nodes.map((node) => {
              const isNodeSelected = selectedNodeId === node.id
              const isInFocus = selectedNodeId ? neighborNodeIds.has(node.id) : true
              const radius = 6 + Math.min(7, node.degree)
              return (
                <g key={node.id} className="graph-node" onClick={() => {
                  setSelectedNodeId(node.id)
                  setSelectedEdgeId(null)
                }}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isNodeSelected ? radius + 2.5 : radius}
                    fill={nodeColor(node.type)}
                    opacity={isInFocus ? 0.92 : 0.22}
                    stroke={isNodeSelected ? '#ffffff' : 'rgba(8, 16, 27, 0.7)'}
                    strokeWidth={isNodeSelected ? 2.2 : 1.2}
                  />
                  <text
                    x={node.x + radius + 6}
                    y={node.y + 4}
                    className="graph-node-label"
                    opacity={isInFocus ? 1 : 0.25}
                  >
                    {node.label}
                  </text>
                </g>
              )
            })}
          </svg>
        </article>

        <aside className="panel graph-inspector-panel">
          <h3>Inspector</h3>
          <div className="graph-inspector-block">
            <label>Visible nodes</label>
            <p>{model.nodes.length}</p>
          </div>
          <div className="graph-inspector-block">
            <label>Visible edges</label>
            <p>{model.edges.length}</p>
          </div>
          <div className="graph-inspector-block">
            <label>Highest visible risk</label>
            <p>{model.maxRisk.toFixed(1)}</p>
          </div>
          <div className="graph-inspector-block">
            <label>Node types</label>
            <div className="graph-type-list">
              {Object.entries(model.typeCounts).map(([type, count]) => (
                <span key={type} className="chip">{type}: {count}</span>
              ))}
            </div>
          </div>

          {selectedNode && (
            <div className="graph-inspector-focus">
              <h4>Node Focus</h4>
              <p><strong>{selectedNode.label}</strong></p>
              <p>Type: {selectedNode.type}</p>
              <p>Connections: {selectedNodeConnections}</p>
              <p>Cumulative Risk: {selectedNode.cumulativeRisk.toFixed(1)}</p>
              <p>Neighborhood: {highlightedNodeCount} nodes</p>
            </div>
          )}

          {selectedEdge && (
            <div className="graph-inspector-focus">
              <h4>Edge Focus</h4>
              <p><strong>{selectedEdge.label}</strong></p>
              <p>{selectedEdge.source} {'->'} {selectedEdge.target}</p>
              <p>Risk: {selectedEdge.risk_score.toFixed(1)} ({riskLevel(selectedEdge.risk_score)})</p>
              <p>{formatTimestamp(selectedEdge.timestamp)}</p>
            </div>
          )}

          {!selectedNode && !selectedEdge && (
            <p className="sync-meta">Select a node or edge to inspect relationships and risk context.</p>
          )}
        </aside>
      </div>
    </div>
  )
}
