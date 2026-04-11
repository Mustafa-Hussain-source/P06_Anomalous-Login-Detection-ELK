export interface LoginEvent {
  id: number
  username: string
  ip_address: string
  user_agent: string
  country: string
  is_suspicious: boolean
  risk_score: number
  event_action: string
  device_fingerprint: string | null
  latitude: number | null
  longitude: number | null
  impossible_travel: boolean
  timestamp: string
}

export interface Mitigation {
  id: number
  uc_id: string
  target_identifier: string
  action: string
  status: string
  timestamp: string
}

export interface EvidenceRecord {
  uc_id?: string
  event?: string
  action?: string
  status?: string
  timestamp?: string
  details?: Record<string, unknown>
  [key: string]: unknown
}

export interface LoginRequest {
  username: string
  password: string
  user_agent?: string
  device_fingerprint?: string | null
  latitude?: number | null
  longitude?: number | null
  is_admin_console?: boolean
  api_key_id?: string | null
  api_key_compromised?: boolean
  containment_entity?: string | null
}

export interface LoginResponse {
  success: boolean
  message: string
}

export interface AuthLoginRequest {
  username: string
  password: string
}

export interface AuthUserCreateRequest {
  username: string
  password: string
  display_name?: string
}

export interface AuthLoginResponse {
  success: boolean
  username: string
  display_name: string
  message: string
}

export interface KpiMetrics {
  total_events: number
  suspicious_events: number
  blocked_events: number
  mitigations: number
  avg_risk: number
  mttd_seconds: number
  mttr_seconds: number
  false_positive_rate: number
}

export interface EnrichedEvent extends LoginEvent {
  triage: {
    status: string
    analyst: string
    severity: string
    notes: string
  }
}

export interface IncidentCase {
  id: number
  title: string
  status: string
  priority: string
  owner: string
  summary: string
  event_ids: number[]
  created_at: string
  updated_at: string
}

export interface DetectionRule {
  id: number
  key: string
  name: string
  description: string
  threshold: number
  enabled: boolean
  confidence: number
  false_positive_rate: number
  updated_at: string
}

export interface SecurityPolicy {
  id: number
  key: string
  value: string
  description: string
  updated_at: string
}

export interface ContainmentTicket {
  id: number
  ticket_id: string
  entity: string
  severity: string
  status: string
  summary: string
  source: string
  created_at: string
  updated_at: string
}

export interface AccessRestrictionItem {
  id: number
  target_type: string
  target_value: string
  reason: string
  active: boolean
  expires_at: string
  created_at: string
}

export interface WeeklyReport {
  generated_at: string
  events_total: number
  mitigations_total: number
  events_by_action: Record<string, number>
  mitigations_by_uc: Record<string, number>
}

export interface InvestigationNode {
  id: string
  type: string
  label: string
}

export interface InvestigationEdge {
  id: string
  source: string
  target: string
  label: string
  risk_score: number
  timestamp: string
}

export interface InvestigationGraph {
  nodes: InvestigationNode[]
  edges: InvestigationEdge[]
}

export interface IngestionHealth {
  status: string
  pipeline: string
  event_count: number
  mitigation_count: number
  restriction_count: number
  last_checked: string
}

export interface SeedTemplateUser {
  username: string
  password_hash: string
}

export interface SeedTemplateEvent {
  username: string
  ip_address: string
  user_agent: string
  country: string
  is_suspicious: boolean
  risk_score: number
  event_action: string
  timestamp: string
}

export interface LiveSeedUser {
  id: number
  username: string
  is_locked: boolean
  mfa_required: boolean
}

export interface SeedUserCreateRequest {
  username: string
  password: string
  is_locked?: boolean
  mfa_required?: boolean
}

export interface SeedUserUpdateRequest {
  username?: string
  password?: string
  is_locked?: boolean
  mfa_required?: boolean
}

export interface LiveSeedEvent {
  id: number
  username: string
  ip_address: string
  country: string
  risk_score: number
  event_action: string
  is_suspicious: boolean
  timestamp: string
}

export interface SeedDatabasePreview {
  database_path: string
  seed_template: {
    total_users: number
    total_events: number
    suspicious_events: number
    users: SeedTemplateUser[]
    events: SeedTemplateEvent[]
  }
  live_database: {
    total_users: number
    total_events: number
    users: LiveSeedUser[]
    events: LiveSeedEvent[]
  }
}
