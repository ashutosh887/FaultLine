import Link from "next/link";
import { SITE_NAME, TAGLINE } from "@/config";

export default function Home() {
  return (
    <main className="mx-auto min-h-screen px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-20 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400"></span>
            Powered by Gemini 2.0 Flash
          </div>
          <h1 className="mb-4 bg-linear-to-r from-zinc-100 via-emerald-100 to-zinc-100 bg-clip-text text-6xl font-bold tracking-tight text-transparent">
            {SITE_NAME}
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-zinc-400">
            {TAGLINE}
          </p>
          <p className="mx-auto max-w-xl text-zinc-500">
            Automatically analyze AI agent failures with evidence-backed root
            cause reports. Every claim links to specific trace events.
          </p>
        </div>

        <div className="mb-16 grid gap-8 md:grid-cols-3">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10">
              <svg
                className="h-6 w-6 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-zinc-100">
              Evidence-Backed
            </h3>
            <p className="text-sm text-zinc-400">
              Every claim links to specific trace events. Click through to see
              exactly what happened.
            </p>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
              <svg
                className="h-6 w-6 text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-zinc-100">
              Automated Analysis
            </h3>
            <p className="text-sm text-zinc-400">
              Gemini analyzes traces automatically. Get root cause analysis in
              10-30 seconds.
            </p>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
              <svg
                className="h-6 w-6 text-purple-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-zinc-100">
              Actionable Fixes
            </h3>
            <p className="text-sm text-zinc-400">
              Get categorized fix suggestions: prompt, tooling, memory,
              orchestration.
            </p>
          </div>
        </div>

        <div className="mb-16 rounded-lg border border-zinc-800 bg-linear-to-br from-zinc-900/50 to-zinc-950/50 p-8">
          <h2 className="mb-6 text-2xl font-semibold text-zinc-100">
            How It Works
          </h2>
          <div className="grid gap-6 md:grid-cols-4">
            <div className="text-center">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                1
              </div>
              <h4 className="mb-1 text-sm font-medium text-zinc-300">
                Capture Events
              </h4>
              <p className="text-xs text-zinc-500">
                SDK captures user inputs, tool calls, model outputs
              </p>
            </div>
            <div className="text-center">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                2
              </div>
              <h4 className="mb-1 text-sm font-medium text-zinc-300">
                Analyze with Gemini
              </h4>
              <p className="text-xs text-zinc-500">
                Automated root cause analysis with structured outputs
              </p>
            </div>
            <div className="text-center">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                3
              </div>
              <h4 className="mb-1 text-sm font-medium text-zinc-300">
                Get Report
              </h4>
              <p className="text-xs text-zinc-500">
                Root cause, contributing factors, causal graph
              </p>
            </div>
            <div className="text-center">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                4
              </div>
              <h4 className="mb-1 text-sm font-medium text-zinc-300">
                Fix & Deploy
              </h4>
              <p className="text-xs text-zinc-500">
                Actionable suggestions categorized by type
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/runs"
            className="rounded-lg bg-linear-to-r from-emerald-600 to-emerald-500 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-500 hover:to-emerald-400 hover:shadow-emerald-500/40"
          >
            View Demo Traces
          </Link>
          <a
            href="https://github.com/ashutosh887/faultline"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-zinc-700 bg-zinc-900/50 px-8 py-3 text-base font-semibold text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800/50"
          >
            View on GitHub
          </a>
        </div>

        <div className="mt-20 border-t border-zinc-800 pt-12">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="mb-4 text-lg font-semibold text-zinc-100">
                Key Features
              </h3>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-emerald-400">✓</span>
                  <span>Clickable evidence links to timeline steps</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-emerald-400">✓</span>
                  <span>Interactive causal graph visualization</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-emerald-400">✓</span>
                  <span>Confidence scores for root cause analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-emerald-400">✓</span>
                  <span>Counterfactual analysis ("If X, then Y")</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-emerald-400">✓</span>
                  <span>Categorized fix suggestions</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-lg font-semibold text-zinc-100">
                Quick Start
              </h3>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
                <code className="text-xs text-zinc-400">
                  <div className="mb-1 text-zinc-500">
                    npm install @faultline/sdk
                  </div>
                  <div className="mb-1">const tracer = new Tracer({"{"}</div>
                  <div className="ml-2 mb-1">
                    ingestUrl: "https://your-app.vercel.app"
                  </div>
                  <div>{"}"})</div>
                  <div className="mt-2">
                    tracer.emit({"{"} type: "user_input", payload: {"{...}"}{" "}
                    {"}"})
                  </div>
                </code>
              </div>
              <p className="mt-3 text-xs text-zinc-500">
                See <span className="text-emerald-400">INTEGRATION.md</span> for
                full guide
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
