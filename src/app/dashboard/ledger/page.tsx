import prisma from '@/lib/prisma'
import { Receipt, CheckCircle2, XCircle, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function LedgerPage() {
    const currentMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })

    const [tenants, expenses] = await Promise.all([
        prisma.tenantProfile.findMany({
            include: {
                payments: {
                    where: { month: currentMonth }
                }
            },
            orderBy: { name: 'asc' }
        }),
        prisma.expense.findMany({ orderBy: { date: 'desc' } })
    ])

    // ── Income calculations ──────────────────────────────────────────────────
    // Expected = what ALL tenants SHOULD pay
    const totalRentExpected = tenants.reduce((acc, t) => acc + t.monthlyRent, 0)
    const totalWaterExpected = tenants.reduce((acc, t) => acc + t.waterCharges, 0)

    // Received = only tenants whose PaymentRecord (type=RENT/WATER) exists this month
    const totalRentReceived = tenants.reduce((acc, t) => {
        const p = t.payments.find(p => p.type === 'RENT')
        // Use the stored payment amount (equals t.monthlyRent at time of payment)
        return acc + (p ? p.amount : 0)
    }, 0)

    const totalWaterReceived = tenants.reduce((acc, t) => {
        const p = t.payments.find(p => p.type === 'WATER')
        // Use tenant's waterCharges field — the payment amount recorded
        return acc + (p ? p.amount : 0)
    }, 0)

    const totalIncome = totalRentReceived + totalWaterReceived
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0)
    const netProfit = totalIncome - totalExpenses
    const isProfit = netProfit >= 0

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Receipt className="text-emerald-500" size={24} />
                    Financial Ledger
                </h1>
                <p className="text-sm text-muted-foreground mt-1">{currentMonth}</p>
            </div>

            {/* ── Grand Financial Summary ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card rounded-2xl p-6 border-l-4 border-emerald-500">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Total Income</p>
                        <div className="p-2 bg-emerald-500/10 rounded-xl"><TrendingUp size={18} className="text-emerald-500" /></div>
                    </div>
                    <p className="text-3xl font-black text-emerald-600">Rs. {totalIncome.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground mt-2">Rent Rs.{totalRentReceived.toLocaleString()} + Water Rs.{totalWaterReceived.toLocaleString()}</p>
                </div>

                <div className="glass-card rounded-2xl p-6 border-l-4 border-rose-500">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Total Expenses</p>
                        <div className="p-2 bg-rose-500/10 rounded-xl"><TrendingDown size={18} className="text-rose-500" /></div>
                    </div>
                    <p className="text-3xl font-black text-rose-500">Rs. {totalExpenses.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground mt-2">{expenses.length} expense record(s)</p>
                </div>

                <div className={cn("glass-card rounded-2xl p-6 border-l-4", isProfit ? "border-blue-500" : "border-rose-600")}>
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{isProfit ? 'Net Profit' : 'Net Loss'}</p>
                        <div className={cn("p-2 rounded-xl", isProfit ? "bg-blue-500/10" : "bg-rose-600/10")}>
                            {isProfit ? <TrendingUp size={18} className="text-blue-500" /> : <TrendingDown size={18} className="text-rose-600" />}
                        </div>
                    </div>
                    <p className={cn("text-3xl font-black", isProfit ? "text-blue-600" : "text-rose-600")}>
                        Rs. {Math.abs(netProfit).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-2">Income − Expenses</p>
                </div>
            </div>

            {/* ── Monthly Income Breakdown Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Rent Expected', value: totalRentExpected, color: 'text-blue-500' },
                    { label: 'Rent Received', value: totalRentReceived, color: 'text-emerald-500' },
                    { label: 'Water Expected', value: totalWaterExpected, color: 'text-violet-500' },
                    { label: 'Water Received', value: totalWaterReceived, color: 'text-emerald-500' },
                ].map(card => (
                    <div key={card.label} className="glass-card rounded-2xl p-5">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">{card.label}</p>
                        <p className={cn("text-xl font-bold", card.color)}>Rs. {card.value.toLocaleString()}</p>
                    </div>
                ))}
            </div>

            {/* ── Tenant Ledger Table ── */}
            <div className="glass-card rounded-2xl overflow-hidden">
                <div className="px-6 py-5 border-b border-border">
                    <h2 className="text-sm font-bold uppercase tracking-wider">Tenant Income Breakdown — {currentMonth}</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-neutral-50/50 dark:bg-neutral-950/20">
                                <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Tenant</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Offices</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] text-right">Rent</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] text-center">Rent Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] text-right">Water</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] text-center">Water Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] text-right">Collected</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {tenants.map((t, index) => {
                                const rentPayment = t.payments.find(p => p.type === 'RENT')
                                const waterPayment = t.payments.find(p => p.type === 'WATER')
                                const collected = (rentPayment?.amount ?? 0) + (waterPayment?.amount ?? 0)
                                return (
                                    <tr key={t.id} className={`hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-neutral-900/10' : 'bg-neutral-50/10'}`}>
                                        <td className="px-6 py-4 font-bold text-sm">{t.name}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {t.offices.map(off => (
                                                    <span key={off} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-muted-foreground border border-border uppercase">{off}</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-right">Rs. {t.monthlyRent.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-center">
                                            {rentPayment
                                                ? <span className="flex items-center justify-center gap-1 text-emerald-600 text-[10px] font-black uppercase"><CheckCircle2 size={12} /> Paid</span>
                                                : <span className="flex items-center justify-center gap-1 text-rose-500 text-[10px] font-black uppercase"><XCircle size={12} /> Unpaid</span>
                                            }
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-right">Rs. {t.waterCharges.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-center">
                                            {waterPayment
                                                ? <span className="flex items-center justify-center gap-1 text-emerald-600 text-[10px] font-black uppercase"><CheckCircle2 size={12} /> Paid</span>
                                                : <span className="flex items-center justify-center gap-1 text-rose-500 text-[10px] font-black uppercase"><XCircle size={12} /> Unpaid</span>
                                            }
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-right text-emerald-600">Rs. {collected.toLocaleString()}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="bg-neutral-50 dark:bg-neutral-900/50 font-bold">
                                <td colSpan={2} className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-muted-foreground">Monthly Total</td>
                                <td className="px-6 py-4 text-right text-sm">Rs. {totalRentExpected.toLocaleString()}</td>
                                <td className="px-6 py-4 text-center text-[10px] font-black text-emerald-600">Rs. {totalRentReceived.toLocaleString()}</td>
                                <td className="px-6 py-4 text-right text-sm">Rs. {totalWaterExpected.toLocaleString()}</td>
                                <td className="px-6 py-4 text-center text-[10px] font-black text-emerald-600">Rs. {totalWaterReceived.toLocaleString()}</td>
                                <td className="px-6 py-4 text-right text-sm font-black text-emerald-600">Rs. {totalIncome.toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* ── Expenses Breakdown ── */}
            {expenses.length > 0 && (
                <div className="glass-card rounded-2xl overflow-hidden">
                    <div className="px-6 py-5 border-b border-border">
                        <h2 className="text-sm font-bold uppercase tracking-wider">Expense Breakdown (All Time)</h2>
                    </div>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-neutral-50/50 dark:bg-neutral-950/20">
                                <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Date</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Category</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Description</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {expenses.map((e, index) => (
                                <tr key={e.id} className={`${index % 2 === 0 ? 'bg-white dark:bg-neutral-900/10' : 'bg-neutral-50/10'}`}>
                                    <td className="px-6 py-3 text-sm text-muted-foreground">{new Date(e.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-3">
                                        <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-500">{e.category}</span>
                                    </td>
                                    <td className="px-6 py-3 text-sm">{e.description}</td>
                                    <td className="px-6 py-3 text-sm font-bold text-right text-rose-500">Rs. {e.amount.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-neutral-50 dark:bg-neutral-900/50">
                                <td colSpan={3} className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-muted-foreground">Total Expenses</td>
                                <td className="px-6 py-4 text-right font-black text-rose-500">Rs. {totalExpenses.toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    )
}
