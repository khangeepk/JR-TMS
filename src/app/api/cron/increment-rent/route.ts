import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

const prisma = new PrismaClient()

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization')

        // In production, require Vercel Cron Secret.
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new Response('Unauthorized', { status: 401 })
        }

        const allTenants = await prisma.tenantProfile.findMany()
        let updatedCount = 0

        const now = new Date()
        const adminPhone = "+923000000000" // Configure your Admin Number

        for (const tenant of allTenants) {
            if (!tenant.startDate) continue
            const start = new Date(tenant.startDate)

            const isSameMonth = start.getMonth() === now.getMonth()
            const isSameDay = start.getDate() === now.getDate()
            const isPastYear = now.getFullYear() > start.getFullYear()

            // If today is their exactly anniversary day and at least 1 year has passed
            if (isSameMonth && isSameDay && isPastYear) {
                // Increase rent by 10%
                const newRent = tenant.monthlyRent * 1.10

                await prisma.tenantProfile.update({
                    where: { id: tenant.id },
                    data: { monthlyRent: newRent }
                })

                updatedCount++

                // 1. Notify the Tenant via WhatsApp API Mock
                const tenantMsg = `Hello ${tenant.name}, happy anniversary at JR Arcade! As per the tenancy agreement, your rent for Office ${tenant.offices.join(', ')} has been increased by 10% to Rs. ${newRent.toLocaleString()}. Thank you.`
                await sendWhatsAppMessage(tenant.phone, tenantMsg)

                // 2. Notify the Admin via WhatsApp API Mock
                const adminMsg = `[ADMIN ALERT] Automated 10% Rent Increment applied to ${tenant.name} (Office: ${tenant.offices.join(', ')}). New Rent: Rs. ${newRent.toLocaleString()}.`
                await sendWhatsAppMessage(adminPhone, adminMsg)
            }
        }

        return NextResponse.json({ success: true, updatedCount })
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
