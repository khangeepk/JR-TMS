// src/lib/whatsapp/index.ts
//
// Provider factory + shared WhatsApp configuration read from environment.
// Credentials never leave this module boundary in plaintext.

import { LogProvider } from "./log-provider";
import { MetaCloudProvider } from "./meta-cloud";
import type { WhatsAppProvider } from "./types";

export * from "./types";
export { sendWhatsAppMessage } from "./legacy";

export interface WhatsAppConfig {
  provider: string;
  baseUrl: string;
  apiVersion: string;
  accessToken: string;
  phoneNumberId: string;
  templateName: string;
  templateLanguage: string;
}

/** Read WhatsApp configuration from environment variables (no secrets hardcoded). */
export function getWhatsAppConfig(): WhatsAppConfig {
  return {
    provider: process.env.WHATSAPP_PROVIDER || "meta_cloud_api",
    baseUrl: process.env.WHATSAPP_API_BASE_URL || "https://graph.facebook.com",
    apiVersion: process.env.WHATSAPP_API_VERSION || "v21.0",
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || "",
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
    templateName: process.env.WHATSAPP_TEMPLATE_NAME || "rent_due_reminder",
    templateLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en_US",
  };
}

/** True when real Meta Cloud API credentials are present. */
export function isWhatsAppConfigured(config: WhatsAppConfig = getWhatsAppConfig()): boolean {
  return Boolean(config.accessToken && config.phoneNumberId);
}

/**
 * Resolve the active provider. Returns the real Meta Cloud provider when
 * credentials exist; otherwise a LogProvider (which refuses to fake success in
 * production).
 */
export function getWhatsAppProvider(
  config: WhatsAppConfig = getWhatsAppConfig()
): WhatsAppProvider {
  if (config.provider === "meta_cloud_api" && isWhatsAppConfigured(config)) {
    return new MetaCloudProvider({
      baseUrl: config.baseUrl,
      apiVersion: config.apiVersion,
      accessToken: config.accessToken,
      phoneNumberId: config.phoneNumberId,
    });
  }
  return new LogProvider();
}
