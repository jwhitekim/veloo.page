import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { NavFilter, Priority, Todo } from '../types'
import { useTodos } from '../hooks/useTodos'
import { useAi } from '../hooks/useAi'
import Sidebar from '../components/Sidebar'
import TodoList from '../components/TodoList'
import FocusPanel from '../components/FocusPanel'
import * as api from '../api/client'

const LIST_MIN = 120
const LIST_MAX = 600
const LIST_DEFAULT = 220

export default function TodoPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<NavFilter>('all')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [listWidth, setListWidth] = useState(LIST_DEFAULT)

  const { todos, loading, reload, addTodo, editTodo, removeTodo, toggleDone, refresh } = useTodos(filter)
  const { generateSteps, generateStrategy, generatingSteps, generatingStrategy } = useAi()

  const selectedTodo = todos.find(t => t.id === selectedId) ?? null

  const dragRef = useRef<{ startX: number; startW: number } | null>(null)

  const handleResizerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragRef.current = { startX: e.clientX, startW: listWidth }
    document.documentElement.classList.add('is-resizing')

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return
      const delta = ev.clientX - dragRef.current.startX
      setListWidth(Math.max(LIST_MIN, Math.min(LIST_MAX, dragRef.current.startW + delta)))
    }

    const onUp = () => {
      dragRef.current = null
      document.documentElement.classList.remove('is-resizing')
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [listWidth])

  const handleAdd = async (data: { name: string; memo: string; priority: Priority; deadline: string }) => {
    const todo = await addTodo(data)
    setSelectedId(todo.id)
    try {
      const stepsResult = await generateSteps(todo)
      for (let i = 0; i < stepsResult.steps.length; i++) {
        await api.addStep(todo.id, { text: stepsResult.steps[i], order_index: i })
      }
      const allTodos = await api.getTodos()
      const updatedTodo = await api.generateStrategy({ todo_id: todo.id, todos: allTodos })
      refresh(updatedTodo)
      await reload()
    } catch (e) {
      console.error('AI generation failed', e)
      await reload()
    }
  }

  const handleToggleStep = useCallback(async (stepId: number) => {
    await api.toggleStepDone(stepId)
    await reload()
  }, [reload])

  const handleAddStep = useCallback(async (todoId: number, text: string) => {
    await api.addStep(todoId, { text, order_index: 999 })
    await reload()
  }, [reload])

  const handleDeleteStep = useCallback(async (stepId: number) => {
    await api.deleteStep(stepId)
    await reload()
  }, [reload])

  const handleGenerateSteps = useCallback(async (todo: Todo) => generateSteps(todo), [generateSteps])

  const handleGenerateStrategy = useCallback(async (todo: Todo) => {
    const allTodos = await api.getTodos()
    const updated = await generateStrategy(todo, allTodos)
    refresh(updated)
    return updated
  }, [generateStrategy, refresh])

  const handleUpdate = useCallback(async (id: number, data: Partial<Todo>) => {
    await editTodo(id, data)
  }, [editTodo])

  const handleDelete = useCallback(async (id: number) => {
    await removeTodo(id)
    setSelectedId(null)
  }, [removeTodo])

  const handleToggleDone = useCallback(async (id: number) => {
    await toggleDone(id)
  }, [toggleDone])

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Home button */}
      <button
        onClick={() => navigate('/')}
        style={{ position: 'fixed', top: 12, right: 12, zIndex: 9999, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '4px 10px', color: '#ccc', fontSize: '0.78rem', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
      >
        ← Home
      </button>

      <Sidebar filter={filter} onFilter={setFilter} todos={todos} />

      <TodoList
        todos={todos}
        filter={filter}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onToggle={handleToggleDone}
        onAdd={handleAdd}
        width={listWidth}
      />

      <div
        onMouseDown={handleResizerMouseDown}
        className="w-1 flex-shrink-0 cursor-col-resize hover:bg-[#1d9e75]/30 transition-colors"
        style={{ background: 'var(--border)' }}
      />

      {loading && !selectedTodo ? (
        <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--panel)' }}>
          <span className="text-[13px] text-gray-400">불러오는 중...</span>
        </div>
      ) : (
        <FocusPanel
          todo={selectedTodo}
          todos={todos}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onToggleStep={handleToggleStep}
          onAddStep={handleAddStep}
          onDeleteStep={handleDeleteStep}
          onGenerateSteps={handleGenerateSteps}
          onGenerateStrategy={handleGenerateStrategy}
          generatingSteps={generatingSteps}
          generatingStrategy={generatingStrategy}
        />
      )}
    </div>
  )
}
