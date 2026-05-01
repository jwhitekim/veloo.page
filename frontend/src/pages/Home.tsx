import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Globe, Network, ClipboardList } from 'lucide-react'
import './Home.css'

const NODES = [
  { id: 'paper',     num: '01', name: '논문 분석기',  desc: 'PDF · arXiv 분석 및 저자 정보', href: '/paper',        Icon: FileText,      cx: 23, cy: 38 },
  { id: 'translate', num: '02', name: '번역기',        desc: '영어 논문 용어를 맥락으로 번역', href: '/translate',    Icon: Globe,         cx: 68, cy: 30 },
  { id: 'arch',      num: '03', name: '아키텍처 훈련', desc: 'AI 설명 + 설명력 셀프 훈련',    href: '/arch-trainer', Icon: Network,       cx: 27, cy: 66 },
  { id: 'todo',      num: '04', name: '투두',          desc: '연구실 할 일 · Supabase 동기화', href: '/todo',         Icon: ClipboardList, cx: 70, cy: 63 },
]

const EDGES: [string, string][] = [
  ['paper', 'translate'],
  ['paper', 'arch'],
  ['translate', 'todo'],
  ['arch', 'todo'],
  ['paper', 'todo'],
]

const nodeMap = Object.fromEntries(NODES.map(n => [n.id, n]))

export default function Home() {
  const [hovered, setHovered] = useState<string | null>(null)
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 })
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const onMove = (e: MouseEvent) =>
      setMouse({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight })
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      r: Math.random() * 1.1 + 0.4,
      o: Math.random() * 0.18 + 0.06,
    }))

    let raf: number
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(177,156,217,${p.o})`
        ctx.fill()
      }
      raf = requestAnimationFrame(draw)
    }
    draw()

    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <div className="home-root">
      <canvas ref={canvasRef} className="home-canvas" />

      <header className="home-header">
        <span className="home-brand">Lab Toolkit</span>
        <span className="home-brand">PRML Lab</span>
      </header>

      {/* 패럴랙스 워터마크 */}
      {NODES.map(n => (
        <div key={n.id} className="home-watermark" style={{
          left: `${n.cx}%`, top: `${n.cy}%`,
          transform: `translate(calc(-50% + ${(mouse.x - 0.5) * 32}px), calc(-50% + ${(mouse.y - 0.5) * 20}px))`,
        }}>
          {n.num}
        </div>
      ))}

      {/* SVG 연결선 */}
      <svg className="home-svg">
        {EDGES.map(([a, b]) => {
          const na = nodeMap[a], nb = nodeMap[b]
          const active = hovered === a || hovered === b
          return (
            <line key={`${a}-${b}`}
              x1={`${na.cx}%`} y1={`${na.cy}%`}
              x2={`${nb.cx}%`} y2={`${nb.cy}%`}
              stroke={active ? 'rgba(177,156,217,0.55)' : 'rgba(255,255,255,0.05)'}
              strokeWidth={active ? 1.5 : 0.8}
              style={{ transition: 'stroke 0.35s ease, stroke-width 0.35s ease' }}
            />
          )
        })}
      </svg>

      {/* 노드 */}
      {NODES.map(({ id, name, desc, href, Icon }) => (
        <Link key={id} to={href}
          className={`home-node${hovered === id ? ' home-node--active' : ''}`}
          style={{ left: `${nodeMap[id].cx}%`, top: `${nodeMap[id].cy}%` }}
          onMouseEnter={() => setHovered(id)}
          onMouseLeave={() => setHovered(null)}
        >
          <div className="node-icon-row">
            <Icon size={14} strokeWidth={1.5} className="node-icon" />
            <span className="node-name">{name}</span>
          </div>
          <p className="node-desc">{desc}</p>
        </Link>
      ))}
    </div>
  )
}
