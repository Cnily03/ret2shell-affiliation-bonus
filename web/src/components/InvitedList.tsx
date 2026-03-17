import { useState } from 'react'
import clsx from 'clsx'
import type { InvitedEntry } from '@/api/types'
import { formatTime, renderUriTmpl } from '@/utils'
import Toggle from '@/components/Toggle'

const teamUrlTmpl = import.meta.env.VITE_TEAM_URL_TMPL || '/games/{game_id}/teams/{team_id}'

function aggregateByTeam(invited: InvitedEntry[]) {
  const map = new Map<number, { name: string; total: number; count: number }>()
  for (const entry of invited) {
    const tid = entry.bonus_team.id
    const ex = map.get(tid)
    if (ex) { ex.total += entry.bonus_score; ex.count++ }
    else map.set(tid, { name: entry.bonus_team.name, total: entry.bonus_score, count: 1 })
  }
  return Array.from(map.entries()).map(([id, v]) => ({ id, ...v }))
}

function TeamLink({ name, teamId, gameId }: { name: string; teamId: number; gameId: number }) {
  return (
    <a
      href={renderUriTmpl(teamUrlTmpl, { game_id: gameId, team_id: teamId })}
      target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-text-link no-underline border-b border-transparent hover:border-current pb-px"
    >
      <span className="icon-[mdi--account-multiple] text-[13px] shrink-0" />
      {name}
    </a>
  )
}

function InviteToken({ code }: { code: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'error'>('idle')

  const handleCopy = async () => {
    const reset = () => window.setTimeout(() => setState('idle'), 1600)
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(code)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = code
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setState('copied')
      reset()
    } catch {
      setState('error')
      reset()
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={state === 'copied' ? '已复制' : state === 'error' ? '复制失败' : '复制'}
      className="group inline-flex items-center gap-1.5 px-1.5 py-1 rounded bg-input text-text-primary font-mono text-xs tracking-[0.08em] cursor-pointer select-all transition-colors duration-150 hover:bg-bg-accent focus:outline-none"
    >
      <span className={clsx(
        'text-[12px] shrink-0 transition-colors duration-150',
        state === 'copied' && 'icon-[mdi--check] text-green',
        state === 'error' && 'icon-[mdi--close] text-red',
        state === 'idle' && 'icon-[mdi--content-copy] text-text-muted group-hover:text-brand',
      )} />
      <span>{code}</span>
    </button>
  )
}

function SkeletonRow() {
  return (
    <tr>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-bg-accent shrink-0" />
          <div>
            <div className="w-22.5 h-3 rounded-sm bg-bg-accent" />
            <div className="w-15 h-2.5 rounded-sm bg-bg-accent mt-1" />
          </div>
        </div>
      </td>
      <td className="px-3 py-2.5"><div className="w-24 h-3 rounded-sm bg-bg-accent" /></td>
      <td className="px-3 py-2.5">
        <div className="h-7 rounded-md bg-bg-accent" />
      </td>
      <td className="px-3 py-2.5"><div className="w-20 h-3 rounded-sm bg-bg-accent" /></td>
      <td className="px-3 py-2.5"><div className="w-10 h-3 rounded-sm bg-bg-accent ml-auto" /></td>
    </tr>
  )
}

export default function InvitedList({
  invited,
  gameId,
  loading,
}: {
  invited: InvitedEntry[]
  gameId: number
  loading?: boolean
}) {
  const [detailed, setDetailed] = useState(true)
  const teamStats = aggregateByTeam(invited)

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">
          已邀请用户
          {!loading && invited.length > 0 && (
            <span className="ml-2 px-1.75 py-px rounded-[10px] bg-bg-accent text-text-secondary text-[11px] font-semibold">{invited.length}</span>
          )}
        </span>
        <Toggle
          checked={!detailed}
          onChange={(v) => setDetailed(!v)}
          label={detailed ? '详细信息' : '统计信息'}
        />
      </div>

      {/* Detail table */}
      {detailed ? (
        <div className="overflow-x-auto">
          <table className="dc-table">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-[0.05em] text-text-muted whitespace-nowrap">受邀用户</th>
                <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-[0.05em] text-text-muted whitespace-nowrap">绑定时间</th>
                <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-[0.05em] text-text-muted whitespace-nowrap">邀请码</th>
                <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-[0.05em] text-text-muted whitespace-nowrap">奖励队伍</th>
                <th className="px-3 py-2 text-right text-[11px] font-bold uppercase tracking-[0.05em] text-text-muted whitespace-nowrap">奖励分</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <><SkeletonRow /><SkeletonRow /><SkeletonRow /></>
              ) : invited.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-7 text-center text-text-muted text-[13px]">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-[28px] icon-[mdi--account-multiple-outline] opacity-40" />
                      暂无邀请记录
                    </div>
                  </td>
                </tr>
              ) : (
                invited.map((entry) => (
                  <tr key={entry.user.id}>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={entry.user.avatar_uri}
                          alt=""
                          crossOrigin="anonymous"
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                        <div>
                          <div className="text-sm font-semibold text-text-primary">{entry.user.nickname}</div>
                          <div className="text-[11px] text-text-muted">@{entry.user.account}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-[12px] text-text-muted whitespace-nowrap">
                      {formatTime(entry.timestamp)}
                    </td>
                    <td className="px-3 py-2.5">
                      <InviteToken code={entry.invite_code} />
                    </td>
                    <td className="px-3 py-2.5 text-[13px] text-text-secondary">
                      <TeamLink name={entry.bonus_team.name} teamId={entry.bonus_team.id} gameId={gameId} />
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-green text-sm">
                      +{entry.bonus_score}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Stats table */
        <div className="overflow-x-auto">
          <table className="dc-table">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-[0.05em] text-text-muted whitespace-nowrap">队伍</th>
                <th className="px-3 py-2 text-center text-[11px] font-bold uppercase tracking-[0.05em] text-text-muted whitespace-nowrap">邀请人数</th>
                <th className="px-3 py-2 text-right text-[11px] font-bold uppercase tracking-[0.05em] text-text-muted whitespace-nowrap">累计奖励</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-3 py-2.5">
                    <div className="w-full h-3 rounded-sm bg-bg-accent" />
                  </td>
                </tr>
              ) : teamStats.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3 py-7 text-center text-text-muted text-[13px]">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-[28px] icon-[mdi--account-multiple-outline] opacity-40" />
                      暂无邀请记录
                    </div>
                  </td>
                </tr>
              ) : (
                teamStats.map((t) => (
                  <tr key={t.id}>
                    <td className="px-3 py-2.5 text-[13px] text-text-secondary">
                      <TeamLink name={t.name} teamId={t.id} gameId={gameId} />
                    </td>
                    <td className="px-3 py-2.5 text-center text-[13px] text-text-muted">{t.count}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-green text-sm">+{t.total}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
