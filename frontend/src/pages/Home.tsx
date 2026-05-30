import { useState, useEffect } from 'react'
import { CheckSquare, Globe, FileText, GitBranch, ArrowUpRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useTodos } from '../hooks/useTodos'
import * as paperApi from '../api/paper'
import * as translatorApi from '../api/translator'
import * as archApi from '../api/archTrainer'
import type { PaperHistoryItem } from '../api/paper'
import type { TranslationHistoryItem } from '../api/translator'
import type { ArchHistoryItem } from '../api/archTrainer'
import './Home.css'

const PRIORITY_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  urgent: { label: '긴급', color: '#d93025', bg: '#fce8e6' },
  mid:    { label: '중간', color: '#e37400', bg: '#fef3e2' },
}

const APP_CARDS = [
  { name: 'Paper Analyzer', desc: 'PDF 추출 및 논문 분석', href: '/paper',        unit: '분석',   countKey: 'paper' as const, Icon: FileText },
  { name: 'Translator',     desc: '영어 논문 용어 번역',  href: '/translate',    unit: '번역',   countKey: 'tx'    as const, Icon: Globe },
  { name: 'Models Review',  desc: '모델 설명 + AI 피드백', href: '/arch-trainer', unit: '피드백', countKey: 'arch'  as const, Icon: GitBranch },
  { name: 'Todo List',      desc: '연구실 할 일 관리',    href: '/todo',         unit: '할 일',  countKey: 'todo'  as const, Icon: CheckSquare },
]

function trunc(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + '...' : s
}

export default function Home() {
  const navigate = useNavigate()
  const { todos, loading: todosLoading, toggleDone } = useTodos('all')

  const [txHistory, setTxHistory] = useState<TranslationHistoryItem[]>([])
  const [paperHistory, setPaperHistory] = useState<PaperHistoryItem[]>([])
  const [archHistory, setArchHistory] = useState<ArchHistoryItem[]>([])
  const [counts, setCounts] = useState({ paper: 0, tx: 0, arch: 0 })
  const [activityLoading, setActivityLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      translatorApi.getTranslationHistory(),
      paperApi.getHistory(),
      archApi.getArchHistory(),
      paperApi.getPaperCount(),
      translatorApi.getTranslationCount(),
      archApi.getArchCount(),
    ]).then(([tx, paper, arch, paperCount, txCount, archCount]) => {
      setTxHistory(tx.slice(0, 3))
      setPaperHistory(paper.slice(0, 3))
      setArchHistory(arch.slice(0, 3))
      setCounts({ paper: paperCount, tx: txCount, arch: archCount })
    }).catch(() => {}).finally(() => setActivityLoading(false))
  }, [])

  const MAX_TODOS = 8
  const sorted = [...todos].sort((a, b) => Number(a.done) - Number(b.done))
  const visibleTodos = sorted.slice(0, MAX_TODOS)
  const extraCount = sorted.length - MAX_TODOS

  const getCount = (key: typeof APP_CARDS[number]['countKey']) => {
    if (key === 'todo') return todosLoading ? null : todos.length
    return activityLoading ? null : counts[key]
  }

  const completedTodos = todos.filter(todo => todo.done).length
  const openTodos = todos.length - completedTodos

  return (
    <div className="home-root">
      <header className="home-header">
        <Link to="/" className="home-wordmark">veloo</Link>
        <nav className="home-nav" aria-label="Primary">
          {APP_CARDS.map(({ name, href }) => (
            <Link key={href} to={href} className="home-nav-link">{name}</Link>
          ))}
        </nav>
      </header>

      <main className="home-main">
        <section className="home-hero">
          <div>
            <p className="home-kicker">Lab Toolkit</p>
            <h1 className="home-title">Research operations dashboard</h1>
            <p className="home-subtitle">논문 분석, 번역, 모델 리뷰, 할 일을 한 곳에서 관리합니다.</p>
          </div>
          <Link to="/todo" className="home-primary-action">
            할 일 추가
            <ArrowUpRight size={15} />
          </Link>
        </section>

        <section className="metric-grid" aria-label="Overview">
          <div className="metric-card">
            <span className="metric-label">Open tasks</span>
            <strong className="metric-value">
              {todosLoading ? <span className="skeleton-bar metric-skeleton" /> : openTodos}
            </strong>
          </div>
          <div className="metric-card">
            <span className="metric-label">Completed</span>
            <strong className="metric-value">
              {todosLoading ? <span className="skeleton-bar metric-skeleton" /> : completedTodos}
            </strong>
          </div>
          <div className="metric-card">
            <span className="metric-label">Paper analyses</span>
            <strong className="metric-value">
              {activityLoading ? <span className="skeleton-bar metric-skeleton" /> : counts.paper}
            </strong>
          </div>
          <div className="metric-card">
            <span className="metric-label">Translations</span>
            <strong className="metric-value">
              {activityLoading ? <span className="skeleton-bar metric-skeleton" /> : counts.tx}
            </strong>
          </div>
        </section>

        <section className="apps-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">Apps</h2>
              <p className="section-description">자주 쓰는 연구 도구로 바로 이동합니다.</p>
            </div>
          </div>
          <div className="app-grid">
          {APP_CARDS.map(({ name, desc, href, unit, countKey, Icon }) => {
            const count = getCount(countKey)
            return (
              <Link key={href} to={href} className="app-card">
                <div className="app-card-top">
                  <span className="app-icon"><Icon size={18} /></span>
                  <ArrowUpRight className="app-arrow" size={16} />
                </div>
                <div className="app-card-name">{name}</div>
                <p className="app-card-desc">{desc}</p>
                <div className="app-card-count">
                  {count === null
                    ? <span className="skeleton-bar app-count-skeleton" />
                    : `${unit} ${count}${unit === '할 일' ? '개' : '회'}`
                  }
                </div>
              </Link>
            )
          })}
          </div>
        </section>

        <section className="home-grid">

          <div className="home-section home-card">
            <div className="section-header">
              <div>
                <h2 className="section-title">할 일</h2>
                <p className="section-description">최근 작업 큐</p>
              </div>
              <Link to="/todo" className="section-more">전체 보기 →</Link>
            </div>

            {todosLoading ? (
              <div className="skeleton-list">
                {[0, 1, 2].map(i => (
                  <div key={i} className="skeleton-todo-row">
                    <div className="skeleton-circle" />
                    <div className="skeleton-bar" style={{ flex: 1 }} />
                  </div>
                ))}
              </div>
            ) : visibleTodos.length === 0 ? (
              <div className="empty-state">
                <CheckSquare size={18} style={{ opacity: 0.35 }} />
                <span>할 일이 없습니다</span>
              </div>
            ) : (
              <div>
                {visibleTodos.map((todo, i) => (
                  <div
                    key={todo.id}
                    className={`todo-item${i === visibleTodos.length - 1 && extraCount <= 0 ? ' last' : ''}`}
                  >
                    <button
                      className={`todo-check${todo.done ? ' checked' : ''}`}
                      onClick={() => toggleDone(todo.id)}
                    />
                    <span className={`todo-name${todo.done ? ' done' : ''}`}>{todo.name}</span>
                    {PRIORITY_BADGE[todo.priority] && (
                      <span
                        className="todo-badge"
                        style={{
                          color: PRIORITY_BADGE[todo.priority].color,
                          background: PRIORITY_BADGE[todo.priority].bg,
                        }}
                      >
                        {PRIORITY_BADGE[todo.priority].label}
                      </span>
                    )}
                  </div>
                ))}
                {extraCount > 0 && <div className="todo-extra">외 {extraCount}개</div>}
              </div>
            )}

            <button className="todo-add-btn" onClick={() => navigate('/todo')} type="button">
              <span>+ 할 일 추가</span>
            </button>
          </div>

          <div className="home-aside">
            {activityLoading ? (
              <>
                {[0, 1, 2].map(i => (
                  <div key={i} className="activity-card home-card">
                    <div className="skeleton-activity">
                      <div className="skeleton-title-bar" />
                      <div className="skeleton-bar" />
                      <div className="skeleton-bar skeleton-bar--short" />
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <>
                <div className="activity-card home-card">
                  <div className="activity-title">최근 번역</div>
                  {txHistory.length === 0 ? (
                    <div className="activity-empty">
                      <Globe size={18} style={{ opacity: 0.35 }} />
                      <span>최근 번역 기록이 없습니다</span>
                    </div>
                  ) : txHistory.map((item, i) => (
                    <Link key={i} to="/translate" className="activity-item">
                      {trunc(item.source_text, 25)}
                    </Link>
                  ))}
                </div>

                <div className="activity-card home-card">
                  <div className="activity-title">최근 논문</div>
                  {paperHistory.length === 0 ? (
                    <div className="activity-empty">
                      <FileText size={18} style={{ opacity: 0.35 }} />
                      <span>분석한 논문이 없습니다</span>
                    </div>
                  ) : paperHistory.map((item, i) => (
                    <Link key={i} to="/paper" className="activity-item">
                      {trunc(item.title ?? '제목 없음', 30)}
                    </Link>
                  ))}
                </div>

                <div className="activity-card home-card">
                  <div className="activity-title">최근 피드백</div>
                  {archHistory.length === 0 ? (
                    <div className="activity-empty">
                      <GitBranch size={18} style={{ opacity: 0.35 }} />
                      <span>아키텍처 리뷰 기록이 없습니다</span>
                    </div>
                  ) : archHistory.map((item, i) => (
                    <Link key={i} to="/arch-trainer" className="activity-item">
                      {item.image_name ?? new Date(item.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>

        </section>
      </main>
    </div>
  )
}
