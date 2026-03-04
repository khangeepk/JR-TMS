import { NextResponse } from 'next/server';
import { db } from '@vercel/postgres';

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const client = await db.connect();

    // Aap ke asali table 'TenantProfile' se data uthana
    const { rows: unpaidTenants } = await client.sql`
      SELECT name, phone, "monthlyRent" as amount
      FROM "TenantProfile"
    `;

    for (const tenant of unpaidTenants) {
      const message = `Assalam-o-Alaikum ${tenant.name}! JR Arcade Reminder: Aapka Rent Rs. ${tenant.amount} pending hai. Meherbani farmaker jald ada karden.`;

      await fetch(`https://api.green-api.com/waInstance${process.env.GREEN_ID}/sendMessage/${process.env.GREEN_TOKEN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: `${tenant.phone}@c.us`,
          message: message
        }),
      });
    }

    return NextResponse.json({ success: true, message: `${unpaidTenants.length} Reminders Sent!` });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
}