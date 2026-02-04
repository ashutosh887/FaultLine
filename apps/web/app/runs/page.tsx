import Link from "next/link";

async function getRuns() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_INGEST_URL || "http://localhost:3000"}/api/runs`, {
    cache: "no-store",
  });
  const data = await res.json();
  return data.runs as Array<{
    id: string;
    status: string;
    duration_ms?: number;
    failure_reason?: string;
  }>;
}

export default async function RunsPage() {
  const runs = await getRuns();

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-zinc-100">Runs</h1>
      <p className="mt-2 text-zinc-500">
        Traces will appear here. Ingest events via POST /api/ingest.
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
                  <td className="p-3">{run.status}</td>
                  <td className="p-3">
                    {run.duration_ms != null ? `${run.duration_ms}ms` : "—"}
                  </td>
                  <td className="p-3 max-w-xs truncate">
                    {run.failure_reason ?? "—"}
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/runs/${run.id}`}
                      className="text-zinc-400 hover:text-zinc-200"
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
