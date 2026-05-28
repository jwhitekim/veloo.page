import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [mode, setMode] = useState<'landing' | 'form'>('landing')
  const [heroVisible, setHeroVisible] = useState(true)
  const [formVisible, setFormVisible] = useState(false)

  const enterForm = () => {
    setHeroVisible(false)
    setTimeout(() => {
      setMode('form')
      requestAnimationFrame(() => requestAnimationFrame(() => setFormVisible(true)))
    }, 200)
  }

  const exitForm = () => {
    setError('')
    setPassword('')
    setFormVisible(false)
    setTimeout(() => {
      setMode('landing')
      requestAnimationFrame(() => requestAnimationFrame(() => setHeroVisible(true)))
    }, 200)
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mode === 'form') exitForm()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) return
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

  const heroTransition = heroVisible
    ? 'opacity 250ms 150ms, transform 250ms 150ms'
    : 'opacity 200ms, transform 200ms'

  const formTransition = formVisible
    ? 'opacity 250ms 150ms, transform 250ms 150ms'
    : 'opacity 200ms, transform 200ms'

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-base)',
      fontFamily: 'var(--font-sans)',
    }}>
      {/* Wordmark — 상단 좌측 */}
      <div style={{ padding: '24px 32px', flexShrink: 0 }}>
        <span style={{
          fontSize: 18, fontWeight: 700, color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
        }}>
          veloo
        </span>
      </div>

      {/* 중앙 콘텐츠 */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 24px',
      }}>
        {mode === 'landing' ? (
          <div style={{
            textAlign: 'center',
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? 'translateY(0)' : 'translateY(-12px)',
            transition: heroTransition,
          }}>
            {/* 배지 */}
            <div style={{
              display: 'inline-flex', alignItems: 'center',
              border: '1px solid var(--border-subtle)',
              borderRadius: 9999,
              padding: '4px 14px',
              fontSize: 12,
              color: 'var(--text-disabled)',
              marginBottom: 36,
              letterSpacing: '0.02em',
            }}>
              Private Access
            </div>

            {/* 히어로 텍스트 */}
            <div style={{ marginBottom: 44 }}>
              <div style={{
                fontSize: 'clamp(36px, 6vw, 52px)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                lineHeight: 1.15,
                letterSpacing: '-0.025em',
              }}>
                Research Toolkit
              </div>
              <div style={{
                fontSize: 'clamp(36px, 6vw, 52px)',
                fontWeight: 400,
                color: 'var(--text-secondary)',
                lineHeight: 1.15,
                letterSpacing: '-0.025em',
              }}>
                For the Lab
              </div>
            </div>

            {/* Enter 버튼 */}
            <button
              onClick={enterForm}
              style={{
                background: 'var(--c-login-btn)',
                color: 'var(--c-login-btn-text)',
                border: 'none',
                borderRadius: 9999,
                padding: '12px 36px',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                letterSpacing: '0.01em',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Enter
            </button>
          </div>
        ) : (
          <div style={{
            width: '100%',
            maxWidth: 320,
            opacity: formVisible ? 1 : 0,
            transform: formVisible ? 'translateY(0)' : 'translateY(-12px)',
            transition: formTransition,
          }}>
            <div style={{ marginBottom: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
              비밀번호를 입력하세요
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '0.93rem',
                  background: 'var(--bg-base)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  outline: 'none',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--text-primary)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
              />

              {error && (
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--c-error)' }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '10px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  background: loading || !password ? 'var(--c-login-btn-off)' : 'var(--c-login-btn)',
                  color: 'var(--c-login-btn-text)',
                  border: 'none',
                  borderRadius: 8,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                {loading ? '확인 중...' : '로그인'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* 푸터 */}
      <div style={{
        padding: '24px',
        textAlign: 'center',
        fontSize: 12,
        color: 'var(--text-disabled)',
        flexShrink: 0,
      }}>
        © 2026 veloo. All rights reserved.
      </div>
    </div>
  )
}
