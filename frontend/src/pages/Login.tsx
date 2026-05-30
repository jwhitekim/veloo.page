import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

type Screen = 'landing' | 'login' | 'register'

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)

  const [screen, setScreen] = useState<Screen>('landing')
  const [heroVisible, setHeroVisible] = useState(true)
  const [formVisible, setFormVisible] = useState(false)

  const redirectTo = (() => {
    const value = searchParams.get('redirect')
    return value?.startsWith('/') && !value.startsWith('//') ? value : '/'
  })()

  const resetFields = () => {
    setUsername('')
    setPassword('')
    setError('')
    setRegistered(false)
  }

  const enterForm = (target: Screen = 'login') => {
    setHeroVisible(false)
    setTimeout(() => {
      setScreen(target)
      requestAnimationFrame(() => requestAnimationFrame(() => setFormVisible(true)))
    }, 200)
  }

  const exitForm = () => {
    resetFields()
    setFormVisible(false)
    setTimeout(() => {
      setScreen('landing')
      requestAnimationFrame(() => requestAnimationFrame(() => setHeroVisible(true)))
    }, 200)
  }

  const switchForm = (target: 'login' | 'register') => {
    resetFields()
    setFormVisible(false)
    setTimeout(() => {
      setScreen(target)
      requestAnimationFrame(() => requestAnimationFrame(() => setFormVisible(true)))
    }, 200)
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && screen !== 'landing') exitForm()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [screen])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (res.ok) {
        navigate(redirectTo)
      } else {
        const data = await res.json()
        setError(res.status === 403 ? '관리자 승인 대기 중입니다.' : (data.error ?? '로그인에 실패했습니다.'))
      }
    } catch {
      setError('서버 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (res.ok) {
        setRegistered(true)
      } else {
        const data = await res.json()
        setError(data.error ?? '회원가입에 실패했습니다.')
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

  const inputStyle: React.CSSProperties = {
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
  }

  const linkBtnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    fontSize: 13,
    fontFamily: 'inherit',
    textDecoration: 'underline',
    padding: 0,
  }

  return (
    <div style={{
      minHeight: '100dvh',
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
        {screen === 'landing' ? (
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
                Veloo
              </div>
              <div style={{
                fontSize: 'clamp(36px, 6vw, 52px)',
                fontWeight: 400,
                color: 'var(--text-secondary)',
                lineHeight: 1.15,
                letterSpacing: '-0.025em',
              }}>
                Enter with intent
              </div>
            </div>

            {/* Enter 버튼 */}
            <button
              onClick={() => enterForm('login')}
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
              {screen === 'login' ? '로그인' : '계정 만들기'}
            </div>

            {registered ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.7 }}>
                  가입 요청이 접수됐습니다.<br />
                  관리자 승인 후 로그인할 수 있습니다.
                </p>
                <button
                  type="button"
                  onClick={() => switchForm('login')}
                  style={{
                    padding: '10px',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    fontFamily: 'inherit',
                    background: 'var(--c-login-btn)',
                    color: 'var(--c-login-btn-text)',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                >
                  로그인으로 돌아가기
                </button>
              </div>
            ) : (
              <form
                onSubmit={screen === 'login' ? handleLogin : handleRegister}
                style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                <input
                  type="text"
                  name="username"
                  placeholder="사용자명"
                  autoComplete="username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoFocus
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--text-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                />
                <input
                  type="password"
                  name="password"
                  placeholder="비밀번호"
                  autoComplete={screen === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={inputStyle}
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
                    background: loading || !username || !password
                      ? 'var(--c-login-btn-off)'
                      : 'var(--c-login-btn)',
                    color: 'var(--c-login-btn-text)',
                    border: 'none',
                    borderRadius: 8,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'background 0.15s',
                  }}
                >
                  {loading
                    ? (screen === 'login' ? '확인 중...' : '처리 중...')
                    : (screen === 'login' ? '로그인' : '가입하기')}
                </button>

                <div style={{ textAlign: 'center', marginTop: 4, fontSize: 13, color: 'var(--text-secondary)' }}>
                  {screen === 'login' ? (
                    <>
                      계정이 없으신가요?{' '}
                      <button type="button" onClick={() => switchForm('register')} style={linkBtnStyle}>
                        회원가입
                      </button>
                    </>
                  ) : (
                    <>
                      이미 계정이 있으신가요?{' '}
                      <button type="button" onClick={() => switchForm('login')} style={linkBtnStyle}>
                        로그인
                      </button>
                    </>
                  )}
                </div>
              </form>
            )}
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
