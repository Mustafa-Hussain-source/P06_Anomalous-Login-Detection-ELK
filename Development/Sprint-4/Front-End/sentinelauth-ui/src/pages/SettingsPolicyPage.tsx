import { useState } from 'react'
import type { FormEvent } from 'react'
import { usePolling } from '../hooks/usePolling'
import { api } from '../lib/api'
import type { AccessRestrictionItem, SecurityPolicy } from '../types'

export function SettingsPolicyPage() {
  const [policies, setPolicies] = useState<SecurityPolicy[]>([])
  const [restrictions, setRestrictions] = useState<AccessRestrictionItem[]>([])
  const [status, setStatus] = useState('')

  const [targetType, setTargetType] = useState('ip')
  const [targetValue, setTargetValue] = useState('203.0.113.20')
  const [reason, setReason] = useState('Manual SOC lock')
  const [expiresAt, setExpiresAt] = useState('2030-01-01T00:00:00')

  const refresh = async () => {
    const [policyRows, restrictionRows] = await Promise.all([api.listPolicies(), api.listAccessRestrictions()])
    setPolicies(policyRows)
    setRestrictions(restrictionRows)
  }

  usePolling(async () => {
    try {
      await refresh()
    } catch {
      setStatus('Could not load policy management data.')
    }
  }, 6000)

  const updatePolicy = async (policy: SecurityPolicy) => {
    const nextValue = window.prompt(`Update value for ${policy.key}`, policy.value)
    if (nextValue == null) {
      return
    }
    await api.patchPolicy(policy.id, nextValue)
    setStatus(`Updated ${policy.key}`)
    await refresh()
  }

  const addRestriction = async (event: FormEvent) => {
    event.preventDefault()
    await api.createAccessRestriction({
      target_type: targetType,
      target_value: targetValue,
      reason,
      expires_at: new Date(expiresAt).toISOString(),
    })
    setStatus('Restriction created')
    await refresh()
  }

  const deactivate = async (id: number) => {
    await api.deactivateAccessRestriction(id)
    setStatus(`Restriction ${id} deactivated`)
    await refresh()
  }

  return (
    <section>
      <div className="panel-header">
        <h2>Settings & Policy Management</h2>
        <p>Policy tuning and restriction controls.</p>
      </div>

      <p className="sync-meta">{status}</p>

      <div className="two-col">
        <article className="panel">
          <h3>Policies</h3>
          <ul className="list">
            {policies.map((policy) => (
              <li key={policy.id}>
                <span>{policy.key}</span>
                <span>{policy.value}</span>
                <button onClick={() => updatePolicy(policy)}>Edit</button>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <h3>Create Restriction</h3>
          <form className="form-grid" onSubmit={addRestriction}>
            <label>
              Target Type
              <input value={targetType} onChange={(event) => setTargetType(event.target.value)} required />
            </label>
            <label>
              Target Value
              <input value={targetValue} onChange={(event) => setTargetValue(event.target.value)} required />
            </label>
            <label>
              Reason
              <input value={reason} onChange={(event) => setReason(event.target.value)} required />
            </label>
            <label>
              Expires At
              <input value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} required />
            </label>
            <button type="submit">Add Restriction</button>
          </form>
        </article>
      </div>

      <article className="panel">
        <h3>Access Restrictions</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Target</th>
                <th>Reason</th>
                <th>Active</th>
                <th>Ops</th>
              </tr>
            </thead>
            <tbody>
              {restrictions.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.target_type}:{item.target_value}</td>
                  <td>{item.reason}</td>
                  <td>{String(item.active)}</td>
                  <td>{item.active && <button onClick={() => deactivate(item.id)}>Deactivate</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  )
}
