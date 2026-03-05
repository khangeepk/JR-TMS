// src/lib/whatsapp.ts

/**
 * WhatsApp Server API Mock Integration
 * 
 * In a production environment, this function would hit a real 
 * service like Twilio, UltraMsg, or the Meta WhatsApp API.
 * 
 * For this implementation, we will mock the asynchronous HTTP request
 * logging the exact payload it would send.
 */
export async function sendWhatsAppMessage(phone: string, message: string) {
  try {
    // Format number to international format (Pakistan default)
    let cleaned = phone.replace(/[\s\-\(\)]/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = "92" + cleaned.substring(1);
    } else if (!cleaned.startsWith("92") && !cleaned.startsWith("+92")) {
      cleaned = "92" + cleaned;
    }
    cleaned = cleaned.replace("+", "");

    console.log(`[WHATSAPP-API] Attempting to send message to ${cleaned}`);

    // Simulate API Network Request Delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock API request that would theoretically happen:
    /*
      await fetch('https://api.ultramsg.com/instanceXXX/messages/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          token: process.env.WHATSAPP_TOKEN,
          to: cleaned,
          body: message
        })
      });
    */

    console.log(`[WHATSAPP-API] Successfully sent message payload to ${cleaned}:`);
    console.log(`--- MESSAGE START ---\n${message}\n--- MESSAGE END ---`);

    // Generate the fallback wa.me URL
    const encodedMessage = encodeURIComponent(message);
    const waUrl = `https://wa.me/${cleaned}?text=${encodedMessage}`;

    return { success: true, deliveredTo: cleaned, fallbackUrl: waUrl };
  } catch (error) {
    console.error("[WHATSAPP-API] Gateway Delivery Failed:", error);
    return { success: false, error };
  }
}
