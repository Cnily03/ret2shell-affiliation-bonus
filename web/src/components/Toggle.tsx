export default function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <div
      role="switch"
      aria-checked={checked}
      tabIndex={0}
      className="inline-flex items-center gap-2 cursor-pointer select-none"
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") onChange(!checked);
      }}
    >
      <div
        className={`relative w-9 h-5 rounded-[10px] shrink-0 transition-colors duration-200 ${checked ? "bg-brand" : "bg-bg-accent"}`}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-[left] duration-200 ${checked ? "left-4.5" : "left-0.5"}`}
        />
      </div>
      {label && <span className="text-xs text-text-muted font-medium">{label}</span>}
    </div>
  );
}
