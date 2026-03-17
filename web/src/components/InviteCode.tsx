import { useState } from 'react'
import { patchInviteCode } from '@/api/client'

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
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  code: {
    fontFamily: "'Menlo', 'Consolas', monospace",
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--text-primary)',
    letterSpacing: 2,
    padding: '6px 14px',
    background: 'var(--input-bg)',
    borderRadius: 6,
    userSelect: 'all',
  },
  btn: {
    padding: '6px 14px',
    borderRadius: 6,
    border: 'none',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
}

export default function InviteCode({
  code,
  onRefresh,
}: {
  code: string
  onRefresh: (newCode: string) => void
}) {
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleRefresh = async () => {
    setLoading(true)
    try {
      const res = await patchInviteCode()
      onRefresh(res.invite_code)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.card}>
      <div style={styles.title}>我的邀请码</div>
      <div style={styles.row}>
        <span style={styles.code}>{code}</span>
        <button
          style={{ ...styles.btn, background: 'var(--brand)', color: '#fff' }}
          onClick={handleCopy}
        >
          {copied ? '已复制' : '复制'}
        </button>
        <button
          style={{ ...styles.btn, background: 'var(--bg-accent)', color: 'var(--text-primary)' }}
          onClick={handleRefresh}
          disabled={loading}
        >
          {loading ? '刷新中...' : '刷新'}
        </button>
      </div>
    </div>
  )
}
