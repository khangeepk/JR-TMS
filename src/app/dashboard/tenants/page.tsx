import prisma from '@/lib/prisma'
import Link from 'next/link'
import { Users, Plus } from 'lucide-react'
import EditTenantModal from '@/components/EditTenantModal'
import DeleteTenantButton from '@/components/DeleteTenantButton'

export const dynamic = 'force-dynamic'

export default async function TenantsPage() {
    const tenants = await prisma.tenantProfile.findMany({
        orderBy: { name: 'asc' }
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Users className="text-emerald-500" size={24} />
                        Tenant Management
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">{tenants.length} registered tenants · Edit and Delete from here</p>
                </div>
                <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/20"
                >
                    <Plus size={14} /> Add New Tenant
                </Link>
            </div>

            <div className="bg-white premium-shadow rounded-[2rem] overflow-x-auto p-4 lg:p-6 text-slate-800">
                <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                        <tr className="border-b border-neutral-100">
                            <th className="px-5 py-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                            <th className="px-5 py-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Phone</th>
                            <th className="px-5 py-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Offices</th>
                            <th className="px-5 py-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-right">Rent</th>
                            <th className="px-5 py-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-right">Water</th>
                            <th className="px-5 py-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-right">Total/Mo</th>
                            <th className="px-5 py-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Start Date</th>
                            <th className="px-5 py-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Security</th>
                            <th className="px-5 py-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50">
                        {tenants.map((t, index) => {
                            const totalMonthly = t.monthlyRent + t.waterCharges
                            return (
                                <tr
                                    key={t.id}
                                    className="hover:bg-neutral-50/50 transition-colors group"
                                >
                                    <td className="px-5 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm text-slate-800">{t.name}</span>
                                            {t.isShared && (
                                                <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">Shared</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-muted-foreground">{t.phone}</td>
                                    <td className="px-5 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {t.offices.map(off => (
                                                <span key={off} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-muted-foreground border border-border uppercase">{off}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-sm font-bold text-right">Rs. {t.monthlyRent.toLocaleString()}</td>
                                    <td className="px-5 py-4 text-sm font-bold text-right text-blue-600">Rs. {t.waterCharges.toLocaleString()}</td>
                                    <td className="px-5 py-4 text-sm font-black text-right text-emerald-600">Rs. {totalMonthly.toLocaleString()}</td>
                                    <td className="px-5 py-4 text-sm text-muted-foreground whitespace-nowrap">{new Date(t.startDate).toLocaleDateString()}</td>
                                    <td className="px-5 py-4">
                                        <div className="space-y-1">
                                            <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-center ${t.securityStatus === 'Fully Paid'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : t.securityStatus === 'Partial'
                                                    ? 'bg-amber-100 text-amber-700'
                                                    : 'bg-rose-100 text-rose-700'
                                                }`}>
                                                {t.securityStatus}
                                            </span>
                                            {t.totalSecurityAmount > 0 && (
                                                <span className="block text-[9px] text-center text-muted-foreground">
                                                    Rs. {t.securityPaidSoFar.toLocaleString()} / {t.totalSecurityAmount.toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex flex-col gap-0.5 min-w-[120px]">
                                            <EditTenantModal tenant={{
                                                id: t.id,
                                                name: t.name,
                                                phone: t.phone,
                                                monthlyRent: t.monthlyRent,
                                                waterCharges: t.waterCharges,
                                                offices: t.offices,
                                                isShared: t.isShared,
                                                startDate: t.startDate,
                                                totalSecurityAmount: t.totalSecurityAmount,
                                                securityPaidSoFar: t.securityPaidSoFar
                                            }} />
                                            <DeleteTenantButton id={t.id} name={t.name} />
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                        {tenants.length === 0 && (
                            <tr>
                                <td colSpan={9} className="px-6 py-12 text-center text-muted-foreground text-sm">
                                    No tenants registered yet. <Link href="/dashboard" className="text-emerald-600 font-bold hover:underline">Add one →</Link>
                                </td>
                            </tr>
                        )}
                    </tbody>
                    {tenants.length > 0 && (
                        <tfoot>
                            <tr className="bg-neutral-50 text-slate-600">
                                <td colSpan={3} className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 rounded-bl-3xl">
                                    Total ({tenants.length} Tenants)
                                </td>
                                <td className="px-5 py-4 text-sm font-bold text-right">
                                    Rs. {tenants.reduce((a, t) => a + t.monthlyRent, 0).toLocaleString()}
                                </td>
                                <td className="px-5 py-4 text-sm font-bold text-right text-blue-600">
                                    Rs. {tenants.reduce((a, t) => a + t.waterCharges, 0).toLocaleString()}
                                </td>
                                <td className="px-5 py-4 text-sm font-black text-right text-emerald-600">
                                    Rs. {tenants.reduce((a, t) => a + t.monthlyRent + t.waterCharges, 0).toLocaleString()}
                                </td>
                                <td colSpan={3} className="rounded-br-3xl" />
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    )
}
