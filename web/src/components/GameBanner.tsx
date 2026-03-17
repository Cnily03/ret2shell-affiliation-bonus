import type { GameBrief } from "@/api/types";

export default function GameBanner({
  game,
  gameUrl,
  loading,
}: {
  game: GameBrief | null;
  gameUrl?: string;
  loading?: boolean;
}) {
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
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
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
      {!loading && gameUrl && (
        <a
          href={gameUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="前往比赛页面"
          className="shrink-0 flex items-center justify-center size-8 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-accent transition-colors duration-150"
        >
          <span className="text-[18px] icon-[mdi--open-in-new]" />
        </a>
      )}
    </div>
  );
}
