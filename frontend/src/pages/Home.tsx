import { useState, useEffect } from 'react'
import { CheckSquare, Globe, FileText, GitBranch } from 'lucide-react'
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
  { name: 'Paper Analyzer', desc: 'PDF 추출 및 논문 분석', href: '/paper',        unit: '분석',   countKey: 'paper' as const },
  { name: 'Translator',     desc: '영어 논문 용어 번역',  href: '/translate',    unit: '번역',   countKey: 'tx'    as const },
  { name: 'Models Review',  desc: '모델 설명 + AI 피드백', href: '/arch-trainer', unit: '피드백', countKey: 'arch'  as const },
  { name: 'Todo List',      desc: '연구실 할 일 관리',    href: '/todo',         unit: '할 일',  countKey: 'todo'  as const },
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

  return (
    <div className="home-root">
      <header className="home-header">
        <span className="home-wordmark">veloo</span>
      </header>

      <main className="home-main">

        {/* 상단: 앱 카드 4열 */}
        <div className="app-grid">
          {APP_CARDS.map(({ name, desc, href, unit, countKey }) => {
            const count = getCount(countKey)
            return (
              <Link key={href} to={href} className="app-card">
                <div className="app-card-name">{name}</div>
                <div className="app-card-desc">{desc}</div>
                <div className="app-card-count">
                  {count === null
                    ? <div className="skeleton-bar" style={{ width: '40%', height: 14 }} />
                    : `${unit} ${count}${unit === '할 일' ? '개' : '회'}`
                  }
                </div>
              </Link>
            )
          })}
        </div>

        {/* 하단: 2열 */}
        <div className="home-grid">

          {/* 왼쪽: 할 일 */}
          <section className="home-section home-card">
            <div className="section-header">
              <span className="section-title">할 일</span>
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

            <button className="todo-add-btn" onClick={() => navigate('/todo')}>
              + 할 일 추가
            </button>
          </section>

          {/* 오른쪽: 최근 활동 */}
          <aside className="home-aside">
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
          </aside>

        </div>
      </main>
    </div>
  )
}
