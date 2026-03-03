import { NextResponse } from 'next/server';

export async function GET(request) {
  // Check kerna ke request Vercel se hi aa rahi hai
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Green-API ki details jo hum Vercel mein save karenge
    const idInstance = process.env.GREEN_ID;
    const apiToken = process.env.GREEN_TOKEN;

    // --- Yahan Hum Data Base Se Unpaid Tenants Ki List Uthayenge ---
    // Filhal main demo ke liye 1 number likh raha hoon check karne ke liye
    const tenants = [
      { name: "Sami Khan", phone: "923001234567", amount: "50000" } 
    ];

    for (const person of tenants) {
      const message = `Assalam-o-Alaikum ${person.name}! JR Arcade ki taraf se reminder: Aapka Rent Rs. ${person.amount} pending hai. Meherbani farmaker ada karden.`;

      // WhatsApp bhejne ka order
      await fetch(`https://api.green-api.com/waInstance${idInstance}/sendMessage/${apiToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: `${person.phone}@c.us`,
          message: message
        }),
      });
    }

    return NextResponse.json({ success: true, message: "Messages Sent Successfully!" });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
}