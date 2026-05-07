import { useState } from 'react'
import { Plus } from 'lucide-react'
import dayjs from 'dayjs'
import 'dayjs/locale/ko'
import type { Todo, NavFilter, Priority } from '../types'
import TodoItem from './TodoItem'
import AddTodoModal from './AddTodoModal'

dayjs.locale('ko')

interface Props {
  todos: Todo[]
  filter: NavFilter
  selectedId: number | null
  onSelect: (id: number) => void
  onToggle: (id: number) => void
  onEdit: (id: number, name: string) => void
  onAdd: (data: { name: string; memo: string; priority: Priority; deadline: string }) => Promise<void>
  width: number
}

export default function TodoList({ todos, filter, selectedId, onSelect, onToggle, onEdit, onAdd, width }: Props) {
  const [showModal, setShowModal] = useState(false)

  const active = todos.filter(t => !t.done)
  const done = todos.filter(t => t.done)

  const filterLabel: Record<NavFilter, string> = {
    today: dayjs().format('YYYY년 M월 D일'),
    week: '이번주',
    all: '전체',
    memo: '메모',
  }

  return (
    <div
      className="flex flex-col h-full border-r flex-shrink-0"
      style={{ width, borderRight: '1px solid var(--border-subtle)', background: 'var(--bg-additive)' }}
    >
      <div className="px-3 pt-4 pb-2">
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{filterLabel[filter]}</div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>{active.length}개 진행 중</div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
        {active.map(todo => (
          <TodoItem
            key={todo.id}
            todo={todo}
            selected={todo.id === selectedId}
            onSelect={() => onSelect(todo.id)}
            onToggle={() => onToggle(todo.id)}
            onEdit={onEdit}
          />
        ))}

        {done.length > 0 && (
          <>
            <div className="px-3 pt-3 pb-1 text-[11px] text-gray-400 dark:text-gray-600">완료됨 ({done.length})</div>
            {done.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                selected={todo.id === selectedId}
                onSelect={() => onSelect(todo.id)}
                onToggle={() => onToggle(todo.id)}
                onEdit={onEdit}
              />
            ))}
          </>
        )}

        {todos.length === 0 && (
          <div className="px-3 py-8 text-center text-[12px] text-gray-400 dark:text-gray-600">
            할 일이 없습니다
          </div>
        )}
      </div>

      <div className="p-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <button
          onClick={() => setShowModal(true)}
          className="sidebar-item"
          style={{ color: 'var(--text-secondary)', fontWeight: 500, gap: 6 }}
        >
          <Plus size={14} />
          할 일 추가
        </button>
      </div>

      {showModal && (
        <AddTodoModal
          onClose={() => setShowModal(false)}
          onSave={async data => { await onAdd(data) }}
        />
      )}
    </div>
  )
}
