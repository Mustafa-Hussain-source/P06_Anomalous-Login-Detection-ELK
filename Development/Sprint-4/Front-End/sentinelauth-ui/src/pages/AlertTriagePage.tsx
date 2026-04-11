import { useMemo, useState } from 'react'
import { usePolling } from '../hooks/usePolling'
import { api } from '../lib/api'
import type { EnrichedEvent, IncidentCase } from '../types'

function normalizeCaseStatus(value: string): 'pending' | 'in_progress' | 'closed' {
  const status = value.trim().toLowerCase()
  if (status === 'closed' || status === 'resolved' || status === 'completed') {
    return 'closed'
  }
  if (status === 'in_progress' || status === 'active' || status === 'working') {
    return 'in_progress'
  }
  return 'pending'
}

export function AlertTriagePage() {
  const [events, setEvents] = useState<EnrichedEvent[]>([])
  const [cases, setCases] = useState<IncidentCase[]>([])
  const [selectedEventIds, setSelectedEventIds] = useState<number[]>([])
  const [statusMessage, setStatusMessage] = useState('')

  const refresh = async () => {
    const [eventRows, caseRows] = await Promise.all([api.getEnrichedEvents(80), api.listCases(60)])
    setEvents(eventRows)
    setCases(caseRows)
  }

  const activeCases = useMemo(
    () => cases.filter((item) => normalizeCaseStatus(item.status) !== 'closed'),
    [cases],
  )

  const activeCaseEventIds = useMemo(
    () => new Set(activeCases.flatMap((item) => item.event_ids)),
    [activeCases],
  )

  const maliciousEvents = useMemo(
    () =>
      events.filter(
        (event) =>
          (event.is_suspicious || event.risk_score >= 80) &&
          event.triage.status !== 'in_review' &&
          !activeCaseEventIds.has(event.id),
      ),
    [activeCaseEventIds, events],
  )

  const maliciousEventIds = useMemo(() => maliciousEvents.map((event) => event.id), [maliciousEvents])
  const allSelected = maliciousEventIds.length > 0 && maliciousEventIds.every((eventId) => selectedEventIds.includes(eventId))

  usePolling(async () => {
    try {
      await refresh()
    } catch {
      setStatusMessage('Could not load triage stream.')
    }
  }, 4500)

  const markInReview = async (eventId: number) => {
    await api.updateEventTriage(eventId, {
      status: 'in_review',
      analyst: 'soc-analyst-04',
      severity: 'high',
      notes: 'UI triage update',
    })

    const linkedCase = cases.find((item) => item.event_ids.includes(eventId))
    if (linkedCase) {
      setStatusMessage(`Event ${eventId} moved to in_review; linked case ${linkedCase.id} remains in execution pipeline.`)
    } else {
      await api.createCase({
        title: `Triage case for event ${eventId}`,
        status: 'pending',
        priority: 'high',
        owner: 'soc-analyst-04',
        summary: 'Auto-created from triage intake',
        event_ids: [eventId],
      })
      setStatusMessage(`Event ${eventId} moved to in_review and handed off as case intake.`)
    }

    await refresh()
  }

  const createCase = async () => {
    if (!selectedEventIds.length) {
      setStatusMessage('Select at least one event first.')
      return
    }

    await api.createCase({
      title: `Case for ${selectedEventIds.length} selected event${selectedEventIds.length === 1 ? '' : 's'}`,
      status: 'pending',
      priority: 'high',
      owner: 'soc-analyst-04',
      summary: 'Created from triage intake workbench',
      event_ids: selectedEventIds,
    })

    await Promise.all(
      selectedEventIds.map((eventId) =>
        api.updateEventTriage(eventId, {
          status: 'in_review',
          analyst: 'soc-analyst-04',
          severity: 'high',
          notes: 'Moved to pending case from bulk selection',
        }),
      ),
    )

    setStatusMessage(`Case created for ${selectedEventIds.length} selected event${selectedEventIds.length === 1 ? '' : 's'}`)
    setSelectedEventIds([])
    await refresh()
  }

  const toggleSelectedEvent = (eventId: number, checked: boolean) => {
    setSelectedEventIds((current) => {
      if (checked) {
        return current.includes(eventId) ? current : [...current, eventId]
      }

      return current.filter((selectedId) => selectedId !== eventId)
    })
  }

  const clearSelectedEvents = () => {
    setSelectedEventIds([])
  }

  const toggleSelectAll = (checked: boolean) => {
    setSelectedEventIds(checked ? maliciousEventIds : [])
  }

  return (
    <section className="triage-page">
      <div className="panel-header">
        <h2>Alert Triage Workbench</h2>
        <p>Independent intake pipeline: triage suspicious events and hand off case records to Containment execution.</p>
      </div>

      <div className="kpi-grid triage-stat-grid">
        <article className="kpi-card triage-stat-card">
          <span>Suspicious Intake Queue</span>
          <strong>{maliciousEvents.length}</strong>
        </article>
        <article className="kpi-card triage-stat-card">
          <span>Active Case Handoffs</span>
          <strong>{activeCases.length}</strong>
        </article>
      </div>

      <div className="two-col triage-grid pipeline-symmetric-grid">
        <article className="panel">
          <div className="triage-workspace-head">
            <div>
              <h3>Enriched Event Stream</h3>
              <p>Primary workspace for malicious intake and handoff.</p>
            </div>
            <span className="sync-meta">{statusMessage}</span>
          </div>
          <div className="triage-action-bar">
            <label className="triage-select-all">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(event) => toggleSelectAll(event.target.checked)}
                aria-label="Select all malicious events"
              />
              Pick all
            </label>
            <button className="symmetric-action triage-primary-action" onClick={createCase} disabled={!selectedEventIds.length}>
              Create Case
            </button>
            <button className="symmetric-action" onClick={clearSelectedEvents} disabled={!selectedEventIds.length}>
              Clear Selection
            </button>
          </div>
          <div className="table-wrap triage-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Pick</th>
                  <th>ID</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Risk</th>
                  <th>Triage</th>
                  <th>Ops</th>
                </tr>
              </thead>
              <tbody>
                {maliciousEvents.map((event) => (
                  <tr key={event.id} className={selectedEventIds.includes(event.id) ? 'row-selected' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        className="triage-checkbox"
                        checked={selectedEventIds.includes(event.id)}
                        onChange={(changeEvent) => toggleSelectedEvent(event.id, changeEvent.target.checked)}
                        aria-label={`Select event ${event.id}`}
                      />
                    </td>
                    <td>{event.id}</td>
                    <td className="triage-user-cell">{event.username}</td>
                    <td className="triage-action-cell" title={event.event_action}>
                      <span className="triage-action-text">{event.event_action}</span>
                    </td>
                    <td className="triage-risk-cell">
                      <span className="triage-risk-badge">{event.risk_score}</span>
                    </td>
                    <td>{event.triage.status}</td>
                    <td>
                      <div className="button-row triage-ops-row">
                        <button className="symmetric-action triage-secondary-action" onClick={() => markInReview(event.id)}>In Review</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!maliciousEvents.length && (
                  <tr>
                    <td colSpan={7}>No malicious events in the current stream.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel">
          <h3>Case Handoff Snapshot</h3>
          <p className="sync-meta">Execution ownership is in Containment. This view is read-only for pipeline continuity.</p>
          {activeCases.length ? (
            <ul className="list pending-case-list">
              {activeCases.slice(0, 10).map((item) => (
                <li key={item.id}>
                  <span className="case-pick">
                    <span>
                      <strong>{item.title}</strong>
                      <small>#{item.id} · {item.owner}</small>
                    </span>
                  </span>
                  <span className="chip">{normalizeCaseStatus(item.status)}</span>
                  <span className="sync-meta">{item.event_ids.length} event{item.event_ids.length === 1 ? '' : 's'}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="triage-empty-state">
              <span className="material-symbols-outlined triage-empty-icon">search</span>
              <strong>All clear! No active handoffs</strong>
              <p>Cases created from this workbench will appear here once triage hands them off.</p>
            </div>
          )}
        </article>
      </div>
    </section>
  )
}
