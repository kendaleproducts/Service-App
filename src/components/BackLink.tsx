"use client";

import { useRouter } from "next/navigation";

export default function BackLink({
  fallbackHref,
  label,
  className = "text-sm text-stone-500 hover:text-hotsauce",
}: {
  fallbackHref: string;
  label: string;
  className?: string;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
        } else {
          router.push(fallbackHref);
        }
      }}
      className={className}
    >
      ← {label}
    </button>
  );
}
