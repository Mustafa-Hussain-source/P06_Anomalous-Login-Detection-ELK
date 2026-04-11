import type { InvestigationEdge, InvestigationGraph, InvestigationNode } from '../types'

export type GraphLayoutNode = InvestigationNode & {
  x: number
  y: number
  degree: number
  cumulativeRisk: number
}

export type GraphLayoutModel = {
  nodes: GraphLayoutNode[]
  edges: InvestigationEdge[]
  maxRisk: number
  actionLabels: string[]
  typeCounts: Record<string, number>
}

type BuildGraphLayoutOptions = {
  width: number
  height: number
  minRisk: number
  action: string
}

const MARGIN_Y = 56

function evenY(index: number, total: number, height: number): number {
  if (total <= 1) {
    return height / 2
  }

  const usable = Math.max(80, height - MARGIN_Y * 2)
  const step = usable / (total - 1)
  return MARGIN_Y + index * step
}

function rankByImportance(a: GraphLayoutNode, b: GraphLayoutNode): number {
  if (b.degree !== a.degree) {
    return b.degree - a.degree
  }
  if (b.cumulativeRisk !== a.cumulativeRisk) {
    return b.cumulativeRisk - a.cumulativeRisk
  }
  return a.label.localeCompare(b.label)
}

function applyBipartiteLayout(nodes: GraphLayoutNode[], width: number, height: number): void {
  const userNodes = nodes.filter((node) => node.type === 'user').sort(rankByImportance)
  const ipNodes = nodes.filter((node) => node.type === 'ip').sort(rankByImportance)
  const otherNodes = nodes.filter((node) => node.type !== 'user' && node.type !== 'ip').sort(rankByImportance)

  const leftX = width * 0.22
  const rightX = width * 0.78

  userNodes.forEach((node, index) => {
    node.x = leftX
    node.y = evenY(index, userNodes.length, height)
  })

  ipNodes.forEach((node, index) => {
    node.x = rightX
    node.y = evenY(index, ipNodes.length, height)
  })

  if (otherNodes.length > 0) {
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) * 0.18

    otherNodes.forEach((node, index) => {
      const angle = (Math.PI * 2 * index) / otherNodes.length
      node.x = centerX + Math.cos(angle) * radius
      node.y = centerY + Math.sin(angle) * radius
    })
  }
}

function applyRadialLayout(nodes: GraphLayoutNode[], width: number, height: number): void {
  const centerX = width / 2
  const centerY = height / 2
  const sorted = [...nodes].sort(rankByImportance)
  const ringCount = Math.max(1, Math.ceil(sorted.length / 14))

  sorted.forEach((node, index) => {
    const ringIndex = index % ringCount
    const slot = Math.floor(index / ringCount)
    const slotsInRing = Math.ceil((sorted.length - ringIndex) / ringCount)
    const angle = (Math.PI * 2 * slot) / Math.max(1, slotsInRing)
    const radius = 110 + ringIndex * 90
    node.x = centerX + Math.cos(angle) * radius
    node.y = centerY + Math.sin(angle) * radius
  })
}

export function buildGraphLayout(
  graph: InvestigationGraph,
  options: BuildGraphLayoutOptions,
): GraphLayoutModel {
  const { width, height, minRisk, action } = options
  const filteredEdges = graph.edges.filter((edge) => edge.risk_score >= minRisk && (action === 'all' || edge.label === action))

  const nodeById = new Map<string, GraphLayoutNode>()
  graph.nodes.forEach((node) => {
    nodeById.set(node.id, {
      ...node,
      x: width / 2,
      y: height / 2,
      degree: 0,
      cumulativeRisk: 0,
    })
  })

  filteredEdges.forEach((edge) => {
    const source = nodeById.get(edge.source)
    const target = nodeById.get(edge.target)
    if (!source || !target) {
      return
    }

    source.degree += 1
    target.degree += 1
    source.cumulativeRisk += edge.risk_score
    target.cumulativeRisk += edge.risk_score
  })

  const connectedNodeIds = new Set<string>()
  filteredEdges.forEach((edge) => {
    connectedNodeIds.add(edge.source)
    connectedNodeIds.add(edge.target)
  })

  const nodes = Array.from(nodeById.values()).filter((node) => connectedNodeIds.has(node.id))

  const hasUserAndIp = nodes.some((node) => node.type === 'user') && nodes.some((node) => node.type === 'ip')
  if (hasUserAndIp) {
    applyBipartiteLayout(nodes, width, height)
  } else {
    applyRadialLayout(nodes, width, height)
  }

  const allActions = Array.from(new Set(graph.edges.map((edge) => edge.label))).sort((a, b) => a.localeCompare(b))
  const maxRisk = filteredEdges.reduce((max, edge) => Math.max(max, edge.risk_score), 0)
  const typeCounts = nodes.reduce<Record<string, number>>((acc, node) => {
    acc[node.type] = (acc[node.type] || 0) + 1
    return acc
  }, {})

  return {
    nodes,
    edges: filteredEdges,
    maxRisk,
    actionLabels: allActions,
    typeCounts,
  }
}

export function nodeColor(nodeType: string): string {
  if (nodeType === 'user') {
    return '#2dd4bf'
  }
  if (nodeType === 'ip') {
    return '#0ea5e9'
  }
  if (nodeType === 'device') {
    return '#f59e0b'
  }
  return '#edf5ff'
}

export function edgeColor(riskScore: number): string {
  if (riskScore >= 80) {
    return '#fca5a5'
  }
  if (riskScore >= 55) {
    return '#f59e0b'
  }
  return '#2dd4bf'
}
