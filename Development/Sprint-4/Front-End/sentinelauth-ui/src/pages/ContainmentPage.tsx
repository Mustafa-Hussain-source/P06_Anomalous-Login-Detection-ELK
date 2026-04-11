import { useMemo, useState } from 'react'
import { usePolling } from '../hooks/usePolling'
import { api } from '../lib/api'
import type { ContainmentTicket, IncidentCase } from '../types'

const CASES_PER_PAGE = 10

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

function parseLinkedCaseId(source: string): number | null {
  if (!source.toLowerCase().startsWith('case:')) {
    return null
  }
  const parsed = Number(source.split(':')[1])
  return Number.isFinite(parsed) ? parsed : null
}

function toSeverity(priority: string): string {
  const normalized = priority.toLowerCase()
  if (normalized === 'critical' || normalized === 'p1') {
    return 'critical'
  }
  if (normalized === 'high' || normalized === 'p2') {
    return 'high'
  }
  if (normalized === 'medium' || normalized === 'p3') {
    return 'medium'
  }
  return 'low'
}

export function ContainmentPage() {
  const [tickets, setTickets] = useState<ContainmentTicket[]>([])
  const [cases, setCases] = useState<IncidentCase[]>([])
  const [selectedCaseIds, setSelectedCaseIds] = useState<number[]>([])
  const [casePage, setCasePage] = useState(0)
  const [status, setStatus] = useState('')
  const [isBusy, setIsBusy] = useState(false)

  const pendingCases = useMemo(
    () => cases.filter((item) => normalizeCaseStatus(item.status) === 'pending'),
    [cases],
  )

  const totalCasePages = Math.max(1, Math.ceil(pendingCases.length / CASES_PER_PAGE))
  const pagedPendingCases = useMemo(() => {
    const start = casePage * CASES_PER_PAGE
    return pendingCases.slice(start, start + CASES_PER_PAGE)
  }, [casePage, pendingCases])

  const openTicketCaseIds = useMemo(() => {
    const ids = new Set<number>()
    tickets.forEach((ticket) => {
      const linkedId = parseLinkedCaseId(ticket.source)
      if (linkedId !== null && ticket.status.toLowerCase() !== 'closed') {
        ids.add(linkedId)
      }
    })
    return ids
  }, [tickets])

  const refresh = async () => {
    const [ticketRows, caseRows] = await Promise.all([
      api.listTickets(200),
      api.listCases(200),
    ])
    setTickets(ticketRows)
    setCases(caseRows)

    const pageCap = Math.max(
      0,
      Math.ceil(
        caseRows.filter((item) => normalizeCaseStatus(item.status) === 'pending').length / CASES_PER_PAGE,
      ) - 1,
    )
    setCasePage((current) => Math.min(current, pageCap))
    setSelectedCaseIds((current) => (
      current.filter((id) => caseRows.some((item) => item.id === id && normalizeCaseStatus(item.status) === 'pending'))
    ))
  }

  usePolling(async () => {
    try {
      await refresh()
    } catch {
      setStatus('Could not load containment data stream.')
    }
  }, 5000)

  const toggleCaseSelection = (caseId: number) => {
    setSelectedCaseIds((current) => (
      current.includes(caseId)
        ? current.filter((id) => id !== caseId)
        : [...current, caseId]
    ))
  }

  const createTicketsForSelectedCases = async () => {
    const selectedCases = pendingCases.filter((item) => selectedCaseIds.includes(item.id))
    if (selectedCases.length === 0) {
      setStatus('Select at least one pending case.')
      return
    }

    try {
      setIsBusy(true)
      let createdCount = 0

      for (const pendingCase of selectedCases) {
        if (openTicketCaseIds.has(pendingCase.id)) {
          continue
        }

        await api.createTicket({
          entity: `case:${pendingCase.id}`,
          severity: toSeverity(pendingCase.priority),
          summary: pendingCase.summary || pendingCase.title,
          source: `case:${pendingCase.id}`,
        })
        await api.patchCase(pendingCase.id, { status: 'in_progress' })
        createdCount += 1
      }

      setSelectedCaseIds([])
      setStatus(`Created ${createdCount} containment ticket(s) from selected cases.`)
      await refresh()
    } catch {
      setStatus('Could not create one or more containment tickets for selected cases.')
    } finally {
      setIsBusy(false)
    }
  }

  const closeTicket = async (ticket: ContainmentTicket) => {
    try {
      setIsBusy(true)
      await api.patchTicket(ticket.id, 'closed')
      const linkedCaseId = parseLinkedCaseId(ticket.source)
      if (linkedCaseId !== null) {
        await api.patchCase(linkedCaseId, { status: 'closed' })
        setStatus(`Ticket ${ticket.ticket_id} closed and case ${linkedCaseId} marked closed.`)
      } else {
        setStatus(`Ticket ${ticket.ticket_id} closed.`)
      }
      await refresh()
    } catch {
      setStatus(`Failed to close ticket ${ticket.ticket_id}.`)
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <section>
      <div className="panel-header">
        <h2>Containment Action Center</h2>
        <p>Pending-case containment queue with synchronized case-ticket lifecycle management.</p>
      </div>

      <div className="two-col pipeline-symmetric-grid">
        <article className="panel containment-pending-panel">
          <div className="pending-cases-head">
            <h3>Pending Cases Queue</h3>
            <span className="chip">{pendingCases.length} pending</span>
          </div>

          <div className="pending-case-dropdown-actions">
            <button
              onClick={createTicketsForSelectedCases}
              disabled={isBusy || selectedCaseIds.length === 0}
            >
              Create Tickets For Selected
            </button>
            <button
              onClick={() => setSelectedCaseIds([])}
              disabled={selectedCaseIds.length === 0}
            >
              Clear Selection
            </button>
          </div>

          <ul className="pending-case-scroll-list">
            {pagedPendingCases.map((pendingCase) => {
              const hasActiveTicket = openTicketCaseIds.has(pendingCase.id)
              return (
                <li key={pendingCase.id}>
                  <label className="case-pick">
                    <input
                      type="checkbox"
                      className="triage-checkbox"
                      checked={selectedCaseIds.includes(pendingCase.id)}
                      onChange={() => toggleCaseSelection(pendingCase.id)}
                      disabled={hasActiveTicket}
                    />
                    <span>
                      <strong>{pendingCase.title}</strong>
                      <small>Case #{pendingCase.id} · {pendingCase.priority} · {normalizeCaseStatus(pendingCase.status)}</small>
                    </span>
                  </label>
                  <span className="chip">events: {pendingCase.event_ids.length}</span>
                  <span className="sync-meta">{hasActiveTicket ? 'ticket active' : 'ready'}</span>
                </li>
              )
            })}
          </ul>

          <div className="containment-case-pagination">
            <button onClick={() => setCasePage((current) => Math.max(0, current - 1))} disabled={casePage === 0}>Prev</button>
            <span className="sync-meta">Page {casePage + 1} / {totalCasePages}</span>
            <button onClick={() => setCasePage((current) => Math.min(totalCasePages - 1, current + 1))} disabled={casePage >= totalCasePages - 1}>Next</button>
          </div>
        </article>

        <article className="panel containment-ticket-panel">
          <div className="pending-cases-head">
            <h3>Containment Tickets</h3>
            <span className="sync-meta">{status}</span>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Linked Case</th>
                  <th>Entity</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Ops</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>{ticket.ticket_id}</td>
                    <td>{parseLinkedCaseId(ticket.source) ?? '-'}</td>
                    <td>{ticket.entity}</td>
                    <td>{ticket.severity}</td>
                    <td><span className="chip">{ticket.status}</span></td>
                    <td>
                      {ticket.status !== 'closed' && <button onClick={() => closeTicket(ticket)} disabled={isBusy}>Close</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  )
}
