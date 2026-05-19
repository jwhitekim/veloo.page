import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText } from 'lucide-react'
import AppHeader from '../components/AppHeader'
import * as api from '../api/paper'
import type { Candidate, PaperResult } from '../api/paper'

type MainState =
  | { kind: 'idle' }
  | { kind: 'loading'; msg: string }
  | { kind: 'candidates'; items: Candidate[] }
  | { kind: 'result'; data: PaperResult }
  | { kind: 'error'; msg: string }

// ── 색상 토큰 ──────────────────────────────────────────────────────
const C = {
  accent:     'var(--text-primary)',
  accentDim:  'var(--bg-additive)',
  accentText: 'var(--text-primary)',
  sidebar:    'var(--bg-additive)',
  main:       'var(--bg-base)',
  card:       'var(--bg-additive)',
  border:     'var(--border-subtle)',
  borderMid:  'var(--border-subtle)',
  text:       'var(--text-primary)',
  textSub:    'var(--text-secondary)',
  textMuted:  'var(--text-disabled)',
  headerBg:   'var(--bg-base)',
}

export default function PaperAnalyzer() {
  const [query, setQuery] = useState('')
  const [state, setState] = useState<MainState>({ kind: 'idle' })
  const [sidebarData, setSidebarData] = useState<PaperResult | null>(null)
  const [btnHover, setBtnHover] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const doSearch = async () => {
    const q = query.trim()
    if (!q) return
    setQuery('')
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
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: C.main }}>
      <AppHeader
        title="논문 분석기"
        right={
          <div style={{ display: 'flex', maxWidth: 580 }}>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') doSearch() }}
              placeholder="논문 제목 또는 URL (arXiv / DOI / ACM / IEEE 등) 입력"
              autoFocus
              style={{ width: 420, background: C.card, border: `1px solid ${C.border}`, borderRight: 'none', borderRadius: '9999px 0 0 9999px', padding: '8px 16px', fontSize: 14, color: C.text, outline: 'none', fontFamily: 'inherit' }}
              onFocus={e => (e.currentTarget.style.borderColor = '#aaaaaa')}
              onBlur={e => (e.currentTarget.style.borderColor = C.border)}
            />
            <button
              onClick={doSearch}
              onMouseEnter={() => setBtnHover(true)}
              onMouseLeave={() => setBtnHover(false)}
              style={{ background: btnHover ? '#333333' : 'var(--selected-bg)', color: 'var(--selected-text)', border: 'none', borderRadius: '0 9999px 9999px 0', padding: '8px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s', flexShrink: 0, fontFamily: 'inherit' }}
            >분석</button>
          </div>
        }
      />

      {/* Body */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <aside style={{ background: C.sidebar, color: C.text, padding: '32px 24px', overflowY: 'auto', height: '100%', borderRight: `1px solid ${C.border}` }}>
          {!sidebarData ? (
            <p style={{ color: C.textSub, fontSize: 14, lineHeight: 1.8, margin: 0 }}>논문을 검색하면<br />기본 정보와 저널 품질이<br />여기에 표시됩니다.</p>
          ) : (
            <SidebarContent data={sidebarData} />
          )}
        </aside>

        {/* Main */}
        <main style={{ padding: '40px 44px 80px', overflowY: 'auto', background: C.main, minWidth: 0 }}>
          {state.kind === 'idle' && <EmptyState />}
          {state.kind === 'loading' && <Loader msg={state.msg} />}
          {state.kind === 'error' && <ErrorBox msg={state.msg} />}
          {state.kind === 'candidates' && <CandidateList items={state.items} onSelect={doAnalyzeById} />}
          {state.kind === 'result' && <ResultView data={state.data} />}
        </main>
      </div>
    </div>
  )
}

// ── Empty State ────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '48px 40px', background: 'var(--bg-additive)', border: '1.5px dashed var(--border-subtle)', borderRadius: 'var(--radius-lg)', maxWidth: 320, width: '100%' }}>
        <FileText size={48} color="var(--text-disabled)" strokeWidth={1.25} />
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.8, margin: 0 }}>
          PDF 파일을 이곳에 드래그 앤 드롭하거나,<br />상단에서 논문을 검색하세요
        </p>
      </div>
    </div>
  )
}

// ── Sidebar ────────────────────────────────────────────────────────
function SidebarContent({ data }: { data: PaperResult }) {
  const { basic, quality } = data
  const divider = `1px solid ${C.border}`

  return (
    <>
      <section>
        <SideLabel>📄 Paper</SideLabel>
        <div style={{ fontSize: '0.97rem', fontWeight: 700, color: C.text, lineHeight: 1.5, marginBottom: 18, wordBreak: 'keep-all' }}>{basic.title}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <MetaRow k="Year"  v={String(basic.year || '—')} />
          <MetaRow k="Venue" v={basic.venue || '—'} />
          <MetaRow k="Cited" v={`${basic.citationCount ?? '—'}회`} />
        </div>
        <div style={{ marginTop: 18, paddingTop: 18, borderTop: divider, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {basic.doi    && <a href={`https://doi.org/${basic.doi}`}            target="_blank" rel="noreferrer" style={linkStyle}>DOI ↗</a>}
          {basic.arxivId && <a href={`https://arxiv.org/abs/${basic.arxivId}`} target="_blank" rel="noreferrer" style={linkStyle}>arXiv ↗</a>}
          {!basic.doi && !basic.arxivId && <span style={{ color: C.textMuted, fontSize: '0.8rem' }}>원본 링크 없음</span>}
        </div>
      </section>
      <section style={{ marginTop: 28, paddingTop: 28, borderTop: divider }}>
        <SideLabel>📊 Journal Quality</SideLabel>
        <QualityBlock quality={quality} />
      </section>
    </>
  )
}

function SideLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: '0.68rem', fontWeight: 700, color: C.textMuted, letterSpacing: '1.4px', textTransform: 'uppercase', marginBottom: 14 }}>{children}</div>
}

function MetaRow({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, fontSize: '0.85rem' }}>
      <span style={{ color: C.textMuted, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.4px', flexShrink: 0 }}>{k}</span>
      <span style={{ color: C.textSub, fontWeight: 500, textAlign: 'right', wordBreak: 'break-word' }}>{v}</span>
    </div>
  )
}

const linkStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', padding: '4px 10px',
  background: C.accentDim, borderRadius: 6, fontSize: '0.78rem',
  fontWeight: 500, color: C.accentText, textDecoration: 'none',
}

function QualityBlock({ quality }: { quality: PaperResult['quality'] }) {
  if (!quality) return <span style={{ color: C.textMuted, fontSize: '0.82rem', lineHeight: 1.7 }}>데이터 없음</span>
  if (!quality.quartile) return <span style={{ color: C.textMuted, fontSize: '0.82rem', lineHeight: 1.7 }}>Q 등급 없음<br /><strong style={{ color: C.textSub }}>{quality.matched_title}</strong></span>

  const qKey = String(quality.quartile).trim().toLowerCase()
  const qColors: Record<string, string> = { q1: '#0f0f0f', q2: '#404040', q3: '#606060', q4: '#909090' }
  const bg = qColors[qKey] ?? '#6b7280'
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 46, height: 46, borderRadius: 10, background: bg, fontWeight: 800, fontSize: '0.95rem', color: '#fff', flexShrink: 0 }}>{quality.quartile}</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: C.text, lineHeight: 1.4 }}>{quality.matched_title || '—'}</div>
          <div style={{ fontSize: '0.75rem', color: C.textMuted, marginTop: 3 }}>SJR {quality.sjr ? quality.sjr.replace(',', '.') : '—'}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <MetaRow k="Type"    v={quality.type || '—'} />
        <MetaRow k="Country" v={quality.country || '—'} />
      </div>
    </>
  )
}

// ── Main: Candidates ───────────────────────────────────────────────
function CandidateList({ items, onSelect }: { items: Candidate[]; onSelect: (id: string) => void }) {
  return (
    <div style={{ marginBottom: 32, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', fontSize: '0.85rem', color: C.textSub, borderBottom: `1px solid ${C.border}`, fontWeight: 600 }}>
        🔍 검색 결과 — 분석할 논문을 선택하세요
      </div>
      {items.map(p => (
        <div key={p.paperId} onClick={() => onSelect(p.paperId)}
          style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, cursor: 'pointer', transition: 'background 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.background = C.accentDim)}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <div style={{ fontWeight: 600, fontSize: '0.92rem', color: C.text, lineHeight: 1.4 }}>{p.title || '(제목 없음)'}</div>
          <div style={{ fontSize: '0.8rem', color: C.textMuted, marginTop: 4 }}>
            {p.year || '?'}년 · {p.venue || 'venue 미상'} · 인용 {p.citationCount ?? '?'}회
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main: Result ───────────────────────────────────────────────────
function ResultView({ data }: { data: PaperResult }) {
  const { analysis, authors, basic } = data
  const relClass = analysis.relevance === '높음' ? 'high' : analysis.relevance === '낮음' ? 'low' : 'mid'
  const relColors = {
    high: { bg: 'rgba(39,174,96,0.14)',  color: '#4ade80' },
    low:  { bg: 'rgba(231,76,60,0.14)',  color: '#f87171' },
    mid:  { bg: 'rgba(243,156,18,0.14)', color: '#fbbf24' },
  }
  const rel = relColors[relClass]

  return (
    <>
      <section>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 24 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: C.text }}>🧠 이론 분석</h2>
          <span style={{ fontSize: '0.75rem', color: C.textMuted }}>via Claude</span>
        </div>

        {analysis.keywords?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 24 }}>
            {analysis.keywords.map(k => (
              <span key={k} style={{ padding: '3px 11px', background: C.accentDim, color: C.accentText, borderRadius: 20, fontSize: '0.78rem', fontWeight: 600 }}>{k}</span>
            ))}
          </div>
        )}

        {analysis.relevance && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderRadius: 8, marginBottom: 20, fontSize: '0.87rem', background: rel.bg, color: rel.color }}>
            <span style={{ fontWeight: 800, whiteSpace: 'nowrap' }}>관련성 {analysis.relevance}</span>
            <span>{analysis.relevance_reason}</span>
          </div>
        )}

        <AnalysisItem label="문제" short="" detail={analysis.problem} />
        <AnalysisItem label="방법" short="" detail={analysis.method} />
        <AnalysisItem label="결론" short="" detail={analysis.conclusion} />
      </section>

      <section style={{ marginTop: 52, paddingTop: 52, borderTop: `1px solid ${C.border}` }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: C.text, marginBottom: 24 }}>👤 저자 정보</h2>
        {authors?.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px 28px' }}>
            {authors.map(a => <AuthorCard key={a.authorId || a.name} author={a} currentTitle={basic.title} />)}
          </div>
        ) : (
          <span style={{ color: C.textMuted, fontSize: '0.88rem' }}>저자 정보 없음</span>
        )}
      </section>
    </>
  )
}

function AnalysisItem({ label, detail }: { label: string; short: string; detail: string }) {
  return (
    <div style={{ borderLeft: `3px solid ${C.accent}`, marginBottom: 2, borderTop: `1px solid ${C.border}` }}>
      <div style={{ padding: '12px 16px 4px' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}</span>
      </div>
      <div style={{ padding: '0 16px 16px', fontSize: '0.9rem', lineHeight: 1.8, color: C.textSub }}>
        {detail}
      </div>
    </div>
  )
}

function AuthorCard({ author, currentTitle }: { author: PaperResult['authors'][0]; currentTitle: string }) {
  const metaParts: string[] = []
  if (author.hIndex != null)        metaParts.push(`h-index ${author.hIndex}`)
  if (author.citationCount != null) metaParts.push(`인용 ${author.citationCount.toLocaleString()}회`)
  const curTitleLower = currentTitle.toLowerCase()

  return (
    <div style={{ padding: '16px 0', borderBottom: `1px solid ${C.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginBottom: 3 }}>
        <span style={{ fontWeight: 700, fontSize: '0.92rem', color: C.text, lineHeight: 1.3 }}>{author.name}</span>
        {author.authorId && (
          <a href={`https://www.semanticscholar.org/author/${author.authorId}`} target="_blank" rel="noreferrer"
            style={{ fontSize: '0.78rem', color: C.accentText, textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap' }}>
            프로필 ↗
          </a>
        )}
      </div>
      {metaParts.length > 0 && <div style={{ fontSize: '0.76rem', color: C.textMuted, margin: '3px 0 6px' }}>{metaParts.join(' · ')}</div>}
      {author.topPapers?.length > 0 && (
        <ul style={{ listStyle: 'none', marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${C.border}` }}>
          {author.topPapers.map((p, i) => {
            const isCurrent = p.title?.toLowerCase() === curTitleLower
            return (
              <li key={i} style={{ fontSize: '0.8rem', lineHeight: 1.5, padding: '6px 0', color: C.textSub, borderTop: i > 0 ? `1px dashed ${C.border}` : 'none' }}>
                {isCurrent ? <strong style={{ color: C.accentText }}>{p.title} ★</strong> : p.title}
                {' '}<span style={{ color: C.textMuted, fontSize: '0.75rem' }}>· 인용 {p.citationCount ?? '?'}회</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// ── Utilities ──────────────────────────────────────────────────────
function Loader({ msg }: { msg: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: C.textMuted, fontSize: '0.92rem' }}>
      {msg}
      <span style={{ display: 'inline-block', width: 16, height: 16, border: `2px solid ${C.border}`, borderTopColor: C.accent, borderRadius: '50%', marginLeft: 12, verticalAlign: 'middle', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function ErrorBox({ msg }: { msg: string }) {
  return <div style={{ background: 'var(--c-error-dim)', border: '1px solid var(--c-error)', borderRadius: 'var(--radius-md)', padding: '14px 18px', color: 'var(--c-error)', fontSize: '0.88rem' }}>❌ {msg}</div>
}
