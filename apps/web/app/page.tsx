import Link from "next/link";
import { SITE_NAME, TAGLINE } from "@/config";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">
        {SITE_NAME}
      </h1>
      <p className="mt-2 text-zinc-400">{TAGLINE}</p>
      <p className="mt-4 max-w-xl text-sm text-zinc-500">
        Capture agent traces, analyze with Gemini, and get evidence-backed root
        cause reports. Every claim links to specific events.
      </p>
      <nav className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/runs"
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500"
        >
          View runs
        </Link>
        <Link
          href="/runs"
          className="rounded-lg border border-zinc-600 px-5 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-800/50"
        >
          Demo traces
        </Link>
      </nav>
    </main>
  );
}
