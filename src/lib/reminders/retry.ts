// src/lib/reminders/retry.ts
//
// Retry helper with exponential backoff for transient WhatsApp provider
// failures. Pure with respect to timing (backoff is injectable) so it can be
// unit-tested deterministically.

import type { WhatsAppProvider, WhatsAppSendResult } from "@/lib/whatsapp/types";

export interface RetryOptions {
  maxAttempts?: number; // default 3
  baseDelayMs?: number; // default 500
  /** Injectable sleep for tests. */
  sleep?: (ms: number) => Promise<void>;
}

export interface RetryOutcome {
  result: WhatsAppSendResult;
  attempts: number;
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Attempt to send a template message, retrying only on transient failures.
 * - Stops immediately on success.
 * - Stops immediately on a non-retryable failure (invalid number, auth, template).
 * - Retries transient failures up to `maxAttempts`, with exponential backoff.
 */
export async function sendTemplateWithRetry(
  provider: WhatsAppProvider,
  payload: Parameters<WhatsAppProvider["sendTemplateMessage"]>[0],
  options: RetryOptions = {}
): Promise<RetryOutcome> {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 500;
  const sleep = options.sleep ?? defaultSleep;

  let attempts = 0;
  let last: WhatsAppSendResult = {
    success: false,
    errorCode: "not_attempted",
    errorMessage: "No send attempt was made",
    retryable: false,
  };

  while (attempts < maxAttempts) {
    attempts++;
    last = await provider.sendTemplateMessage(payload);

    if (last.success) break;
    if (last.retryable !== true) break; // permanent failure — do not retry
    if (attempts >= maxAttempts) break;

    // Exponential backoff: base * 2^(attempt-1)
    await sleep(baseDelayMs * Math.pow(2, attempts - 1));
  }

  return { result: last, attempts };
}
