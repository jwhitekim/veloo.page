import { Link } from 'react-router-dom'
import './Home.css'

const today = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
}).format(new Date())

const TOOLS = [
  { name: 'Paper Analyzer',  desc: 'PDF 추출 및 논문 이름 검색',    href: '/paper',        activity: '마지막 분석: —'   },
  { name: 'Translator',      desc: '영어 논문 용어를 맥락으로 번역', href: '/translate',    activity: '마지막 번역: —'   },
  { name: 'Models Review',   desc: '모델 설명 + AI 피드백',          href: '/arch-trainer', activity: '마지막 피드백: —' },
  { name: 'Todo List',       desc: '연구실 할 일',                   href: '/todo',         activity: '오늘 할 일: —'   },
]

export default function Home() {
  return (
    <div className="home-root">
      <header className="home-header">
        <span className="home-wordmark">veloo</span>
        <span className="home-date">{today}</span>
      </header>
      <main className="home-main">
        <nav className="home-list">
          {TOOLS.map(({ name, desc, href, activity }, i) => (
            <Link
              key={href}
              to={href}
              className="home-card"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="card-left">
                <span className="card-name">{name}</span>
                <p className="card-desc">{desc}</p>
              </div>
              <div className="card-right">
                <span className="card-activity">{activity}</span>
                <span className="card-open">열기 →</span>
              </div>
            </Link>
          ))}
        </nav>
      </main>
    </div>
  )
}
