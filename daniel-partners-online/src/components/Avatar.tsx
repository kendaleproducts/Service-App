export default function Avatar({ initials, tone = "dark", size = "md" }: { initials: string; tone?: "dark" | "gold" | "light"; size?: "sm" | "md" | "lg" }) {
  const sz = { sm: "h-8 w-8 text-[11px]", md: "h-11 w-11 text-sm", lg: "h-16 w-16 text-lg" }[size];
  const tn = { dark: "bg-brand-black text-gold", gold: "bg-gold text-brand-black", light: "bg-stone text-brand-black" }[tone];
  return <span className={`inline-flex shrink-0 items-center justify-center rounded-full font-display tracking-wider ${sz} ${tn}`}>{initials}</span>;
}
