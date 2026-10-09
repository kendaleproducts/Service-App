import ServiceDeskMark from "@/components/ServiceDeskMark";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const hasError = params.error === "1";
  const next = params.next ?? "/";

  return (
    <div className="min-h-screen flex items-center justify-center bg-charcoal px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <ServiceDeskMark className="h-20 mb-3 text-white" />
          <h1 className="text-xl font-heading font-medium text-white">Kendale Service Desk</h1>
          <p className="text-sm text-white/50 mt-1">Kendale Products Ltd &middot; Fort Erie, ON</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-8">
          <form action={login} className="space-y-4">
            <input type="hidden" name="next" value={next} />
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-stone-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoFocus
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              />
            </div>
            {hasError && <p className="text-sm text-hickory">Incorrect password. Try again.</p>}
            <button
              type="submit"
              className="w-full rounded-md bg-hotsauce text-white text-sm font-medium py-2 hover:bg-hickory transition-colors"
            >
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
