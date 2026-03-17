import { type FormEvent, useRef, useState } from "react";
import type { FromEntry } from "@/api/types";
import { formatTime, renderUriTmpl } from "@/utils";

const teamUrlTmpl = import.meta.env.VITE_TEAM_URL_TMPL || "/games/{game_id}/teams/{team_id}";

interface Props {
  from: FromEntry | null;
  gameId: number;
  loading?: boolean;
  onRedeem?: (inviteCode: string) => Promise<void>;
}

export default function BindInviteCard({ from, loading, onRedeem }: Props) {
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hint, setHint] = useState<{ text: string; type: "error" | "info" } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePaste = async () => {
    try {
      let text = "";
      if (navigator.clipboard && window.isSecureContext) {
        text = await navigator.clipboard.readText();
      }
      const cleaned = text
        .replace(/[^A-Za-z0-9]/g, "")
        .toUpperCase()
        .slice(0, 12);
      setCode(cleaned);
      setHint(null);
      inputRef.current?.focus();
    } catch {
      // clipboard read not permitted — let browser native paste handle it
      inputRef.current?.focus();
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!onRedeem || submitting) return;
    const sanitized = code.replace(/\s+/g, "").trim();
    if (!sanitized) {
      setHint({ text: "请输入邀请码", type: "error" });
      return;
    }

    setSubmitting(true);
    setHint(null);
    try {
      await onRedeem(sanitized);
      setCode("");
    } catch (err) {
      let message = "绑定失败，请稍后再试";
      if (err && typeof err === "object" && "response" in err) {
        try {
          const resp = (err as { response?: Response }).response;
          if (resp) {
            const text = await resp.text();
            if (text) message = text;
          }
        } catch {
          /* ignore */
        }
      } else if (err instanceof Error && err.message) {
        message = err.message;
      }
      setHint({ text: message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const isBound = Boolean(!loading && from);

  return (
    <div className="px-4 py-3.5 bg-card rounded-lg border border-border">
      {/* Section label */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">绑定邀请码</div>
        {isBound && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green bg-bg-accent rounded-full px-2 py-0.5">
            <span className="text-[12px] shrink-0 icon-[mdi--check-circle-outline]" />
            已绑定
          </span>
        )}
      </div>

      {/* Skeleton */}
      {loading && !from ? (
        <div className="flex flex-col gap-2.5">
          <div className="flex gap-2">
            <div className="flex-1 h-9 rounded-md bg-bg-accent" />
            <div className="w-8 h-9 rounded-md bg-bg-accent shrink-0" />
            <div className="w-20 h-9 rounded-md bg-bg-accent shrink-0" />
          </div>
          <div className="w-48 h-2.75 rounded-sm bg-bg-accent" />
        </div>
      ) : isBound && from ? (
        /* ── Bound state: left = input+hint, right = inviter user info ── */
        <div className="flex gap-3 items-start">
          {/* Left col */}
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={from.invite_code}
                readOnly
                disabled
                className="w-full pl-3 pr-3 py-1.25 rounded bg-input text-text-primary font-mono text-[17px] font-bold tracking-[0.12em] focus:outline-none opacity-50 cursor-not-allowed transition-colors"
              />
            </div>
            <div className="flex items-center gap-2 h-4.25 text-[12px] leading-snug text-text-muted min-w-0">
              <span className="icon-[mdi--clock-outline] text-[12px] shrink-0" />
              <span className="shrink-0">{formatTime(from.timestamp)}</span>
              <span className="text-border shrink-0">·</span>
              <a
                href={renderUriTmpl(teamUrlTmpl, { team_id: from.peer_team.id })}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-text-link no-underline border-b border-transparent hover:border-current pb-px truncate"
              >
                <span className="icon-[mdi--account-multiple] text-[12px] shrink-0" />
                <span className="truncate">{from.peer_team.name}</span>
              </a>
            </div>
          </div>

          {/* Right col: inviter */}
          <div className="flex items-center gap-3.5 shrink-0">
            <img
              src={from.peer_user.avatar_uri}
              alt=""
              crossOrigin="anonymous"
              className="w-11 h-11 rounded-full object-cover shrink-0"
            />
            <div className="flex flex-col gap-0.5">
              <span className="text-[15px] font-semibold text-text-primary whitespace-nowrap">
                {from.peer_user.nickname}
              </span>
              <span className="text-xs text-text-muted whitespace-nowrap">@{from.peer_user.account}</span>
            </div>
          </div>
        </div>
      ) : (
        /* ── Unbound state: top = input row, bottom = hint ── */
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          {/* Input + paste + bind button on one line */}
          <div className="flex gap-2 items-center">
            <div className="relative flex-1 min-w-0">
              <input
                ref={inputRef}
                type="text"
                value={code}
                onChange={(e) => {
                  const filtered = e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
                  setCode(filtered);
                  setHint(null);
                }}
                onPaste={(e) => {
                  e.preventDefault();
                  const pasted = e.clipboardData
                    .getData("text")
                    .replace(/[^A-Za-z0-9]/g, "")
                    .toUpperCase()
                    .slice(0, 12);
                  setCode(pasted);
                  setHint(null);
                }}
                placeholder="输入邀请码"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={12}
                disabled={submitting || !onRedeem}
                className="w-full pl-3 pr-9 py-1.25 rounded bg-input text-text-primary font-mono text-[17px] font-bold tracking-[0.12em] placeholder:font-normal focus:outline-none focus:bg-bg-accent disabled:cursor-default transition-colors"
              />
              <button
                type="button"
                title="粘贴"
                onClick={handlePaste}
                disabled={submitting || !onRedeem}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 size-7 flex items-center justify-center rounded text-text-muted hover:text-text-primary hover:bg-bg-accent cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="text-[16px] shrink-0 icon-[mdi--clipboard-outline]" />
              </button>
            </div>
            <button
              type="submit"
              disabled={!onRedeem || submitting || !code.replace(/\s+/g, "").trim()}
              className="shrink-0 px-4 py-1.25 rounded bg-brand text-white font-semibold text-sm cursor-pointer transition-[filter] duration-150 hover:brightness-110 active:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "绑定中…" : "绑定"}
            </button>
          </div>
          {/* Hint line */}
          <p
            className={`h-4.25 text-[12px] leading-snug truncate ${hint?.type === "error" ? "text-red" : "text-text-muted"}`}
          >
            {hint ? hint.text : "填写收到的邀请码并绑定，每个账号仅能绑定一次"}
          </p>
        </form>
      )}
    </div>
  );
}
