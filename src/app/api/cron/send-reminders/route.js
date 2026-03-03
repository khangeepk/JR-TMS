import { NextResponse } from 'next/server';
import { db } from '@vercel/postgres'; // Ye aapke database se baat karega

export async function GET(request) {
  // 1. Security Check
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const client = await db.connect();

    // 2. Database se Unpaid Tenants ki list uthana
    // Hum sirf unka data nikal rahe hain jin ka status 'unpaid' hai
    const { rows: unpaidTenants } = await client.sql`
      SELECT name, phone, amount, office_no 
      FROM tenants 
      WHERE status = 'unpaid'
    `;

    // 3. WhatsApp bhejne ka loop
    for (const tenant of unpaidTenants) {
      const message = `Assalam-o-Alaikum ${tenant.name}! JR Arcade ki taraf se reminder: Aapka Office #${tenant.office_no} ka Rent Rs. ${tenant.amount} pending hai. Meherbani farmaker jald ada karden. Shukriya!`;

      // Green-API ko order dena
      await fetch(`https://api.green-api.com/waInstance${process.env.GREEN_ID}/sendMessage/${process.env.GREEN_TOKEN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: `${tenant.phone}@c.us`,
          message: message
        }),
      });
    }

    return NextResponse.json({ success: true, message: `${unpaidTenants.length} Messages sent!` });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
}