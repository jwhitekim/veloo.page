import { useTheme } from '../context/ThemeContext'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggle}
      title={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
      style={{
        position: 'fixed',
        bottom: 22,
        right: 22,
        zIndex: 9990,
        width: 40,
        height: 40,
        borderRadius: '50%',
        border: `1px solid var(--c-border-mid)`,
        background: 'var(--c-surface)',
        color: 'var(--c-text-sub)',
        fontSize: '1rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
        transition: 'background 0.2s, color 0.2s, border-color 0.2s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.background = 'var(--c-accent-dim)'
        ;(e.currentTarget as HTMLElement).style.color = 'var(--c-accent-txt)'
        ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--c-accent)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = 'var(--c-surface)'
        ;(e.currentTarget as HTMLElement).style.color = 'var(--c-text-sub)'
        ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--c-border-mid)'
      }}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}
