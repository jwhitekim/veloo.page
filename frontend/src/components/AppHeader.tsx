import { useNavigate } from 'react-router-dom'

interface Props {
  title?: string
  right?: React.ReactNode
}

export default function AppHeader({ title, right }: Props) {
  const navigate = useNavigate()
  return (
    <header style={{
      height: 'var(--header-h)',
      position: 'sticky',
      top: 0,
      background: 'var(--bg-base)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: 12,
      zIndex: 100,
      flexShrink: 0,
    }}>
      <button
        onClick={() => navigate('/')}
        style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          fontSize: 18, fontWeight: 700, color: 'var(--text-primary)',
          letterSpacing: '-0.01em', padding: '6px 10px',
          borderRadius: 'var(--radius-sm)', fontFamily: 'inherit',
          transition: 'background 0.15s', flexShrink: 0,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-additive)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
      >
        Lab Toolkit
      </button>
      {title && (
        <>
          <span style={{ color: 'var(--text-disabled)', fontSize: 16, userSelect: 'none', margin: '0 -4px' }}>›</span>
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</span>
        </>
      )}
      <div style={{ flex: 1 }} />
      {right}
    </header>
  )
}
