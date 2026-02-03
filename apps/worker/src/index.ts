import { Worker, Queue } from "bullmq";

const REDIS_HOST = process.env.REDIS_HOST ?? "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT ?? "6379", 10);

const connection = {
  host: REDIS_HOST,
  port: REDIS_PORT,
};

export const FORENSICS_QUEUE_NAME = "faultline:forensics";

export const forensicsQueue = new Queue(FORENSICS_QUEUE_NAME, {
  connection,
  defaultJobOptions: { removeOnComplete: 100 },
});

async function processForensicsJob(job: { id?: string; data: { trace_id: string } }) {
  const { trace_id } = job.data;
  const jobId = job.id ?? "unknown";
  console.log("[worker] Forensics job started", { jobId, trace_id });
  console.log("[worker] Forensics job finished (stub)", { jobId });
}

const worker = new Worker(
  FORENSICS_QUEUE_NAME,
  async (job) => {
    await processForensicsJob(job);
  },
  { connection, concurrency: 2 }
);

worker.on("completed", (job) => console.log("[worker] Job completed", job.id));
worker.on("failed", (job, err) => console.error("[worker] Job failed", job?.id, err));

console.log("[worker] FaultLine forensics worker started");
process.on("SIGTERM", () => worker.close().then(() => process.exit(0)));
