// src/lib/whatsapp/legacy.ts
//
// Backwards-compatible helper used by the existing receipt / manual-reminder
// flows in dashboard/actions.ts. These are interactive flows that also open a
// wa.me link in the browser, so behaviour is intentionally preserved.
//
// The automated monthly reminder system does NOT use this function — it uses
// the provider abstraction (getWhatsAppProvider) with approved templates.

import { normalizePhone } from "@/lib/phone";

export async function sendWhatsAppMessage(phone: string, message: string) {
  try {
    const { msisdn } = normalizePhone(phone);
    const cleaned = msisdn ?? phone.replace(/[^\d]/g, "");

    console.log(`[whatsapp] preparing interactive message for ${cleaned}`);

    const encodedMessage = encodeURIComponent(message);
    const waUrl = `https://wa.me/${cleaned}?text=${encodedMessage}`;

    return { success: true, deliveredTo: cleaned, fallbackUrl: waUrl };
  } catch (error) {
    console.error("[whatsapp] interactive message prep failed:", error);
    return { success: false, error };
  }
}
