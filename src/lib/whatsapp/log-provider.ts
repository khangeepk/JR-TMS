// src/lib/whatsapp/log-provider.ts
//
// Fallback provider used when no real WhatsApp credentials are configured.
//
// IMPORTANT: This must NEVER report a message as "sent" in production, because
// nothing is actually delivered. In non-production it simulates success so the
// flow can be exercised locally; in production it fails loudly with a clear,
// non-retryable configuration error.

import type {
  WhatsAppProvider,
  WhatsAppSendResult,
  WhatsAppTemplatePayload,
  WhatsAppTextPayload,
} from "./types";

export class LogProvider implements WhatsAppProvider {
  readonly name = "log";
  private isProduction: boolean;

  constructor(isProduction: boolean = process.env.NODE_ENV === "production") {
    this.isProduction = isProduction;
  }

  private result(kind: string, to: string): WhatsAppSendResult {
    if (this.isProduction) {
      return {
        success: false,
        errorCode: "provider_not_configured",
        errorMessage:
          "WhatsApp provider is not configured. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID.",
        retryable: false,
      };
    }
    // Development/preview: simulate a successful send.
    console.log(`[whatsapp:log] simulated ${kind} send to ${to}`);
    return {
      success: true,
      providerMessageId: `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    };
  }

  async sendTemplateMessage(
    payload: WhatsAppTemplatePayload
  ): Promise<WhatsAppSendResult> {
    return this.result("template", payload.to);
  }

  async sendTextMessage(payload: WhatsAppTextPayload): Promise<WhatsAppSendResult> {
    return this.result("text", payload.to);
  }
}
