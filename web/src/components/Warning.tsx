export default function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex gap-2.5 items-start px-4 py-3 rounded-lg text-text-primary text-sm leading-relaxed border"
      style={{
        background: 'color-mix(in srgb, var(--yellow) 10%, var(--card-bg))',
        borderColor: 'color-mix(in srgb, var(--yellow) 40%, transparent)',
      }}
    >
      <span className="text-[18px] icon-[mdi--alert] text-yellow shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  )
}
