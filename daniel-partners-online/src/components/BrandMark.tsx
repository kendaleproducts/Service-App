import { firm } from "@/lib/brand";

/**
 * Wordmark in the style of the firm's site: serif "Daniel & Partners LLP" with
 * a gold ampersand and a spaced "LAWYERS" line. `variant="online"` swaps the
 * sub-line for the online offering's label.
 */
export default function BrandMark({
  tone = "light",
  variant = "online",
  size = "md",
}: {
  tone?: "light" | "dark";
  variant?: "online" | "lawyers";
  size?: "sm" | "md" | "lg";
}) {
  const color = tone === "light" ? "text-white" : "text-brand-black";
  const sub = tone === "light" ? "text-white/80" : "text-brand-black/70";
  const main = { sm: "text-[22px]", md: "text-[28px]", lg: "text-[40px] sm:text-[48px]" }[size];
  const subSize = { sm: "text-[8px]", md: "text-[10px]", lg: "text-[13px]" }[size];
  return (
    <span className={`inline-flex flex-col leading-none ${color}`} aria-label={firm.name}>
      <span className={`font-serif font-medium tracking-tight ${main}`}>
        Daniel <span className="text-gold">&amp;</span> Partners{" "}
        <span className="text-[0.62em] tracking-[0.04em] align-baseline">LLP</span>
      </span>
      <span className={`font-display uppercase tracking-[0.42em] ${subSize} ${sub} mt-1 self-end pr-1`}>
        {variant === "online" ? "Lawyers · Online" : "Lawyers"}
      </span>
    </span>
  );
}
