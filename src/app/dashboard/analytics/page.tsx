import prisma from '@/lib/prisma'
import { BarChart3, TrendingUp, Users, CreditCard, Droplets } from 'lucide-react'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
    const currentMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })

    const tenants = await prisma.tenantProfile.findMany({
        include: {
            payments: true,
            securityInstallments: true
        }
    })

    const currentMonthPayments = tenants.flatMap(t => t.payments.filter(p => p.month === currentMonth))

    const totalRentExpected = tenants.reduce((acc, t) => acc + t.monthlyRent, 0)
    const totalWaterExpected = tenants.reduce((acc, t) => acc + t.waterCharges, 0)
    const totalRentReceived = currentMonthPayments.filter(p => p.type === 'RENT').reduce((acc, p) => acc + p.amount, 0)
    const totalWaterReceived = currentMonthPayments.filter(p => p.type === 'WATER').reduce((acc, p) => acc + p.amount, 0)
    const totalSecurityCollected = tenants.reduce((acc, t) => acc + t.securityPaidSoFar, 0)
    const totalSecurityPending = tenants.reduce((acc, t) => acc + (t.totalSecurityAmount - t.securityPaidSoFar), 0)

    const rentRecovery = totalRentExpected > 0 ? Math.round((totalRentReceived / totalRentExpected) * 100) : 0
    const waterRecovery = totalWaterExpected > 0 ? Math.round((totalWaterReceived / totalWaterExpected) * 100) : 0

    const topPayersByRent = [...tenants].sort((a, b) => b.monthlyRent - a.monthlyRent).slice(0, 5)

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <BarChart3 className="text-emerald-500" size={24} />
                    Analytics
                </h1>
                <p className="text-sm text-muted-foreground mt-1">Performance overview for {currentMonth}</p>
            </div>

            {/* Stat Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                    { label: 'Total Tenants', value: tenants.length, icon: Users, color: 'bg-violet-600' },
                    { label: 'Rent Collected', value: `Rs. ${totalRentReceived.toLocaleString()}`, icon: CreditCard, color: 'bg-blue-600' },
                    { label: 'Water Collected', value: `Rs. ${totalWaterReceived.toLocaleString()}`, icon: Droplets, color: 'bg-cyan-600' },
                    { label: 'Rent Recovery', value: `${rentRecovery}%`, icon: TrendingUp, color: 'bg-emerald-600' },
                    { label: 'Security Collected', value: `Rs. ${totalSecurityCollected.toLocaleString()}`, icon: CreditCard, color: 'bg-amber-600' },
                    { label: 'Security Pending', value: `Rs. ${totalSecurityPending.toLocaleString()}`, icon: CreditCard, color: 'bg-rose-600' },
                ].map(card => (
                    <div key={card.label} className="glass-card rounded-2xl p-5 flex items-center gap-4">
                        <div className={cn('p-3 rounded-xl shadow-lg', card.color)}>
                            <card.icon size={20} className="text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">{card.label}</p>
                            <p className="text-xl font-bold mt-0.5">{card.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recovery Bars */}
            <div className="glass-card rounded-2xl p-6 space-y-5">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Recovery Rate</h2>
                {[
                    { label: 'Rent', percent: rentRecovery, color: 'bg-emerald-500' },
                    { label: 'Water', percent: waterRecovery, color: 'bg-blue-500' },
                ].map(bar => (
                    <div key={bar.label} className="space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                            <span>{bar.label}</span>
                            <span className="text-emerald-500">{bar.percent}%</span>
                        </div>
                        <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2.5">
                            <div
                                className={cn('h-2.5 rounded-full transition-all', bar.color)}
                                style={{ width: `${bar.percent}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Top 5 Tenants by Rent */}
            <div className="glass-card rounded-2xl p-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Top Tenants by Rent</h2>
                <div className="space-y-3">
                    {topPayersByRent.map((t, i) => (
                        <div key={t.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-muted-foreground w-5">#{i + 1}</span>
                                <div>
                                    <p className="text-sm font-bold">{t.name}</p>
                                    <p className="text-[10px] text-muted-foreground">{t.offices.join(', ')}</p>
                                </div>
                            </div>
                            <span className="text-sm font-bold text-emerald-600">Rs. {t.monthlyRent.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
