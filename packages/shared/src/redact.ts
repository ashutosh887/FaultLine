const SECRET_KEYS = [
  "api_key",
  "apikey",
  "password",
  "secret",
  "token",
  "authorization",
  "auth",
  "cookie",
  "bearer",
];

function isSecretKey(key: string): boolean {
  const lower = key.toLowerCase();
  return SECRET_KEYS.some((k) => lower.includes(k));
}

const BEARER_REGEX = /bearer\s+[a-zA-Z0-9_\-\.]+/gi;
const SK_KEY_REGEX = /sk-[a-zA-Z0-9]{20,}/g;

function redactString(value: string): string {
  let out = value.replace(BEARER_REGEX, "Bearer [REDACTED]");
  out = out.replace(SK_KEY_REGEX, "sk-[REDACTED]");
  return out;
}

export function redactSecrets(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value === "string") {
    return redactString(value);
  }
  if (Array.isArray(value)) {
    return value.map(redactSecrets);
  }
  if (typeof value === "object" && value !== null) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = isSecretKey(k) ? "[REDACTED]" : redactSecrets(v);
    }
    return out;
  }
  return value;
}
