import { useState } from 'react'
import { Plus, RefreshCw, Edit2, Trash2 } from 'lucide-react'
import type { Todo, Step, Priority } from '../types'

interface Props {
  todo: Todo | null
  todos: Todo[]
  onUpdate: (id: number, data: Partial<Todo>) => Promise<void>
  onDelete: (id: number) => Promise<void>
  onToggleStep: (stepId: number) => void
  onAddStep: (todoId: number, text: string) => Promise<void>
  onDeleteStep: (stepId: number) => void
  onGenerateSteps: (todo: Todo) => Promise<{ steps: string[] }>
  onGenerateStrategy: (todo: Todo) => Promise<Todo>
  generatingSteps: boolean
  generatingStrategy: boolean
  onBack?: () => void
}

const priorityStyle: Record<string, string> = {
  urgent: 'text-[#a32d2d] bg-[#fcebeb] dark:bg-[#3d1414] dark:text-[#f87171]',
  mid:    'text-[#854f0b] bg-[#faeeda] dark:bg-[#2d1f08] dark:text-[#fbbf24]',
  normal: 'text-[#0f6e56] bg-[#e1f5ee] dark:bg-[#0a2318] dark:text-[#34d399]',
}
const priorityLabel: Record<string, string> = { urgent: '긴급', mid: '보통', normal: '낮음' }

function SectionHeader({ label, action }: { label: string; action?: React.ReactNode }) {
  return (
    <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wider flex items-center justify-between">
      <span>{label}</span>
      {action}
    </div>
  )
}

function StepSkeleton() {
  return (
    <div className="space-y-2 py-1">
      {[80, 65, 72].map((w, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse flex-shrink-0" />
          <div className="h-3 rounded animate-pulse bg-gray-200 dark:bg-gray-700" style={{ width: `${w}%` }} />
        </div>
      ))}
    </div>
  )
}

function StrategySkeleton() {
  return (
    <div className="space-y-2 py-1">
      <div className="h-3 rounded animate-pulse bg-gray-200 dark:bg-gray-700 w-full" />
      <div className="h-3 rounded animate-pulse bg-gray-200 dark:bg-gray-700 w-4/5" />
    </div>
  )
}

export default function FocusPanel({
  todo,
  onUpdate,
  onDelete,
  onToggleStep,
  onAddStep,
  onDeleteStep,
  onGenerateSteps,
  onGenerateStrategy,
  generatingSteps,
  generatingStrategy,
  onBack,
}: Props) {
  const [editMode, setEditMode] = useState(false)
  const [editName, setEditName] = useState('')
  const [editMemo, setEditMemo] = useState('')
  const [editPriority, setEditPriority] = useState<Priority>('normal')
  const [editDeadline, setEditDeadline] = useState('')
  const [newStep, setNewStep] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (!todo) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--panel)' }}>
        <p className="text-[13px] text-gray-400 dark:text-gray-600">할 일을 선택하세요</p>
      </div>
    )
  }

  const startEdit = () => {
    setEditName(todo.name)
    setEditMemo(todo.memo)
    setEditPriority(todo.priority)
    setEditDeadline(todo.deadline)
    setEditMode(true)
  }

  const saveEdit = async () => {
    await onUpdate(todo.id, { name: editName, memo: editMemo, priority: editPriority, deadline: editDeadline })
    setEditMode(false)
  }

  const handleAddStep = async () => {
    if (!newStep.trim()) return
    await onAddStep(todo.id, newStep.trim())
    setNewStep('')
  }

  const handleGenerateSteps = async () => {
    const result = await onGenerateSteps(todo)
    for (let i = 0; i < result.steps.length; i++) {
      await onAddStep(todo.id, result.steps[i])
    }
  }

  const steps = todo.steps ?? []
  const completedSteps = steps.filter(s => s.done).length

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--panel)' }}>
      {onBack && (
        <div className="px-4 py-2 flex-shrink-0 border-b" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={onBack}
            style={{ fontSize: 13, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            ← 목록으로
          </button>
        </div>
      )}
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
        {editMode ? (
          <div className="space-y-3">
            <input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="w-full text-[15px] font-semibold border-b pb-1 outline-none border-[#1d9e75] bg-transparent text-gray-900 dark:text-gray-100"
            />
            <textarea
              value={editMemo}
              onChange={e => setEditMemo(e.target.value)}
              rows={3}
              placeholder="메모 · 맥락"
              className="w-full border rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#1d9e75] resize-none bg-transparent text-gray-700 dark:text-gray-300"
              style={{ borderColor: 'var(--input-border)' }}
            />
            <div className="flex gap-3">
              <select
                value={editPriority}
                onChange={e => setEditPriority(e.target.value as Priority)}
                className="border rounded px-2 py-1 text-[12px] outline-none bg-transparent text-gray-700 dark:text-gray-300"
                style={{ borderColor: 'var(--input-border)' }}
              >
                <option value="urgent">긴급</option>
                <option value="mid">보통</option>
                <option value="normal">낮음</option>
              </select>
              <input
                value={editDeadline}
                onChange={e => setEditDeadline(e.target.value)}
                placeholder="마감"
                className="border rounded px-2 py-1 text-[12px] outline-none flex-1 bg-transparent text-gray-700 dark:text-gray-300"
                style={{ borderColor: 'var(--input-border)' }}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={saveEdit} className="px-3 py-1.5 text-[12px] bg-[#1d9e75] text-white rounded-lg">저장</button>
              <button onClick={() => setEditMode(false)} className="px-3 py-1.5 text-[12px] text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg">취소</button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${priorityStyle[todo.priority]}`}>
                  {priorityLabel[todo.priority]}
                </span>
                {todo.deadline && <span className="text-[11px] text-gray-400 dark:text-gray-500">{todo.deadline}</span>}
                {steps.length > 0 && (
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">단계 {completedSteps}/{steps.length} 완료</span>
                )}
              </div>
              <h2 className="text-[15px] font-semibold leading-snug text-gray-900 dark:text-gray-100">{todo.name}</h2>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button
                onClick={startEdit}
                className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
        {/* Memo */}
        {todo.memo ? (
          <div>
            <SectionHeader label="메모 · 맥락" />
            <p
              className="text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed rounded-lg px-3 py-2.5"
              style={{ background: 'var(--list)' }}
            >
              {todo.memo}
            </p>
          </div>
        ) : null}

        {/* Steps */}
        <div>
          <SectionHeader
            label="AI 실행 단계"
            action={
              <button
                onClick={handleGenerateSteps}
                disabled={generatingSteps}
                className="flex items-center gap-1 text-[10px] text-[#1d9e75] hover:text-[#188a64] disabled:opacity-50 font-normal normal-case"
              >
                <RefreshCw size={10} className={generatingSteps ? 'animate-spin' : ''} />
                {generatingSteps ? '생성 중...' : 'AI 재생성'}
              </button>
            }
          />

          {generatingSteps ? (
            <StepSkeleton />
          ) : (
            <div className="space-y-1">
              {steps.map(step => (
                <StepRow
                  key={step.id}
                  step={step}
                  onToggle={() => onToggleStep(step.id)}
                  onDelete={() => onDeleteStep(step.id)}
                />
              ))}
            </div>
          )}

          {!generatingSteps && (
            <div className="flex gap-2 mt-2">
              <input
                value={newStep}
                onChange={e => setNewStep(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddStep()}
                placeholder="+ 단계 추가"
                className="flex-1 text-[12px] text-gray-500 dark:text-gray-400 px-2 py-1.5 border-b outline-none focus:border-[#1d9e75] bg-transparent transition-colors"
                style={{ borderColor: 'var(--border)' }}
              />
              <button onClick={handleAddStep} disabled={!newStep.trim()} className="text-[#1d9e75] disabled:opacity-30">
                <Plus size={14} />
              </button>
            </div>
          )}

          {steps.length === 0 && !generatingSteps && (
            <button
              onClick={handleGenerateSteps}
              className="mt-2 w-full py-2 text-[12px] text-[#1d9e75] border border-dashed border-[#1d9e75]/30 rounded-lg hover:bg-[#e1f5ee] dark:hover:bg-[#0a2318] transition-colors"
            >
              AI로 단계 자동 생성
            </button>
          )}
        </div>

        {/* Strategy */}
        <div>
          <SectionHeader
            label="AI 전략"
            action={
              <button
                onClick={() => onGenerateStrategy(todo)}
                disabled={generatingStrategy}
                className="flex items-center gap-1 text-[10px] text-[#1d9e75] hover:text-[#188a64] disabled:opacity-50 font-normal normal-case"
              >
                <RefreshCw size={10} className={generatingStrategy ? 'animate-spin' : ''} />
                {generatingStrategy ? '생성 중...' : '재생성'}
              </button>
            }
          />

          {generatingStrategy ? (
            <StrategySkeleton />
          ) : todo.ai_strategy ? (
            <p
              className="text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed rounded-lg px-3 py-2.5"
              style={{ background: 'color-mix(in srgb, #e1f5ee 30%, var(--panel))' }}
            >
              {todo.ai_strategy}
            </p>
          ) : (
            <p className="text-[12px] text-gray-400 dark:text-gray-600 italic">전략이 아직 없습니다. 재생성을 눌러보세요.</p>
          )}
        </div>
      </div>

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-[2px]">
          <div className="rounded-xl shadow-xl p-6 w-80" style={{ background: 'var(--panel)' }}>
            <p className="text-[14px] text-gray-700 dark:text-gray-300 mb-4">이 할 일을 삭제할까요?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 text-[13px] text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg"
              >
                취소
              </button>
              <button
                onClick={async () => { await onDelete(todo.id); setShowDeleteConfirm(false) }}
                className="px-3 py-1.5 text-[13px] text-white bg-red-500 hover:bg-red-600 rounded-lg"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StepRow({ step, onToggle, onDelete }: { step: Step; onToggle: () => void; onDelete: () => void }) {
  const [hovered, setHovered] = useState(false)
  const [animating, setAnimating] = useState(false)

  const handleToggle = () => {
    if (!step.done) setAnimating(true)
    onToggle()
  }

  return (
    <div
      className="flex items-center gap-2 py-1"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={handleToggle}
        style={{ transition: 'background 0.2s ease, border-color 0.2s ease' }}
        className={`flex-shrink-0 w-4 h-4 rounded border ${
          step.done
            ? 'bg-[#1d9e75] border-[#1d9e75]'
            : 'border-gray-300 dark:border-gray-600 hover:border-[#1d9e75]'
        }`}
      >
        {step.done && (
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
      <span
        className={`flex-1 text-[13px] transition-all duration-300 ${
          step.done ? 'line-through text-gray-400 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'
        }`}
      >
        {step.text}
      </span>
      {hovered && (
        <button onClick={onDelete} className="text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors">
          <Trash2 size={12} />
        </button>
      )}
    </div>
  )
}
