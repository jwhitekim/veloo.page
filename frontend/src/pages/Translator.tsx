import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../api/translator'

export default function Translator() {
  const navigate = useNavigate()
  const [source, setSource] = useState('')
  const [result, setResult] = useState<api.TranslateResult | null>(null)
  const [translating, setTranslating] = useState(false)
  const [error, setError] = useState('')

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
    <div style={{ fontFamily: "'Google Sans', 'Segoe UI', Arial, sans-serif", height: '100vh', overflow: 'hidden' }}>
      {/* Home button */}
      <button onClick={() => navigate('/')} style={{ position: 'fixed', top: 12, left: 12, zIndex: 9999, background: 'rgba(0,0,0,0.06)', border: '1px solid #e0e0e0', borderRadius: 8, padding: '4px 10px', fontSize: '0.78rem', cursor: 'pointer', color: '#5f6368' }}>← Home</button>

      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        {/* Main */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '40px 20px 60px', background: '#f8f9fa', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
          <h1 style={{ fontSize: 15, color: '#5f6368', marginBottom: 20, letterSpacing: '0.3px' }}>Translation Studio</h1>

          <div style={{ width: '100%', maxWidth: 900, background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.15)', display: 'flex', overflow: 'hidden' }}>
            {/* Input */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <div style={{ padding: '8px 16px', fontSize: 12, color: '#5f6368', borderBottom: '1px solid #e0e0e0' }}>원문 (ENGLISH)</div>
              <textarea
                value={source}
                onChange={e => handleInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); clearTimeout(timerRef.current); doTranslate(source) } }}
                placeholder={'텍스트를 입력하면 자동 번역됩니다.\nCtrl+Enter → 즉시 번역  /  텍스트 선택 후 우클릭 → 사전 검색'}
                style={{ flex: 1, height: 260, border: 'none', outline: 'none', resize: 'none', padding: 16, fontSize: 16, lineHeight: 1.7, fontFamily: 'inherit', background: 'transparent', color: '#202124' }}
              />
            </div>

            {/* Output */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, borderLeft: '1px solid #e0e0e0' }}>
              <div style={{ padding: '8px 16px', fontSize: 12, color: '#5f6368', borderBottom: '1px solid #e0e0e0' }}>번역 결과</div>
              <div style={{ padding: 16, fontSize: 16, lineHeight: 1.7, minHeight: 260, color: result ? '#202124' : '#5f6368' }}>
                {translating && <span style={{ color: '#9aa0a6', fontSize: 14 }}>번역 중...</span>}
                {error && <span style={{ color: '#d93025', fontSize: 14 }}>{error}</span>}
                {!translating && !error && result && (
                  <>
                    <div>{result.translation}</div>
                    {result.explanation && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e0e0e0', fontSize: 14, color: '#5f6368', lineHeight: 1.6 }}>{result.explanation}</div>
                    )}
                    {result.related && result.related.length > 0 && (
                      <div style={{ marginTop: 10, fontSize: 12, color: '#9aa0a6' }}>관련: {result.related.join(' · ')}</div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dict Panel */}
        <div style={{ width: dictOpen ? 400 : 0, overflow: 'hidden', transition: 'width 0.3s ease', borderLeft: '1px solid #e0e0e0', background: '#fff', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ width: 400, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa', flexShrink: 0 }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: '#202124' }}>네이버 사전 — {dictQuery}</span>
              <button onClick={() => setDictOpen(false)} style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: '#5f6368', lineHeight: 1 }}>✕</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: '4px 0' }}>
              {dictLoading && <p style={{ padding: 16, color: '#9aa0a6', fontSize: 14 }}>검색 중...</p>}
              {!dictLoading && dictEntries.length === 0 && <p style={{ padding: 16, color: '#9aa0a6', fontSize: 14 }}>검색 결과 없음</p>}
              {dictEntries.map((item, i) => (
                <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid #f1f3f4' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 16, color: '#1a73e8' }}>{item.entry}</span>
                    <span style={{ fontSize: 13, color: '#9aa0a6' }}>{item.phonetic}</span>
                  </div>
                  {item.senses.map((s, j) => (
                    <div key={j} style={{ marginTop: 6 }}>
                      <span style={{ fontSize: 11, color: '#03c75a', background: '#e8f9f0', padding: '1px 6px', borderRadius: 3, marginRight: 6 }}>{s.pos}</span>
                      <span style={{ fontSize: 14, color: '#202124' }}>{s.value}</span>
                      {s.exampleOri && (
                        <div style={{ marginTop: 4, paddingLeft: 8, borderLeft: '2px solid #e0e0e0', color: '#9aa0a6', fontSize: 12, lineHeight: 1.6 }}>
                          <div>{s.exampleOri}</div>
                          <div>{s.exampleTrans}</div>
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
        <div style={{ position: 'fixed', left: ctxPos.x, top: ctxPos.y, background: '#fff', borderRadius: 8, boxShadow: '0 2px 16px rgba(0,0,0,0.18)', zIndex: 9999, minWidth: 180, overflow: 'hidden' }}
          onClick={() => setCtxVisible(false)}>
          <button
            style={{ display: 'block', width: '100%', padding: '10px 16px', background: 'none', border: 'none', textAlign: 'left', fontSize: 14, color: '#202124', cursor: 'pointer', fontFamily: 'inherit' }}
            onClick={() => { openDict(ctxWord); setCtxVisible(false) }}
          >네이버 사전에서 검색</button>
        </div>
      )}
      {ctxVisible && <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={() => setCtxVisible(false)} />}
    </div>
  )
}
