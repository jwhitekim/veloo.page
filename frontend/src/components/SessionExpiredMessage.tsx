interface Props {
  redirectTo?: string
}

export function SessionExpiredMessage({ redirectTo = '/translate' }: Props) {
  const loginUrl = `/login?redirect=${encodeURIComponent(redirectTo)}`
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px', background: '#fef7e0',
      borderRadius: 8, fontSize: 14, color: '#7c4c00',
    }}>
      <span>⚠ 세션이 만료되었습니다.</span>
      <a href={loginUrl} style={{ color: '#1a73e8', fontWeight: 500 }}>다시 로그인</a>
    </div>
  )
}
