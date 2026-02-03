import Link from "next/link";
import { SITE_NAME, TAGLINE } from "@/config";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">
        {SITE_NAME}
      </h1>
      <p className="mt-2 text-zinc-400">
        {TAGLINE}
      </p>
      <nav className="mt-10 flex gap-4">
        <Link
          href="/runs"
          className="rounded-md bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700"
        >
          Run list
        </Link>
      </nav>
    </main>
  );
}
