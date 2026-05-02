import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        navigate('/')
      } else {
        const data = await res.json()
        setError(data.error ?? '비밀번호가 틀렸습니다.')
      }
    } catch {
      setError('서버 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--c-bg)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <div style={{
        width: '100%',
        maxWidth: 340,
        padding: '36px 32px',
        background: 'var(--c-surface)',
        border: '1px solid var(--c-border)',
        borderRadius: 16,
      }}>
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--c-text-muted)' }}>
            Lab Toolkit
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="비밀번호"
            autoFocus
            style={{
              width: '100%',
              padding: '10px 14px',
              fontSize: '0.93rem',
              background: 'var(--c-bg)',
              color: 'var(--c-text)',
              border: '1px solid var(--c-border)',
              borderRadius: 8,
              outline: 'none',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--c-accent)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--c-border)')}
          />

          {error && (
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--c-error)' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={!password || loading}
            style={{
              padding: '10px',
              fontSize: '0.88rem',
              fontWeight: 600,
              fontFamily: 'inherit',
              background: loading || !password ? 'rgba(177,156,217,0.4)' : 'rgba(177,156,217,0.85)',
              color: '#0f0f14',
              border: 'none',
              borderRadius: 8,
              cursor: !password || loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {loading ? '확인 중...' : '입장'}
          </button>
        </form>
      </div>
    </div>
  )
}
