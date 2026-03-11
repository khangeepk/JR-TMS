import prisma from '@/lib/prisma'
import DashboardClient from '@/components/DashboardClient'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  try {
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
  } catch (error: any) {
    console.error("Dashboard Page Error:", error)
    return (
      <div className="p-8 bg-white rounded-3xl shadow-xl">
        <h1 className="text-2xl font-bold text-rose-500 mb-4">Dashboard Loading Error</h1>
        <p className="text-slate-600 mb-4">There was a problem loading the dashboard data. This might be due to database connectivity or configuration.</p>
        <pre className="p-4 bg-slate-50 rounded-xl text-xs overflow-auto max-h-96">
          {error.message || "Unknown error"}
          {"\n\nStack Trace:\n"}
          {error.stack || "No stack trace available"}
        </pre>
      </div>
    )
  }
}