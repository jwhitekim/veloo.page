import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../api/translator'

const C = {
  bg:         'var(--c-bg)',
  surface:    'var(--c-surface)',
  card:       'var(--c-card)',
  border:     'var(--c-border)',
  accent:     'var(--c-accent)',
  accentDim:  'var(--c-accent-dim)',
  accentText: 'var(--c-accent-txt)',
  text:       'var(--c-text)',
  textSub:    'var(--c-text-sub)',
  textMuted:  'var(--c-text-muted)',
  error:      'var(--c-error)',
  green:      'var(--c-green)',
  greenDim:   'var(--c-green-dim)',
}

export default function Translator() {
  const navigate = useNavigate()

  // Translation
  const [source, setSource] = useState('')
  const [streamedText, setStreamedText] = useState('')
  const [translating, setTranslating] = useState(false)
  const [error, setError] = useState('')
  const [focused, setFocused] = useState(false)

  // Word search
  const [wordQuery, setWordQuery] = useState('')

  // Dict panel
  const [dictOpen, setDictOpen] = useState(false)
  const [dictQuery, setDictQuery] = useState('')
  const [dictEntries, setDictEntries] = useState<api.DictEntry[]>([])
  const [dictLoading, setDictLoading] = useState(false)

  // Context menu
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

    try {
      const res = await fetch('/translate/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      })
      if (!res.ok) throw new Error(`번역 오류 (${res.status})`)

      const reader = res.body!.getReader()
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
    setDictLoading(true)
    try {
      const data = await api.naverDict(word)
      setDictEntries(data.results)
    } catch {
      setDictEntries([])
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
    setSource(val)
    clearTimeout(timerRef.current)
    if (val.trim()) {
      timerRef.current = setTimeout(() => doTranslate(val), 300)
    } else {
      abortRef.current?.abort()
      setStreamedText('')
      setError('')
      setTranslating(false)
    }
  }

  return (
    <div style={{
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: C.bg,
      color: C.text,
    }}>
      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>

      {/* Top bar */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '0 20px',
        height: 50,
        borderBottom: `1px solid ${C.border}`,
        background: C.surface,
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'transparent',
            border: `1px solid ${C.border}`,
            borderRadius: 7,
            padding: '4px 11px',
            fontSize: '0.78rem',
            cursor: 'pointer',
            color: C.textMuted,
            transition: 'color 0.2s, background 0.2s',
            flexShrink: 0,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.accentText; (e.currentTarget as HTMLElement).style.background = C.accentDim }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.textMuted; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >← Home</button>

        <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: C.textMuted }}>
          Translation Studio
        </span>

        <div style={{ flex: 1 }} />

        {/* Word search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.72rem', color: C.textMuted, letterSpacing: '0.5px', flexShrink: 0 }}>단어</span>
          <input
            value={wordQuery}
            onChange={e => setWordQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doWordSearch()}
            placeholder="단어 검색..."
            style={{
              width: 190,
              padding: '5px 10px',
              fontSize: '0.85rem',
              background: C.bg,
              color: C.text,
              border: `1px solid ${C.border}`,
              borderRadius: 7,
              outline: 'none',
              fontFamily: 'inherit',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
            onBlur={e => (e.currentTarget.style.borderColor = C.border)}
          />
          <button
            onClick={doWordSearch}
            disabled={!wordQuery.trim()}
            style={{
              padding: '5px 13px',
              fontSize: '0.82rem',
              fontWeight: 600,
              fontFamily: 'inherit',
              background: wordQuery.trim() ? C.accentDim : 'transparent',
              color: wordQuery.trim() ? C.accentText : C.textMuted,
              border: `1px solid ${wordQuery.trim() ? C.accent : C.border}`,
              borderRadius: 7,
              cursor: wordQuery.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s',
              flexShrink: 0,
            }}
          >
            사전 검색
          </button>
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Translation panels */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: C.surface }}>
          {/* EN */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{
              padding: '8px 16px',
              fontSize: '0.72rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
              color: C.textMuted, borderBottom: `1px solid ${C.border}`, flexShrink: 0,
            }}>English</div>
            <textarea
              value={source}
              onChange={e => handleInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  e.preventDefault()
                  clearTimeout(timerRef.current)
                  doTranslate(source)
                }
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={'텍스트를 입력하면 자동 번역됩니다.\nCtrl+Enter → 즉시 번역  /  텍스트 선택 후 우클릭 → 사전 검색'}
              style={{
                flex: 1,
                border: 'none',
                resize: 'none',
                padding: 18,
                fontSize: 15,
                lineHeight: 2.0,
                fontFamily: 'inherit',
                background: 'transparent',
                color: C.text,
                outline: 'none',
                boxShadow: focused ? `inset 0 0 0 2px rgba(177,156,217,0.25)` : 'none',
                transition: 'box-shadow 0.2s',
              }}
            />
          </div>

          {/* Divider */}
          <div style={{ width: 1, background: C.border, flexShrink: 0 }} />

          {/* KO */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{
              padding: '8px 16px',
              fontSize: '0.72rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
              color: C.textMuted, borderBottom: `1px solid ${C.border}`, flexShrink: 0,
            }}>Korean</div>
            <div style={{ flex: 1, padding: 18, overflowY: 'auto' }}>
              {translating && !streamedText && (
                <span style={{ color: C.textMuted, fontSize: 14 }}>번역 중...</span>
              )}
              {error && (
                <span style={{ color: C.error, fontSize: 14 }}>{error}</span>
              )}
              {streamedText && (
                <div style={{ fontSize: 15, color: C.text, lineHeight: 2.0, whiteSpace: 'pre-wrap' }}>
                  {streamedText}
                  {translating && (
                    <span style={{
                      display: 'inline-block',
                      width: 2, height: '1.1em',
                      background: C.accent,
                      marginLeft: 3,
                      verticalAlign: 'text-bottom',
                      animation: 'blink 0.9s step-end infinite',
                    }} />
                  )}
                </div>
              )}
              {!translating && !error && !streamedText && (
                <span style={{ color: C.textMuted, fontSize: 14 }}>번역 결과가 여기에 표시됩니다</span>
              )}
            </div>
          </div>
        </div>

        {/* Dict panel */}
        <div style={{
          width: dictOpen ? 380 : 0,
          overflow: 'hidden',
          transition: 'width 0.3s ease',
          borderLeft: `1px solid ${C.border}`,
          background: C.surface,
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}>
          <div style={{ width: 380, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{
              padding: '14px 18px',
              borderBottom: `1px solid ${C.border}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: C.text }}>
                사전 — <span style={{ color: C.accentText }}>{dictQuery}</span>
              </span>
              <button
                onClick={() => setDictOpen(false)}
                style={{ border: 'none', background: 'none', fontSize: 16, cursor: 'pointer', color: C.textMuted, lineHeight: 1 }}
              >✕</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: '6px 0' }}>
              {dictLoading && <p style={{ padding: '16px 18px', color: C.textMuted, fontSize: 14 }}>검색 중...</p>}
              {!dictLoading && dictEntries.length === 0 && (
                <p style={{ padding: '16px 18px', color: C.textMuted, fontSize: 14 }}>검색 결과 없음</p>
              )}
              {dictEntries.map((item, i) => (
                <div key={i} style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 17, color: C.accentText }}>{item.entry}</span>
                    <span style={{ fontSize: 13, color: C.textMuted }} dangerouslySetInnerHTML={{ __html: item.phonetic }} />
                  </div>
                  {item.senses.map((s, j) => (
                    <div key={j} style={{ marginTop: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: '0.7rem', color: C.green, background: C.greenDim, padding: '2px 7px', borderRadius: 4, fontWeight: 700 }}>{s.pos}</span>
                        <span style={{ fontSize: '0.9rem', color: C.text }} dangerouslySetInnerHTML={{ __html: s.value }} />
                      </div>
                      {s.exampleOri && (
                        <div style={{ marginTop: 4, paddingLeft: 10, borderLeft: `2px solid ${C.border}`, fontSize: '0.78rem', lineHeight: 1.65 }}>
                          <div style={{ color: C.textSub }} dangerouslySetInnerHTML={{ __html: s.exampleOri }} />
                          <div style={{ color: C.textMuted }}>{s.exampleTrans}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Context menu */}
      {ctxVisible && (
        <div
          style={{ position: 'fixed', left: ctxPos.x, top: ctxPos.y, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 9999, minWidth: 180, overflow: 'hidden' }}
          onClick={() => setCtxVisible(false)}
        >
          <button
            style={{ display: 'block', width: '100%', padding: '10px 16px', background: 'none', border: 'none', textAlign: 'left', fontSize: 14, color: C.text, cursor: 'pointer', fontFamily: 'inherit' }}
            onMouseEnter={e => (e.currentTarget.style.background = C.accentDim)}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            onClick={() => { openDict(ctxWord); setCtxVisible(false) }}
          >네이버 사전에서 검색</button>
        </div>
      )}
      {ctxVisible && <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={() => setCtxVisible(false)} />}
    </div>
  )
}
