// src/lib/whatsapp/meta-cloud.ts
//
// Meta WhatsApp Cloud API provider. All credentials are injected via config
// (sourced from environment variables) — nothing is hardcoded here.

import type {
  WhatsAppProvider,
  WhatsAppSendResult,
  WhatsAppTemplatePayload,
  WhatsAppTextPayload,
} from "./types";

export interface MetaCloudConfig {
  baseUrl: string; // e.g. https://graph.facebook.com
  apiVersion: string; // e.g. v21.0
  accessToken: string;
  phoneNumberId: string;
}

// Meta error codes that must NOT be retried automatically.
const NON_RETRYABLE_CODES = new Set<number>([
  0, // AuthException
  3, // API method / permission
  10, // permission denied
  190, // access token expired/invalid
  131047, // re-engagement message (outside 24h) — template issue
  131051, // unsupported message type
  132000, // template param mismatch
  132001, // template does not exist / not approved
  132005, // template hydrated text too long
  132007, // template format character policy violated
  131026, // message undeliverable (invalid number)
  131008, // required parameter missing
]);

export class MetaCloudProvider implements WhatsAppProvider {
  readonly name = "meta_cloud_api";
  private config: MetaCloudConfig;
  private fetchImpl: typeof fetch;

  constructor(config: MetaCloudConfig, fetchImpl: typeof fetch = fetch) {
    this.config = config;
    this.fetchImpl = fetchImpl;
  }

  private endpoint(): string {
    const base = this.config.baseUrl.replace(/\/+$/, "");
    return `${base}/${this.config.apiVersion}/${this.config.phoneNumberId}/messages`;
  }

  private async send(body: Record<string, unknown>): Promise<WhatsAppSendResult> {
    try {
      const res = await this.fetchImpl(this.endpoint(), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        const messageId = data?.messages?.[0]?.id as string | undefined;
        return { success: true, providerMessageId: messageId };
      }

      const err = data?.error ?? {};
      const code: number | undefined = err?.code;
      // 5xx / 429 are transient; otherwise fall back to the code table.
      const transientHttp = res.status >= 500 || res.status === 429;
      const retryable =
        transientHttp && (code === undefined || !NON_RETRYABLE_CODES.has(code));

      return {
        success: false,
        errorCode: code !== undefined ? `meta_${code}` : `http_${res.status}`,
        errorMessage: sanitizeError(err?.message ?? `HTTP ${res.status}`),
        retryable,
      };
    } catch {
      // Network-level failure — treat as transient.
      return {
        success: false,
        errorCode: "network_error",
        errorMessage: "Network error contacting WhatsApp provider",
        retryable: true,
      };
    }
  }

  async sendTemplateMessage(
    payload: WhatsAppTemplatePayload
  ): Promise<WhatsAppSendResult> {
    const body = {
      messaging_product: "whatsapp",
      to: payload.to,
      type: "template",
      template: {
        name: payload.templateName,
        language: { code: payload.languageCode },
        components: [
          {
            type: "body",
            parameters: payload.variables.map((v) => ({
              type: "text",
              text: v,
            })),
          },
        ],
      },
    };
    return this.send(body);
  }

  async sendTextMessage(payload: WhatsAppTextPayload): Promise<WhatsAppSendResult> {
    const body = {
      messaging_product: "whatsapp",
      to: payload.to,
      type: "text",
      text: { body: payload.text, preview_url: false },
    };
    return this.send(body);
  }
}

/** Strip anything that could leak tokens/PII out of a provider error message. */
function sanitizeError(message: string): string {
  return String(message)
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer ***")
    .slice(0, 300);
}
