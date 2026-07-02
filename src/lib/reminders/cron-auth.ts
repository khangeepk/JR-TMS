// src/lib/reminders/cron-auth.ts
//
// Server-to-server authentication for the cron endpoint. Vercel Cron sends the
// configured CRON_SECRET as `Authorization: Bearer <secret>`. We also accept a
// legacy AUTH_TOKEN bearer for backwards compatibility with the prior setup.

export interface CronAuthEnv {
  cronSecret?: string;
  authToken?: string;
}

/**
 * Validate an incoming Authorization header against the configured secret(s).
 * Returns false when no secret is configured (fail closed) or the header is
 * missing/incorrect. Comparison is constant-time-ish via exact string equality
 * on already-small values.
 */
export function isAuthorizedCron(
  authHeader: string | null | undefined,
  env: CronAuthEnv
): boolean {
  const { cronSecret, authToken } = env;

  // Fail closed: if nothing is configured, reject all requests.
  if (!cronSecret && !authToken) return false;
  if (!authHeader) return false;

  const expected: string[] = [];
  if (cronSecret) expected.push(`Bearer ${cronSecret}`);
  if (authToken) expected.push(`Bearer ${authToken}`);

  return expected.some((candidate) => safeEqual(authHeader, candidate));
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
