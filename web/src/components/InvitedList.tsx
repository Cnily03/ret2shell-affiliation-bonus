import { useState } from 'react'
import type { InvitedEntry } from '@/api/types'
import { formatTime, renderUriTmpl } from '@/utils'
import Toggle from '@/components/Toggle'

const teamUrlTmpl = import.meta.env.VITE_TEAM_URL_TMPL || '/games/{game_id}/teams/{team_id}'

const styles: Record<string, React.CSSProperties> = {
  card: {
    padding: '14px 18px',
    background: 'var(--card-bg)',
    borderRadius: 8,
    border: '1px solid var(--border)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  empty: {
    fontSize: 14,
    color: 'var(--text-muted)',
    textAlign: 'center',
    padding: '20px 0',
  },
  // detail view
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 0',
    borderBottom: '1px solid var(--border)',
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
    flex: 1,
    minWidth: 0,
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
  score: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--green)',
    flexShrink: 0,
  },
  // stats view
  statRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid var(--border)',
  },
  teamName: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  teamScore: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--green)',
  },
}

// Aggregate scores by team
function aggregateByTeam(invited: InvitedEntry[]) {
  const map = new Map<number, { name: string; total: number }>()
  for (const entry of invited) {
    const tid = entry.bonus_team.id
    const existing = map.get(tid)
    if (existing) {
      existing.total += entry.bonus_score
    } else {
      map.set(tid, { name: entry.bonus_team.name, total: entry.bonus_score })
    }
  }
  return Array.from(map.entries()).map(([id, v]) => ({ id, ...v }))
}

function TeamLink({ name, teamId, gameId }: { name: string; teamId: number; gameId: number }) {
  const url = renderUriTmpl(teamUrlTmpl, { game_id: gameId, team_id: teamId })
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2 }}>
      {name}
    </a>
  )
}

export default function InvitedList({ invited, gameId }: { invited: InvitedEntry[]; gameId: number }) {
  const [detailed, setDetailed] = useState(true)

  const teamStats = aggregateByTeam(invited)

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span style={styles.title}>已邀请用户</span>
        <Toggle
          checked={!detailed}
          onChange={(v) => setDetailed(!v)}
          label={detailed ? '详细信息' : '统计信息'}
        />
      </div>

      {invited.length === 0 ? (
        <div style={styles.empty as React.CSSProperties}>暂无邀请记录</div>
      ) : detailed ? (
        // Detail view
        invited.map((entry, i) => (
          <div
            key={i}
            style={{
              ...styles.item,
              borderBottom: i === invited.length - 1 ? 'none' : styles.item.borderBottom,
            }}
          >
            <img src={entry.user.avatar_uri} alt="" style={styles.avatar} />
            <div style={styles.info}>
              <span style={styles.name}>
                {entry.user.nickname}
                <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6, fontSize: 12 }}>
                  @{entry.user.account}
                </span>
              </span>
              <span style={styles.detail}>
                队伍「<TeamLink name={entry.bonus_team.name} teamId={entry.bonus_team.id} gameId={gameId} />」· 邀请码 {entry.invite_code} · {formatTime(entry.timestamp)}
              </span>
            </div>
            <span style={styles.score}>+{entry.bonus_score}</span>
          </div>
        ))
      ) : (
        // Stats view
        teamStats.map((t, i) => (
          <div
            key={t.id}
            style={{
              ...styles.statRow,
              borderBottom: i === teamStats.length - 1 ? 'none' : styles.statRow.borderBottom,
            }}
          >
            <span style={styles.teamName}>队伍「<TeamLink name={t.name} teamId={t.id} gameId={gameId} />」</span>
            <span style={styles.teamScore}>+{t.total}</span>
          </div>
        ))
      )}
    </div>
  )
}
