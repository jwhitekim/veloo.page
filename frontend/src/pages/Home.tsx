import { Link } from 'react-router-dom'
import { FileText, Globe, Network, ClipboardList } from 'lucide-react'
import './Home.css'

const TOOLS = [
  { name: '논문 분석기',  desc: 'PDF · arXiv 분석 및 저자 정보',  href: '/paper',        Icon: FileText      },
  { name: '번역기',        desc: '영어 논문 용어를 맥락으로 번역',  href: '/translate',    Icon: Globe         },
  { name: '아키텍처 훈련', desc: 'AI 설명 + 설명력 셀프 훈련',     href: '/arch-trainer', Icon: Network       },
  { name: '투두',          desc: '연구실 할 일 · Supabase 동기화', href: '/todo',         Icon: ClipboardList },
]

export default function Home() {
  return (
    <div className="home-root">
      <header className="home-header">
        <span className="home-wordmark">Lab Toolkit</span>
      </header>
      <main className="home-main">
        <nav className="home-grid">
          {TOOLS.map(({ name, desc, href, Icon }, i) => (
            <Link
              key={href}
              to={href}
              className="home-card"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <Icon size={64} strokeWidth={1.25} className="card-icon" />
              <span className="card-name">{name}</span>
              <p className="card-desc">{desc}</p>
            </Link>
          ))}
        </nav>
      </main>
    </div>
  )
}
