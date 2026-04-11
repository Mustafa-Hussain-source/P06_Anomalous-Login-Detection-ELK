import { useMemo, useState } from 'react'
import { usePolling } from '../hooks/usePolling'
import { api } from '../lib/api'
import type { LiveSeedUser, SeedDatabasePreview } from '../types'

type UserFilter = 'all' | 'locked' | 'mfa'

const EMPTY_DATA: SeedDatabasePreview = {
  database_path: '',
  seed_template: {
    total_users: 0,
    total_events: 0,
    suspicious_events: 0,
    users: [],
    events: [],
  },
  live_database: {
    total_users: 0,
    total_events: 0,
    users: [],
    events: [],
  },
}

export function SeedDatabasePage() {
  const [data, setData] = useState<SeedDatabasePreview>(EMPTY_DATA)
  const [users, setUsers] = useState<LiveSeedUser[]>([])
  const [status, setStatus] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [userFilter, setUserFilter] = useState<UserFilter>('all')
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null)
  const [deleteCandidate, setDeleteCandidate] = useState<LiveSeedUser | null>(null)

  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('password123')
  const [newLocked, setNewLocked] = useState(false)
  const [newMfa, setNewMfa] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editUsername, setEditUsername] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editLocked, setEditLocked] = useState(false)
  const [editMfa, setEditMfa] = useState(false)

  usePolling(async () => {
    try {
      const [payload, userRows] = await Promise.all([
        api.seedDatabasePreview(80, 120),
        api.listSeedUsers(300),
      ])
      setData(payload)
      setUsers(userRows)
      setStatus(`Seed database snapshot refreshed at ${new Date().toLocaleTimeString()}`)
      setError(null)
    } catch {
      setStatus('Could not load seed database preview.')
      setError('Could not load users from the seeding database.')
    }
  }, 6000)

  const filteredUsers = useMemo(() => {
    if (userFilter === 'locked') {
      return users.filter((user) => user.is_locked)
    }
    if (userFilter === 'mfa') {
      return users.filter((user) => user.mfa_required)
    }
    return users
  }, [users, userFilter])

  const lockedCount = useMemo(() => users.filter((user) => user.is_locked).length, [users])
  const mfaCount = useMemo(() => users.filter((user) => user.mfa_required).length, [users])

  const beginEdit = (user: LiveSeedUser) => {
    setEditingId(user.id)
    setEditUsername(user.username)
    setEditPassword('')
    setEditLocked(user.is_locked)
    setEditMfa(user.mfa_required)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditUsername('')
    setEditPassword('')
    setEditLocked(false)
    setEditMfa(false)
  }

  const cancelDelete = () => {
    if (deletingUserId !== null) {
      return
    }
    setDeleteCandidate(null)
  }

  const createUser = async () => {
    if (!newUsername.trim() || !newPassword.trim()) {
      setError('Username and password are required to create a user.')
      return
    }

    setCreating(true)
    try {
      await api.createSeedUser({
        username: newUsername.trim(),
        password: newPassword,
        is_locked: newLocked,
        mfa_required: newMfa,
      })

      const userRows = await api.listSeedUsers(300)
      setUsers(userRows)
      setStatus(`User ${newUsername.trim()} added at ${new Date().toLocaleTimeString()}`)
      setNewUsername('')
      setNewPassword('password123')
      setNewLocked(false)
      setNewMfa(false)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user.')
    } finally {
      setCreating(false)
    }
  }

  const saveUserEdit = async () => {
    if (editingId === null) {
      return
    }
    if (!editUsername.trim()) {
      setError('Username cannot be empty.')
      return
    }

    setUpdating(true)
    try {
      const payload: { username: string; is_locked: boolean; mfa_required: boolean; password?: string } = {
        username: editUsername.trim(),
        is_locked: editLocked,
        mfa_required: editMfa,
      }
      if (editPassword.trim()) {
        payload.password = editPassword
      }

      await api.updateSeedUser(editingId, payload)
      const userRows = await api.listSeedUsers(300)
      setUsers(userRows)
      setStatus(`User #${editingId} updated at ${new Date().toLocaleTimeString()}`)
      setError(null)
      cancelEdit()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user.')
    } finally {
      setUpdating(false)
    }
  }

  const confirmDeleteUser = async () => {
    if (deleteCandidate === null) {
      return
    }

    const userId = deleteCandidate.id
    setDeletingUserId(userId)
    try {
      await api.deleteSeedUser(userId)
      const userRows = await api.listSeedUsers(300)
      setUsers(userRows)
      setStatus(`User #${userId} removed at ${new Date().toLocaleTimeString()}`)
      setError(null)
      if (editingId === userId) {
        cancelEdit()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove user.')
    } finally {
      setDeletingUserId(null)
      setDeleteCandidate(null)
    }
  }

  return (
    <section>
      <div className="panel-header">
        <h2>Seed Database</h2>
        <p>Live view of the SQLite data currently used as the active seeding source.</p>
      </div>

      <article className="panel seed-hero-panel">
        <div>
          <h3>Seeding Console</h3>
          <p>
            Manage the active user seed set with consistent controls, compact tables, and a scrollable record view.
          </p>
        </div>
        <div className="seed-hero-meta">
          <span className={`chip seed-status-chip ${data.database_path ? 'seed-status-online' : 'seed-status-offline'}`}>
            {data.database_path ? 'Connected' : 'Offline'}
          </span>
          <span className="chip">Visible rows: 20</span>
          <span className="chip">Filtered users: {filteredUsers.length}</span>
        </div>
      </article>

      <div className="kpi-grid kpi-grid-six seed-kpi-grid">
        <article className="kpi-card seed-kpi-primary"><span>Template Users</span><strong>{data.seed_template.total_users}</strong></article>
        <article className="kpi-card seed-kpi-secondary"><span>Live Users</span><strong>{users.length}</strong></article>
        <article className="kpi-card seed-kpi-critical"><span>Locked Users</span><strong>{lockedCount}</strong></article>
        <article className="kpi-card seed-kpi-accent"><span>MFA Required</span><strong>{mfaCount}</strong></article>
        <article className="kpi-card"><span>User Delta</span><strong>{users.length - data.seed_template.total_users}</strong></article>
        <article className="kpi-card"><span>Rows in Filter</span><strong>{filteredUsers.length}</strong></article>
      </div>

      <p className="sync-meta">{status}</p>
      {error && <p className="error-banner">{error}</p>}

      <div className="seed-page-layout">
        <main className="seed-main-column">
          <article className="panel seed-filter-panel">
            <div className="seed-filter-group">
              <span className="sync-meta">Live user filter</span>
              <div className="button-row">
                <button className={`seed-filter-button ${userFilter === 'all' ? 'seed-filter-active' : ''}`} onClick={() => setUserFilter('all')}>All</button>
                <button className={`seed-filter-button ${userFilter === 'locked' ? 'seed-filter-active' : ''}`} onClick={() => setUserFilter('locked')}>Locked</button>
                <button className={`seed-filter-button ${userFilter === 'mfa' ? 'seed-filter-active' : ''}`} onClick={() => setUserFilter('mfa')}>MFA Required</button>
              </div>
            </div>

            <div className="seed-filter-metrics">
              <span className="chip">Visible users: {filteredUsers.length}</span>
              <span className="chip">Template users: {data.seed_template.total_users}</span>
              <span className="chip">Locked: {lockedCount}</span>
              <span className="chip">MFA: {mfaCount}</span>
            </div>
          </article>

          <article className="panel">
            <div className="panel-header panel-header-row seed-section-header">
              <div>
                <h3>Active Seed Users</h3>
                <p>The primary table stays centered and compact with a 20-row viewport for faster scanning.</p>
              </div>
              <div className="button-row seed-table-actions">
                <span className="seed-action-hint">Scroll to review all {filteredUsers.length} matching rows</span>
              </div>
            </div>
            <div className="table-wrap seed-user-table-wrap">
              <table className="seed-user-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Locked</th>
                    <th>MFA</th>
                    <th className="seed-actions-col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className={editingId === user.id ? 'row-selected' : ''}>
                      <td>{user.id}</td>
                      <td>{user.username}</td>
                      <td>
                        <span className={`seed-pill ${user.is_locked ? 'seed-pill-danger' : 'seed-pill-neutral'}`}>
                          {user.is_locked ? 'Locked' : 'Open'}
                        </span>
                      </td>
                      <td>
                        <span className={`seed-pill ${user.mfa_required ? 'seed-pill-danger' : 'seed-pill-neutral'}`}>
                          {user.mfa_required ? 'Required' : 'Off'}
                        </span>
                      </td>
                      <td className="seed-actions-col">
                        <div className="button-row seed-action-row">
                          <button type="button" className="seed-btn seed-btn-edit" onClick={() => beginEdit(user)}>
                            <span className="material-symbols-outlined seed-btn-icon">edit</span>
                            Edit
                          </button>
                          <button
                            type="button"
                            className="seed-btn seed-btn-remove"
                            onClick={() => setDeleteCandidate(user)}
                            disabled={deletingUserId === user.id}
                          >
                            <span className="material-symbols-outlined seed-btn-icon">delete</span>
                            {deletingUserId === user.id ? 'Removing...' : 'Remove'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!filteredUsers.length && (
                    <tr>
                      <td colSpan={5}>No users match the selected filter.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </main>

        <aside className="seed-sidebar">
          <article className="panel seed-sidebar-card">
            <h3>Add User For Seeding</h3>
            <div className="form-grid seed-form-grid">
              <label>
                Username
                <input value={newUsername} onChange={(event) => setNewUsername(event.target.value)} placeholder="e.g. nora" />
              </label>
              <label>
                Password
                <input value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="password123" />
              </label>
              <label className="seed-checkbox-row">
                <input type="checkbox" checked={newLocked} onChange={(event) => setNewLocked(event.target.checked)} />
                Locked account
              </label>
              <label className="seed-checkbox-row">
                <input type="checkbox" checked={newMfa} onChange={(event) => setNewMfa(event.target.checked)} />
                MFA required
              </label>
              <div className="button-row seed-sidebar-actions">
                <button type="button" className="seed-btn seed-btn-primary" onClick={createUser} disabled={creating}>
                  <span className="material-symbols-outlined seed-btn-icon">add</span>
                  {creating ? 'Adding...' : 'Add User'}
                </button>
              </div>
            </div>
          </article>

          <article className="panel seed-sidebar-card">
            <h3>{editingId === null ? 'Select User To Edit' : `Edit User #${editingId}`}</h3>
            {editingId === null ? (
              <p className="sync-meta">Choose a row from the table to edit username, password, or flags.</p>
            ) : (
              <div className="form-grid seed-form-grid">
                <label>
                  Username
                  <input value={editUsername} onChange={(event) => setEditUsername(event.target.value)} />
                </label>
                <label>
                  New Password (optional)
                  <input value={editPassword} onChange={(event) => setEditPassword(event.target.value)} placeholder="Leave blank to keep current" />
                </label>
                <label className="seed-checkbox-row">
                  <input type="checkbox" checked={editLocked} onChange={(event) => setEditLocked(event.target.checked)} />
                  Locked account
                </label>
                <label className="seed-checkbox-row">
                  <input type="checkbox" checked={editMfa} onChange={(event) => setEditMfa(event.target.checked)} />
                  MFA required
                </label>
                <div className="button-row seed-sidebar-actions">
                  <button type="button" className="seed-btn seed-btn-primary" onClick={saveUserEdit} disabled={updating}>
                    <span className="material-symbols-outlined seed-btn-icon">save</span>
                    {updating ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button type="button" className="seed-btn seed-btn-ghost" onClick={cancelEdit} disabled={updating}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </article>
        </aside>
      </div>

      {deleteCandidate && (
        <div className="modal-backdrop" role="presentation" onClick={cancelDelete}>
          <article className="panel modal-card" role="dialog" aria-modal="true" aria-labelledby="delete-user-title" onClick={(event) => event.stopPropagation()}>
            <h3 id="delete-user-title">Remove User</h3>
            <p className="sync-meta">
              Delete {deleteCandidate.username} from the seed database? This also removes any active session rows for that user.
            </p>
            <div className="button-row">
              <button type="button" onClick={confirmDeleteUser} disabled={deletingUserId === deleteCandidate.id}>
                {deletingUserId === deleteCandidate.id ? 'Removing...' : 'Confirm Delete'}
              </button>
              <button type="button" onClick={cancelDelete} disabled={deletingUserId === deleteCandidate.id}>
                Cancel
              </button>
            </div>
          </article>
        </div>
      )}
    </section>
  )
}
