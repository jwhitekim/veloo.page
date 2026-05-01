import { useState, useRef, useEffect } from 'react'
import { Pencil } from 'lucide-react'
import type { Todo } from '../types'

interface Props {
  todo: Todo
  selected: boolean
  onSelect: () => void
  onToggle: () => void
  onEdit: (id: number, name: string) => void
}

const priorityStyle: Record<string, string> = {
  urgent: 'text-[#a32d2d] bg-[#fcebeb] dark:bg-[#3d1414] dark:text-[#f87171]',
  mid:    'text-[#854f0b] bg-[#faeeda] dark:bg-[#2d1f08] dark:text-[#fbbf24]',
  normal: 'text-[#0f6e56] bg-[#e1f5ee] dark:bg-[#0a2318] dark:text-[#34d399]',
}

const priorityLabel: Record<string, string> = {
  urgent: '긴급',
  mid:    '보통',
  normal: '낮음',
}

export default function TodoItem({ todo, selected, onSelect, onToggle, onEdit }: Props) {
  const [animating, setAnimating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(todo.name)
  const inputRef = useRef<HTMLInputElement>(null)

  const completedSteps = todo.steps.filter(s => s.done).length
  const totalSteps = todo.steps.length

  useEffect(() => {
    if (isEditing) inputRef.current?.focus()
  }, [isEditing])

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!todo.done) setAnimating(true)
    onToggle()
  }

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditValue(todo.name)
    setIsEditing(true)
  }

  const commitEdit = () => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== todo.name) onEdit(todo.id, trimmed)
    setIsEditing(false)
  }

  const cancelEdit = () => {
    setEditValue(todo.name)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); commitEdit() }
    if (e.key === 'Escape') cancelEdit()
  }

  return (
    <div
      onClick={isEditing ? undefined : onSelect}
      style={{ transition: 'opacity 0.3s ease' }}
      className={`group px-3 py-2.5 rounded-md cursor-pointer transition-colors ${
        selected
          ? 'bg-white dark:bg-[#262626] shadow-sm'
          : 'hover:bg-white/60 dark:hover:bg-white/5'
      } ${todo.done ? 'opacity-40' : 'opacity-100'}`}
    >
      <div className="flex items-start gap-2">
        <button
          onClick={handleToggle}
          style={{ transition: 'background 0.2s ease, border-color 0.2s ease' }}
          className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border ${
            todo.done
              ? 'bg-[#1d9e75] border-[#1d9e75]'
              : 'border-gray-300 dark:border-gray-600 hover:border-[#1d9e75]'
          }`}
        >
          {todo.done && (
            <svg viewBox="0 0 12 10" fill="none" className="w-full h-full p-0.5">
              <path
                className={animating ? 'check-path' : ''}
                d="M1 5l3.5 3.5L11 1"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${priorityStyle[todo.priority]}`}>
              {priorityLabel[todo.priority]}
            </span>
            {todo.deadline && (
              <span className="text-[10px] text-gray-400 dark:text-gray-500">{todo.deadline}</span>
            )}
          </div>

          {isEditing ? (
            <input
              ref={inputRef}
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={commitEdit}
              onClick={e => e.stopPropagation()}
              className="w-full mt-0.5 text-[13px] leading-snug bg-transparent border-b border-[#1d9e75] outline-none text-gray-800 dark:text-gray-200"
            />
          ) : (
            <p className={`text-[13px] mt-0.5 leading-snug transition-all duration-300 ${
              todo.done ? 'line-through text-gray-400 dark:text-gray-600' : 'text-gray-800 dark:text-gray-200'
            }`}>
              {todo.name}
            </p>
          )}

          {totalSteps > 0 && (
            <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-0.5">
              단계 {completedSteps}/{totalSteps} 완료
            </p>
          )}
        </div>

        {!todo.done && !isEditing && (
          <button
            onClick={startEdit}
            className="flex-shrink-0 mt-0.5 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-[#1d9e75]"
          >
            <Pencil size={12} />
          </button>
        )}
      </div>
    </div>
  )
}
