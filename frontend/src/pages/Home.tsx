import { useState, useEffect } from 'react'
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

function trunc(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + '...' : s
}

export default function Home() {
  const navigate = useNavigate()
  const { todos, loading, toggleDone } = useTodos('today')

  const [txHistory, setTxHistory] = useState<TranslationHistoryItem[]>([])
  const [paperHistory, setPaperHistory] = useState<PaperHistoryItem[]>([])
  const [archHistory, setArchHistory] = useState<ArchHistoryItem[]>([])

  useEffect(() => {
    Promise.all([
      translatorApi.getTranslationHistory(),
      paperApi.getHistory(),
      archApi.getArchHistory(),
    ]).then(([tx, paper, arch]) => {
      setTxHistory(tx.slice(0, 3))
      setPaperHistory(paper.slice(0, 3))
      setArchHistory(arch.slice(0, 3))
    }).catch(() => {})
  }, [])

  const MAX_TODOS = 8
  const visibleTodos = todos.slice(0, MAX_TODOS)
  const extraCount = todos.length - MAX_TODOS

  return (
    <div className="home-root">
      <header className="home-header">
        <span className="home-wordmark">veloo</span>
        <nav className="home-nav">
          <Link to="/paper" className="home-nav-link">Paper Analyzer</Link>
          <Link to="/translate" className="home-nav-link">Translator</Link>
          <Link to="/arch-trainer" className="home-nav-link">Models Review</Link>
          <Link to="/todo" className="home-nav-link">Todo</Link>
        </nav>
      </header>

      <main className="home-main">
        <div className="home-grid">

          {/* 왼쪽: 오늘 할 일 */}
          <section className="home-section">
            <div className="section-header">
              <span className="section-title">오늘</span>
              <Link to="/todo" className="section-more">전체 보기 →</Link>
            </div>

            {loading ? (
              <div className="skeleton-list">
                <div className="skeleton-row" />
                <div className="skeleton-row" />
                <div className="skeleton-row" />
              </div>
            ) : visibleTodos.length === 0 ? (
              <div className="home-empty">오늘 할 일이 없어요</div>
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
                {extraCount > 0 && (
                  <div className="todo-extra">외 {extraCount}개</div>
                )}
              </div>
            )}

            <button className="todo-add-btn" onClick={() => navigate('/todo')}>
              + 할 일 추가
            </button>
          </section>

          {/* 오른쪽: 최근 활동 */}
          <aside className="home-aside">
            <div className="activity-section">
              <div className="activity-title">최근 번역</div>
              {txHistory.length === 0 ? (
                <div className="activity-empty">기록 없음</div>
              ) : txHistory.map((item, i) => (
                <Link key={i} to="/translate" className="activity-item">
                  {trunc(item.source_text, 25)}
                </Link>
              ))}
            </div>

            <div className="activity-section">
              <div className="activity-title">최근 논문</div>
              {paperHistory.length === 0 ? (
                <div className="activity-empty">기록 없음</div>
              ) : paperHistory.map((item, i) => (
                <Link key={i} to="/paper" className="activity-item">
                  {trunc(item.title ?? '제목 없음', 30)}
                </Link>
              ))}
            </div>

            <div className="activity-section">
              <div className="activity-title">최근 피드백</div>
              {archHistory.length === 0 ? (
                <div className="activity-empty">기록 없음</div>
              ) : archHistory.map((item, i) => (
                <Link key={i} to="/arch-trainer" className="activity-item">
                  {item.image_name ?? new Date(item.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                </Link>
              ))}
            </div>
          </aside>

        </div>
      </main>
    </div>
  )
}
