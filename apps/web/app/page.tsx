import Link from "next/link";
import { SITE_NAME, TAGLINE } from "@/config";

export default function Home() {
  return (
    <main className="mx-auto min-h-screen px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <div className="mb-16">
          <h1 className="mb-3 text-5xl font-bold tracking-tight text-zinc-100">
            {SITE_NAME}
          </h1>
          <p className="mb-8 text-xl text-zinc-400">{TAGLINE}</p>
          <p className="mb-10 max-w-2xl text-zinc-500">
            Root-cause analysis for AI agent failures. Every claim links to
            specific trace events with evidence-backed reports.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/runs"
              className="rounded-md border border-zinc-700 bg-zinc-900/50 px-6 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-800/50"
            >
              View Traces
            </Link>
            <a
              href="https://github.com/ashutosh887/faultline"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-zinc-700 bg-zinc-900/50 px-6 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-800/50"
            >
              GitHub
            </a>
          </div>
        </div>

        <div className="mb-16 space-y-8 border-t border-zinc-800 pt-12">
          <div>
            <h2 className="mb-3 text-lg font-semibold text-zinc-100">
              Evidence-backed analysis
            </h2>
            <p className="text-sm leading-relaxed text-zinc-400">
              Every root cause claim links directly to specific trace events.
              Click through evidence links to see exactly what happened in your
              agent&apos;s execution timeline.
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-zinc-100">
              Automated forensics
            </h2>
            <p className="text-sm leading-relaxed text-zinc-400">
              Gemini analyzes traces automatically and generates structured
              reports with root causes, contributing factors, and causal graphs
              in 10-30 seconds.
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-zinc-100">
              Actionable fixes
            </h2>
            <p className="text-sm leading-relaxed text-zinc-400">
              Get categorized fix suggestions for prompt engineering, tooling
              issues, memory problems, and orchestration failures.
            </p>
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-12">
          <h3 className="mb-4 text-sm font-medium text-zinc-300">
            Quick start
          </h3>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
            <code className="block text-xs text-zinc-400">
              <div className="mb-1 text-zinc-500">npm install @faultline/sdk</div>
              <div className="mb-1">
                const tracer = new Tracer({"{"}
              </div>
              <div className="ml-4 mb-1">
                ingestUrl: &quot;https://your-app.vercel.app&quot;
              </div>
              <div className="mb-3">{"}"})</div>
              <div>
                tracer.emit({"{"} type: &quot;user_input&quot;, payload: {"{...}"}{" "}
                {"}"})
              </div>
            </code>
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            See <span className="text-emerald-400">INTEGRATION.md</span> for
            complete integration guide
          </p>
        </div>
      </div>
    </main>
  );
}
