import { useState, useEffect, useCallback } from 'react'
import type { Todo, NavFilter } from '../types'
import * as api from '../api/client'

export function useTodos(filter: NavFilter) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.getTodos(filter === 'all' ? undefined : filter)
      setTodos(data)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { load() }, [load])

  const refresh = (updated: Todo) =>
    setTodos(prev => prev.map(t => (t.id === updated.id ? updated : t)))

  const addTodo = async (data: { name: string; memo?: string; priority?: string; deadline?: string }) => {
    const todo = await api.createTodo(data)
    const normalized = { ...todo, steps: todo.steps ?? [] }
    setTodos(prev => [normalized, ...prev])
    return normalized
  }

  const editTodo = async (id: number, data: Partial<Todo>) => {
    const updated = await api.updateTodo(id, data)
    refresh(updated)
    return updated
  }

  const removeTodo = async (id: number) => {
    await api.deleteTodo(id)
    setTodos(prev => prev.filter(t => t.id !== id))
  }

  const toggleDone = async (id: number) => {
    const updated = await api.toggleTodoDone(id)
    refresh(updated)
    return updated
  }

  return { todos, loading, reload: load, addTodo, editTodo, removeTodo, toggleDone, refresh }
}
