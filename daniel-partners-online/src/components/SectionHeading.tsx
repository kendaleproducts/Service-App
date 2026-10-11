export default function SectionHeading({
  eyebrow,
  title,
  lede,
  tone = "dark",
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  tone?: "dark" | "light";
  align?: "left" | "center";
}) {
  const t = tone === "light" ? "text-white" : "text-brand-black";
  const l = tone === "light" ? "text-white/75" : "text-slate";
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h2 className={`text-3xl sm:text-4xl ${t}`}>{title}</h2>
      <div className={`rule-gold mt-5 ${align === "center" ? "mx-auto" : ""}`} />
      {lede && <p className={`lede mt-5 ${l}`}>{lede}</p>}
    </div>
  );
}
