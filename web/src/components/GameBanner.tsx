import type { GameResponse } from "@/api/types";

export default function GameBanner({ game, loading }: { game: GameResponse | null; loading?: boolean }) {
  return (
    <div className="flex items-center gap-3.5 px-4 py-3.5 bg-card rounded-lg border border-border">
      {loading || !game ? (
        <div className="w-11 h-11 rounded-lg bg-bg-accent shrink-0" />
      ) : (
        <img
          src={game.logo_uri}
          alt=""
          crossOrigin="anonymous"
          className="w-11 h-11 rounded-lg object-cover shrink-0"
        />
      )}
      <div className="flex flex-col gap-0.5 min-w-0">
        {loading || !game ? (
          <>
            <div className="w-36 h-3.75 rounded bg-bg-accent" />
            <div className="w-52 h-3 rounded bg-bg-accent mt-1" />
          </>
        ) : (
          <>
            <span className="text-[15px] font-semibold text-text-primary truncate">{game.name}</span>
            {game.brief && <span className="text-xs text-text-muted truncate">{game.brief}</span>}
          </>
        )}
      </div>
    </div>
  );
}
