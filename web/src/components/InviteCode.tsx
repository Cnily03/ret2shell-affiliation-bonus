import clsx from "clsx";
import { useState } from "react";
import { patchInviteCode } from "@/api/client";

function Btn({
  children,
  onClick,
  disabled,
  variant = "ghost",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "brand" | "ghost";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded text-[13px] font-medium border-0 transition-[filter] duration-150",
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:brightness-110 active:brightness-95",
        variant === "brand" ? "bg-brand text-white" : "bg-bg-accent text-text-primary"
      )}
    >
      {children}
    </button>
  );
}

export default function InviteCode({
  code,
  bonusScore,
  maxScore,
  onRefresh,
  loading: propLoading,
}: {
  code: string;
  bonusScore?: number;
  maxScore?: number;
  onRefresh?: (newCode: string) => void;
  loading?: boolean;
}) {
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await patchInviteCode();
      onRefresh?.(res.invite_code);
    } catch {
      // ignore
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="px-4 py-3.5 bg-card rounded-lg border border-border">
      <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted mb-2.5">我的邀请码</div>
      <div className="flex items-center gap-2 flex-wrap">
        {propLoading ? (
          <div className="w-35 h-8.5 rounded bg-bg-accent" />
        ) : (
          <code className="font-mono text-[17px] font-bold tracking-[0.12em] text-text-primary px-3 py-1.25 bg-input rounded select-all">
            {code}
          </code>
        )}
        <Btn variant="brand" onClick={handleCopy} disabled={propLoading || !code}>
          <span className={clsx("text-[14px] shrink-0", copied ? "icon-[mdi--check]" : "icon-[mdi--content-copy]")} />
          {copied ? "已复制" : "复制"}
        </Btn>
        <Btn onClick={handleRefresh} disabled={propLoading || refreshing}>
          <span
            className={clsx(
              "text-[14px] shrink-0 icon-[mdi--refresh]",
              refreshing && "animate-[spinner-rotate_0.8s_linear_infinite]"
            )}
          />
          刷新
        </Btn>
      </div>
      {propLoading ? (
        <div className="w-72 h-2.75 rounded-sm bg-bg-accent mt-2.5" />
      ) : (
        bonusScore !== undefined &&
        maxScore !== undefined && (
          <p className="mt-2.5 text-[12px] text-text-muted leading-snug">
            分享邀请码，其他用户填写后，你所在的队伍可获得
            <span className="text-text-secondary font-medium"> {bonusScore} pts </span>
            奖励，每支队伍累计上限
            <span className="text-text-secondary font-medium"> {maxScore} pts</span>
          </p>
        )
      )}
    </div>
  );
}
