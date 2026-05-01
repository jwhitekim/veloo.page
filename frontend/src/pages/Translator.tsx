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
  const [source, setSource] = useState('')
  const [result, setResult] = useState<api.TranslateResult | null>(null)
  const [translating, setTranslating] = useState(false)
  const [error, setError] = useState('')
  const [focused, setFocused] = useState(false)

  const [dictOpen, setDictOpen] = useState(false)
  const [dictQuery, setDictQuery] = useState('')
  const [dictEntries, setDictEntries] = useState<api.DictEntry[]>([])
  const [dictLoading, setDictLoading] = useState(false)

  const [ctxVisible, setCtxVisible] = useState(false)
  const [ctxPos, setCtxPos] = useState({ x: 0, y: 0 })
  const [ctxWord, setCtxWord] = useState('')
  const cachedSelRef = useRef('')
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  const doTranslate = useCallback(async (text: string) => {
    if (!text.trim()) return
    setTranslating(true)
    setError('')
    try {
      setResult(await api.translate(text))
    } catch (e) {
      setError((e as Error).message)
      setResult(null)
    } finally {
      setTranslating(false)
    }
  }, [])

  const openDict = async (word: string) => {
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
    if (val.trim()) timerRef.current = setTimeout(() => doTranslate(val), 500)
    else { setResult(null); setError('') }
  }

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", height: '100vh', overflow: 'hidden', background: C.bg, color: C.text }}>
      {/* Home button */}
      <button
        onClick={() => navigate('/')}
        style={{
          position: 'fixed', top: 14, left: 14, zIndex: 9999,
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${C.border}`,
          borderRadius: 8, padding: '5px 12px',
          fontSize: '0.78rem', cursor: 'pointer',
          color: C.textMuted, transition: 'color 0.2s, background 0.2s',
        }}
        onMouseEnter={e => { (e.target as HTMLElement).style.color = C.accentText; (e.target as HTMLElement).style.background = C.accentDim }}
        onMouseLeave={e => { (e.target as HTMLElement).style.color = C.textMuted; (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.04)' }}
      >← Home</button>

      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        {/* Main */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '52px 24px 60px', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: C.textMuted, marginBottom: 24 }}>Translation Studio</div>

          <div style={{ width: '100%', maxWidth: 940, background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, display: 'flex', overflow: 'hidden' }}>
            {/* Input */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <div style={{ padding: '8px 16px', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: C.textMuted, borderBottom: `1px solid ${C.border}` }}>English</div>
              <textarea
                value={source}
                onChange={e => handleInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); clearTimeout(timerRef.current); doTranslate(source) } }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder={'텍스트를 입력하면 자동 번역됩니다.\nCtrl+Enter → 즉시 번역  /  텍스트 선택 후 우클릭 → 사전 검색'}
                style={{
                  flex: 1, height: 280, border: 'none', resize: 'none',
                  padding: 18, fontSize: 15, lineHeight: 2.0,
                  fontFamily: 'inherit', background: 'transparent',
                  color: C.text, outline: 'none',
                  boxShadow: focused ? `inset 0 0 0 2px rgba(177,156,217,0.35)` : 'none',
                  transition: 'box-shadow 0.2s',
                  borderRadius: '0 0 0 14px',
                }}
              />
            </div>

            {/* Divider */}
            <div style={{ width: 1, background: C.border, flexShrink: 0 }} />

            {/* Output */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <div style={{ padding: '8px 16px', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: C.textMuted, borderBottom: `1px solid ${C.border}` }}>Korean</div>
              <div style={{ padding: 18, minHeight: 280 }}>
                {translating && (
                  <span style={{ color: C.textMuted, fontSize: 14 }}>번역 중<span style={{ display: 'inline-block', animation: 'pulse 1s infinite' }}>…</span></span>
                )}
                {error && <span style={{ color: C.error, fontSize: 14 }}>{error}</span>}
                {!translating && !error && result && (
                  <div>
                    {/* Translation */}
                    <div style={{ fontSize: 18, fontWeight: 600, color: 'rgba(255,255,255,0.82)', lineHeight: 2.0, marginBottom: 14 }}>
                      {result.translation}
                    </div>

                    {/* Explanation */}
                    {result.explanation && (
                      <div style={{ fontSize: '0.86rem', color: C.textSub, lineHeight: 2.0, marginBottom: 14, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                        {result.explanation}
                      </div>
                    )}

                    {/* Related tags */}
                    {result.related && result.related.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                        {result.related.map((r, i) => (
                          <span key={i} style={{ padding: '3px 10px', background: C.accentDim, color: C.accentText, borderRadius: 20, fontSize: '0.76rem', fontWeight: 600 }}>
                            {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {!translating && !error && !result && (
                  <span style={{ color: C.textMuted, fontSize: 14 }}>번역 결과가 여기에 표시됩니다</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dict Panel */}
        <div style={{ width: dictOpen ? 400 : 0, overflow: 'hidden', transition: 'width 0.3s ease', borderLeft: `1px solid ${C.border}`, background: C.surface, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ width: 400, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: C.text }}>사전 — <span style={{ color: C.accentText }}>{dictQuery}</span></span>
              <button onClick={() => setDictOpen(false)} style={{ border: 'none', background: 'none', fontSize: 16, cursor: 'pointer', color: C.textMuted, lineHeight: 1 }}>✕</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: '6px 0' }}>
              {dictLoading && <p style={{ padding: '16px 18px', color: C.textMuted, fontSize: 14 }}>검색 중...</p>}
              {!dictLoading && dictEntries.length === 0 && <p style={{ padding: '16px 18px', color: C.textMuted, fontSize: 14 }}>검색 결과 없음</p>}
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
