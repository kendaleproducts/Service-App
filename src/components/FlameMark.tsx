export default function FlameMark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12.5 1.5c.6 3.1-.7 4.9-2.3 6.6-1.8 1.9-3.7 3.9-3.7 7.2a5.5 5.5 0 0 0 9.4 3.9c1.9-1.9 2.4-4.6 1.3-7-.3.9-1 1.7-1.8 2-.6-2.9.2-4.6 1.3-6.2C18 6 18.6 3.8 17.3 1.6c-.4 1.6-1.4 2.6-2.6 3.2.2-1.4-.3-2.6-2.2-3.3Z"
        fill="var(--color-hotsauce)"
      />
      <path
        d="M12.2 9.3c-.9 1.1-1.7 2.3-1.7 3.9a2.9 2.9 0 0 0 5 2.1 2.9 2.9 0 0 0 .5-3.3c-.3.6-.7 1-1.2 1.2.1-1.7-.5-2.8-1.4-3.9Z"
        fill="var(--color-charcoal)"
      />
    </svg>
  );
}
