import type { Todo, Step } from '../types'

const BASE = '/todo/api'

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err)
  }
  return res.json()
}

export const getTodos = (filter?: string) =>
  req<Todo[]>('/todos' + (filter ? `?filter=${filter}` : ''))

export const getTodo = (id: number) => req<Todo>(`/todos/${id}`)

export const createTodo = (data: { name: string; memo?: string; priority?: string; deadline?: string }) =>
  req<Todo>('/todos', { method: 'POST', body: JSON.stringify(data) })

export const updateTodo = (id: number, data: Partial<Todo>) =>
  req<Todo>(`/todos/${id}`, { method: 'PATCH', body: JSON.stringify(data) })

export const deleteTodo = (id: number) =>
  req<{ ok: boolean }>(`/todos/${id}`, { method: 'DELETE' })

export const toggleTodoDone = (id: number) =>
  req<Todo>(`/todos/${id}/done`, { method: 'PATCH' })

export const addStep = (todoId: number, data: { text: string; order_index?: number }) =>
  req<Step>(`/todos/${todoId}/steps`, { method: 'POST', body: JSON.stringify(data) })

export const updateStep = (stepId: number, data: Partial<Step>) =>
  req<Step>(`/steps/${stepId}`, { method: 'PATCH', body: JSON.stringify(data) })

export const toggleStepDone = (stepId: number) =>
  req<Step>(`/steps/${stepId}/done`, { method: 'PATCH' })

export const deleteStep = (stepId: number) =>
  req<{ ok: boolean }>(`/steps/${stepId}`, { method: 'DELETE' })

export const generateSteps = (data: { todo_name: string; memo?: string; priority?: string; deadline?: string }) =>
  req<{ steps: string[] }>('/ai/generate-steps', { method: 'POST', body: JSON.stringify(data) })

export const generateStrategy = (data: { todo_id: number; todos: Partial<Todo>[] }) =>
  req<Todo>('/ai/generate-strategy', { method: 'POST', body: JSON.stringify(data) })
