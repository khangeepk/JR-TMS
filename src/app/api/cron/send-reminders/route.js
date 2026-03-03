import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  // 1. Security Check
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // 2. Prisma se TenantProfile ka data uthana
    const unpaidTenants = await prisma.tenantProfile.findMany();

    // 3. WhatsApp bhejne ka loop
    for (const tenant of unpaidTenants) {
      const message = `Assalam-o-Alaikum ${tenant.name}! JR Arcade Reminder: Aapka Rent Rs. ${tenant.monthlyRent} pending hai. Shukriya!`;

      await fetch(`https://api.green-api.com/waInstance${process.env.GREEN_ID}/sendMessage/${process.env.GREEN_TOKEN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: `${tenant.phone}@c.us`,
          message: message
        }),
      });
    }

    return NextResponse.json({ success: true, message: `${unpaidTenants.length} Messages Sent!` });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  } finally {
    await prisma.$disconnect();
  }
}