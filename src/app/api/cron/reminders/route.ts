import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

const prisma = new PrismaClient()

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization')

        // Check for standard Vercel CRON_SECRET or custom AUTH_TOKEN
        if (
            authHeader !== `Bearer ${process.env.CRON_SECRET}` &&
            authHeader !== `Bearer ${process.env.AUTH_TOKEN}`
        ) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const currentMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })

        const unpaidTenants = await prisma.tenantProfile.findMany({
            where: {
                status: 'unpaid'
            }
        })

        if (unpaidTenants.length === 0) {
            return NextResponse.json({ message: 'No unpaid tenants found for reminder.' })
        }

        let successCount = 0
        let failureCount = 0

        for (const tenant of unpaidTenants) {
            const officeStr = tenant.offices.join(', ')
            const rentStr = `Rs. ${tenant.monthlyRent.toLocaleString()}`

            const message = `Assalam-o-Alaikum ${tenant.name} Sahab,\n\nUmeed hai aap khairiyat se honge. JR Arcade ki taraf se ye aik soft reminder hai ke aapke Office/Shop ${officeStr} ka mahina ${currentMonth} ka rent ${rentStr} abhi tak pending hai.\n\nGuzarish hai ke jald az jald payment jama karwa dain takay ledger up-to-date rahay. Agar aap payment kar chuke hain, to baraye meherbani is message ko nazar-andaz (ignore) karein.\n\nShukriya,\nManagement - JR Arcade`

            const result = await sendWhatsAppMessage(tenant.phone, message)
            if (result.success) {
                successCount++
            } else {
                failureCount++
            }
        }

        return NextResponse.json({
            message: 'Monthly reminders processed.',
            totalUnpaid: unpaidTenants.length,
            successes: successCount,
            failures: failureCount
        })

    } catch (error: any) {
        console.error('Reminder Cron Error:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
