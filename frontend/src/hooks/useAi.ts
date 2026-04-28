import { useState } from 'react'
import type { Todo } from '../types'
import * as api from '../api/client'

export function useAi() {
  const [generatingSteps, setGeneratingSteps] = useState(false)
  const [generatingStrategy, setGeneratingStrategy] = useState(false)

  const generateSteps = async (todo: Todo) => {
    setGeneratingSteps(true)
    try {
      return await api.generateSteps({
        todo_name: todo.name,
        memo: todo.memo,
        priority: todo.priority,
        deadline: todo.deadline,
      })
    } finally {
      setGeneratingSteps(false)
    }
  }

  const generateStrategy = async (todo: Todo, todos: Todo[]) => {
    setGeneratingStrategy(true)
    try {
      return await api.generateStrategy({
        todo_id: todo.id,
        todos: todos.map(t => ({ id: t.id, name: t.name, priority: t.priority, deadline: t.deadline, done: t.done })),
      })
    } finally {
      setGeneratingStrategy(false)
    }
  }

  return { generateSteps, generateStrategy, generatingSteps, generatingStrategy }
}
