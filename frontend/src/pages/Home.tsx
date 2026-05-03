import { Link } from 'react-router-dom'
import { FileText, Globe, Network, ClipboardList } from 'lucide-react'
import './Home.css'

const TOOLS = [
  { id: 'paper',     num: '01', name: '논문 분석기',   desc: 'PDF · arXiv 분석 및 저자 정보',   href: '/paper',        Icon: FileText      },
  { id: 'translate', num: '02', name: '번역기',         desc: '영어 논문 용어를 맥락으로 번역',   href: '/translate',    Icon: Globe         },
  { id: 'arch',      num: '03', name: '아키텍처 훈련',  desc: 'AI 설명 + 설명력 셀프 훈련',      href: '/arch-trainer', Icon: Network       },
  { id: 'todo',      num: '04', name: '투두',           desc: '연구실 할 일 · Supabase 동기화',  href: '/todo',         Icon: ClipboardList },
]

export default function Home() {
  return (
    <div className="home-root">
      <header className="home-header">
        <span className="home-brand">PRML Lab</span>
        <span className="home-brand">Lab Toolkit</span>
      </header>

      <main className="home-main">
        <div className="home-hero">
          <p className="home-eyebrow">Research Tools</p>
          <h1 className="home-title">Lab<br />Toolkit</h1>
        </div>

        <nav className="home-grid">
          {TOOLS.map(({ id, num, name, desc, href, Icon }) => (
            <Link key={id} to={href} className="home-card">
              <span className="card-num">{num}</span>
              <Icon size={18} strokeWidth={1.5} className="card-icon" />
              <div className="card-name">{name}</div>
              <p className="card-desc">{desc}</p>
            </Link>
          ))}
        </nav>
      </main>
    </div>
  )
}
