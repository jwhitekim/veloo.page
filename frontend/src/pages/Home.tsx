import { Link } from 'react-router-dom'
import './Home.css'

const PANELS = [
  { num: '01', name: '논문 분석기', desc: 'PDF · arXiv 업로드로 논문 구조 즉시 분석', href: '/paper' },
  { num: '02', name: '번역기', desc: '영어 논문 용어를 연구 맥락으로 번역', href: '/translate' },
  { num: '03', name: '아키텍처 훈련', desc: '논문 그림 AI 설명 + 설명력 셀프 훈련', href: '/arch-trainer' },
  { num: '04', name: '투두', desc: '연구실 할 일 · Supabase 동기화', href: '/todo' },
]

export default function Home() {
  return (
    <div className="home-root">
      <span className="home-wordmark">Lab Toolkit</span>
      <span className="home-lab">PRML Lab</span>
      {PANELS.map(p => (
        <Link key={p.href} to={p.href} className="panel">
          <span className="panel-arrow">↗</span>
          <div className="panel-num">{p.num}</div>
          <div className="panel-name">{p.name}</div>
          <div className="panel-desc">{p.desc}</div>
        </Link>
      ))}
    </div>
  )
}
