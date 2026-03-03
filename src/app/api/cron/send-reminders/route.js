import { NextResponse } from 'next/server';

export async function GET(request) {
  const authHeader = request.headers.get('authorization');

  // Security Check (Password)
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  return NextResponse.json({ 
    success: true, 
    message: "Sami Khan Sahab, System Live Hai!" 
  });
}