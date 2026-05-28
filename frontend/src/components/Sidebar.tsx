import type { NavFilter, Todo } from '../types'
import dayjs from 'dayjs'

interface Props {
  filter: NavFilter
  onFilter: (f: NavFilter) => void
  todos: Todo[]
}

const navItems: { label: string; key: NavFilter }[] = [
  { label: '오늘', key: 'today' },
  { label: '이번주', key: 'week' },
  { label: '전체', key: 'all' },
  { label: '메모', key: 'memo' },
]

export default function Sidebar({ filter, onFilter, todos }: Props) {
  const count = (key: NavFilter) => {
    if (key === 'today') {
      const today = dayjs().format('YYYY-MM-DD')
      return todos.filter(t => dayjs(t.created_at).format('YYYY-MM-DD') === today || t.deadline?.includes('오늘')).length
    }
    if (key === 'week') return todos.filter(t => !t.done).length
    if (key === 'all') return todos.length
    if (key === 'memo') return todos.filter(t => t.memo).length
    return 0
  }

  return (
    <aside
      className="flex flex-col h-full flex-shrink-0"
      style={{ width: 'var(--sidebar-w)', borderRight: '1px solid var(--border-subtle)', background: 'var(--bg-base)' }}
    >
      <div style={{ padding: '20px 16px 12px' }} />

      <nav className="flex-1 px-2">
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={() => onFilter(item.key)}
            className={`sidebar-item${filter === item.key ? ' active' : ''}`}
          >
            <span>{item.label}</span>
            <span className="sidebar-count">{count(item.key)}</span>
          </button>
        ))}
      </nav>

    </aside>
  )
}
