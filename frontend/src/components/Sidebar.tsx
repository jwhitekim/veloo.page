import { Moon, Sun } from 'lucide-react'
import type { NavFilter, Todo } from '../types'
import dayjs from 'dayjs'

interface Props {
  filter: NavFilter
  onFilter: (f: NavFilter) => void
  todos: Todo[]
  isDark: boolean
  onToggleDark: () => void
}

const navItems: { label: string; key: NavFilter }[] = [
  { label: '오늘', key: 'today' },
  { label: '이번주', key: 'week' },
  { label: '전체', key: 'all' },
  { label: '메모', key: 'memo' },
]

export default function Sidebar({ filter, onFilter, todos, isDark, onToggleDark }: Props) {
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
      className="flex flex-col h-full border-r flex-shrink-0"
      style={{ width: 160, borderColor: 'var(--border)', background: 'var(--panel)' }}
    >
      <div className="px-4 pt-5 pb-3">
        <div className="text-[11px] font-semibold text-gray-400 tracking-widest uppercase">PRML Lab</div>
      </div>

      <nav className="flex-1 px-2">
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={() => onFilter(item.key)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-[13px] transition-colors ${
              filter === item.key
                ? 'bg-[#e1f5ee] dark:bg-[#0f2e22] text-[#0f6e56] dark:text-[#1d9e75] font-medium'
                : 'text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <span>{item.label}</span>
            <span className={`text-[11px] tabular-nums ${
              filter === item.key ? 'text-[#1d9e75]' : 'text-gray-400 dark:text-gray-500'
            }`}>
              {count(item.key)}
            </span>
          </button>
        ))}
      </nav>

      <div
        className="px-3 py-3 border-t flex items-center justify-between"
        style={{ borderColor: 'var(--border)' }}
      >
        <span className="text-[11px] text-gray-400 dark:text-gray-500">설정</span>
        <button
          onClick={onToggleDark}
          className="p-1.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          title={isDark ? '라이트 모드' : '다크 모드'}
        >
          {isDark ? <Sun size={13} /> : <Moon size={13} />}
        </button>
      </div>
    </aside>
  )
}
