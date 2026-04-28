import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../api/paper'
import type { Candidate, PaperResult } from '../api/paper'

type MainState =
  | { kind: 'idle' }
  | { kind: 'loading'; msg: string }
  | { kind: 'candidates'; items: Candidate[] }
  | { kind: 'result'; data: PaperResult }
  | { kind: 'error'; msg: string }

const accent = '#4a6cf7'
const sidebarBg = '#1a1a2e'

export default function PaperAnalyzer() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [state, setState] = useState<MainState>({ kind: 'idle' })
  const [sidebarData, setSidebarData] = useState<PaperResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const doSearch = async () => {
    const q = query.trim()
    if (!q) return
    setState({ kind: 'loading', msg: '검색 중' })
    setSidebarData(null)
    try {
      const data = await api.search(q)
      if (data.type === 'url') {
        await doAnalyzeUrl(data.query!)
      } else if (data.type === 'unsupported_url') {
        setState({ kind: 'error', msg: 'URL에서 DOI / arXiv ID를 찾을 수 없습니다. 논문 제목으로 검색해주세요.' })
      } else if (data.type === 'candidates' && data.data) {
        setState({ kind: 'candidates', items: data.data })
      } else {
        setState({ kind: 'error', msg: (data as any).error || '알 수 없는 오류' })
      }
    } catch (e) {
      setState({ kind: 'error', msg: (e as Error).message })
    }
  }

  const doAnalyzeById = async (paperId: string) => {
    setState({ kind: 'loading', msg: '분석 중 (약 10~20초 소요)' })
    try {
      const data = await api.analyzeById(paperId)
      setSidebarData(data)
      setState({ kind: 'result', data })
    } catch (e) {
      setState({ kind: 'error', msg: (e as Error).message })
    }
  }

  const doAnalyzeUrl = async (url: string) => {
    setState({ kind: 'loading', msg: '분석 중 (약 10~20초 소요)' })
    try {
      const data = await api.analyzeByUrl(url)
      setSidebarData(data)
      setState({ kind: 'result', data })
    } catch (e) {
      setState({ kind: 'error', msg: (e as Error).message })
    }
  }

  return (
    <div style={{ fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif", height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, background: sidebarBg, color: '#fff', height: 72, padding: '0 32px', display: 'flex', alignItems: 'center', gap: 20, borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '4px 10px', fontSize: '0.78rem', cursor: 'pointer', color: '#ccc', flexShrink: 0 }}>← Home</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <span style={{ fontSize: '1.4rem' }}>📄</span>
          <span style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '0.3px' }}>Paper Analyzer</span>
        </div>
        <div style={{ flex: 1, display: 'flex', gap: 10, maxWidth: 720, marginLeft: 'auto' }}>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') doSearch() }}
            placeholder="논문 제목 또는 URL (arXiv / DOI / ACM / IEEE 등) 입력"
            autoFocus
            style={{ flex: 1, background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 14px', fontSize: '0.92rem', color: '#fff', outline: 'none' }}
          />
          <button onClick={doSearch} style={{ background: accent, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 22px', fontSize: '0.92rem', fontWeight: 600, cursor: 'pointer' }}>분석</button>
        </div>
      </header>

      {/* Body */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <aside style={{ background: sidebarBg, color: '#e8ecf0', padding: '36px 28px', overflowY: 'auto', height: '100%' }}>
          {!sidebarData ? (
            <p style={{ color: '#8a95a8', fontSize: '0.88rem', lineHeight: 1.7 }}>논문을 검색하면<br />기본 정보와 저널 품질이 여기에 표시됩니다.</p>
          ) : (
            <SidebarContent data={sidebarData} />
          )}
        </aside>

        {/* Main */}
        <main style={{ padding: '40px 48px 80px', overflowY: 'auto', background: '#f4f6f9', minWidth: 0 }}>
          {state.kind === 'idle' && null}
          {state.kind === 'loading' && <Loader msg={state.msg} />}
          {state.kind === 'error' && <ErrorBox msg={state.msg} />}
          {state.kind === 'candidates' && (
            <CandidateList items={state.items} onSelect={doAnalyzeById} />
          )}
          {state.kind === 'result' && (
            <ResultView data={state.data} />
          )}
        </main>
      </div>
    </div>
  )
}

function SidebarContent({ data }: { data: PaperResult }) {
  const { basic, quality } = data
  const border = '1px solid rgba(255,255,255,0.08)'

  return (
    <>
      {/* Paper info */}
      <section>
        <SideLabel>📄 Paper</SideLabel>
        <div style={{ fontSize: '1.02rem', fontWeight: 700, color: '#fff', lineHeight: 1.45, marginBottom: 18, wordBreak: 'keep-all' }}>{basic.title}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <MetaRow k="Year" v={String(basic.year || '—')} />
          <MetaRow k="Venue" v={basic.venue || '—'} />
          <MetaRow k="Cited" v={`${basic.citationCount ?? '—'}회`} />
        </div>
        <div style={{ marginTop: 18, paddingTop: 18, borderTop: border, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {basic.doi
            ? <a href={`https://doi.org/${basic.doi}`} target="_blank" rel="noreferrer" style={linkStyle}>DOI ↗</a>
            : null}
          {basic.arxivId
            ? <a href={`https://arxiv.org/abs/${basic.arxivId}`} target="_blank" rel="noreferrer" style={linkStyle}>arXiv ↗</a>
            : null}
          {!basic.doi && !basic.arxivId && <span style={{ color: '#8a95a8', fontSize: '0.82rem' }}>원본 링크 없음</span>}
        </div>
      </section>

      {/* Journal quality */}
      <section style={{ marginTop: 32, paddingTop: 32, borderTop: border }}>
        <SideLabel>📊 Journal Quality</SideLabel>
        <QualityBlock quality={quality} />
      </section>
    </>
  )
}

function SideLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8a95a8', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 14 }}>{children}</div>
}

function MetaRow({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, fontSize: '0.88rem' }}>
      <span style={{ color: '#8a95a8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.3px', flexShrink: 0 }}>{k}</span>
      <span style={{ color: '#cdd5e0', fontWeight: 500, textAlign: 'right', wordBreak: 'break-word' }}>{v}</span>
    </div>
  )
}

const linkStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', padding: '5px 11px',
  background: 'rgba(74,108,247,0.15)', borderRadius: 6, fontSize: '0.8rem',
  fontWeight: 500, color: '#a5b4fc', textDecoration: 'none',
}

function QualityBlock({ quality }: { quality: PaperResult['quality'] }) {
  if (!quality) {
    return <span style={{ color: '#8a95a8', fontSize: '0.85rem', lineHeight: 1.7 }}>데이터 없음<br /><code style={{ color: '#a5b4fc' }}>data/scimago_if.csv</code> 파일 필요</span>
  }
  if (!quality.quartile) {
    return <span style={{ color: '#8a95a8', fontSize: '0.85rem', lineHeight: 1.7 }}>Q 등급 데이터 없음<br /><strong style={{ color: '#cdd5e0' }}>{quality.matched_title}</strong></span>
  }
  const qKey = String(quality.quartile).trim().toLowerCase()
  const qColors: Record<string, string> = { q1: accent, q2: '#6d87f7', q3: '#f39c12', q4: '#6b7280' }
  const bg = qColors[qKey] ?? '#6b7280'
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: 10, background: bg, fontWeight: 800, fontSize: '1.05rem', color: '#fff', flexShrink: 0 }}>{quality.quartile}</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff', lineHeight: 1.35 }}>{quality.matched_title || '—'}</div>
          <div style={{ fontSize: '0.8rem', color: '#8a95a8', marginTop: 3 }}>SJR {quality.sjr ? quality.sjr.replace(',', '.') : '—'}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <MetaRow k="Type" v={quality.type || '—'} />
        <MetaRow k="Country" v={quality.country || '—'} />
      </div>
    </>
  )
}

function CandidateList({ items, onSelect }: { items: Candidate[]; onSelect: (id: string) => void }) {
  return (
    <div style={{ marginBottom: 32, background: '#fff', border: '1px solid #e8ecf0', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '16px 22px', fontSize: '0.9rem', background: '#fafbfe', borderBottom: '1px solid #e8ecf0', fontWeight: 600 }}>
        🔍 검색 결과 — 분석할 논문을 선택하세요
      </div>
      {items.map(p => (
        <div key={p.paperId} onClick={() => onSelect(p.paperId)}
          style={{ padding: '14px 22px', borderBottom: '1px solid #f0f2f5', cursor: 'pointer' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#f0f4ff')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <div style={{ fontWeight: 600, fontSize: '0.95rem', lineHeight: 1.4 }}>{p.title || '(제목 없음)'}</div>
          <div style={{ fontSize: '0.83rem', color: '#666', marginTop: 4 }}>
            {p.year || '?'}년 · {p.venue || 'venue 미상'} · 인용 {p.citationCount ?? '?'}회
          </div>
        </div>
      ))}
    </div>
  )
}

function ResultView({ data }: { data: PaperResult }) {
  const { analysis, authors, basic } = data
  const relClass = analysis.relevance === '높음' ? 'high' : analysis.relevance === '낮음' ? 'low' : 'mid'
  const relColors = {
    high: { bg: '#d4f0dc', color: '#1a7a3c' },
    low: { bg: '#fde8e8', color: '#c0392b' },
    mid: { bg: '#fef3cd', color: '#856404' },
  }
  const rel = relColors[relClass]

  return (
    <>
      {/* Theory Analysis */}
      <section>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1a1a2e', letterSpacing: '-0.2px' }}>🧠 이론 분석</h2>
          <span style={{ fontSize: '0.78rem', color: '#8a95a8', fontWeight: 500 }}>via Claude</span>
        </div>

        {analysis.keywords?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
            {analysis.keywords.map(k => (
              <span key={k} style={{ padding: '4px 12px', background: 'rgba(74,108,247,.1)', color: accent, borderRadius: 20, fontSize: '0.82rem', fontWeight: 600 }}>{k}</span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 8, marginBottom: 24, fontSize: '0.9rem', background: rel.bg, color: rel.color }}>
          <span style={{ fontWeight: 800, whiteSpace: 'nowrap' }}>관련성 {analysis.relevance}</span>
          <span>{analysis.relevance_reason}</span>
        </div>

        <AnalysisItem color="#e74c3c" label="문제" short={analysis.problem_short || analysis.problem} detail={analysis.problem} />
        <AnalysisItem color={accent} label="방법" short={analysis.method_short || analysis.method} detail={analysis.method} />
        <AnalysisItem color="#27ae60" label="결론" short={analysis.conclusion_short || analysis.conclusion} detail={analysis.conclusion} />
      </section>

      {/* Authors */}
      <section style={{ marginTop: 56, paddingTop: 56, borderTop: '1px solid #e8ecf0' }}>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1a1a2e' }}>👤 저자 정보</h2>
        </div>
        {authors?.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px 32px' }}>
            {authors.map(a => (
              <AuthorCard key={a.authorId || a.name} author={a} currentTitle={basic.title} />
            ))}
          </div>
        ) : (
          <span style={{ color: '#8a95a8', fontSize: '0.9rem' }}>저자 정보 없음</span>
        )}
      </section>
    </>
  )
}

function AnalysisItem({ color, label, short, detail }: { color: string; label: string; short: string; detail: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderLeft: `3px solid ${color}`, marginBottom: 4 }}>
      <div
        onClick={() => setOpen(v => !v)}
        style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '14px 0 14px 16px', cursor: 'pointer', borderTop: '1px solid #e8ecf0' }}
      >
        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#2c3544', whiteSpace: 'nowrap' }}>{label}</span>
        <span style={{ fontSize: '0.92rem', color: '#4a5568', lineHeight: 1.5 }}>{short}</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.76rem', color: '#8a95a8', flexShrink: 0 }}>{open ? '접기' : '펼치기'}</span>
      </div>
      {open && (
        <div style={{ padding: '0 16px 16px', fontSize: '0.93rem', lineHeight: 1.75, color: '#2c3544', background: '#fafbfe', borderTop: '1px dashed #e8ecf0' }}>
          {detail}
        </div>
      )}
    </div>
  )
}

function AuthorCard({ author, currentTitle }: { author: PaperResult['authors'][0]; currentTitle: string }) {
  const [open, setOpen] = useState(false)
  const metaParts = []
  if (author.hIndex != null) metaParts.push(`h-index ${author.hIndex}`)
  if (author.citationCount != null) metaParts.push(`인용 ${author.citationCount.toLocaleString()}회`)
  const curTitleLower = currentTitle.toLowerCase()

  return (
    <div style={{ padding: '18px 0', borderBottom: '1px solid #e8ecf0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
        <span style={{ fontWeight: 700, fontSize: '0.98rem', color: '#1a1a2e', lineHeight: 1.3 }}>{author.name}</span>
        {author.authorId && (
          <a href={`https://www.semanticscholar.org/author/${author.authorId}`} target="_blank" rel="noreferrer"
            style={{ fontSize: '0.82rem', color: accent, textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap' }}>
            프로필 ↗
          </a>
        )}
      </div>
      {metaParts.length > 0 && (
        <div style={{ fontSize: '0.8rem', color: '#8a95a8', margin: '3px 0 6px' }}>{metaParts.join(' · ')}</div>
      )}
      {author.topPapers?.length > 0 && (
        <div>
          <button onClick={() => setOpen(v => !v)}
            style={{ background: 'none', border: 'none', padding: '4px 0', fontSize: '0.85rem', color: accent, fontWeight: 600, cursor: 'pointer' }}>
            {open ? '▾' : '▸'} 대표 논문 {author.topPapers.length}편 보기
          </button>
          {open && (
            <ul style={{ listStyle: 'none', marginTop: 10, paddingTop: 10, borderTop: '1px dashed #e8ecf0' }}>
              {author.topPapers.map((p, i) => {
                const isCurrent = p.title?.toLowerCase() === curTitleLower
                return (
                  <li key={i} style={{ fontSize: '0.85rem', lineHeight: 1.5, padding: '8px 0', color: '#333', borderTop: i > 0 ? '1px dashed #f0f2f5' : 'none' }}>
                    {isCurrent
                      ? <strong style={{ color: accent }}>{p.title} ★</strong>
                      : p.title}
                    {' '}<span style={{ color: '#8a95a8', fontSize: '0.8rem' }}>· 인용 {p.citationCount ?? '?'}회</span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function Loader({ msg }: { msg: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888', fontSize: '0.95rem' }}>
      {msg}
      <span style={{ display: 'inline-block', width: 18, height: 18, border: '3px solid #dde3ec', borderTopColor: accent, borderRadius: '50%', marginLeft: 12, verticalAlign: 'middle', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function ErrorBox({ msg }: { msg: string }) {
  return <div style={{ background: '#fde8e8', borderRadius: 10, padding: '16px 20px', color: '#c0392b', fontSize: '0.92rem' }}>❌ {msg}</div>
}
