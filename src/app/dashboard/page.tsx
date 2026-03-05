import prisma from '@/lib/prisma'
import DashboardClient from '@/components/DashboardClient'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const currentMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })

  const [tenants, paymentsThisMonth] = await Promise.all([
    prisma.tenantProfile.findMany({ orderBy: { startDate: 'desc' } }),
    prisma.paymentRecord.findMany({ where: { month: currentMonth } })
  ])

  return (
    <DashboardClient
      initialTenants={tenants as any}
      initialPayments={paymentsThisMonth as any}
      currentMonth={currentMonth}
    />
  )
}