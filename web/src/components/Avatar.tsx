export default function Avatar({
  src,
  size = "w-11 h-11",
  rounded = "rounded-full",
}: {
  src: string;
  size?: string;
  rounded?: string;
}) {
  return (
    <div
      role="img"
      aria-label="avatar"
      className={`relative shrink-0 overflow-hidden ${size} ${rounded}`}
      onContextMenu={(e) => e.preventDefault()}
    >
      <img
        src={src}
        alt=""
        crossOrigin="anonymous"
        draggable={false}
        className="w-full h-full object-cover select-none pointer-events-none"
      />
      {/* Transparent overlay: blocks drag, selection, and right-click on the image */}
      <div className={`absolute inset-0 ${rounded}`} />
    </div>
  );
}
