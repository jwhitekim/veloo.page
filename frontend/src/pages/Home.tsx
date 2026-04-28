import { useNavigate } from 'react-router-dom'

const TOOLS = [
  { emoji: '📄', name: '논문 분석기', desc: 'PDF·arXiv 논문 분석 및 저자 정보', path: '/paper' },
  { emoji: '🌐', name: '번역기', desc: '영어 논문 용어 번역 및 네이버 사전', path: '/translate' },
  { emoji: '🧠', name: '아키텍처 훈련', desc: '논문 그림 AI 설명 + 설명력 셀프 훈련', path: '/arch-trainer' },
  { emoji: '✅', name: '투두', desc: '연구실 할 일 관리', path: '/todo' },
]

export default function Home() {
  const navigate = useNavigate()
  return (
    <div style={{ background: '#0d1117', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', fontFamily: "'Pretendard', sans-serif" }}>
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2.2rem, 5vw, 3.4rem)', color: '#fff', letterSpacing: '0.02em' }}>
          Lab Toolkit
        </h1>
        <p style={{ marginTop: '0.6rem', fontSize: '0.95rem', color: '#8b949e' }}>PRML Lab 연구 도구 모음</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', width: '100%', maxWidth: '1100px' }}>
        {TOOLS.map(t => (
          <button
            key={t.path}
            onClick={() => navigate(t.path)}
            style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '12px', padding: '2rem 1.75rem', cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.75rem', transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.15s', color: 'inherit' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#0d9488'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 0 1px #0d9488, 0 4px 24px rgba(13,148,136,0.18)'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#30363d'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)' }}
          >
            <span style={{ fontSize: '2rem' }}>{t.emoji}</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#e6edf3' }}>{t.name}</span>
            <span style={{ fontSize: '0.85rem', color: '#8b949e', lineHeight: 1.55 }}>{t.desc}</span>
          </button>
        ))}
      </div>

      <footer style={{ marginTop: '3rem', fontSize: '0.75rem', color: '#3d444d' }}>PRML Lab © 2025</footer>
    </div>
  )
}
