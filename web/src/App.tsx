import clsx from "clsx";
import { useEffect, useState } from "react";
import { fetchInfo, getStatus, postCheck, redeemCode } from "@/api/client";
import type { CheckResponse, InfoResponse, StatusResponse } from "@/api/types";
import BindInvite from "@/components/FromInfo";
import GameBanner from "@/components/GameBanner";
import InviteCode from "@/components/InviteCode";
import InvitedList from "@/components/InvitedList";
import Spinner from "@/components/Spinner";
import UserCard from "@/components/UserCard";
import Warning from "@/components/Warning";
import type { ThemePreference } from "@/theme";
import { getThemePreference, setThemePreference } from "@/theme";
import { getToken, redirectToLogin, renderUriTmpl } from "@/utils";

type Phase = "loading" | "no-team" | "game-ended" | "ready" | "error";

const THEME_CYCLE: ThemePreference[] = ["system", "light", "dark"];
const THEME_ICON: Record<ThemePreference, string> = {
  system: "icon-[mdi--theme-light-dark]",
  light: "icon-[mdi--weather-sunny]",
  dark: "icon-[mdi--weather-night]",
};
const THEME_TITLE: Record<ThemePreference, string> = {
  system: "跟随系统",
  light: "日间模式",
  dark: "夜间模式",
};

function ThemeToggle() {
  const [pref, setPref] = useState<ThemePreference>(getThemePreference);
  const toggle = () => {
    const next = THEME_CYCLE[(THEME_CYCLE.indexOf(pref) + 1) % THEME_CYCLE.length];
    setThemePreference(next);
    setPref(next);
  };
  return (
    <button
      type="button"
      onClick={toggle}
      title={THEME_TITLE[pref]}
      className="flex items-center p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-accent transition-colors duration-150 border-0 bg-transparent cursor-pointer"
    >
      <span className={clsx("text-[20px] shrink-0", THEME_ICON[pref])} />
    </button>
  );
}

export default function App() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [info, setInfo] = useState<InfoResponse | null>(null);
  const [check, setCheck] = useState<CheckResponse | null>(null);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [errMsg, setErrMsg] = useState("");

  const handleRedeem = async (inviteCode: string) => {
    const resp = await redeemCode(inviteCode);
    setStatus((prev) =>
      prev
        ? {
            ...prev,
            from: {
              invite_code: resp.invite_code,
              peer_user: resp.peer_user,
              peer_team: resp.peer_team,
              timestamp: resp.timestamp,
            },
          }
        : prev
    );
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      redirectToLogin();
      return;
    }
    async function init() {
      try {
        const infoData = await fetchInfo();
        setInfo(infoData);
        document.title = `邀请奖励 · ${infoData.game.name}`;

        if (infoData.bonus.game_ended) {
          try {
            const statusData = await getStatus();
            setStatus(statusData);
          } catch {
            // best-effort; show page anyway
          }
          setPhase("game-ended");
          return;
        }

        let checkData: CheckResponse | null = null;
        try {
          checkData = await postCheck();
          setCheck(checkData);
        } catch (e: unknown) {
          if (e && typeof e === "object" && "response" in e) {
            const resp = (e as { response: Response }).response;
            if (resp.status === 503) {
              try {
                const statusData = await getStatus();
                setStatus(statusData);
              } catch {
                // best-effort
              }
              setPhase("game-ended");
              return;
            }
            if (resp.status === 412) {
              setPhase("no-team");
              return;
            }
          }
          throw e;
        }

        const statusData = await getStatus();
        setStatus(statusData);
        setPhase("ready");
      } catch (e: unknown) {
        if (e && typeof e === "object" && "response" in e) {
          const resp = (e as { response: Response }).response;
          if (resp.status === 401) return;
        }
        setErrMsg("加载失败，请刷新重试");
        setPhase("error");
      }
    }
    init();
  }, []);

  const gameUrlTemplate = import.meta.env.VITE_GAME_URL_TMPL || "/games/{game_id}";

  const header = (
    <div className="flex items-center justify-between">
      <h1 className="text-xl font-bold text-text-primary tracking-wider">邀请奖励</h1>
      <ThemeToggle />
    </div>
  );

  const wrap = (children: React.ReactNode) => (
    <div className="max-w-180 mx-auto px-3 sm:px-4 py-5 sm:py-7 flex flex-col gap-3">{children}</div>
  );

  if (phase === "error") {
    return wrap(
      <>
        {header}
        <Warning>{errMsg}</Warning>
      </>
    );
  }

  if (phase === "game-ended" && info) {
    return wrap(
      <>
        {header}
        <GameBanner game={info.game} gameUrl={renderUriTmpl(gameUrlTemplate, { game_id: info.bonus.game_id })} />
        <UserCard info={info.user} />
        <Warning>比赛已结束，邀请奖励功能已停止使用。</Warning>
        {status && (
          <>
            <BindInvite from={status.from} gameId={info.bonus.game_id} gameEnded />
            <InviteCode
              code={status.invite_code}
              bonusScore={info.bonus.bonus_score}
              maxScore={info.bonus.max_score}
              gameEnded
            />
            <InvitedList invited={status.invited} gameId={info.bonus.game_id} />
          </>
        )}
      </>
    );
  }

  if (phase === "no-team" && info) {
    const gameUrl = renderUriTmpl(gameUrlTemplate, { game_id: info.bonus.game_id });
    return wrap(
      <>
        {header}
        <GameBanner game={info.game} gameUrl={renderUriTmpl(gameUrlTemplate, { game_id: info.bonus.game_id })} />
        <UserCard info={info.user} />
        <Warning>
          你还没有创建队伍，请先前往
          <a href={gameUrl} target="_blank" rel="noopener noreferrer" className="mx-1 hover:underline">
            比赛页面
          </a>
          创建或加入一支队伍。
        </Warning>
      </>
    );
  }

  const isLoading = phase === "loading";

  return wrap(
    <>
      {header}

      {/* Game banner skeleton or real */}
      {isLoading || !info ? (
        <GameBanner game={null} loading />
      ) : (
        <GameBanner game={info.game} gameUrl={renderUriTmpl(gameUrlTemplate, { game_id: info.bonus.game_id })} />
      )}

      {/* User card skeleton or real */}
      {isLoading || !info ? (
        <UserCard info={null} loading />
      ) : (
        <UserCard info={info.user} team={check?.team} maxScore={info.bonus.max_score} />
      )}

      {/* Bind invite card */}
      {isLoading || !info || !status ? (
        <BindInvite from={null} loading />
      ) : (
        <BindInvite from={status.from} gameId={info.bonus.game_id} onRedeem={handleRedeem} />
      )}

      {/* Invite code */}
      {isLoading || !status || !info ? (
        <InviteCode code="" loading />
      ) : (
        <InviteCode
          code={status.invite_code}
          bonusScore={info.bonus.bonus_score}
          maxScore={info.bonus.max_score}
          onRefresh={(newCode) => setStatus((s) => (s ? { ...s, invite_code: newCode } : s))}
        />
      )}

      {/* Invited list */}
      {isLoading || !status ? (
        <InvitedList invited={[]} gameId={0} loading />
      ) : (
        <InvitedList invited={status.invited} gameId={info!.bonus.game_id} />
      )}
    </>
  );
}

export { Spinner };
