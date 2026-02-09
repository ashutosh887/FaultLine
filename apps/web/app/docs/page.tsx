import Link from "next/link";

export default function DocsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-12">
      <div className="mb-8">
        <Link
          href="/"
          className="mb-4 inline-block text-sm text-zinc-400 hover:text-zinc-300"
        >
          ← Home
        </Link>
        <h1 className="mb-2 text-3xl font-bold text-zinc-100">
          Integration Guide
        </h1>
        <p className="text-zinc-400">
          How to integrate FaultLine into your AI agent system
        </p>
      </div>

      <div className="space-y-12">
        {/* Quick Start */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-zinc-100">
            Quick Start
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="mb-2 text-lg font-medium text-zinc-200">
                1. Install SDK
              </h3>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
                <code className="block text-sm text-zinc-300">
                  <div className="mb-1 text-zinc-500">
                    {/* Install from GitHub (Recommended) */}
                    Install from GitHub (Recommended)
                  </div>
                  <div className="mb-3">
                    npm install github:ashutosh887/FaultLine#packages/sdk
                  </div>
                  <div className="mb-1 text-zinc-500">
                    {/* Or from npm (if published) */}
                    Or from npm (if published)
                  </div>
                  <div>npm install @faultline/sdk</div>
                </code>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-medium text-zinc-200">
                2. Initialize Tracer
              </h3>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
                <code className="block text-sm text-zinc-300">
                  <div className="mb-1">import {"{"} Tracer {"}"} from &quot;@faultline/sdk&quot;;</div>
                  <div className="mb-1"> </div>
                  <div className="mb-1">
                    const tracer = new Tracer({"{"}
                  </div>
                  <div className="ml-4 mb-1">
                    ingestUrl: &quot;https://your-faultline-app.vercel.app&quot;
                  </div>
                  <div>{"}"});</div>
                </code>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-medium text-zinc-200">
                3. Emit Events
              </h3>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
                <code className="block text-sm text-zinc-300">
                  <div className="mb-2 text-zinc-500">{"//"} User input</div>
                  <div className="mb-1">
                    tracer.emit({"{"}
                  </div>
                  <div className="ml-4 mb-1">
                    type: &quot;user_input&quot;,
                  </div>
                  <div className="ml-4 mb-3">
                    payload: {"{"} text: &quot;Book a flight...&quot; {"}"}
                  </div>
                  <div className="mb-4">{"}"});</div>
                  <div className="mb-2 text-zinc-500">{"//"} Tool call</div>
                  <div className="mb-1">
                    tracer.emit({"{"}
                  </div>
                  <div className="ml-4 mb-1">
                    type: &quot;tool_call&quot;,
                  </div>
                  <div className="ml-4 mb-1">
                    payload: {"{"}
                  </div>
                  <div className="ml-8 mb-1">
                    tool_name: &quot;flight_search&quot;,
                  </div>
                  <div className="ml-8 mb-1">
                    input: {"{"} origin: &quot;NYC&quot;, destination: &quot;LAX&quot; {"}"}
                  </div>
                  <div className="ml-4 mb-1">{"}"}</div>
                  <div>{"}"});</div>
                </code>
              </div>
            </div>
          </div>
        </section>

        {/* Event Types */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-zinc-100">
            Event Types
          </h2>

          <div className="space-y-6">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
              <h3 className="mb-2 font-medium text-zinc-200">
                user_input
              </h3>
              <p className="mb-3 text-sm text-zinc-400">
                Captures user requests/inputs
              </p>
              <code className="block text-xs text-zinc-400">
                tracer.emit({"{"} type: &quot;user_input&quot;, payload: {"{"} text: string {"}"} {"}"})
              </code>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
              <h3 className="mb-2 font-medium text-zinc-200">tool_call</h3>
              <p className="mb-3 text-sm text-zinc-400">
                Captures tool/function calls
              </p>
              <code className="block text-xs text-zinc-400">
                tracer.emit({"{"} type: &quot;tool_call&quot;, payload: {"{"}
                tool_name: string, input: object, output?: object, error?:
                string {"}"} {"}"})
              </code>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
              <h3 className="mb-2 font-medium text-zinc-200">
                model_output
              </h3>
              <p className="mb-3 text-sm text-zinc-400">Captures LLM responses</p>
              <code className="block text-xs text-zinc-400">
                tracer.emit({"{"} type: &quot;model_output&quot;, payload: {"{"}
                text: string, token_count?: number {"}"} {"}"})
              </code>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
              <h3 className="mb-2 font-medium text-zinc-200">memory_op</h3>
              <p className="mb-3 text-sm text-zinc-400">
                Captures memory operations
              </p>
              <code className="block text-xs text-zinc-400">
                tracer.emit({"{"} type: &quot;memory_op&quot;, payload: {"{"}
                operation: &quot;store&quot; | &quot;retrieve&quot; | &quot;delete&quot;, key:
                string {"}"} {"}"})
              </code>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
              <h3 className="mb-2 font-medium text-zinc-200">
                system_state
              </h3>
              <p className="mb-3 text-sm text-zinc-400">
                Captures system state changes
              </p>
              <code className="block text-xs text-zinc-400">
                tracer.emit({"{"} type: &quot;system_state&quot;, payload: {"{"}
                state: object {"}"} {"}"})
              </code>
            </div>
          </div>
        </section>

        {/* Integration Examples */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-zinc-100">
            Integration Examples
          </h2>

          <div className="space-y-6">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
              <h3 className="mb-2 font-medium text-zinc-200">
                LangChain Agent
              </h3>
              <div className="rounded border border-zinc-800 bg-zinc-950 p-3">
                <code className="block text-xs text-zinc-400">
                  <div className="mb-1">
                    const tracer = new Tracer({"{"} ingestUrl: process.env.FAULTLINE_URL! {"}"});
                  </div>
                  <div className="mb-1"> </div>
                  <div className="mb-1">
                    tracer.emit({"{"} type: &quot;user_input&quot;, payload: {"{"} text: userInput {"}"} {"}"});
                  </div>
                  <div className="mb-1">
                    tracer.emit({"{"} type: &quot;tool_call&quot;, payload: {"{"}
                    tool_name: &quot;search_flights&quot;, input: {"{"} query: userInput {"}"} {"}"} {"}"});
                  </div>
                  <div>
                    tracer.emit({"{"} type: &quot;model_output&quot;, payload: {"{"}
                    text: result.output {"}"} {"}"});
                  </div>
                </code>
              </div>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
              <h3 className="mb-2 font-medium text-zinc-200">
                OpenAI Function Calling
              </h3>
              <div className="rounded border border-zinc-800 bg-zinc-950 p-3">
                <code className="block text-xs text-zinc-400">
                  <div className="mb-1">
                    tracer.emit({"{"} type: &quot;user_input&quot;, payload: {"{"} text: message {"}"} {"}"});
                  </div>
                  <div className="mb-1">
                    const response = await openai.chat.completions.create({"{"}...{"}"});
                  </div>
                  <div className="mb-1">
                    tracer.emit({"{"} type: &quot;model_output&quot;, payload: {"{"}
                    text: response.choices[0].message.content {"}"} {"}"});
                  </div>
                </code>
              </div>
            </div>
          </div>
        </section>

        {/* What Happens Next */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-zinc-100">
            What Happens After Integration
          </h2>
          <div className="space-y-3 text-sm text-zinc-400">
            <div className="flex items-start gap-2">
              <span className="mt-1 text-emerald-400">1.</span>
              <span>Events are ingested → Stored in Redis</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-1 text-emerald-400">2.</span>
              <span>Job is enqueued → BullMQ queue processes trace</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-1 text-emerald-400">3.</span>
              <span>Worker processes → Gemini analyzes the trace</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-1 text-emerald-400">4.</span>
              <span>Report is generated → Verdict + causal graph stored</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-1 text-emerald-400">5.</span>
              <span>
                View in UI → Visit <Link href="/runs" className="text-emerald-400 hover:underline">/runs</Link> to see analysis
              </span>
            </div>
          </div>
          <p className="mt-4 text-sm text-zinc-500">
            Analysis typically takes 10-30 seconds depending on trace length.
          </p>
        </section>

        {/* Resources */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-zinc-100">
            Resources
          </h2>
          <div className="space-y-2 text-sm">
            <div>
              <a
                href="https://github.com/ashutosh887/FaultLine/blob/main/INTEGRATION.md"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:underline"
              >
                📖 Full Integration Guide (INTEGRATION.md)
              </a>
              <p className="mt-1 text-zinc-500">
                Complete documentation with all event types, examples, and best
                practices
              </p>
            </div>
            <div>
              <a
                href="https://github.com/ashutosh887/FaultLine/blob/main/DEPLOYMENT.md"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:underline"
              >
                🚀 Deployment Guide (DEPLOYMENT.md)
              </a>
              <p className="mt-1 text-zinc-500">
                Step-by-step instructions for deploying FaultLine to production
              </p>
            </div>
            <div>
              <Link href="/runs" className="text-emerald-400 hover:underline">
                📊 View Demo Traces
              </Link>
              <p className="mt-1 text-zinc-500">
                See example traces and root-cause analysis reports
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
