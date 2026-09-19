export default function FlameMark({ className = "h-6 w-auto" }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- static brand asset, skip the image optimizer
  return <img src="/brand/kendale-flame.webp" alt="Kendale Products Ltd" className={className} />;
}
