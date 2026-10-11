import type { Metadata } from "next";
import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import SubmitButton from "@/components/SubmitButton";
import { firm } from "@/lib/brand";
import { signIn } from "./actions";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const params = await searchParams;
  const error = params.error === "1";
  const next = typeof params.next === "string" ? params.next : "";
  const sandboxPassword = process.env.SANDBOX_PASSWORD || "Sandbox2026!";

  return (
    <main className="flex min-h-screen flex-col bg-brand-black text-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6">
        <Link href="/" aria-label="Home">
          <BrandMark tone="light" size="sm" />
        </Link>
        <a href={firm.siteUrl} className="text-[11px] uppercase tracking-[0.18em] text-white/60 hover:text-gold">
          {firm.siteLabel}
        </a>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">
          <p className="eyebrow text-center">Client portal</p>
          <h1 className="mt-3 text-center text-3xl">Sign in</h1>
          <form action={signIn} className="card mt-8 space-y-5 p-8 text-ink">
            <input type="hidden" name="next" value={next} />
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input id="email" name="email" type="email" autoComplete="email" required autoFocus className="field" />
            </div>
            <div>
              <label htmlFor="password" className="label">Password</label>
              <input id="password" name="password" type="password" autoComplete="current-password" required className="field" />
            </div>
            {error && <p className="text-sm text-red">That email and password do not match. Try again.</p>}
            <SubmitButton className="btn-dark w-full" pendingText="Signing in…">Sign in</SubmitButton>
            <p className="text-center text-xs text-slate">
              New here? Start with a <Link href="/services" className="text-gold-deep underline">service</Link> and we will create your portal account as part of intake.
            </p>
          </form>
          <div className="mt-6 rounded-xl border border-gold/30 bg-white/5 p-5 text-xs text-white/70">
            <p className="font-display uppercase tracking-[0.18em] text-gold">Sandbox accounts</p>
            <p className="mt-2">Password for all: <code className="text-white">{sandboxPassword}</code></p>
            <ul className="mt-2 space-y-1">
              <li><span className="text-white">client@sandbox.test</span> — Jordan Avery, client with two matters</li>
              <li><span className="text-white">priya@sandbox.test</span> — Priya Natarajan, client with a real estate purchase</li>
              <li><span className="text-white">intake@sandbox.test</span> — Intake Desk (firm staff)</li>
              <li><span className="text-white">brandon.m.boone@sandbox.test</span> — lawyer (firm staff)</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
