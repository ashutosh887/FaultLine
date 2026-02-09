import { Queue } from "bullmq";
import { FORENSICS_QUEUE_NAME } from "@faultline/shared";

const REDIS_HOST = process.env.REDIS_HOST ?? "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT ?? "6379", 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const isUpstash = REDIS_HOST.includes("upstash.io");

const connection = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  ...(isUpstash && {
    tls: {
      rejectUnauthorized: false,
    },
  }),
};

let forensicsQueue: Queue | null = null;

export function getForensicsQueue(): Queue {
  if (!forensicsQueue) {
    forensicsQueue = new Queue(FORENSICS_QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        removeOnComplete: 100,
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
      },
    });
  }
  return forensicsQueue;
}

export async function enqueueForensicsJob(
  trace_id: string,
  session_id?: string | null,
): Promise<string | null> {
  try {
    const queue = getForensicsQueue();
    const job = await queue.add("analyze", {
      trace_id,
      session_id: session_id ?? undefined,
    });
    return job.id ?? null;
  } catch {
    return null;
  }
}
