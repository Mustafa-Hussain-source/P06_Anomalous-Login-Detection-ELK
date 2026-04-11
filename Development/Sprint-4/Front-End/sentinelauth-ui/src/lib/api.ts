import type {
  AccessRestrictionItem,
  AuthLoginRequest,
  AuthLoginResponse,
  AuthUserCreateRequest,
  ContainmentTicket,
  DetectionRule,
  EnrichedEvent,
  EvidenceRecord,
  IncidentCase,
  IngestionHealth,
  InvestigationGraph,
  KpiMetrics,
  LoginEvent,
  LoginRequest,
  LoginResponse,
  Mitigation,
  SeedUserCreateRequest,
  SeedUserUpdateRequest,
  SeedDatabasePreview,
  SecurityPolicy,
  WeeklyReport,
} from '../types'

const DEFAULT_API_BASE = 'http://localhost:8000'
const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) || DEFAULT_API_BASE

class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 12000)

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
      signal: controller.signal,
    })

    const bodyText = await response.text()
    const parsed = bodyText ? (JSON.parse(bodyText) as unknown) : null

    if (!response.ok) {
      const detail = typeof parsed === 'object' && parsed && 'detail' in parsed
        ? String((parsed as { detail?: unknown }).detail)
        : `Request failed with status ${response.status}`
      throw new ApiError(detail, response.status)
    }

    return parsed as T
  } finally {
    window.clearTimeout(timeout)
  }
}

export const api = {
  baseUrl: API_BASE,
  authLogin(payload: AuthLoginRequest) {
    return fetchJson<AuthLoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  createAuthUser(payload: AuthUserCreateRequest) {
    return fetchJson<{ id: number; username: string; display_name: string }>('/auth/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  listAuthUsers() {
    return fetchJson<Array<{ id: number; username: string }>>('/auth/users')
  },
  getEvents(limit = 50) {
    return fetchJson<LoginEvent[]>(`/events?limit=${limit}`)
  },
  getEnrichedEvents(limit = 50) {
    return fetchJson<EnrichedEvent[]>(`/events/enriched?limit=${limit}`)
  },
  updateEventTriage(eventId: number, payload: { status: string; analyst: string; severity: string; notes: string }) {
    return fetchJson<{ status: string }>(`/events/${eventId}/triage`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  getMitigations(limit = 50) {
    return fetchJson<Mitigation[]>(`/mitigations?limit=${limit}`)
  },
  getKpi() {
    return fetchJson<KpiMetrics>('/analytics/kpi')
  },
  getThreatHeatmap() {
    return fetchJson<Array<{ country: string; count: number; percentage: number; last_seen: string | null }>>('/analytics/threat-heatmap')
  },
  getThreatVelocity(hours = 12, buckets = 12) {
    return fetchJson<Array<{ bucket: number; start_time: string; end_time: string; event_count: number; total_risk: number; avg_risk: number }>>(`/analytics/threat-velocity?hours=${hours}&buckets=${buckets}`)
  },
  getRiskyUsers(limit = 10) {
    return fetchJson<Array<{ username: string; risk_score: number; event_action: string; timestamp: string }>>(`/analytics/risky-users?limit=${limit}`)
  },
  getEvidence(limit = 50) {
    return fetchJson<EvidenceRecord[]>(`/sprint4/evidence?limit=${limit}`)
  },
  listCases(limit = 100) {
    return fetchJson<IncidentCase[]>(`/cases?limit=${limit}`)
  },
  createCase(payload: {
    title: string
    status?: string
    priority?: string
    owner?: string
    summary?: string
    event_ids?: number[]
  }) {
    return fetchJson<{ id: number }>('/cases', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  patchCase(caseId: number, payload: { status?: string; priority?: string; owner?: string; summary?: string }) {
    return fetchJson<{ id: number }>(`/cases/${caseId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },
  listDetectionRules() {
    return fetchJson<DetectionRule[]>('/detection-rules')
  },
  patchDetectionRule(ruleId: number, payload: { threshold?: number; enabled?: boolean; confidence?: number; false_positive_rate?: number }) {
    return fetchJson<{ id: number }>(`/detection-rules/${ruleId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },
  backtestDetectionRule(ruleId: number, days = 30) {
    return fetchJson<{ events_evaluated: number; hits: number; hit_rate: number }>(`/detection-rules/${ruleId}/backtest?days=${days}`)
  },
  listPolicies() {
    return fetchJson<SecurityPolicy[]>('/policies')
  },
  patchPolicy(policyId: number, value: string) {
    return fetchJson<{ id: number }>(`/policies/${policyId}`, {
      method: 'PATCH',
      body: JSON.stringify({ value }),
    })
  },
  listTickets(limit = 100) {
    return fetchJson<ContainmentTicket[]>(`/containment/tickets?limit=${limit}`)
  },
  createTicket(payload: { entity: string; severity: string; summary: string; source?: string }) {
    return fetchJson<{ id: number }>('/containment/tickets', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  patchTicket(ticketId: number, status: string) {
    return fetchJson<{ id: number }>(`/containment/tickets/${ticketId}?status=${encodeURIComponent(status)}`, {
      method: 'PATCH',
    })
  },
  listAccessRestrictions() {
    return fetchJson<AccessRestrictionItem[]>('/access-restrictions')
  },
  createAccessRestriction(payload: {
    target_type: string
    target_value: string
    reason: string
    expires_at: string
  }) {
    return fetchJson<{ id: number }>('/access-restrictions', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  deactivateAccessRestriction(id: number) {
    return fetchJson<{ id: number }>(`/access-restrictions/${id}`, { method: 'DELETE' })
  },
  weeklyReport() {
    return fetchJson<WeeklyReport>('/reports/weekly')
  },
  reportExport(limit = 100) {
    return fetchJson<{ events: LoginEvent[]; mitigations: Mitigation[] }>(`/reports/export?limit=${limit}`)
  },
  investigationGraph(limit = 200) {
    return fetchJson<InvestigationGraph>(`/investigation/graph?limit=${limit}`)
  },
  ingestionHealth() {
    return fetchJson<IngestionHealth>('/ingestion/health')
  },
  clearEvents(seed = true) {
    return fetchJson<{ status: string; seeded: boolean }>(`/events/clear?seed=${seed}`, {
      method: 'POST',
    })
  },
  startTraffic() {
    return fetchJson<{ status: string }>('/traffic/start', { method: 'POST' })
  },
  stopTraffic() {
    return fetchJson<{ status: string }>('/traffic/stop', { method: 'POST' })
  },
  trafficStatus() {
    return fetchJson<{ status: string; running: boolean }>('/traffic/status')
  },
  triggerSimulation(uc: string) {
    return fetchJson<{ status: string; uc: string }>(`/simulate/${uc}`, { method: 'POST' })
  },
  seedDatabasePreview(usersLimit = 80, eventsLimit = 120) {
    return fetchJson<SeedDatabasePreview>(`/seed/database-preview?users_limit=${usersLimit}&events_limit=${eventsLimit}`)
  },
  listSeedUsers(limit = 200) {
    return fetchJson<Array<{ id: number; username: string; is_locked: boolean; mfa_required: boolean }>>(`/seed/users?limit=${limit}`)
  },
  createSeedUser(payload: SeedUserCreateRequest) {
    return fetchJson<{ id: number; username: string; is_locked: boolean; mfa_required: boolean }>('/seed/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  updateSeedUser(userId: number, payload: SeedUserUpdateRequest) {
    return fetchJson<{ id: number; username: string; is_locked: boolean; mfa_required: boolean }>(`/seed/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },
  deleteSeedUser(userId: number) {
    return fetchJson<{ id: number; status: string }>(`/seed/users/${userId}`, {
      method: 'DELETE',
    })
  },
  login(payload: LoginRequest) {
    return fetchJson<LoginResponse>('/login', {
      method: 'POST',
      body: JSON.stringify({
        user_agent: 'sentinelauth-ui',
        ...payload,
      }),
    })
  },
}

export { ApiError }
