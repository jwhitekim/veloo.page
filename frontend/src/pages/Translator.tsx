import { useState, useRef, useEffect, useCallback } from 'react'
import AppHeader from '../components/AppHeader'
import { SessionExpiredMessage } from '../components/SessionExpiredMessage'
import * as api from '../api/translator'

function stripHtml(html: string): string {
  const el = document.createElement('div')
  el.innerHTML = html
  return el.textContent ?? ''
}

const MAX_CHARS = 5000

const LEVEL_STYLE: Record<string, { background: string; color: string }> = {
  beginner:     { background: '#e6f4ea', color: '#137333' },
  intermediate: { background: '#e8f0fe', color: '#1a73e8' },
  general:      { background: '#f1f3f4', color: '#5f6368' },
}

export default function Translator() {
  const [source, setSource] = useState('')
  const [streamedText, setStreamedText] = useState('')
  const [translating, setTranslating] = useState(false)
  const [error, setError] = useState('')
  const [sessionExpired, setSessionExpired] = useState(false)
  const [copied, setCopied] = useState(false)

  const [wordQuery, setWordQuery] = useState('')

  const [dictOpen, setDictOpen] = useState(false)
  const [dictQuery, setDictQuery] = useState('')
  const [dictResult, setDictResult] = useState<api.DictResult | null>(null)
  const [dictLoading, setDictLoading] = useState(false)
  const [dictTab, setDictTab] = useState<'definitions' | 'examples'>('definitions')

  const [ctxVisible, setCtxVisible] = useState(false)
  const [ctxPos, setCtxPos] = useState({ x: 0, y: 0 })
  const [ctxWord, setCtxWord] = useState('')

  const cachedSelRef = useRef('')
  const timerRef = useRef<ReturnType<typeof setTimeout>>()
  const abortRef = useRef<AbortController | null>(null)

  const doTranslate = useCallback(async (text: string) => {
    if (!text.trim()) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setTranslating(true)
    setStreamedText('')
    setError('')
    setSessionExpired(false)
    try {
      const res = await fetch('/translate/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      })
      if (res.status === 401) {
        setSessionExpired(true)
        setTranslating(false)
        return
      }
      if (!res.ok) throw new Error(`번역 오류 (${res.status})`)
      if (!res.body) throw new Error('스트리밍을 지원하지 않는 환경입니다.')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        setStreamedText(prev => prev + decoder.decode(value, { stream: true }))
      }
      setTranslating(false)
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return
      setError((e as Error).message)
      setStreamedText('')
      setTranslating(false)
    }
  }, [])

  const openDict = async (word: string) => {
    if (!word.trim()) return
    setDictQuery(word)
    setDictOpen(true)
    setDictTab('definitions')
    setDictLoading(true)
    try {
      const data = await api.naverDict(word)
      setDictResult(data)
    } catch {
      setDictResult(null)
    } finally {
      setDictLoading(false)
    }
  }

  const doWordSearch = () => {
    if (wordQuery.trim()) {
      openDict(wordQuery.trim())
      setWordQuery('')
    }
  }

  const handleCopy = async () => {
    if (!streamedText) return
    await navigator.clipboard.writeText(streamedText)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleClear = () => {
    abortRef.current?.abort()
    setSource('')
    setStreamedText('')
    setError('')
    setSessionExpired(false)
    setTranslating(false)
  }

  useEffect(() => {
    return () => { abortRef.current?.abort() }
  }, [])

  useEffect(() => {
    const onMouseUp = () => {
      cachedSelRef.current = window.getSelection()?.toString().trim() ?? ''
    }
    const onCtx = (e: MouseEvent) => {
      if (!cachedSelRef.current) return
      e.preventDefault()
      setCtxWord(cachedSelRef.current)
      setCtxPos({ x: e.clientX, y: e.clientY })
      setCtxVisible(true)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setCtxVisible(false); setDictOpen(false) }
    }
    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('contextmenu', onCtx, true)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('contextmenu', onCtx, true)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const handleInput = (val: string) => {
    const clamped = val.slice(0, MAX_CHARS)
    setSource(clamped)
    clearTimeout(timerRef.current)
    if (clamped.trim()) {
      timerRef.current = setTimeout(() => doTranslate(clamped), 300)
    } else {
      abortRef.current?.abort()
      setStreamedText('')
      setError('')
      setSessionExpired(false)
      setTranslating(false)
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
      background: '#ffffff',
      fontFamily: 'var(--font-sans)',
      color: '#202124',
    }}>
      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }
        @keyframes gt-spin { to { transform: rotate(360deg) } }
        .gt-source-ta::placeholder { color: #80868b; }
        .gt-icon-btn {
          border: none; background: none; cursor: pointer;
          border-radius: 50%; padding: 8px;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s; color: #5f6368;
        }
        .gt-icon-btn:hover { background: #f1f3f4; }
        .gt-icon-btn:disabled { opacity: 0.38; cursor: default; }
        .gt-icon-btn:disabled:hover { background: none; }
        .gt-lang-btn {
          font-size: 14px; font-weight: 500; padding: 8px 12px;
          border: none; border-bottom: 2px solid transparent;
          border-radius: 0; background: transparent;
          color: #5f6368; cursor: pointer; transition: background 0.15s;
          font-family: inherit;
        }
        .gt-lang-btn:hover:not(.active) { background: #f1f3f4; border-radius: 4px; }
        .gt-lang-btn.active { color: #1a73e8; border-bottom: 2px solid #1a73e8; }
        .dict-tab {
          padding: 8px 16px; font-size: 14px; font-weight: 500;
          border: none; border-bottom: 2px solid transparent;
          background: transparent; color: #5f6368;
          cursor: pointer; font-family: inherit;
        }
        .dict-tab.active { color: #1a73e8; border-bottom: 2px solid #1a73e8; }
        .dict-close {
          background: transparent; border: none; font-size: 18px;
          color: #5f6368; cursor: pointer; padding: 4px 8px;
          border-radius: 4px; line-height: 1; flex-shrink: 0;
        }
        .dict-close:hover { background: #f1f3f4; }
        .dict-search-input {
          width: 360px; padding: 7px 14px 7px 34px;
          font-size: 14px; border: 1.5px solid #dadce0;
          border-radius: 4px; outline: none;
          background: #ffffff; color: #202124;
          transition: border-color 0.15s; font-family: inherit;
        }
        .dict-search-input::placeholder { color: #80868b; }
        .dict-search-input:hover { border-color: #bdc1c6; }
        .dict-search-input:focus { border-color: #1a73e8; border-width: 2px; }
        .gt-dict-entry:hover { background: #f8f9fa; }
      `}</style>

      {/* 헤더 — 전체 너비 */}
      <AppHeader
        title="번역"
        right={
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="#80868b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ position: 'absolute', left: 10, pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="dict-search-input"
              value={wordQuery}
              onChange={e => setWordQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doWordSearch()}
              placeholder="단어 검색..."
            />
          </div>
        }
      />

      {/* 바디 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>

          {/* 언어 바 — 전체 너비 */}
          <div style={{
            display: 'flex', alignItems: 'center',
            padding: '0 16px', height: 52,
            borderBottom: '1px solid #dadce0',
            flexShrink: 0, background: '#ffffff',
          }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
              <button className="gt-lang-btn">언어 감지</button>
              <button className="gt-lang-btn active">영어</button>
              <button className="gt-lang-btn">일본어</button>
            </div>
            <button disabled style={{
              width: 40, height: 40, border: '1px solid #dadce0', borderRadius: '50%',
              background: '#fff', cursor: 'default', opacity: 0.45,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#5f6368">
                <path d="M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z"/>
              </svg>
            </button>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4, paddingLeft: 8 }}>
              <button className="gt-lang-btn active">한국어</button>
              <button className="gt-lang-btn">영어</button>
              <button className="gt-lang-btn">일본어</button>
            </div>
          </div>

          {/* 패널 영역 */}
          <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>

          {/* 소스 패널 */}
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            background: '#f8f9fa', borderRight: '1px solid #dadce0', minWidth: 0,
          }}>
            <textarea
              className="gt-source-ta"
              value={source}
              onChange={e => handleInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  e.preventDefault()
                  clearTimeout(timerRef.current)
                  doTranslate(source)
                }
              }}
              placeholder="텍스트 입력"
              style={{
                flex: 1, border: 'none', resize: 'none',
                padding: '16px 24px', fontSize: 20, lineHeight: 1.75,
                fontFamily: 'inherit', background: 'transparent',
                color: '#202124', outline: 'none', minHeight: 0,
              }}
            />
            {/* 소스 하단 바 */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0 16px', height: 44, flexShrink: 0,
              borderTop: '1px solid #dadce0',
            }}>
              <span style={{ fontSize: 12, color: '#80868b' }}>
                {source.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
              </span>
              {source && (
                <button className="gt-icon-btn" onClick={handleClear} title="지우기">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* 결과 패널 */}
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            background: '#ffffff', minWidth: 0,
          }}>
            <div style={{ flex: 1, padding: '16px 24px', overflowY: 'auto' }}>
              {sessionExpired && <SessionExpiredMessage redirectTo="/translate" />}
              {!sessionExpired && translating && !streamedText && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="#1a73e8" strokeWidth="2.5"
                    style={{ animation: 'gt-spin 0.8s linear infinite', flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                  <span style={{ color: '#9aa0a6', fontSize: 16 }}>번역 중...</span>
                </div>
              )}
              {!sessionExpired && error && (
                <span style={{ color: '#d93025', fontSize: 15 }}>{error}</span>
              )}
              {!sessionExpired && streamedText && (
                <div style={{ fontSize: 20, color: '#1a73e8', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                  {streamedText}
                  {translating && (
                    <span style={{
                      display: 'inline-block', width: 2, height: '1.1em',
                      background: '#1a73e8', marginLeft: 3,
                      verticalAlign: 'text-bottom',
                      animation: 'blink 0.9s step-end infinite',
                    }} />
                  )}
                </div>
              )}
              {!sessionExpired && !translating && !error && !streamedText && (
                <span style={{ color: '#80868b', fontSize: 20 }}>번역 결과</span>
              )}
            </div>
            {/* 결과 하단 바 */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
              padding: '0 16px', height: 44, flexShrink: 0,
              borderTop: '1px solid #dadce0',
            }}>
              <button
                className="gt-icon-btn"
                onClick={handleCopy}
                disabled={!streamedText || translating}
                title={copied ? '복사됨!' : '복사'}
                style={{ color: copied ? '#1a73e8' : '#5f6368' }}
              >
                {copied ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* ── 우측 사전 컬럼 ── */}
          {dictOpen && (
          <div style={{
            width: 360, flexShrink: 0,
            borderLeft: '1px solid #dadce0',
            background: '#ffffff',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* 사전 헤더 */}
            <div style={{ padding: '18px 18px 0', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 22, color: '#202124', lineHeight: 1.3 }}>{dictQuery}</div>
                  {dictResult?.phonetic && (
                    <div style={{ fontSize: 13, color: '#5f6368', marginTop: 2 }}>{stripHtml(dictResult.phonetic)}</div>
                  )}
                </div>
                <button className="dict-close" onClick={() => setDictOpen(false)}>×</button>
              </div>
              <div style={{ display: 'flex', borderBottom: '1px solid #dadce0', marginTop: 12 }}>
                <button className={`dict-tab${dictTab === 'definitions' ? ' active' : ''}`} onClick={() => setDictTab('definitions')}>정의</button>
                <button className={`dict-tab${dictTab === 'examples' ? ' active' : ''}`} onClick={() => setDictTab('examples')}>예문</button>
              </div>
            </div>

            {/* 탭 컨텐츠 */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 18px' }}>
              {dictLoading && <p style={{ color: '#9aa0a6', fontSize: 14 }}>검색 중...</p>}
              {!dictLoading && !dictResult && <p style={{ color: '#9aa0a6', fontSize: 14 }}>검색 결과 없음</p>}

              {!dictLoading && dictResult && dictTab === 'definitions' && (
                (dictResult.definitions ?? []).length === 0
                  ? <p style={{ color: '#9aa0a6', fontSize: 14 }}>정의 없음</p>
                  : (dictResult.definitions ?? []).map((d, i) => (
                    <div key={i} className="gt-dict-entry" style={{
                      padding: '8px 0', borderBottom: '1px solid #f1f3f4',
                      display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
                    }}>
                      <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 4, background: '#e8f0fe', color: '#1a73e8' }}>{d.pos}</span>
                      {d.level && (
                        <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 4, ...(LEVEL_STYLE[d.level] ?? LEVEL_STYLE.general) }}>{d.level}</span>
                      )}
                      <span style={{ fontSize: 14, color: '#202124' }}>{d.value}</span>
                    </div>
                  ))
              )}

              {!dictLoading && dictResult && dictTab === 'examples' && (
                (dictResult.examples ?? []).length === 0
                  ? <p style={{ color: '#9aa0a6', fontSize: 14 }}>예문 없음</p>
                  : (dictResult.examples ?? []).map((ex, i) => (
                    <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #dadce0' }}>
                      <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 4, background: '#e8f0fe', color: '#1a73e8', display: 'inline-block', marginBottom: 6 }}>{ex.pos}</span>
                      <div style={{ fontSize: 14, color: '#202124', marginBottom: 4 }}>{ex.ori}</div>
                      <div style={{ fontSize: 13, color: '#5f6368' }}>{ex.trans}</div>
                    </div>
                  ))
              )}
            </div>
          </div>
          )}

          </div>{/* end 패널 영역 */}

      </div>

      {/* 컨텍스트 메뉴 */}
      {ctxVisible && (
        <div style={{
          position: 'fixed', left: ctxPos.x, top: ctxPos.y,
          background: '#fff', border: '1px solid #dadce0',
          borderRadius: 8, zIndex: 9999, minWidth: 180,
          overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
        }} onClick={() => setCtxVisible(false)}>
          <button style={{
            display: 'block', width: '100%', padding: '10px 16px',
            background: 'none', border: 'none', textAlign: 'left',
            fontSize: 14, color: '#202124', cursor: 'pointer', fontFamily: 'inherit',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f1f3f4')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            onClick={() => { openDict(ctxWord); setCtxVisible(false) }}
          >네이버 사전에서 검색</button>
        </div>
      )}
      {ctxVisible && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={() => setCtxVisible(false)} />
      )}
    </div>
  )
}
