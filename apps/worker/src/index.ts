import { Worker, Queue } from "bullmq";
import { FORENSICS_QUEUE_NAME } from "@faultline/shared";
import { logWithTrace } from "@faultline/shared";

const REDIS_HOST = process.env.REDIS_HOST ?? "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT ?? "6379", 10);

const connection = {
  host: REDIS_HOST,
  port: REDIS_PORT,
};

export { FORENSICS_QUEUE_NAME };

export const forensicsQueue = new Queue(FORENSICS_QUEUE_NAME, {
  connection,
  defaultJobOptions: { removeOnComplete: 100 },
});

async function processForensicsJob(job: { id?: string; data: { trace_id: string } }) {
  const { trace_id } = job.data;
  const jobId = job.id ?? "unknown";
  logWithTrace(trace_id, "forensics_job_started", { jobId });
  logWithTrace(trace_id, "forensics_job_finished_stub", { jobId });
}

const worker = new Worker(
  FORENSICS_QUEUE_NAME,
  async (job) => {
    await processForensicsJob(job);
  },
  { connection, concurrency: 2 }
);

worker.on("completed", (job) =>
  logWithTrace((job?.data as { trace_id?: string })?.trace_id ?? "", "job_completed", { jobId: job?.id })
);
worker.on("failed", (job, err) =>
  logWithTrace((job?.data as { trace_id?: string })?.trace_id ?? "", "job_failed", { jobId: job?.id, error: String(err) })
);

console.log("[worker] FaultLine forensics worker started");
process.on("SIGTERM", () => worker.close().then(() => process.exit(0)));
