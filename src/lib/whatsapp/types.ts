// src/lib/whatsapp/types.ts
//
// Provider-agnostic contract for sending WhatsApp messages. The reminder
// service only depends on these interfaces, so swapping providers (Meta Cloud
// API, an on-prem gateway, a test mock, etc.) requires no changes upstream.

export interface WhatsAppTemplatePayload {
  /** Destination in E.164 or plain MSISDN form (digits only). */
  to: string;
  /** Approved template name registered with the provider. */
  templateName: string;
  /** BCP-47 language/locale code, e.g. "en_US". */
  languageCode: string;
  /**
   * Ordered body variables mapped to the template's {{1}}, {{2}}, ... slots.
   */
  variables: string[];
}

export interface WhatsAppTextPayload {
  to: string;
  text: string;
}

export interface WhatsAppSendResult {
  success: boolean;
  /** Provider-assigned message id, present only on success. */
  providerMessageId?: string;
  /** Stable, machine-readable failure code (e.g. "invalid_number", "auth"). */
  errorCode?: string;
  /** Human-readable, non-sensitive error description. */
  errorMessage?: string;
  /**
   * Whether the failure is transient and worth retrying. Permanent failures
   * (invalid number, auth error, template rejected) MUST set this to false.
   */
  retryable?: boolean;
}

export interface WhatsAppProvider {
  readonly name: string;
  sendTemplateMessage(payload: WhatsAppTemplatePayload): Promise<WhatsAppSendResult>;
  sendTextMessage?(payload: WhatsAppTextPayload): Promise<WhatsAppSendResult>;
}
