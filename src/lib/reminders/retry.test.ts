import { describe, it, expect, vi } from "vitest";
import { sendTemplateWithRetry } from "./retry";
import type { WhatsAppProvider, WhatsAppSendResult } from "@/lib/whatsapp/types";

function makeProvider(results: WhatsAppSendResult[]): WhatsAppProvider {
  let i = 0;
  return {
    name: "mock",
    sendTemplateMessage: vi.fn(async () => results[Math.min(i++, results.length - 1)]),
  };
}

const payload = {
  to: "923001234567",
  templateName: "rent_due_reminder",
  languageCode: "en_US",
  variables: ["Ali", "July 2026", "JR Arcade", "Shop 1", "Rs. 100", "Mgmt"],
};

const noSleep = () => Promise.resolve();

describe("sendTemplateWithRetry", () => {
  it("succeeds on the first attempt", async () => {
    const provider = makeProvider([{ success: true, providerMessageId: "wamid.1" }]);
    const { result, attempts } = await sendTemplateWithRetry(provider, payload, { sleep: noSleep });
    expect(result.success).toBe(true);
    expect(attempts).toBe(1);
  });

  it("retries transient failures then succeeds", async () => {
    const provider = makeProvider([
      { success: false, retryable: true, errorCode: "network_error" },
      { success: false, retryable: true, errorCode: "http_500" },
      { success: true, providerMessageId: "wamid.2" },
    ]);
    const { result, attempts } = await sendTemplateWithRetry(provider, payload, { sleep: noSleep });
    expect(result.success).toBe(true);
    expect(attempts).toBe(3);
  });

  it("stops after the configured maximum attempts", async () => {
    const provider = makeProvider([{ success: false, retryable: true, errorCode: "http_503" }]);
    const { result, attempts } = await sendTemplateWithRetry(provider, payload, {
      maxAttempts: 3,
      sleep: noSleep,
    });
    expect(result.success).toBe(false);
    expect(attempts).toBe(3);
    expect(provider.sendTemplateMessage).toHaveBeenCalledTimes(3);
  });

  it("does not retry permanent failures (invalid number / auth)", async () => {
    const provider = makeProvider([
      { success: false, retryable: false, errorCode: "meta_131026" },
    ]);
    const { result, attempts } = await sendTemplateWithRetry(provider, payload, { sleep: noSleep });
    expect(result.success).toBe(false);
    expect(attempts).toBe(1);
    expect(provider.sendTemplateMessage).toHaveBeenCalledTimes(1);
  });
});
