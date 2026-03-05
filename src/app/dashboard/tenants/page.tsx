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

            <div className="glass-card rounded-2xl overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                        <tr className="bg-neutral-50/50 dark:bg-neutral-950/20">
                            <th className="px-5 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Name</th>
                            <th className="px-5 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Phone</th>
                            <th className="px-5 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Offices</th>
                            <th className="px-5 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] text-right">Monthly Rent</th>
                            <th className="px-5 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] text-right">Water Charges</th>
                            <th className="px-5 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] text-right">Total/Month</th>
                            <th className="px-5 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Start Date</th>
                            <th className="px-5 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Security</th>
                            <th className="px-5 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {tenants.map((t, index) => {
                            const totalMonthly = t.monthlyRent + t.waterCharges
                            return (
                                <tr
                                    key={t.id}
                                    className={`hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-neutral-900/10' : 'bg-neutral-50/10 dark:bg-neutral-800/5'}`}
                                >
                                    <td className="px-5 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm">{t.name}</span>
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
                                            <span className={`block px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider text-center ${t.securityStatus === 'Fully Paid'
                                                    ? 'bg-emerald-500/10 text-emerald-600'
                                                    : t.securityStatus === 'Partial'
                                                        ? 'bg-amber-500/10 text-amber-600'
                                                        : 'bg-rose-500/10 text-rose-500'
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
                                                startDate: t.startDate
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
                            <tr className="bg-neutral-50 dark:bg-neutral-900/50">
                                <td colSpan={3} className="px-5 py-4 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                                    Total ({tenants.length} Tenants)
                                </td>
                                <td className="px-5 py-4 text-sm font-black text-right">
                                    Rs. {tenants.reduce((a, t) => a + t.monthlyRent, 0).toLocaleString()}
                                </td>
                                <td className="px-5 py-4 text-sm font-black text-right text-blue-600">
                                    Rs. {tenants.reduce((a, t) => a + t.waterCharges, 0).toLocaleString()}
                                </td>
                                <td className="px-5 py-4 text-sm font-black text-right text-emerald-600">
                                    Rs. {tenants.reduce((a, t) => a + t.monthlyRent + t.waterCharges, 0).toLocaleString()}
                                </td>
                                <td colSpan={3} />
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    )
}
