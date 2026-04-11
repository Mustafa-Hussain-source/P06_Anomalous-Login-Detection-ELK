import { useState } from 'react'
import { api } from '../lib/api'
import { usePolling } from '../hooks/usePolling'

type UcTrigger = {
  id: string
  title: string
  detail: string
  item: string
}

const ucTriggers: UcTrigger[] = [
  {
    id: 'uc-012',
    title: 'Auto-Lock Account on High-Severity Anomaly',
    detail: 'Locks a user account when high-confidence malicious behavior is detected.',
    item: '#21',
  },
  {
    id: 'uc-013',
    title: 'Auto-Block Source IP on Repeated Malicious Activity',
    detail: 'Blocks an offending source IP after repeated suspicious attempts.',
    item: '#22',
  },
  {
    id: 'uc-014',
    title: 'Auto-Terminate Suspicious Active Sessions',
    detail: 'Invalidates active sessions tied to suspicious user behavior.',
    item: '#25',
  },
  {
    id: 'uc-015',
    title: 'Force MFA Step-Up on Risky Logins',
    detail: 'Requires additional MFA challenge when login risk exceeds threshold.',
    item: '#24',
  },
  {
    id: 'uc-016',
    title: 'Auto-Revoke Compromised API Keys',
    detail: 'Revokes keys marked compromised to prevent continued abuse.',
    item: '#29',
  },
  {
    id: 'uc-017',
    title: 'Auto-Disable VPN Access on Suspected Compromise',
    detail: 'Disables VPN access for identities with active compromise indicators.',
    item: '#28',
  },
  {
    id: 'uc-018',
    title: 'Auto-Block Administrative Console Logins',
    detail: 'Prevents privileged console access when anomalous admin activity is detected.',
    item: '#23',
  },
  {
    id: 'uc-019',
    title: 'Automated Containment Ticket Creation',
    detail: 'Creates a containment ticket with incident context for response teams.',
    item: '#27',
  },
  {
    id: 'uc-020',
    title: 'IPS Rollback on False Positives',
    detail: 'Rolls back containment rules when events are classified as false positive.',
    item: '#26',
  },
]

export function SimulationPage() {
  const [status, setStatus] = useState<string>('Ready')
  const [isBusy, setIsBusy] = useState<boolean>(false)
  const [trafficState, setTrafficState] = useState<'running' | 'stopped' | 'unknown'>('unknown')

  usePolling(async () => {
    try {
      const payload = await api.trafficStatus()
      setTrafficState(payload.running ? 'running' : 'stopped')
    } catch {
      setTrafficState('unknown')
    }
  }, 3500)

  const run = async (task: () => Promise<unknown>, label: string) => {
    setIsBusy(true)
    try {
      await task()
      setStatus(`${label} completed at ${new Date().toLocaleTimeString()}`)
    } catch (err) {
      setStatus(`${label} failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <section>
      <div className="panel-header">
        <h2>Simulation Console</h2>
        <p>Trigger UC flows and traffic controls against live backend.</p>
      </div>

      <article className="panel">
        <h3>Traffic Controls</h3>
        <p className="simulation-traffic-state">
          Traffic State:
          <span className={`chip ${trafficState === 'running' ? 'chip-state-running' : trafficState === 'stopped' ? 'chip-state-stopped' : 'chip-state-unknown'}`}>
            {trafficState === 'running' ? 'Actively Running' : trafficState === 'stopped' ? 'Stopped' : 'Unknown'}
          </span>
        </p>
        <div className="button-row">
          <button disabled={isBusy} onClick={() => run(() => api.startTraffic(), 'Traffic start')}>Start Traffic</button>
          <button disabled={isBusy} onClick={() => run(() => api.stopTraffic(), 'Traffic stop')}>Stop Traffic</button>
          <button disabled={isBusy} onClick={() => run(() => api.clearEvents(true), 'Events clear + seed')}>Clear & Seed</button>
        </div>
      </article>

      <article className="panel">
        <h3>UC Triggers</h3>
        <div className="uc-trigger-grid">
          {ucTriggers.map((uc) => (
            <article key={uc.id} className="uc-trigger-card">
              <header className="uc-trigger-head">
                <strong>{uc.id.toUpperCase()}</strong>
                <span className="chip">{uc.item}</span>
              </header>
              <h4>{uc.title}</h4>
              <p>{uc.detail}</p>
              <button
              disabled={isBusy}
              onClick={() => run(() => api.triggerSimulation(uc.id), `Trigger ${uc.id.toUpperCase()}`)}
            >
                Trigger {uc.id.toUpperCase()}
              </button>
            </article>
          ))}
        </div>
      </article>

      <p className="sync-meta">{status}</p>
    </section>
  )
}
