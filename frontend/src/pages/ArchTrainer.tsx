import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import * as api from '../api/archTrainer'

type Step = 'upload' | 'explanation' | 'train' | 'feedback'

export default function ArchTrainer() {
  const navigate = useNavigate()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState('')
  const [explanation, setExplanation] = useState('')
  const [userText, setUserText] = useState('')
  const [feedbackText, setFeedbackText] = useState('')
  const [step, setStep] = useState<Set<Step>>(new Set(['upload']))
  const [loadingExplain, setLoadingExplain] = useState(false)
  const [loadingFeedback, setLoadingFeedback] = useState(false)
  const [showExplanation, setShowExplanation] = useState(true)
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
      show('explanation')
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
      setFeedbackText(data.feedback)
      show('feedback')
    } catch (e) {
      alert('오류: ' + (e as Error).message)
    } finally {
      setLoadingFeedback(false)
    }
  }

  const resetAll = () => {
    resetUpload()
    setExplanation(''); setUserText(''); setFeedbackText(''); setSessionId('')
    setStep(new Set(['upload']))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const s: React.CSSProperties = {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    background: '#f5f5f5', minHeight: '100vh', padding: '24px 16px',
  }

  return (
    <div style={s}>
      <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/')} style={backBtn}>← Home</button>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700 }}>
            논문 아키텍처 <span style={{ color: '#6366f1' }}>설명력 훈련</span>
          </h1>
        </div>

        {/* Step 1 */}
        <Card>
          <CardTitle step={1}>아키텍처 그림 업로드</CardTitle>
          {!previewUrl ? (
            <div
              style={dropZoneStyle}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLDivElement).style.borderColor = '#6366f1' }}
              onDragLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#d1d5db' }}
              onDrop={e => { e.preventDefault(); (e.currentTarget as HTMLDivElement).style.borderColor = '#d1d5db'; const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) setFile(f) }}
            >
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0]) }} />
              <p style={{ color: '#9ca3af', fontSize: '0.92rem' }}>📄 <strong style={{ color: '#4b5563' }}>클릭하거나 이미지를 드래그</strong>해서 올려주세요</p>
              <p style={{ marginTop: 6, fontSize: '0.8rem', color: '#9ca3af' }}>PNG, JPG, WEBP — 최대 10MB</p>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <img src={previewUrl} alt="미리보기" style={{ width: '100%', maxHeight: 400, objectFit: 'contain', borderRadius: 8, border: '1px solid #e5e7eb' }} />
              <button onClick={resetUpload} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,.55)', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: '0.8rem', cursor: 'pointer' }}>다시 선택</button>
            </div>
          )}
          <div style={{ marginTop: 14 }}>
            <Btn primary disabled={!imageFile || loadingExplain} onClick={doExplain}>
              {loadingExplain ? <><Spinner />AI가 분석 중...</> : 'AI 설명 받기'}
            </Btn>
          </div>
        </Card>

        {/* Step 2 */}
        {step.has('explanation') && (
          <Card>
            <CardTitle step={2}>AI 설명</CardTitle>
            <div style={mdStyle}><ReactMarkdown>{explanation}</ReactMarkdown></div>
            <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
              <Btn primary onClick={() => { setUserText(''); setStep(prev => { const s = new Set(prev); s.delete('feedback'); return new Set([...s, 'train']) }) }}>직접 설명해보기 →</Btn>
            </div>
          </Card>
        )}

        {/* Step 3 */}
        {step.has('train') && (
          <Card>
            <CardTitle step={3}>내 설명 입력</CardTitle>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: 12 }}>AI 설명을 보지 말고, 이 아키텍처를 내 말로 설명해보세요.</p>
            <textarea
              value={userText}
              onChange={e => setUserText(e.target.value)}
              placeholder="이 모델은... 전체적으로... 각 모듈은..."
              style={{ width: '100%', minHeight: 130, border: '1.5px solid #d1d5db', borderRadius: 8, padding: 12, fontSize: '0.93rem', fontFamily: 'inherit', resize: 'vertical', outline: 'none', lineHeight: 1.6 }}
            />
            <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
              <Btn primary disabled={loadingFeedback} onClick={doFeedback}>
                {loadingFeedback ? <><Spinner />피드백 생성 중...</> : '피드백 받기'}
              </Btn>
              <Btn onClick={() => setShowExplanation(v => !v)}>AI 설명 보기/숨기기</Btn>
            </div>
          </Card>
        )}

        {/* Step 4 */}
        {step.has('feedback') && (
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#888' }}>피드백</span>
              <span style={{ background: '#ecfdf5', color: '#059669', borderRadius: 20, padding: '2px 10px', fontSize: '0.78rem', fontWeight: 600 }}>AI 채점</span>
            </div>
            <div style={mdStyle}><ReactMarkdown>{feedbackText}</ReactMarkdown></div>
            <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: 14 }}>더 잘 설명할 수 있을 것 같으면 다시 도전해보세요.</p>
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

const backBtn: React.CSSProperties = { background: '#e5e7eb', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: '0.8rem', cursor: 'pointer', color: '#374151' }
const dropZoneStyle: React.CSSProperties = { border: '2px dashed #d1d5db', borderRadius: 10, padding: '40px 20px', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.18s' }
const mdStyle: React.CSSProperties = { fontSize: '0.93rem', lineHeight: 1.7, color: '#374151' }

function Card({ children }: { children: React.ReactNode }) {
  return <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>{children}</div>
}

function CardTitle({ step, children }: { step: number; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: '#6366f1', color: '#fff', fontSize: '0.72rem', fontWeight: 700, marginRight: 6 }}>{step}</span>
      <span style={{ fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#888' }}>{children}</span>
    </div>
  )
}

function Btn({ children, primary, ghost, disabled, onClick }: { children: React.ReactNode; primary?: boolean; ghost?: boolean; disabled?: boolean; onClick?: () => void }) {
  const base: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 8, fontSize: '0.92rem', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1, transition: 'opacity 0.15s', border: 'none' }
  const variant = primary ? { background: '#6366f1', color: '#fff' } : ghost ? { background: 'transparent', color: '#6366f1', border: '1.5px solid #6366f1' } : { background: '#f3f4f6', color: '#374151' }
  return <button style={{ ...base, ...variant }} disabled={disabled} onClick={onClick}>{children}</button>
}

function Spinner() {
  return <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.35)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite', marginRight: 6, verticalAlign: 'middle' }} />
}
