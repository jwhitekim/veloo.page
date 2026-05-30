import { useState, useRef, useEffect, useCallback } from 'react'
import { Check, Copy, Loader2, Search, Volume2, X } from 'lucide-react'
import AppHeader from '../components/AppHeader'
import { SessionExpiredMessage } from '../components/SessionExpiredMessage'
import * as api from '../api/translator'
import type { TranslationHistoryItem } from '../api/translator'
import './Translator.css'

function stripHtml(html: string): string {
  const el = document.createElement('div')
  el.innerHTML = html
  return el.textContent ?? ''
}

const MAX_CHARS = 5000

const POS_KO: Record<string, string> = {
  VERB: '동사', NOUN: '명사', ADJ: '형용사', ADV: '부사',
  PREP: '전치사', CONJ: '접속사', PRON: '대명사', INTERJ: '감탄사',
}

function checkIsWord(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed) return false
  const words = trimmed.split(/\s+/).filter(Boolean).length
  return words <= 2 && trimmed.length <= 20
}

export default function Translator() {
  const [source, setSource] = useState('')
  const [txHistory, setTxHistory] = useState<TranslationHistoryItem[]>([])
  const [streamedText, setStreamedText] = useState('')
  const [translating, setTranslating] = useState(false)
  const [error, setError] = useState('')
  const [sessionExpired, setSessionExpired] = useState(false)
  const [copied, setCopied] = useState(false)

  const [dictOpen, setDictOpen] = useState(false)
  const [dictQuery, setDictQuery] = useState('')
  const [dictPanelInput, setDictPanelInput] = useState('')
  const [dictResult, setDictResult] = useState<api.DictResult | null>(null)
  const [dictLoading, setDictLoading] = useState(false)

  const [ctxVisible, setCtxVisible] = useState(false)
  const [ctxPos, setCtxPos] = useState({ x: 0, y: 0 })
  const [ctxWord, setCtxWord] = useState('')

  const cachedSelRef = useRef('')
  const timerRef = useRef<ReturnType<typeof setTimeout>>()
  const abortRef = useRef<AbortController | null>(null)

  const sourceIsWord = checkIsWord(source)

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
      setTranslating(false)
    }
  }, [])

  const openDict = async (word: string, openPanel = true) => {
    if (!word.trim()) return
    setDictQuery(word)
    setDictPanelInput(word)
    if (openPanel) setDictOpen(true)
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
    api.getTranslationHistory().then(setTxHistory)
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
    if (!clamped.trim()) {
      abortRef.current?.abort()
      setStreamedText('')
      setError('')
      setSessionExpired(false)
      setTranslating(false)
      setDictResult(null)
      return
    }
    if (checkIsWord(clamped)) {
      timerRef.current = setTimeout(() => {
        doTranslate(clamped.trim())
        openDict(clamped.trim(), false)
      }, 300)
    } else {
      setDictResult(null)
      timerRef.current = setTimeout(() => doTranslate(clamped.trim()), 300)
    }
  }

  const defs = dictResult?.definitions ?? []
  const exs = dictResult?.examples ?? []
  const syns = dictResult?.synonyms ?? []
  const groupedDefs = defs.reduce<Record<string, typeof defs>>((acc, d) => {
    const key = d.pos || '기타'
    acc[key] = [...(acc[key] ?? []), d]
    return acc
  }, {})

  return (
    <>
    <div className="translator-root">
      <AppHeader title="번역" />

      <main className={`translator-shell${dictOpen ? ' has-dict' : ''}`}>
        <section className="translator-workspace">
          <div className="translator-panel translator-panel--source">
            <div className="translator-panel-header">
              <div>
                <span className="translator-label">Source</span>
                <span className="translator-language">English</span>
              </div>
              {source && (
                <button className="translator-icon-btn" onClick={handleClear} title="지우기" type="button">
                  <X size={15} />
                </button>
              )}
            </div>

            <textarea
              className="translator-textarea"
              value={source}
              onChange={e => handleInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  e.preventDefault()
                  clearTimeout(timerRef.current)
                  doTranslate(source.trim())
                }
              }}
              placeholder="텍스트 입력"
            />

            <div className="translator-panel-footer">
              <span>{source.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}</span>
              <span>{sourceIsWord && source ? 'Dictionary' : 'Auto translate'}</span>
            </div>
          </div>

          <div className="translator-panel translator-panel--result">
            <div className="translator-panel-header">
              <div>
                <span className="translator-label">Translation</span>
                <span className="translator-language">Korean</span>
              </div>
              <button
                className="translator-icon-btn"
                onClick={handleCopy}
                disabled={!streamedText || translating}
                title={copied ? '복사됨' : '복사'}
                type="button"
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
              </button>
            </div>

            <div className="translator-output">
              {sessionExpired && <SessionExpiredMessage redirectTo="/translate" />}

              {!sessionExpired && translating && !streamedText && (
                <div className="translator-status">
                  <Loader2 size={15} className="translator-spin" />
                  <span>번역 중</span>
                </div>
              )}

              {!sessionExpired && error && (
                <div className="translator-error">{error}</div>
              )}

              {!sessionExpired && streamedText && (
                <div className="translator-result-text">
                  {streamedText}
                  {translating && <span className="translator-caret" />}
                </div>
              )}

              {!sessionExpired && !translating && !error && !streamedText && !sourceIsWord && (
                txHistory.length > 0 ? (
                  <div className="translator-history">
                    <div className="translator-history-title">Recent</div>
                    {txHistory.map(item => (
                      <button
                        key={item.id}
                        className="translator-history-item"
                        onClick={() => { setSource(item.source_text); setStreamedText(item.translated_text) }}
                        type="button"
                      >
                        <span>{item.source_text}</span>
                        <small>{item.translated_text}</small>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="translator-muted">번역 결과</div>
                )
              )}

              {sourceIsWord && source.trim() && !sessionExpired && (
                <div className="dict-inline">
                  <div className="dict-inline-divider"><span>네이버 사전</span></div>

                  {dictLoading && (
                    <div className="translator-status">
                      <Loader2 size={13} className="translator-spin" />
                      <span>검색 중</span>
                    </div>
                  )}

                  {!dictLoading && !dictResult && (
                    <p className="dict-muted">검색 결과 없음</p>
                  )}

                  {!dictLoading && dictResult && (
                    <>
                      <div className="dict-inline-heading">
                        <div>
                          <strong>{dictQuery}</strong>
                          {dictResult.phonetic && (
                            <span className="dict-inline-phonetic">{stripHtml(dictResult.phonetic)}</span>
                          )}
                        </div>
                        {dictResult.audioUrl && (
                          <button
                            className="translator-icon-btn"
                            onClick={() => new Audio(dictResult!.audioUrl!).play()}
                            title="발음 듣기"
                            type="button"
                          >
                            <Volume2 size={13} />
                          </button>
                        )}
                      </div>

                      {defs.length === 0 && <p className="dict-muted">정의 없음</p>}

                      {Object.entries(groupedDefs).map(([pos, items], pi) => (
                        <section className="dict-section" key={pos}>
                          <h3>{POS_KO[pos] ?? pos}</h3>
                          {items.map((d, i) => (
                            <div className="dict-def-row" key={`${pos}-${i}`}>
                              <span className="dict-def-number">{i + 1}</span>
                              <div className="dict-def-body">
                                <p>{d.value}</p>
                                {d.exampleOri && <q>{d.exampleOri}</q>}
                                {pi === 0 && i === 0 && syns.length > 0 && (
                                  <div className="dict-synonyms">
                                    <span>동의어 </span>
                                    {syns.map((s, si) => (
                                      <button key={si} onClick={() => { setSource(s); openDict(s, false) }} type="button">
                                        {s}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {d.level && <span className="dict-level">{d.level}</span>}
                            </div>
                          ))}
                        </section>
                      ))}

                      {exs.length > 0 && (
                        <section className="dict-section">
                          <h3>예문</h3>
                          {exs.slice(0, 3).map((ex, i) => (
                            <div className="dict-example-row" key={i}>
                              <p>{ex.ori}</p>
                              {ex.trans && <small>{ex.trans}</small>}
                            </div>
                          ))}
                        </section>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

      </main>

      {ctxVisible && (
        <div
          className="translator-context-menu"
          style={{ left: ctxPos.x, top: ctxPos.y }}
          onClick={() => setCtxVisible(false)}
        >
          <button onClick={() => { openDict(ctxWord); setCtxVisible(false) }} type="button">
            사전에서 검색
          </button>
        </div>
      )}
      {ctxVisible && <div className="translator-context-backdrop" onClick={() => setCtxVisible(false)} />}
    </div>
    {dictOpen && (
      <aside className="dict-panel">
        <div className="dict-toolbar">
          <div className="dict-search">
            <Search size={14} />
            <input
              value={dictPanelInput}
              onChange={e => setDictPanelInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && openDict(dictPanelInput.trim())}
              placeholder="Search"
            />
          </div>
          <button className="translator-icon-btn" onClick={() => setDictOpen(false)} title="닫기" type="button">
            <X size={15} />
          </button>
        </div>

        {dictQuery && (
          <div className="dict-heading">
            <div>
              <h2>{dictQuery}</h2>
              {dictResult?.phonetic && <p>{stripHtml(dictResult.phonetic)}</p>}
            </div>
            {dictResult?.audioUrl && (
              <button
                className="translator-icon-btn"
                onClick={() => new Audio(dictResult.audioUrl!).play()}
                title="발음 듣기"
                type="button"
              >
                <Volume2 size={15} />
              </button>
            )}
          </div>
        )}

        <div className="dict-content">
          {dictLoading && <p className="dict-muted">검색 중</p>}
          {!dictLoading && !dictResult && <p className="dict-muted">검색 결과 없음</p>}

          {!dictLoading && dictResult && (
            <>
              {defs.length === 0 && <p className="dict-muted">정의 없음</p>}

              {Object.entries(groupedDefs).map(([pos, items], pi) => (
                <section className="dict-section" key={pos}>
                  <h3>{POS_KO[pos] ?? pos}</h3>
                  {items.map((d, i) => (
                    <div className="dict-def-row" key={`${pos}-${i}`}>
                      <span className="dict-def-number">{i + 1}</span>
                      <div className="dict-def-body">
                        <p>{d.value}</p>
                        {d.exampleOri && <q>{d.exampleOri}</q>}
                        {pi === 0 && i === 0 && syns.length > 0 && (
                          <div className="dict-synonyms">
                            <span>동의어 </span>
                            {syns.map((s, si) => (
                              <button key={si} onClick={() => { setSource(s); openDict(s) }} type="button">
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {d.level && <span className="dict-level">{d.level}</span>}
                    </div>
                  ))}
                </section>
              ))}

              {exs.length > 0 && (
                <section className="dict-section">
                  <h3>예문</h3>
                  {exs.map((ex, i) => (
                    <div className="dict-example-row" key={i}>
                      <p>{ex.ori}</p>
                      {ex.trans && <small>{ex.trans}</small>}
                    </div>
                  ))}
                </section>
              )}
            </>
          )}
        </div>
      </aside>
    )}
    </>
  )
}
