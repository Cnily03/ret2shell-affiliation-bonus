import { useEffect, useState } from 'react'
import { fetchInfo, postCheck, getStatus } from '@/api/client'
import type { InfoResponse, CheckResponse, StatusResponse } from '@/api/types'
import { getToken, redirectToLogin, renderUriTmpl } from '@/utils'
import UserCard from '@/components/UserCard'
import Warning from '@/components/Warning'
import InviteCode from '@/components/InviteCode'
import FromInfo from '@/components/FromInfo'
import InvitedList from '@/components/InvitedList'

type Phase = 'loading' | 'no-team' | 'ready' | 'error'

const containerStyle: React.CSSProperties = {
  maxWidth: 640,
  margin: '0 auto',
  padding: '32px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
}

const headingStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  color: 'var(--text-primary)',
}

export default function App() {
  const [phase, setPhase] = useState<Phase>('loading')
  const [info, setInfo] = useState<InfoResponse | null>(null)
  const [check, setCheck] = useState<CheckResponse | null>(null)
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [errMsg, setErrMsg] = useState('')

  useEffect(() => {
    const token = getToken()
    if (!token) {
      redirectToLogin()
      return
    }
    init()
  }, [])

  async function init() {
    try {
      const infoData = await fetchInfo()
      setInfo(infoData)

      let checkData: CheckResponse | null = null
      try {
        checkData = await postCheck()
        setCheck(checkData)
      } catch (e: unknown) {
        if (e && typeof e === 'object' && 'response' in e) {
          const resp = (e as { response: Response }).response
          if (resp.status === 412) {
            setPhase('no-team')
            return
          }
        }
        throw e
      }

      const statusData = await getStatus()
      setStatus(statusData)
      setPhase('ready')
    } catch (e: unknown) {
      // 401 is handled by the API client hook (redirect)
      if (e && typeof e === 'object' && 'response' in e) {
        const resp = (e as { response: Response }).response
        if (resp.status === 401) return
      }
      setErrMsg('加载失败，请刷新重试')
      setPhase('error')
    }
  }

  if (phase === 'loading') {
    return (
      <div style={{ ...containerStyle, alignItems: 'center', paddingTop: 80 }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 15 }}>加载中…</span>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div style={containerStyle}>
        <Warning>{errMsg}</Warning>
      </div>
    )
  }

  const gameUrlTemplate =
    import.meta.env.VITE_GAME_URL_TMPL || '/games/{game_id}'

  if (phase === 'no-team' && info) {
    const gameUrl = renderUriTmpl(gameUrlTemplate, { game_id: info.game_id })
    return (
      <div style={containerStyle}>
        <h1 style={headingStyle}>邀请奖励</h1>
        <UserCard info={info} />
        <Warning>
          你还没有创建队伍，请先前往
          <a href={gameUrl} target="_blank" rel="noopener noreferrer" style={{ margin: '0 4px' }}>
            比赛页面
          </a>
          创建或加入一支队伍。
        </Warning>
      </div>
    )
  }

  // phase === 'ready'
  if (!info || !check || !status) return null

  return (
    <div style={containerStyle}>
      <h1 style={headingStyle}>邀请奖励</h1>
      <UserCard info={info} />

      {status.from && <FromInfo from={status.from} gameId={info.game_id} />}

      <InviteCode
        code={status.invite_code}
        onRefresh={(newCode) => setStatus((s) => (s ? { ...s, invite_code: newCode } : s))}
      />

      <InvitedList invited={status.invited} gameId={info.game_id} />
    </div>
  )
}
