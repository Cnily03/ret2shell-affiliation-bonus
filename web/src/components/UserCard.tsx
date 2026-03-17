import type { InfoResponse } from '@/api/types'

const styles: Record<string, React.CSSProperties> = {
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '16px 20px',
    background: 'var(--card-bg)',
    borderRadius: 8,
    border: '1px solid var(--border)',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    objectFit: 'cover',
    flexShrink: 0,
  },
  info: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  nickname: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  account: {
    fontSize: 13,
    color: 'var(--text-muted)',
  },
}

export default function UserCard({ info }: { info: InfoResponse }) {
  return (
    <div style={styles.card}>
      <img src={info.avatar_uri} alt="" style={styles.avatar} />
      <div style={styles.info}>
        <span style={styles.nickname}>{info.nickname}</span>
        <span style={styles.account}>@{info.account}</span>
      </div>
    </div>
  )
}
