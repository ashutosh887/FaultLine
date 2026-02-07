import Link from "next/link";
import { getRuns } from "@/app/lib/runs";

export const dynamic = "force-dynamic";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    analyzed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    succeeded: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    failed: "bg-red-500/20 text-red-400 border-red-500/40",
    running: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  };
  return (
    <span
      className={`rounded border px-2 py-0.5 text-xs font-medium ${
        styles[status] ?? "bg-zinc-500/20 text-zinc-400 border-zinc-500/40"
      }`}
    >
      {status}
    </span>
  );
}

export default async function RunsPage() {
  const runs = await getRuns();

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-zinc-100">Runs</h1>
      <p className="mt-2 text-zinc-500">
        {runs.length === 0
          ? "No traces yet. Run npm run seed for demo data, or ingest events via POST /api/ingest."
          : `${runs.length} trace${runs.length === 1 ? "" : "s"}`}
      </p>
      <div className="mt-8 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-700 text-zinc-400">
              <th className="p-3 font-medium">Run ID</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Duration</th>
              <th className="p-3 font-medium">Failure reason</th>
              <th className="p-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {runs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-zinc-500">
                  No runs yet.
                </td>
              </tr>
            ) : (
              runs.map((run) => (
                <tr
                  key={run.id}
                  className="border-b border-zinc-800 text-zinc-300 last:border-0"
                >
                  <td className="p-3 font-mono text-xs">{run.id}</td>
                  <td className="p-3">
                    <StatusBadge status={run.status} />
                  </td>
                  <td className="p-3">
                    {run.duration_ms != null ? `${run.duration_ms}ms` : "—"}
                  </td>
                  <td className="p-3 max-w-xs truncate">
                    {run.failure_reason ?? "—"}
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/runs/${run.id}`}
                      className="rounded bg-zinc-800 px-3 py-1 text-sm text-zinc-300 transition hover:bg-zinc-700 hover:text-zinc-100"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
