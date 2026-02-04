import Link from "next/link";
import { getReport } from "@/app/lib/report";
import { ReportDownloadButton } from "./ReportDownloadButton";

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await getReport(id);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-zinc-100">Run {id}</h1>
        <ReportDownloadButton traceId={id} />
      </div>
      <Link
        href="/runs"
        className="mt-2 inline-block text-sm text-zinc-400 hover:text-zinc-300"
      >
        ← Runs
      </Link>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <h2 className="text-sm font-medium text-zinc-400">Timeline</h2>
          {report.timeline.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">
              No events yet. Analysis may still be running.
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {report.timeline.map((event, i) => (
                <li
                  key={i}
                  className="rounded border border-zinc-700 bg-zinc-800/50 p-2 text-sm text-zinc-300"
                >
                  <span className="font-medium">{event.type}</span>
                  {typeof event.timestamp === "number"
                    ? ` — ${new Date(event.timestamp).toISOString()}`
                    : ""}
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <h2 className="text-sm font-medium text-zinc-400">Causal graph</h2>
          {report.causal_graph.nodes.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">No graph data yet.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm text-zinc-300">
              {report.causal_graph.nodes.map((n) => (
                <li key={n.id}>{n.label}</li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <section className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <h2 className="text-sm font-medium text-zinc-400">Verdict</h2>
        {report.verdict ? (
          <div className="mt-2 space-y-2 text-sm text-zinc-300">
            <p>
              <span className="text-zinc-500">Root cause:</span>{" "}
              {report.verdict.root_cause}
            </p>
            {report.verdict.counterfactual ? (
              <p>
                <span className="text-zinc-500">Counterfactual:</span>{" "}
                {report.verdict.counterfactual}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">
            Analysis pending or failed. Timeline still loads.
          </p>
        )}
      </section>
    </main>
  );
}
