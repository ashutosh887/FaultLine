import { Worker, Queue } from "bullmq";
import { FORENSICS_QUEUE_NAME, FORENSICS_DLQ_NAME } from "@faultline/shared";
import { logWithTrace } from "@faultline/shared";
import { getEvents, storeReport } from "./redis-store.js";
import { analyzeTrace } from "./gemini.js";

const REDIS_HOST = process.env.REDIS_HOST ?? "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT ?? "6379", 10);

const connection = {
  host: REDIS_HOST,
  port: REDIS_PORT,
};

const dlq = new Queue(FORENSICS_DLQ_NAME, { connection });

async function processForensicsJob(job: {
  id?: string;
  data: { trace_id: string };
}) {
  const { trace_id } = job.data;
  const jobId = job.id ?? "unknown";
  logWithTrace(trace_id, "forensics_job_started", { jobId });

  try {
    const events = await getEvents(trace_id);
    if (events.length === 0) {
      logWithTrace(trace_id, "forensics_no_events", { jobId });
      return;
    }

    logWithTrace(trace_id, "forensics_calling_gemini", {
      jobId,
      event_count: events.length,
    });

    const { verdict, causal_graph } = await analyzeTrace(trace_id, events);

    await storeReport(trace_id, verdict, causal_graph);

    logWithTrace(trace_id, "forensics_completed", {
      jobId,
      root_cause: verdict.root_cause.substring(0, 50),
    });
  } catch (error) {
    logWithTrace(trace_id, "forensics_error", {
      jobId,
      error: String(error),
    });
    throw error;
  }
}

const worker = new Worker(
  FORENSICS_QUEUE_NAME,
  async (job) => {
    await processForensicsJob(job);
  },
  { connection, concurrency: 2 },
);

worker.on("completed", (job) =>
  logWithTrace(
    (job?.data as { trace_id?: string })?.trace_id ?? "",
    "job_completed",
    { jobId: job?.id },
  ),
);
worker.on("failed", async (job, err) => {
  const trace_id = (job?.data as { trace_id?: string })?.trace_id ?? "";
  logWithTrace(trace_id, "job_failed", {
    jobId: job?.id,
    error: String(err),
  });
  if (job) {
    await dlq.add(
      "failed",
      {
        trace_id,
        job_id: job.id,
        error: String(err),
        failed_at: new Date().toISOString(),
      },
      { removeOnComplete: 1000 },
    );
  }
});

console.log("[worker] FaultLine forensics worker started");
process.on("SIGTERM", () => worker.close().then(() => process.exit(0)));
