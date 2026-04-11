import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../../../Development/Sprint-4/Front-End/sentinelauth-ui/src/App'

type JsonBody = Record<string, unknown> | Array<unknown>

function jsonResponse(body: JsonBody, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

describe('App integration', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const rawUrl = String(input)
      const url = new URL(rawUrl)

      if (url.pathname === '/events') {
        return jsonResponse([
          {
            id: 1,
            username: 'alice',
            ip_address: '1.1.1.1',
            country: 'PK',
            event_action: 'block_ip',
            risk_score: 88,
            is_suspicious: true,
            created_at: '2026-04-06T18:10:00Z',
          },
        ])
      }

      if (url.pathname === '/mitigations') {
        return jsonResponse([
          {
            id: 1,
            event_id: 1,
            action: 'ip_block',
            reason: 'High risk login',
            uc_id: 'UC-013',
            created_at: '2026-04-06T18:10:10Z',
          },
        ])
      }

      if (url.pathname === '/analytics/kpi') {
        return jsonResponse({
          total_events: 7,
          suspicious_events: 3,
          blocked_events: 2,
          mitigations: 1,
          avg_risk: 65,
        })
      }

      if (url.pathname === '/analytics/threat-heatmap') {
        return jsonResponse([{ country: 'PK', count: 4 }])
      }

      if (url.pathname === '/analytics/risky-users') {
        return jsonResponse([
          { username: 'alice', risk_score: 88, event_action: 'block_ip', timestamp: '2026-04-06T18:10:00Z' },
        ])
      }

      if (url.pathname === '/traffic/start') {
        return jsonResponse({ status: 'started' })
      }

      return jsonResponse({ detail: `Unhandled route in test: ${url.pathname}` }, 404)
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('renders dashboard KPIs from backend responses', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Executive Dashboard' })).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('7')).toBeInTheDocument()
    })

    expect(screen.getByText('alice')).toBeInTheDocument()
    expect(screen.getByText('PK')).toBeInTheDocument()
  })

  it('triggers traffic start from simulation page', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/simulate']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Simulation Console' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Start Traffic' }))

    await waitFor(() => {
      expect(screen.getByText(/Traffic start completed at/i)).toBeInTheDocument()
    })
  })
})
