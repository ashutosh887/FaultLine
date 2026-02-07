import { logWithTrace } from "@faultline/shared";

export function reportError(
  trace_id: string,
  context: string,
  error: unknown,
): void {
  const msg = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  logWithTrace(trace_id, "error", {
    context,
    error: msg,
    stack: stack?.split("\n").slice(0, 5),
  });
}
