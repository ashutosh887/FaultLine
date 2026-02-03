import Link from "next/link";

export default function RunsPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-zinc-100">Runs</h1>
      <p className="mt-2 text-zinc-500">
        Traces will appear here. Ingest events via POST /api/ingest.
      </p>
      <div className="mt-8 rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 text-center text-zinc-500">
        No runs yet.
      </div>
      <Link
        href="/"
        className="mt-6 inline-block text-sm text-zinc-400 hover:text-zinc-300"
      >
        ← Home
      </Link>
    </main>
  );
}
