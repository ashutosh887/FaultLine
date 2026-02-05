import Link from "next/link";
import type { EvidenceLink } from "@faultline/shared";
import { getReport } from "@/app/lib/report";
import { ReportDownloadButton } from "./ReportDownloadButton";
import { TimelineView } from "./TimelineView";
import { CausalGraphView } from "./CausalGraphView";
import { EvidencePanel } from "./EvidencePanel";

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
      {report.failure_anchor &&
        (report.failure_anchor.failure_reason ||
          report.failure_anchor.failure_event_id) && (
          <section className="mt-4 rounded-lg border border-amber-900/50 bg-amber-950/30 p-4">
            <h2 className="text-sm font-medium text-amber-400">
              Failure anchor
            </h2>
            <p className="mt-1 text-sm text-zinc-300">
              {report.failure_anchor.failure_event_id && (
                <span className="text-zinc-500">Step: </span>
              )}
              {report.failure_anchor.failure_event_id}
              {report.failure_anchor.failure_reason && (
                <>
                  {report.failure_anchor.failure_event_id && " — "}
                  {report.failure_anchor.failure_reason}
                </>
              )}
            </p>
          </section>
        )}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <h2 className="text-sm font-medium text-zinc-400">Timeline</h2>
          <TimelineView events={report.timeline} />
        </section>
        <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <h2 className="text-sm font-medium text-zinc-400">Causal graph</h2>
          <div className="mt-2">
            <CausalGraphView graph={report.causal_graph} />
          </div>
        </section>
      </div>
      <section className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <h2 className="text-sm font-medium text-zinc-400">Verdict</h2>
        {report.verdict ? (
          <div className="mt-2 space-y-4 text-sm text-zinc-300">
            {report.verdict.confidence_root_cause != null && (
              <p>
                <span className="text-zinc-500">Confidence (root cause):</span>{" "}
                {Math.round(report.verdict.confidence_root_cause * 100)}%
              </p>
            )}
            {report.verdict.confidence_factors != null && (
              <p>
                <span className="text-zinc-500">Confidence (factors):</span>{" "}
                {Math.round(report.verdict.confidence_factors * 100)}%
              </p>
            )}
            <p>
              <span className="text-zinc-500">Root cause:</span>{" "}
              {report.verdict.root_cause}
            </p>
            {report.verdict.evidence_links.length > 0 && (
              <div>
                <span className="text-zinc-500">Evidence:</span>
                <ul className="mt-1 list-inside list-disc space-y-0.5 text-zinc-400">
                  {report.verdict.evidence_links.map((e, i) => (
                    <li key={i}>
                      {e.step_id}
                      {e.snippet ? ` — ${e.snippet}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {report.verdict.contributing_factors.length > 0 && (
              <div>
                <span className="text-zinc-500">Contributing factors:</span>
                <ol className="mt-1 list-inside list-decimal space-y-1 text-zinc-400">
                  {report.verdict.contributing_factors.map((f, i) => (
                    <li key={i}>{f.description}</li>
                  ))}
                </ol>
              </div>
            )}
            {report.verdict.counterfactual && (
              <p>
                <span className="text-zinc-500">Counterfactual:</span>{" "}
                {report.verdict.counterfactual}
              </p>
            )}
            {report.verdict.fix_suggestions.length > 0 && (
              <div>
                <span className="text-zinc-500">Fix suggestions:</span>
                <ul className="mt-1 list-inside list-disc space-y-0.5 text-zinc-400">
                  {report.verdict.fix_suggestions.map((f, i) => (
                    <li key={i}>
                      [{f.category}] {f.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">
            Analysis pending or failed. Timeline still loads.
          </p>
        )}
      </section>
      {report.verdict && (() => {
        const links: EvidenceLink[] = [
          ...report.verdict.evidence_links,
          ...report.verdict.contributing_factors.flatMap((f) => f.evidence_links),
          ...report.verdict.fix_suggestions.flatMap(
            (f) => f.evidence_links ?? [],
          ),
        ];
        return <EvidencePanel evidenceLinks={links} />;
      })()}
    </main>
  );
}
