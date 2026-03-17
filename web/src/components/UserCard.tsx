import clsx from "clsx";
import type { CheckTeam, UserBrief } from "@/api/types";

export default function UserCard({
  info,
  team,
  maxScore,
  loading,
}: {
  info: UserBrief | null;
  team?: CheckTeam | null;
  maxScore?: number;
  loading?: boolean;
}) {
  const userCell = (
    <div className="flex items-center gap-3.5 min-w-0">
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
      <div className="flex flex-col gap-0.5 min-w-0">
        {loading || !info ? (
          <>
            <div className="w-30 h-3.75 rounded bg-bg-accent" />
            <div className="w-20 h-3 rounded bg-bg-accent mt-1" />
          </>
        ) : (
          <>
            <span className="text-[15px] font-semibold text-text-primary truncate">{info.nickname}</span>
            <span className="text-xs text-text-muted truncate">@{info.account}</span>
          </>
        )}
      </div>
    </div>
  );

  const showTeam = !loading && team;

  return (
    <div className="flex items-stretch gap-0 bg-card rounded-lg border border-border overflow-hidden">
      <div className="flex items-center gap-3.5 px-4 py-3.5 min-w-0 flex-1">{userCell}</div>
      {showTeam && (
        <>
          <div className="w-px bg-border shrink-0" />
          <div className="flex items-center gap-3 px-4 py-3.5 min-w-0 flex-1 max-w-[50%]">
            <div className="w-11 h-11 rounded-full bg-bg-accent flex items-center justify-center shrink-0">
              <span className="icon-[mdi--account-group] text-[22px] text-text-muted" />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[15px] font-semibold text-text-primary truncate">{team.name}</span>
              <span className="text-xs text-text-muted truncate">
                <span>Total </span>
                <span
                  className={clsx(
                    "font-bold",
                    maxScore !== undefined && team.total_bonus >= maxScore
                      ? "text-yellow"
                      : team.total_bonus > 0
                        ? "text-green"
                        : ""
                  )}
                >
                  + {team.total_bonus} pts
                </span>
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
