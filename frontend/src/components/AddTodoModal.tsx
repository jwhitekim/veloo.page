import { useState } from 'react'
import { X, Sparkles } from 'lucide-react'
import type { Priority } from '../types'

interface Props {
  onClose: () => void
  onSave: (data: { name: string; memo: string; priority: Priority; deadline: string }) => Promise<void>
}

const priorities: { value: Priority; label: string; cls: string; activeCls: string }[] = [
  {
    value: 'urgent',
    label: '긴급',
    cls: 'border-[#a32d2d]/20 text-[#a32d2d] dark:text-[#f87171] hover:bg-[#fcebeb] dark:hover:bg-[#3d1414]',
    activeCls: 'bg-[#fcebeb] dark:bg-[#3d1414] border-[#a32d2d]/40 text-[#a32d2d] dark:text-[#f87171]',
  },
  {
    value: 'mid',
    label: '보통',
    cls: 'border-[#854f0b]/20 text-[#854f0b] dark:text-[#fbbf24] hover:bg-[#faeeda] dark:hover:bg-[#2d1f08]',
    activeCls: 'bg-[#faeeda] dark:bg-[#2d1f08] border-[#854f0b]/40 text-[#854f0b] dark:text-[#fbbf24]',
  },
  {
    value: 'normal',
    label: '낮음',
    cls: 'border-[#0f6e56]/20 text-[#0f6e56] dark:text-[#34d399] hover:bg-[#e1f5ee] dark:hover:bg-[#0a2318]',
    activeCls: 'bg-[#e1f5ee] dark:bg-[#0a2318] border-[#0f6e56]/40 text-[#0f6e56] dark:text-[#34d399]',
  },
]

export default function AddTodoModal({ onClose, onSave }: Props) {
  const [name, setName] = useState('')
  const [memo, setMemo] = useState('')
  const [priority, setPriority] = useState<Priority>('normal')
  const [deadline, setDeadline] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      await onSave({ name: name.trim(), memo, priority, deadline })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(3px)' }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl shadow-2xl w-[480px] overflow-hidden"
        style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-0">
          <h2 className="text-[14px] font-semibold text-gray-800 dark:text-gray-200">할 일 추가</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 pt-4 pb-5 space-y-4">
          {/* Title */}
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="무엇을 해야 하나요?"
            className="w-full text-[15px] font-medium placeholder:text-gray-300 dark:placeholder:text-gray-600 bg-transparent outline-none text-gray-900 dark:text-gray-100 border-b pb-2 transition-colors focus:border-[#1d9e75]"
            style={{ borderColor: 'var(--border)' }}
          />

          {/* Memo */}
          <textarea
            value={memo}
            onChange={e => setMemo(e.target.value)}
            placeholder="맥락이나 배경을 적어두세요 — 피드백, 참고사항, 이전 논의 등"
            rows={3}
            className="w-full text-[13px] placeholder:text-gray-300 dark:placeholder:text-gray-600 bg-transparent outline-none resize-none text-gray-700 dark:text-gray-300 rounded-lg px-3 py-2.5 transition-colors"
            style={{ background: 'var(--list)' }}
          />

          {/* Priority pills */}
          <div>
            <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-2">우선순위</div>
            <div className="flex gap-2">
              {priorities.map(p => (
                <button
                  key={p.value}
                  onClick={() => setPriority(p.value)}
                  className={`flex-1 py-1.5 rounded-lg text-[12px] font-medium border transition-colors ${
                    priority === p.value ? p.activeCls : `border-transparent ${p.cls}`
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Deadline */}
          <div>
            <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-2">마감</div>
            <input
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              placeholder="예: 이번주 금요일, 오늘, 다음주"
              className="w-full text-[13px] rounded-lg px-3 py-2 outline-none border bg-transparent text-gray-700 dark:text-gray-300 placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:border-[#1d9e75] transition-colors"
              style={{ borderColor: 'var(--input-border)' }}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex justify-end gap-2 px-6 py-4 border-t"
          style={{ borderColor: 'var(--border)', background: 'var(--list)' }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 text-[13px] text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="px-4 py-2 text-[13px] text-white bg-[#1d9e75] hover:bg-[#188a64] rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {saving ? (
              <>
                <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                AI 생성 중...
              </>
            ) : (
              <>
                <Sparkles size={13} />
                저장하기
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
