export default function Spinner({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 50 50" className="animate-[spinner-rotate_1.4s_linear_infinite]">
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke="var(--brand)"
        strokeWidth="4"
        strokeLinecap="round"
        className="animate-[spinner-dash_1.4s_ease-in-out_infinite]"
      />
    </svg>
  );
}
