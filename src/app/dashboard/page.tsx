import { PrismaClient } from '@prisma/client'
import DashboardClient from '@/components/DashboardClient'

const prisma = new PrismaClient()

export default async function DashboardPage() {
  // Fetch tenants — security scalar fields (totalSecurityAmount, securityPaidSoFar, securityStatus)
  // are included by default with all scalar fields. We skip the securityInstallments relation
  // include until the Prisma client is regenerated after a dev server restart.
  const tenants = await prisma.tenantProfile.findMany({
    orderBy: { startDate: 'desc' }
  })

  const currentMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })

  const paymentsThisMonth = await prisma.paymentRecord.findMany({
    where: { month: currentMonth }
  })

  return (
    <DashboardClient
      initialTenants={tenants as any}
      initialPayments={paymentsThisMonth as any}
      currentMonth={currentMonth}
    />
  )
}