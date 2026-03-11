'use client'

export default function DashboardClient({ initialTenants, initialPayments, currentMonth }: any) {
  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold">Dashboard (Debug Mode)</h1>
      <p>Tenants Count: {initialTenants?.length || 0}</p>
      <p>Payments Count: {initialPayments?.length || 0}</p>
      <p>Current Month: {currentMonth}</p>
      <pre className="mt-4 p-4 bg-slate-100 rounded">
        {JSON.stringify(initialTenants?.slice(0, 2), null, 2)}
      </pre>
    </div>
  )
}
