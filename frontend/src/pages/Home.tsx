import { Link } from 'react-router-dom'
import { FileText, Globe, Network, ClipboardList } from 'lucide-react'
import './Home.css'

const TOOLS = [
  { num: '01', label: 'paper', href: '/paper',        Icon: FileText      },
  { num: '02', label: 'lang',  href: '/translate',    Icon: Globe         },
  { num: '03', label: 'arch',  href: '/arch-trainer', Icon: Network       },
  { num: '04', label: 'list',  href: '/todo',         Icon: ClipboardList },
]

export default function Home() {
  return (
    <div className="home-root">
      <nav className="home-grid">
        {TOOLS.map(({ num, label, href, Icon }, i) => (
          <Link
            key={num}
            to={href}
            className="home-card"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <span className="card-num">{num}</span>
            <Icon size={22} strokeWidth={1.25} className="card-icon" />
            <span className="card-label">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
