import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { RotateCcw } from 'lucide-react'
import * as api from '../api/archTrainer'
import type { ExplanationJSON, FeedbackJSON } from '../api/archTrainer'

const C = {
  bg:         'var(--c-bg)',
  surface:    'var(--c-surface)',
  card:       'var(--c-card)',
  border:     'var(--c-border)',
  accent:     'var(--c-accent)',
  accentDim:  'var(--c-accent-dim)',
  accentText: 'var(--c-accent-txt)',
  text:       'var(--c-text)',
  textSub:    'var(--c-text-sub)',
  textMuted:  'var(--c-text-muted)',
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
  const navigate = useNavigate()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState('')
  const [explanation, setExplanation] = useState<ExplanationJSON | null>(null)
  const [userText, setUserText] = useState('')
  const [feedback, setFeedback] = useState<FeedbackJSON | null>(null)
  const [step, setStep] = useState<Set<Step>>(new Set(['upload']))
  const [loadingExplain, setLoadingExplain] = useState(false)
  const [loadingFeedback, setLoadingFeedback] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [textareaFocused, setTextareaFocused] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const show = (s: Step) => setStep(prev => new Set([...prev, s]))

  const setFile = (file: File) => {
    setImageFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const resetUpload = () => {
    setImageFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const doExplain = async () => {
    if (!imageFile) return
    setLoadingExplain(true)
    setStep(new Set(['upload']))
    try {
      const data = await api.explain(imageFile)
      setSessionId(data.session_id)
      setExplanation(data.explanation)
      show('train')
    } catch (e) {
      alert('오류: ' + (e as Error).message)
    } finally {
      setLoadingExplain(false)
    }
  }

  const doFeedback = async () => {
    if (!userText.trim()) { alert('설명을 입력해주세요.'); return }
    setLoadingFeedback(true)
    setStep(prev => { const s = new Set(prev); s.delete('feedback'); return s })
    try {
      const data = await api.feedback(sessionId, userText)
      setFeedback(data.feedback)
      show('feedback')
    } catch (e) {
      alert('오류: ' + (e as Error).message)
    } finally {
      setLoadingFeedback(false)
    }
  }

  const resetAll = () => {
    resetUpload()
    setExplanation(null); setUserText(''); setFeedback(null); setSessionId('')
    setStep(new Set(['upload']))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: C.bg, minHeight: '100vh', padding: '24px 16px', color: C.text }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0 rgba(177,156,217,0.4); }
          70%  { box-shadow: 0 0 0 10px rgba(177,156,217,0); }
          100% { box-shadow: 0 0 0 0 rgba(177,156,217,0); }
        }
        .reselect-btn { position: absolute; top: 8px; right: 8px; display: inline-flex; align-items: center; gap: 5px; padding: 5px 11px; border-radius: 6px; font-size: 0.78rem; font-weight: 500; cursor: pointer; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); background: rgba(255,255,255,0.72); color: rgba(0,0,0,0.72); border: 1px solid rgba(255,255,255,0.5); box-shadow: 0 1px 6px rgba(0,0,0,0.1); transition: background 0.2s; }
        .dark .reselect-btn { background: rgba(0,0,0,0.6); color: rgba(255,255,255,0.82); border-color: rgba(255,255,255,0.12); }
        .reselect-btn:hover { background: rgba(255,255,255,0.9); }
        .dark .reselect-btn:hover { background: rgba(0,0,0,0.8); }
      `}</style>

      <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 4 }}>
          <button
            onClick={() => navigate('/')}
            style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 8, padding: '5px 12px', fontSize: '0.78rem', cursor: 'pointer', color: C.textMuted, transition: 'color 0.2s, background 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.accentText; (e.currentTarget as HTMLElement).style.background = C.accentDim }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.textMuted; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)' }}
          >← Home</button>
          <div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: C.textMuted }}>
              논문 아키텍처
            </span>
            <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: C.accent, marginLeft: 6, marginBottom: 1, verticalAlign: 'middle', opacity: 0.8 }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: C.textMuted, marginLeft: 6 }}>
              설명력 훈련
            </span>
          </div>
        </div>

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
                border: `2px dashed ${dragOver ? C.accent : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 10,
                padding: '40px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragOver ? C.accentDim : 'transparent',
                transition: 'border-color 0.2s, background 0.2s',
              }}
            >
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0]) }} />
              <div style={{ fontSize: '1.6rem', marginBottom: 10, opacity: 0.5 }}>📄</div>
              <p style={{ color: C.textSub, fontSize: '0.92rem' }}>
                <strong style={{ color: C.accentText }}>클릭하거나 이미지를 드래그</strong>해서 올려주세요
              </p>
              <p style={{ marginTop: 6, fontSize: '0.78rem', color: C.textMuted }}>PNG, JPG, WEBP — 최대 10MB</p>
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
                width: '100%', minHeight: 130, border: 'none', outline: 'none',
                borderRadius: 8, padding: 14, fontSize: '0.93rem',
                fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.85,
                background: C.bg, color: C.text,
                boxShadow: textareaFocused
                  ? `0 0 0 2px rgba(177,156,217,0.35)`
                  : `0 0 0 1px rgba(255,255,255,0.08)`,
                transition: 'box-shadow 0.2s',
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
    <div style={{ borderRadius: 8, padding: '10px 14px', background: 'var(--c-card)' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 6, color: 'var(--c-accent-txt)' }}>
        {label}
      </div>
      <p style={{ fontSize: '0.9rem', color: 'var(--c-text-sub)', lineHeight: 1.75, margin: 0 }}>{content}</p>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--c-surface)', borderRadius: 14, padding: 24, border: '1px solid var(--c-border)' }}>
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
        background: 'rgba(177,156,217,0.2)', color: '#c4b5fd',
        fontSize: '0.72rem', fontWeight: 800, marginRight: 8,
      }}>{step}</span>
      <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'rgba(255,255,255,0.4)' }}>{children}</span>
    </div>
  )
}

function Btn({ children, primary, ghost, disabled, loading, onClick }: {
  children: React.ReactNode; primary?: boolean; ghost?: boolean
  disabled?: boolean; loading?: boolean; onClick?: () => void
}) {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '10px 20px', borderRadius: 8,
    fontSize: '0.88rem', fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    transition: 'opacity 0.15s, background 0.15s',
    border: 'none',
    animation: loading ? 'pulse-ring 1.4s ease-out infinite' : 'none',
  }
  const variant = primary
    ? { background: 'rgba(177,156,217,0.85)', color: '#0f0f14' }
    : ghost
      ? { background: 'transparent', color: '#c4b5fd', border: '1.5px solid rgba(177,156,217,0.4)' }
      : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)' }
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
      border: '2px solid rgba(15,15,20,0.3)',
      borderTopColor: '#0f0f14',
      borderRadius: '50%',
      display: 'inline-block',
      animation: 'spin 0.7s linear infinite',
    }} />
  )
}
