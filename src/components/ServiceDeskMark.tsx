// Material "build" glyph — the same wrench used for vendor pins on the map.
const WRENCH_PATH =
  "M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z";

// The Kendale flame (untouched) inside a ring that breaks around a free-floating
// wrench. Ring and wrench take currentColor, so it works on any surface.
export default function ServiceDeskMark({ className = "h-10" }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Kendale Service Desk"
      className={`relative inline-block shrink-0 aspect-[220/250] ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- static brand asset, skip the image optimizer */}
      <img
        src="/brand/kendale-flame.webp"
        alt=""
        className="absolute"
        style={{ left: "21.4%", top: "10%", width: "57.3%", height: "80%" }}
      />
      <svg viewBox="0 0 220 250" className="absolute inset-0 h-full w-full" aria-hidden="true">
        {/* Ring broken around the lower-right, where the wrench floats in the gap. */}
        <path
          d="M171.13 209.14 A104 104 0 1 1 194.14 186.13"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <g transform="translate(165.5,180.5) scale(1.5)">
          <path d={WRENCH_PATH} fill="currentColor" />
        </g>
      </svg>
    </span>
  );
}
