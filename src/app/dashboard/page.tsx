import prisma from '@/lib/prisma'
import DashboardClient from '@/components/DashboardClient'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const currentMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })

  try {
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
    console.error("Dashboard Data Fetch Error:", error);
    return (
      <div className="p-10 bg-white min-h-screen">
        <div className="max-w-2xl mx-auto bg-rose-50 border border-rose-200 p-8 rounded-3xl shadow-xl">
          <h1 className="text-2xl font-black text-rose-600 mb-2">Database Connection Error</h1>
          <p className="text-slate-600 mb-6">The application failed to connect to the database or retrieve data. This usually happens due to missing environment variables or connection limits.</p>
          
          <div className="bg-slate-900 rounded-2xl p-6 overflow-hidden">
            <p className="text-emerald-400 font-mono text-sm mb-2">Error Message:</p>
            <p className="text-white font-mono text-xs mb-6 break-words">{error.message || "No message available"}</p>
            
            <p className="text-emerald-400 font-mono text-sm mb-2">Code:</p>
            <p className="text-white font-mono text-xs">{error.code || "N/A"}</p>
          </div>
          
          <div className="mt-8 text-xs text-slate-400">
            Reference ID: {new Date().getTime()}
          </div>
        </div>
      </div>
    );
  }
}