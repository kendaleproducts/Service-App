import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 text-3xl">Page not found</h1>
      <Link href="/" className="btn-outline mt-8">
        Back to home
      </Link>
    </main>
  );
}
