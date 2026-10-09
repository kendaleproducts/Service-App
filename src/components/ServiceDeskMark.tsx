// Material "build" glyph — the same wrench used for vendor pins on the map.
const WRENCH_PATH =
  "M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z";

/**
 * The Kendale flame (untouched) inside a thin ring with a wrench badge.
 * Ring, badge outline and wrench take `currentColor`; `badgeFill` should
 * match whatever the mark sits on so the badge visibly breaks the ring.
 */
export default function ServiceDeskMark({
  className = "h-10",
  badgeFill = "#f6f1e7",
}: {
  className?: string;
  badgeFill?: string;
}) {
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
        <circle cx="110" cy="125" r="104" fill="none" stroke="currentColor" strokeWidth="5" />
        <circle cx="183.5" cy="198.5" r="22" fill={badgeFill} stroke="currentColor" strokeWidth="5" />
        <g transform="translate(167.9,182.9) scale(1.3)">
          <path d={WRENCH_PATH} fill="currentColor" />
        </g>
      </svg>
    </span>
  );
}
