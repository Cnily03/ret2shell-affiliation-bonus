import clsx from "clsx";
import { useEffect, useState } from "react";
import { fetchInfo, getStatus, postCheck, redeemCode } from "@/api/client";
import type { CheckResponse, InfoResponse, StatusResponse } from "@/api/types";
import BindInvite from "@/components/FromInfo";
import InviteCode from "@/components/InviteCode";
import InvitedList from "@/components/InvitedList";
import Spinner from "@/components/Spinner";
import UserCard from "@/components/UserCard";
import Warning from "@/components/Warning";
import { getColorScheme, setColorScheme } from "@/theme";
import { getToken, redirectToLogin, renderUriTmpl } from "@/utils";

type Phase = "loading" | "no-team" | "ready" | "error";

function ThemeToggle() {
  const [scheme, setScheme] = useState(getColorScheme);
  const toggle = () => {
    const next = scheme === "dark" ? "light" : "dark";
    setColorScheme(next);
    setScheme(next);
  };
  return (
    <button
      type="button"
      onClick={toggle}
      title={scheme === "dark" ? "切换亮色模式" : "切换暗色模式"}
      className="flex items-center p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-accent transition-colors duration-150 border-0 bg-transparent cursor-pointer"
    >
      <span
        className={clsx(
          "text-[20px] shrink-0",
          scheme === "dark" ? "icon-[mdi--weather-sunny]" : "icon-[mdi--weather-night]"
        )}
      />
    </button>
  );
}

export default function App() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [info, setInfo] = useState<InfoResponse | null>(null);
  const [, setCheck] = useState<CheckResponse | null>(null);
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

        let checkData: CheckResponse | null = null;
        try {
          checkData = await postCheck();
          setCheck(checkData);
        } catch (e: unknown) {
          if (e && typeof e === "object" && "response" in e) {
            const resp = (e as { response: Response }).response;
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
      <h1 className="text-xl font-bold text-text-primary tracking-tight">邀请奖励</h1>
      <ThemeToggle />
    </div>
  );

  const wrap = (children: React.ReactNode) => (
    <div className="max-w-180 mx-auto px-4 py-7 flex flex-col gap-3">{children}</div>
  );

  if (phase === "error") {
    return wrap(
      <>
        {header}
        <Warning>{errMsg}</Warning>
      </>
    );
  }

  if (phase === "no-team" && info) {
    const gameUrl = renderUriTmpl(gameUrlTemplate, { game_id: info.game_id });
    return wrap(
      <>
        {header}
        <UserCard info={info} />
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

      {/* User card skeleton or real */}
      {isLoading || !info ? <UserCard info={null} loading /> : <UserCard info={info} />}

      {/* Bind invite card */}
      {isLoading || !info || !status ? (
        <BindInvite from={null} loading />
      ) : (
        <BindInvite from={status.from} onRedeem={handleRedeem} />
      )}

      {/* Invite code */}
      {isLoading || !status ? (
        <InviteCode code="" loading />
      ) : (
        <InviteCode
          code={status.invite_code}
          onRefresh={(newCode) => setStatus((s) => (s ? { ...s, invite_code: newCode } : s))}
        />
      )}

      {/* Invited list */}
      {isLoading || !status ? (
        <InvitedList invited={[]} gameId={0} loading />
      ) : (
        <InvitedList invited={status.invited} gameId={info!.game_id} />
      )}
    </>
  );
}

export { Spinner };
