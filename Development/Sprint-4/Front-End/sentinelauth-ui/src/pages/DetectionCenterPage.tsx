import { useMemo, useState } from 'react'
import { usePolling } from '../hooks/usePolling'
import { api } from '../lib/api'
import type { DetectionRule } from '../types'

type BacktestResult = {
  events_evaluated: number
  hits: number
  hit_rate: number
}

type RuleDraft = {
  threshold: number
  confidence: number
  false_positive_rate: number
}

type RiskyUser = {
  username: string
  risk_score: number
  event_action: string
  timestamp: string
}

type ThreatVelocityPoint = {
  bucket: number
  start_time: string
  end_time: string
  event_count: number
  total_risk: number
  avg_risk: number
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function DetectionCenterPage() {
  const [rules, setRules] = useState<DetectionRule[]>([])
  const [riskyUsers, setRiskyUsers] = useState<RiskyUser[]>([])
  const [threatVelocity, setThreatVelocity] = useState<ThreatVelocityPoint[]>([])
  const [draftByRule, setDraftByRule] = useState<Record<number, RuleDraft>>({})
  const [backtests, setBacktests] = useState<Record<number, BacktestResult>>({})
  const [selectedRuleId, setSelectedRuleId] = useState<number | null>(null)
  const [backtestDays, setBacktestDays] = useState<number>(30)
  const [isSaving, setIsSaving] = useState(false)
  const [isBacktesting, setIsBacktesting] = useState(false)
  const [status, setStatus] = useState('')

  const refresh = async () => {
    const [rows, riskRows, velocityRows] = await Promise.all([
      api.listDetectionRules(),
      api.getRiskyUsers(8),
      api.getThreatVelocity(24, 12),
    ])

    setRules(rows)
    setRiskyUsers(riskRows)
    setThreatVelocity(velocityRows)
    setSelectedRuleId((current) => {
      if (rows.length === 0) {
        return null
      }
      if (current && rows.some((rule) => rule.id === current)) {
        return current
      }
      return rows[0].id
    })

    setDraftByRule((current) => {
      const next = { ...current }
      rows.forEach((rule) => {
        if (!next[rule.id]) {
          next[rule.id] = {
            threshold: rule.threshold,
            confidence: rule.confidence,
            false_positive_rate: rule.false_positive_rate,
          }
        }
      })
      return next
    })
  }

  usePolling(async () => {
    try {
      await refresh()
    } catch {
      setStatus('Failed to load detection intelligence feeds.')
    }
  }, 7000)

  const selectedRule = useMemo(
    () => rules.find((rule) => rule.id === selectedRuleId) || null,
    [rules, selectedRuleId],
  )

  const selectedDraft = selectedRule ? draftByRule[selectedRule.id] : undefined

  const enabledRules = useMemo(
    () => rules.filter((rule) => rule.enabled).length,
    [rules],
  )

  const avgConfidence = useMemo(
    () => average(rules.map((rule) => rule.confidence)),
    [rules],
  )

  const avgFalsePositiveRate = useMemo(
    () => average(rules.map((rule) => rule.false_positive_rate)),
    [rules],
  )

  const avgThreshold = useMemo(
    () => average(rules.map((rule) => rule.threshold)),
    [rules],
  )

  const driftIndex = useMemo(() => {
    if (threatVelocity.length < 4) {
      return 0
    }
    const midpoint = Math.floor(threatVelocity.length / 2)
    const baseline = average(threatVelocity.slice(0, midpoint).map((item) => item.avg_risk))
    const recent = average(threatVelocity.slice(midpoint).map((item) => item.avg_risk))
    return recent - baseline
  }, [threatVelocity])

  const maxVelocityCount = useMemo(
    () => Math.max(1, ...threatVelocity.map((item) => item.event_count)),
    [threatVelocity],
  )

  const setDraftValue = (ruleId: number, field: keyof RuleDraft, value: number) => {
    setDraftByRule((current) => ({
      ...current,
      [ruleId]: {
        ...(current[ruleId] || { threshold: 50, confidence: 0.8, false_positive_rate: 0.1 }),
        [field]: value,
      },
    }))
  }

  const toggleRule = async (rule: DetectionRule) => {
    try {
      setIsSaving(true)
      await api.patchDetectionRule(rule.id, { enabled: !rule.enabled })
      setStatus(`${rule.name} set to ${!rule.enabled ? 'enabled' : 'disabled'}`)
      await refresh()
    } catch {
      setStatus(`Failed to update ${rule.name}.`)
    } finally {
      setIsSaving(false)
    }
  }

  const saveCalibration = async () => {
    if (!selectedRule || !selectedDraft) {
      return
    }

    try {
      setIsSaving(true)
      await api.patchDetectionRule(selectedRule.id, {
        threshold: Math.round(selectedDraft.threshold),
        confidence: Number(selectedDraft.confidence.toFixed(2)),
        false_positive_rate: Number(selectedDraft.false_positive_rate.toFixed(2)),
      })
      setStatus(`${selectedRule.name} calibration saved.`)
      await refresh()
    } catch {
      setStatus('Calibration save failed.')
    } finally {
      setIsSaving(false)
    }
  }

  const applyPreset = (preset: 'conservative' | 'balanced' | 'aggressive') => {
    if (!selectedRule) {
      return
    }

    const baseline = draftByRule[selectedRule.id] || {
      threshold: selectedRule.threshold,
      confidence: selectedRule.confidence,
      false_positive_rate: selectedRule.false_positive_rate,
    }

    if (preset === 'conservative') {
      setDraftByRule((current) => ({
        ...current,
        [selectedRule.id]: {
          threshold: Math.min(95, baseline.threshold + 10),
          confidence: Math.min(0.99, baseline.confidence + 0.05),
          false_positive_rate: Math.max(0.01, baseline.false_positive_rate - 0.03),
        },
      }))
      setStatus('Conservative preset applied: stricter threshold, lower FPR.')
      return
    }

    if (preset === 'balanced') {
      setDraftByRule((current) => ({
        ...current,
        [selectedRule.id]: {
          threshold: selectedRule.threshold,
          confidence: Math.max(0.8, selectedRule.confidence),
          false_positive_rate: Math.min(0.1, selectedRule.false_positive_rate),
        },
      }))
      setStatus('Balanced preset applied.')
      return
    }

    setDraftByRule((current) => ({
      ...current,
      [selectedRule.id]: {
        threshold: Math.max(20, baseline.threshold - 10),
        confidence: Math.max(0.55, baseline.confidence - 0.04),
        false_positive_rate: Math.min(0.35, baseline.false_positive_rate + 0.05),
      },
    }))
    setStatus('Aggressive preset applied: wider detection net.')
  }

  const runBacktest = async (ruleId: number) => {
    try {
      const result = await api.backtestDetectionRule(ruleId, backtestDays)
      setBacktests((current) => ({ ...current, [ruleId]: result }))
      setStatus(
        `Backtest(${backtestDays}d) events=${result.events_evaluated} hits=${result.hits} hitRate=${(result.hit_rate * 100).toFixed(1)}%`,
      )
    } catch {
      setStatus('Backtest failed for selected rule.')
    }
  }

  const runAllBacktests = async () => {
    if (rules.length === 0) {
      return
    }

    try {
      setIsBacktesting(true)
      const pairs = await Promise.all(
        rules.map(async (rule) => ({
          ruleId: rule.id,
          result: await api.backtestDetectionRule(rule.id, backtestDays),
        })),
      )

      const next: Record<number, BacktestResult> = {}
      pairs.forEach((pair) => {
        next[pair.ruleId] = pair.result
      })
      setBacktests(next)
      setStatus(`Completed model sweep for ${rules.length} rules (${backtestDays} day window).`)
    } catch {
      setStatus('Model sweep failed. Some rules may not have completed backtests.')
    } finally {
      setIsBacktesting(false)
    }
  }

  const selectedBacktest = selectedRule ? backtests[selectedRule.id] : undefined

  return (
    <section>
      <div className="panel-header">
        <h2>Detection Center</h2>
        <p>Model operations cockpit for calibration, drift monitoring, and detection strategy control.</p>
      </div>

      <div className="kpi-grid kpi-grid-six">
        <article className="kpi-card"><span>Enabled Rules</span><strong>{enabledRules}</strong></article>
        <article className="kpi-card"><span>Avg Confidence</span><strong>{(avgConfidence * 100).toFixed(1)}%</strong></article>
        <article className="kpi-card"><span>Avg False Positive</span><strong>{(avgFalsePositiveRate * 100).toFixed(1)}%</strong></article>
        <article className="kpi-card"><span>Avg Threshold</span><strong>{avgThreshold.toFixed(1)}</strong></article>
        <article className={`kpi-card ${driftIndex > 6 ? 'warning' : ''}`}><span>Risk Drift (24h)</span><strong>{driftIndex >= 0 ? '+' : ''}{driftIndex.toFixed(1)}</strong></article>
        <article className="kpi-card"><span>Cached Backtests</span><strong>{Object.keys(backtests).length}</strong></article>
      </div>

      <p className="sync-meta">{status}</p>

      <div className="two-col detection-ml-grid">
        <article className="panel detection-panel-calibration">
          <div className="detection-panel-head">
            <h3>Calibration Workbench</h3>
            <span className="chip">ML tuning lane</span>
          </div>

          <div className="detection-row-inline">
            <label>
              Active rule
              <select
                value={selectedRuleId ?? ''}
                onChange={(event) => setSelectedRuleId(Number(event.target.value))}
                disabled={rules.length === 0}
              >
                {rules.map((rule) => (
                  <option key={rule.id} value={rule.id}>{rule.name}</option>
                ))}
              </select>
            </label>

            <label>
              Backtest days
              <input
                type="number"
                min={7}
                max={120}
                value={backtestDays}
                onChange={(event) => setBacktestDays(Math.max(7, Math.min(120, Number(event.target.value) || 30)))}
              />
            </label>

            <button onClick={runAllBacktests} disabled={isBacktesting || rules.length === 0}>
              {isBacktesting ? 'Running Sweep...' : 'Run Model Sweep'}
            </button>
          </div>

          {selectedRule && selectedDraft && (
            <>
              <div className="detection-preset-row">
                <button onClick={() => applyPreset('conservative')} disabled={isSaving}>Conservative</button>
                <button onClick={() => applyPreset('balanced')} disabled={isSaving}>Balanced</button>
                <button onClick={() => applyPreset('aggressive')} disabled={isSaving}>Aggressive</button>
              </div>

              <div className="detection-slider-grid">
                <label>
                  <span>Threshold</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={selectedDraft.threshold}
                    onChange={(event) => setDraftValue(selectedRule.id, 'threshold', Number(event.target.value))}
                  />
                  <strong>{Math.round(selectedDraft.threshold)}</strong>
                </label>

                <label>
                  <span>Confidence</span>
                  <input
                    type="range"
                    min={0.5}
                    max={0.99}
                    step={0.01}
                    value={selectedDraft.confidence}
                    onChange={(event) => setDraftValue(selectedRule.id, 'confidence', Number(event.target.value))}
                  />
                  <strong>{(selectedDraft.confidence * 100).toFixed(1)}%</strong>
                </label>

                <label>
                  <span>False Positive Rate</span>
                  <input
                    type="range"
                    min={0.01}
                    max={0.4}
                    step={0.01}
                    value={selectedDraft.false_positive_rate}
                    onChange={(event) => setDraftValue(selectedRule.id, 'false_positive_rate', Number(event.target.value))}
                  />
                  <strong>{(selectedDraft.false_positive_rate * 100).toFixed(1)}%</strong>
                </label>
              </div>

              <div className="button-row">
                <button onClick={saveCalibration} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Calibration'}</button>
                <button onClick={() => runBacktest(selectedRule.id)} disabled={isBacktesting}>Run Backtest</button>
                <button onClick={() => toggleRule(selectedRule)} disabled={isSaving}>{selectedRule.enabled ? 'Disable Rule' : 'Enable Rule'}</button>
              </div>

              {selectedBacktest && (
                <div className="detection-backtest-summary">
                  <h4>Selected Rule Backtest</h4>
                  <p>Events evaluated: <strong>{selectedBacktest.events_evaluated}</strong></p>
                  <p>Hits: <strong>{selectedBacktest.hits}</strong></p>
                  <p>Hit rate: <strong>{(selectedBacktest.hit_rate * 100).toFixed(2)}%</strong></p>
                </div>
              )}
            </>
          )}
        </article>

        <article className="panel detection-panel-signals">
          <h3>Signal Intelligence</h3>

          <div className="detection-velocity-track">
            <h4>Threat Velocity (24h)</h4>
            <div className="bars detection-bars">
              {threatVelocity.map((point) => (
                <div
                  key={point.bucket}
                  className="bar"
                  style={{
                    height: `${Math.max(8, (point.event_count / maxVelocityCount) * 100)}%`,
                    background: point.avg_risk >= 80 ? 'rgba(255, 111, 97, 0.7)' : point.avg_risk >= 55 ? 'rgba(255, 185, 95, 0.7)' : 'rgba(87, 241, 219, 0.48)',
                  }}
                  title={`${new Date(point.start_time).toLocaleTimeString()} events=${point.event_count} avgRisk=${point.avg_risk.toFixed(1)}`}
                />
              ))}
            </div>
            <p className="sync-meta">Recent average risk drift: {driftIndex >= 0 ? '+' : ''}{driftIndex.toFixed(2)}</p>
          </div>

          <div>
            <h4>Top Risky Users</h4>
            <ul className="list detection-user-list">
              {riskyUsers.map((user) => (
                <li key={`${user.username}-${user.timestamp}`}>
                  <span>{user.username}</span>
                  <span className="chip">{user.event_action}</span>
                  <span className="mono">{user.risk_score.toFixed(1)}</span>
                </li>
              ))}
            </ul>
          </div>
        </article>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Rule</th>
              <th>Description</th>
              <th>Threshold</th>
              <th>Confidence</th>
              <th>False Positive</th>
              <th>Enabled</th>
              <th>Latest Hit Rate</th>
              <th>Ops</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id}>
                <td>{rule.name}</td>
                <td>{rule.description}</td>
                <td>{rule.threshold}</td>
                <td>{Math.round(rule.confidence * 100)}%</td>
                <td>{Math.round(rule.false_positive_rate * 100)}%</td>
                <td><span className="chip">{rule.enabled ? 'enabled' : 'disabled'}</span></td>
                <td>{backtests[rule.id] ? `${(backtests[rule.id].hit_rate * 100).toFixed(1)}%` : '-'}</td>
                <td>
                  <button onClick={() => toggleRule(rule)}>{rule.enabled ? 'Disable' : 'Enable'}</button>
                  <button onClick={() => runBacktest(rule.id)}>Backtest</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
