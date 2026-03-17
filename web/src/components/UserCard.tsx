import type { InfoResponse } from '@/api/types'

export default function UserCard({ info, loading }: { info: InfoResponse | null; loading?: boolean }) {
  return (
    <div className="flex items-center gap-3.5 px-4 py-3.5 bg-card rounded-lg border border-border">
      {loading || !info ? (
        <div className="w-11 h-11 rounded-full bg-bg-accent shrink-0" />
      ) : (
        <img
          src={info.avatar_uri}
          alt=""
          crossOrigin="anonymous"
          className="w-11 h-11 rounded-full object-cover shrink-0"
        />
      )}
      <div className="flex flex-col gap-0.5">
        {loading || !info ? (
          <>
            <div className="w-30 h-3.75 rounded bg-bg-accent" />
            <div className="w-20 h-3 rounded bg-bg-accent mt-1" />
          </>
        ) : (
          <>
            <span className="text-[15px] font-semibold text-text-primary">{info.nickname}</span>
            <span className="text-xs text-text-muted">@{info.account}</span>
          </>
        )}
      </div>
    </div>
  )
}
