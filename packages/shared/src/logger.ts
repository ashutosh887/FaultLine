export function logWithTrace(
  trace_id: string,
  message: string,
  meta?: Record<string, unknown>,
) {
  const line = JSON.stringify({ trace_id, message, ...meta });
  console.log(line);
}
