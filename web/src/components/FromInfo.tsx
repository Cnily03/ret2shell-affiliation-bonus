import type { FromEntry } from '@/api/types'
import { formatTime, renderUriTmpl } from '@/utils'

const teamUrlTmpl = import.meta.env.VITE_TEAM_URL_TMPL || '/games/{game_id}/teams/{team_id}'

const styles: Record<string, React.CSSProperties> = {
  card: {
    padding: '14px 18px',
    background: 'var(--card-bg)',
    borderRadius: 8,
    border: '1px solid var(--border)',
  },
  title: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    objectFit: 'cover',
    flexShrink: 0,
  },
  info: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  detail: {
    fontSize: 12,
    color: 'var(--text-muted)',
  },
}

export default function FromInfo({ from, gameId }: { from: FromEntry; gameId: number }) {
  return (
    <div style={styles.card}>
      <div style={styles.title}>受邀信息</div>
      <div style={styles.row}>
        <img src={from.peer_user.avatar_uri} alt="" style={styles.avatar} />
        <div style={styles.info}>
          <span style={styles.name}>
            {from.peer_user.nickname}
            <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6, fontSize: 12 }}>
              @{from.peer_user.account}
            </span>
          </span>
          <span style={styles.detail}>
            为队伍「<a href={renderUriTmpl(teamUrlTmpl, { game_id: gameId, team_id: from.peer_team.id })} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2 }}>{from.peer_team.name}</a>」加分 · 邀请码 {from.invite_code} · {formatTime(from.timestamp)}
          </span>
        </div>
      </div>
    </div>
  )
}
