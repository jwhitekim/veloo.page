import { Link } from 'react-router-dom'
import { FileText, Globe, Network, ClipboardList } from 'lucide-react'
import './Home.css'

const TOOLS = [
  { name: 'Paper Analyzer',  desc: 'PDF 추출 및 논문 이름 검색',  href: '/paper',        Icon: FileText      },
  { name: 'Translator',        desc: '영어 논문 용어를 맥락으로 번역',  href: '/translate',    Icon: Globe         },
  { name: 'Models Review', desc: '모델 설명 + AI 피드백',     href: '/arch-trainer', Icon: Network       },
  { name: 'Todo List',          desc: '연구실 할 일', href: '/todo',         Icon: ClipboardList },
]

export default function Home() {
  return (
    <div className="home-root">
      <header className="home-header">
        <span className="home-wordmark">veloo</span>
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
