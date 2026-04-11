import { useState } from 'react'
import type { FormEvent } from 'react'

import { api } from '../lib/api'

type LoginPageProps = {
  onLoginSuccess: (username: string) => void
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [mode, setMode] = useState<'signin' | 'create'>('signin')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [welcomeName, setWelcomeName] = useState<string | null>(null)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!username.trim() || !password) {
      setError('Username and password are required.')
      return
    }

    setBusy(true)
    try {
      const trimmedUsername = username.trim()

      if (mode === 'create') {
        await api.createAuthUser({
          username: trimmedUsername,
          password,
          display_name: displayName.trim() || undefined,
        })
      }

      const payload = await api.authLogin({ username: trimmedUsername, password })
      setError(null)
      const resolvedDisplayName = payload.display_name || payload.username
      setWelcomeName(resolvedDisplayName)
      window.setTimeout(() => {
        onLoginSuccess(resolvedDisplayName)
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="login-screen">
      <article className="login-card">
        <header className="login-header">
          <h1>SentinelAuth</h1>
          <p>{mode === 'signin' ? 'Sign in to access the Obsidian Sentinel control plane.' : 'Create a new analyst account in the auth database.'}</p>
        </header>

        {welcomeName ? (
          <div className="login-welcome">
            <h2>Welcome, {welcomeName}</h2>
            <p>Loading SentinelAuth...</p>
          </div>
        ) : (
          <form className="login-form" onSubmit={submit}>
          <div className="login-mode-toggle">
            <button
              type="button"
              className={mode === 'signin' ? 'login-mode-btn active' : 'login-mode-btn'}
              onClick={() => {
                setMode('signin')
                setError(null)
              }}
            >
              Sign in
            </button>
            <button
              type="button"
              className={mode === 'create' ? 'login-mode-btn active' : 'login-mode-btn'}
              onClick={() => {
                setMode('create')
                setError(null)
              }}
            >
              Create user
            </button>
          </div>

          <label>
            Username
            <input
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter username"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
            />
          </label>

          {mode === 'create' && (
            <label>
              Visible Name (optional)
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="How your name should appear"
              />
            </label>
          )}

          {error && <p className="error-banner">{error}</p>}

          <button className="login-submit" type="submit" disabled={busy}>
            {busy ? (mode === 'signin' ? 'Signing in...' : 'Creating account...') : (mode === 'signin' ? 'Sign in' : 'Create user & Sign in')}
          </button>
          </form>
        )}
      </article>
    </section>
  )
}
