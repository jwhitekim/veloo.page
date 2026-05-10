import { useState, useRef } from 'react'
import { RotateCcw } from 'lucide-react'
import AppHeader from '../components/AppHeader'
import * as api from '../api/archTrainer'
import type { ExplanationJSON, FeedbackJSON } from '../api/archTrainer'

const C = {
  bg:         'var(--bg-base)',
  surface:    'var(--bg-base)',
  card:       'var(--bg-additive)',
  border:     'var(--border-subtle)',
  accent:     'var(--text-primary)',
  accentDim:  'var(--bg-additive)',
  accentText: 'var(--text-primary)',
  text:       'var(--text-primary)',
  textSub:    'var(--text-secondary)',
  textMuted:  'var(--text-disabled)',
  green:      'var(--c-green)',
  greenDim:   'var(--c-green-dim)',
  error:      'var(--c-error)',
}

const SECTION_LABELS: Record<keyof ExplanationJSON, string> = {
  overview:     '전체 흐름',
  modules:      '각 모듈',
  data_flow:    '데이터 흐름',
  contribution: '핵심 기여',
}

const FEEDBACK_LABELS: Record<keyof FeedbackJSON, string> = {
  correct:    '잘 이해한 부분',
  missing:    '틀리거나 빠진 부분',
  suggestion: '더 정확한 표현',
}

type Step = 'upload' | 'train' | 'feedback'

export default function ArchTrainer() {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [explanation, setExplanation] = useState<ExplanationJSON | null>(null)
  const [userText, setUserText] = useState('')
  const [feedback, setFeedback] = useState<FeedbackJSON | null>(null)
  const [step, setStep] = useState<Set<Step>>(new Set(['upload']))
  const [loadingExplain, setLoadingExplain] = useState(false)
  const [loadingFeedback, setLoadingFeedback] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [textareaFocused, setTextareaFocused] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const show = (s: Step) => setStep(prev => new Set([...prev, s]))

  const setFile = (file: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setImageFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const resetUpload = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setImageFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const doExplain = async () => {
    if (!imageFile) return
    setLoadingExplain(true)
    setError(null)
    setStep(new Set(['upload']))
    try {
      const data = await api.explain(imageFile)
      setExplanation(data.explanation)
      show('train')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoadingExplain(false)
    }
  }

  const doFeedback = async () => {
    if (!userText.trim()) { setError('설명을 입력해주세요.'); return }
    setLoadingFeedback(true)
    setError(null)
    setStep(prev => { const s = new Set(prev); s.delete('feedback'); return s })
    try {
      const data = await api.feedback(explanation!, userText)
      setFeedback(data.feedback)
      show('feedback')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoadingFeedback(false)
    }
  }

  const resetAll = () => {
    resetUpload()
    setExplanation(null); setUserText(''); setFeedback(null)
    setStep(new Set(['upload']))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .reselect-btn { position: absolute; top: 8px; right: 8px; display: inline-flex; align-items: center; gap: 5px; padding: 5px 11px; border-radius: 6px; font-size: 0.78rem; font-weight: 500; cursor: pointer; background: rgba(255,255,255,0.88); color: #0f0f0f; border: 1px solid #e5e5e5; transition: background 0.15s; }
        .reselect-btn:hover { background: #ffffff; }
        textarea::placeholder { color: var(--text-secondary); }
      `}</style>

      <AppHeader title="아키텍처 훈련" />

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && (
          <div style={{ padding: '10px 16px', borderRadius: 'var(--radius-md)', background: 'var(--c-error-dim, #fef2f2)', color: C.error, fontSize: 14, border: '1px solid var(--c-error)' }}>
            {error}
          </div>
        )}


        {/* Step 1 — Upload */}
        <Card>
          <CardTitle step={1}>아키텍처 그림 업로드</CardTitle>
          {!previewUrl ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) setFile(f) }}
              style={{
                border: `1.5px dashed ${dragOver ? C.accent : C.border}`,
                borderRadius: 'var(--radius-lg)',
                padding: '40px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: C.card,
                transition: 'border-color 0.15s',
              }}
            >
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0]) }} />
              <div style={{ fontSize: '1.6rem', marginBottom: 10, opacity: 0.4 }}>📄</div>
              <p style={{ color: C.textSub, fontSize: 14, margin: 0 }}>
                <strong style={{ color: C.text }}>클릭하거나 이미지를 드래그</strong>해서 올려주세요
              </p>
              <p style={{ marginTop: 6, fontSize: 12, color: C.textMuted }}>PNG, JPG, WEBP — 최대 10MB</p>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <img
                src={previewUrl}
                alt="미리보기"
                style={{ width: '100%', maxHeight: 400, objectFit: 'contain', borderRadius: 8, border: `1px solid ${C.border}`, background: C.card }}
              />
              <button onClick={resetUpload} className="reselect-btn">
                <RotateCcw size={11} />다시 선택
              </button>
            </div>
          )}
          <div style={{ marginTop: 16 }}>
            <Btn primary disabled={!imageFile || loadingExplain} onClick={doExplain} loading={loadingExplain}>
              {loadingExplain ? 'AI가 분석 중...' : 'AI 설명 받기'}
            </Btn>
          </div>
        </Card>

        {/* Step 2 — User Input */}
        {step.has('train') && (
          <Card>
            <CardTitle step={2}>직접 설명해보기</CardTitle>
            <p style={{ fontSize: '0.85rem', color: C.textMuted, marginBottom: 12 }}>준비됐습니다. 먼저 직접 설명해보세요.</p>
            <textarea
              value={userText}
              onChange={e => setUserText(e.target.value)}
              onFocus={() => setTextareaFocused(true)}
              onBlur={() => setTextareaFocused(false)}
              placeholder="이 모델은... 전체적으로... 각 모듈은..."
              style={{
                width: '100%', minHeight: 130, outline: 'none',
                border: `1px solid ${textareaFocused ? '#aaaaaa' : C.border}`,
                borderRadius: 'var(--radius-md)', padding: 14, fontSize: 14,
                fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.85,
                background: C.bg, color: C.text,
                transition: 'border-color 0.15s',
              }}
            />
            <div style={{ marginTop: 14 }}>
              <Btn primary disabled={loadingFeedback} onClick={doFeedback} loading={loadingFeedback}>
                {loadingFeedback ? '피드백 생성 중...' : '피드백 받기'}
              </Btn>
            </div>
          </Card>
        )}

        {/* Step 3 — AI Explanation + Feedback */}
        {step.has('feedback') && explanation && feedback && (
          <Card>
            <CardTitle step={3}>분석 결과</CardTitle>

            {/* AI 설명 */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: C.textMuted, marginBottom: 10 }}>AI 설명</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(Object.keys(SECTION_LABELS) as (keyof ExplanationJSON)[]).map(key => (
                  <SectionBlock key={key} label={SECTION_LABELS[key]} content={explanation[key]} />
                ))}
              </div>
            </div>

            {/* 피드백 */}
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: C.textMuted, marginBottom: 10 }}>피드백</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(Object.keys(FEEDBACK_LABELS) as (keyof FeedbackJSON)[]).map(key => (
                  <SectionBlock key={key} label={FEEDBACK_LABELS[key]} content={feedback[key]} />
                ))}
              </div>
            </div>

            <p style={{ fontSize: '0.82rem', color: C.textMuted, marginTop: 16 }}>더 잘 설명할 수 있을 것 같으면 다시 도전해보세요.</p>
            <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
              <Btn ghost onClick={() => { setUserText(''); setStep(prev => { const s = new Set(prev); s.delete('feedback'); return s }) }}>다시 설명하기</Btn>
              <Btn onClick={resetAll}>새 논문 업로드</Btn>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

function SectionBlock({ label, content }: { label: string; content: string }) {
  return (
    <div style={{ borderRadius: 'var(--radius-md)', padding: '10px 14px', background: 'var(--bg-additive)' }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 6, color: 'var(--text-secondary)' }}>
        {label}
      </div>
      <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.75, margin: 0 }}>{content}</p>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-base)', borderRadius: 'var(--radius-lg)', padding: 24, border: '1px solid var(--border-subtle)' }}>
      {children}
    </div>
  )
}

function CardTitle({ step, children }: { step: number; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 22, height: 22, borderRadius: '50%',
        background: 'var(--selected-bg)', color: 'var(--selected-text)',
        fontSize: 11, fontWeight: 700, marginRight: 8,
      }}>{step}</span>
      <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-primary)' }}>{children}</span>
    </div>
  )
}

function Btn({ children, primary, ghost, disabled, loading, onClick }: {
  children: React.ReactNode; primary?: boolean; ghost?: boolean
  disabled?: boolean; loading?: boolean; onClick?: () => void
}) {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '8px 20px', borderRadius: 'var(--radius-md)',
    fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    transition: 'background 0.15s',
    border: 'none',
  }
  const variant = primary
    ? { background: 'var(--selected-bg)', color: 'var(--selected-text)' }
    : ghost
      ? { background: 'transparent', color: 'var(--text-primary)', border: '1.5px solid var(--border-subtle)' }
      : { background: 'var(--bg-additive)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }
  return (
    <button style={{ ...base, ...variant }} disabled={disabled} onClick={onClick}>
      {loading && <Spinner />}
      {children}
    </button>
  )
}

function Spinner() {
  return (
    <span style={{
      width: 13, height: 13,
      border: '2px solid var(--border-subtle)',
      borderTopColor: 'var(--text-primary)',
      borderRadius: '50%',
      display: 'inline-block',
      animation: 'spin 0.7s linear infinite',
    }} />
  )
}
