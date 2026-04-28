export type Priority = 'urgent' | 'mid' | 'normal'

export interface Step {
  id: number
  todo_id: number
  text: string
  done: boolean
  order_index: number
}

export interface Todo {
  id: number
  name: string
  memo: string
  priority: Priority
  deadline: string
  done: boolean
  ai_strategy: string
  created_at: string
  updated_at: string
  steps: Step[]
}

export type NavFilter = 'today' | 'week' | 'all' | 'memo'
