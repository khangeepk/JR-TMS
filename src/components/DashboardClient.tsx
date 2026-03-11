'use client'

import { useState, useTransition, useOptimistic, startTransition } from 'react'
import { addTenant, markAsPaid, exportMonthlyLedger } from '@/app/dashboard/actions'
import WhatsAppActionButton from '@/components/WhatsAppActionButton'
import SecurityInstallmentButton from '@/components/SecurityInstallmentButton'
import { ThemeToggle } from '@/components/ThemeToggle'
import { cn } from '@/lib/utils'
import {
    Search,
    MoreVertical,
    TrendingUp,
    Users,
    AlertCircle,
    CreditCard,
    Plus,
    Download,
    CheckCircle2
} from 'lucide-react'

// Mockup SVG Sparklines for visual flair
const SparklineGreen = () => (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-12 stroke-emerald-400 fill-emerald-500/10 mt-2">
        <path d="M0,30 L10,25 L30,28 L50,15 L70,22 L90,5 L100,0 L100,30 Z" stroke="none" />
        <path d="M0,30 L10,25 L30,28 L50,15 L70,22 L90,5 L100,0" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

const SparklineRed = () => (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-12 stroke-rose-400 fill-rose-500/10 mt-2">
        <path d="M0,5 L10,8 L30,2 L50,15 L70,12 L90,25 L100,30 L100,30 L0,30 Z" stroke="none" />
        <path d="M0,5 L10,8 L30,2 L50,15 L70,12 L90,25 L100,30" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

// Sub-component for individual Stat Cards based on premium UI mockup
function StatCard({ title, value, subValue, trendInfo, type = 'good' }: any) {
    return (
        <div
            className="bg-white premium-shadow rounded-2xl p-4 md:p-6 flex flex-col justify-between overflow-hidden relative group hover:-translate-y-1 transition-transform duration-300 min-h-[140px]"
        >
            <div className="flex justify-between items-start mb-2 relative z-10">
                <p className="text-xs md:text-sm font-semibold text-slate-800">{title}</p>
                {trendInfo && (
                    <span className={cn("text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full", type === 'good' ? "text-emerald-500 bg-emerald-50" : "text-rose-500 bg-rose-50")}>
                        {trendInfo}
                    </span>
                )}
            </div>

            <div className="relative z-10">
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
                <p className="text-[10px] md:text-[11px] font-medium text-slate-400 mt-1">{subValue}</p>
            </div>

            {/* Sparkline decoration at the bottom */}
            <div className="absolute bottom-0 left-0 right-0 pointer-events-none opacity-40 md:opacity-60 group-hover:opacity-100 transition-opacity">
                {type === 'good' ? <SparklineGreen /> : <SparklineRed />}
            </div>
        </div>
    )
}

export default function DashboardClient({ initialTenants, initialPayments, currentMonth }: any) {
    const [isPending, startTransition] = useTransition()
    const [searchQuery, setSearchQuery] = useState('')

    // State for the new Two-Step Export flow
    const [preparedExport, setPreparedExport] = useState<{ base64: string, fileName: string } | null>(null)
    const [isPreparing, setIsPreparing] = useState(false)

    const totalRentExpected = initialTenants.reduce((acc: number, t: any) => acc + t.monthlyRent, 0)
    const totalWaterExpected = initialTenants.reduce((acc: number, t: any) => acc + t.waterCharges, 0)
    const grandTotalExpected = totalRentExpected + totalWaterExpected

    // useOptimistic to add successful payments instantly to the view
    const [optimisticPayments, addOptimisticPayment] = useOptimistic(
        initialPayments,
        (state, newPayment: any) => [...state, newPayment]
    )

    const totalRentReceived = optimisticPayments.filter((p: any) => p.type === 'RENT').reduce((acc: number, p: any) => acc + p.amount, 0)
    const totalWaterReceived = initialTenants.reduce((acc: number, t: any) => {
        const waterPaid = optimisticPayments.some((p: any) => p.tenantId === t.id && p.type === 'WATER')
        return acc + (waterPaid ? t.waterCharges : 0)
    }, 0)

    const grandTotalReceived = totalRentReceived + totalWaterReceived

    const totalRentPending = totalRentExpected - totalRentReceived
    const totalWaterPending = totalWaterExpected - totalWaterReceived
    const grandTotalPending = grandTotalExpected - grandTotalReceived

    const activeTenantsCount = initialTenants.length
    const unpaidTenantsCount = initialTenants.filter((t: any) => {
        const rentPaid = optimisticPayments.some((p: any) => p.tenantId === t.id && p.type === 'RENT')
        const waterPaid = optimisticPayments.some((p: any) => p.tenantId === t.id && p.type === 'WATER')
        return !rentPaid || !waterPaid
    }).length

    const recoveryRate = grandTotalExpected > 0 ? Math.round((grandTotalReceived / grandTotalExpected) * 100) : 0

    const filteredTenants = initialTenants.filter((t: any) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.offices.some((off: string) => off.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    const handlePrepareExport = async () => {
        setIsPreparing(true)
        try {
            const res = await exportMonthlyLedger()
            setPreparedExport(res)
        } catch (err: any) {
            alert(`Preparation failed: ${err.message}`)
        } finally {
            setIsPreparing(false)
        }
    }

    const handleSaveToDevice = async () => {
        if (!preparedExport) return
        const byteCharacters = window.atob(preparedExport.base64)
        const byteArrays = []
        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512)
            const byteNumbers = new Array(slice.length)
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i)
            }
            const byteArray = new Uint8Array(byteNumbers)
            byteArrays.push(byteArray)
        }
        const blob = new Blob(byteArrays, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

        try {
            // @ts-ignore
            if (window.showSaveFilePicker) {
                const handle = await (window as any).showSaveFilePicker({
                    suggestedName: preparedExport.fileName,
                    types: [{
                        description: 'Excel Workbook',
                        accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] }
                    }]
                })
                const writable = await handle.createWritable()
                await writable.write(blob)
                await writable.close()
                alert("File saved successfully!")
                setPreparedExport(null)
            } else { throw new Error('Picker not supported') }
        } catch (error: any) {
            if (error.name === 'AbortError') return
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = preparedExport.fileName
            document.body.appendChild(link)
            link.click()
            setTimeout(() => {
                document.body.removeChild(link)
                window.URL.revokeObjectURL(url)
            }, 1000)
            setPreparedExport(null)
        }
    }

    return (
        <div
            className="space-y-8 pb-12"
        >
            {/* SaaS Metrics Header */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 relative z-10">
                <StatCard
                    title="Total Expected"
                    value={`Rs. ${grandTotalExpected.toLocaleString()}`}
                    subValue="Monthly Target"
                    trendInfo="↑"
                    type="good"
                />
                <StatCard
                    title="Received"
                    value={`Rs. ${grandTotalReceived.toLocaleString()}`}
                    subValue="Spark Recovery"
                    trendInfo="↑"
                    type="good"
                />
                <StatCard
                    title="Pending"
                    value={`Rs. ${grandTotalPending.toLocaleString()}`}
                    subValue="Spark Pending"
                    trendInfo="↓"
                    type="bad"
                />
                <StatCard
                    title="Occupancy"
                    value={`${Math.min(100, Math.round((activeTenantsCount / 50) * 100))}%`}
                    subValue="50 Units"
                    trendInfo=""
                    type="good"
                />
            </div>

            {/* Actions & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-4 rounded-2xl">
                <div className="relative flex-1 w-full sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Search tenants..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-neutral-100 dark:bg-neutral-800 border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    />
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                    {!preparedExport ? (
                        <button
                            onClick={handlePrepareExport}
                            disabled={isPreparing}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                        >
                            {isPreparing ? <><span className="animate-spin h-3 w-3 border-2 border-emerald-500 border-t-transparent rounded-full" /> Preparing...</> : <><Download size={14} /> Export XL</>}
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 flex-1 sm:flex-none">
                            <button
                                onClick={() => setPreparedExport(null)}
                                className="px-3 py-2 text-rose-500 hover:bg-rose-50 rounded-xl text-[10px] font-bold uppercase transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveToDevice}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20"
                            >
                                <CheckCircle2 size={14} /> Save
                            </button>
                        </div>
                    )}
                    <ThemeToggle />
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
                {/* Enhanced Tenant List Table based on Mockup */}
                <div
                    className="xl:col-span-2 bg-white premium-shadow rounded-[2rem] overflow-hidden"
                >
                    <div className="px-4 md:px-8 py-6 border-b border-neutral-100 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg md:text-xl font-bold tracking-tight text-slate-800">Tenants Overview</h2>
                            <p className="text-[10px] md:text-xs text-slate-400 mt-1">Manage your active tenant accounts and payments.</p>
                        </div>
                    </div>
                    {/* Responsive Table / Card View */}
                    <div className="px-4 pb-4 overflow-x-auto">
                        <table className="w-full text-left hidden sm:table">
                            <thead>
                                <tr>
                                    <th className="px-4 py-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                                    <th className="px-4 py-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Office</th>
                                    <th className="px-4 py-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                    {filteredTenants.map((t: any, index: number) => {
                                        const rentPaid = optimisticPayments.some((p: any) => p.tenantId === t.id && p.type === 'RENT')
                                        const waterPaid = optimisticPayments.some((p: any) => p.tenantId === t.id && p.type === 'WATER')
                                        const isPaid = rentPaid && waterPaid

                                        return (
                                            <tr
                                                key={t.id}
                                                className={cn(
                                                    "hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors group",
                                                    index % 2 === 0 ? "bg-white dark:bg-neutral-900/10" : "bg-neutral-50/10 dark:bg-neutral-800/5"
                                                )}
                                            >
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-xs shrink-0">
                                                            {t.name.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="font-bold text-sm text-slate-800 block truncate">{t.name}</span>
                                                            <span className="text-[10px] text-slate-500 truncate block">Tenant ID: {t.id.substring(0, 8)}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-medium text-slate-700">
                                                        {t.offices.join(', ')}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        {isPaid ? (
                                                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-wider">PAID</span>
                                                        ) : (
                                                            <>
                                                                <span className="px-2.5 py-1 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-full uppercase tracking-wider">PENDING</span>
                                                                {(rentPaid || waterPaid) && <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase tracking-wider">PARTIAL</span>}
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {!rentPaid && (
                                                            <button
                                                                onClick={() => startTransition(async () => {
                                                                    addOptimisticPayment({ tenantId: t.id, amount: t.monthlyRent, month: currentMonth, type: 'RENT', receiptId: 'opt-r-' + t.id })
                                                                    await markAsPaid(t.id, t.monthlyRent, 'RENT')
                                                                })}
                                                                className="px-3 py-1.5 bg-emerald-500 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-600 transition-all uppercase whitespace-nowrap"
                                                            >Pay Rent</button>
                                                        )}
                                                        {!waterPaid && (
                                                            <button
                                                                onClick={() => startTransition(async () => {
                                                                    addOptimisticPayment({ tenantId: t.id, amount: t.waterCharges, month: currentMonth, type: 'WATER', receiptId: 'opt-w-' + t.id })
                                                                    await markAsPaid(t.id, t.waterCharges, 'WATER')
                                                                })}
                                                                className="px-3 py-1.5 bg-blue-500 text-white text-[10px] font-bold rounded-lg hover:bg-blue-600 transition-all uppercase whitespace-nowrap"
                                                            >Pay Water</button>
                                                        )}
                                                        <WhatsAppActionButton tenantId={t.id} amount={t.monthlyRent + t.waterCharges} month={currentMonth} phone={t.phone} isPaid={isPaid} />
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                            </tbody>
                        </table>

                        {/* Mobile Stacked View */}
                        <div className="sm:hidden space-y-4 pt-2">
                            {filteredTenants.map((t: any) => {
                                const rentPaid = optimisticPayments.some((p: any) => p.tenantId === t.id && p.type === 'RENT')
                                const waterPaid = optimisticPayments.some((p: any) => p.tenantId === t.id && p.type === 'WATER')
                                const isPaid = rentPaid && waterPaid

                                return (
                                    <div key={t.id} className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-sm shrink-0">
                                                    {t.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800 text-base">{t.name}</h4>
                                                    <p className="text-xs text-slate-500">Offices: {t.offices.join(', ')}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                {isPaid ? (
                                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase">PAID</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-full uppercase">PENDING</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1 no-scrollbar">
                                            {!rentPaid && (
                                                <button
                                                    onClick={() => startTransition(async () => {
                                                        addOptimisticPayment({ tenantId: t.id, amount: t.monthlyRent, month: currentMonth, type: 'RENT', receiptId: 'opt-r-' + t.id })
                                                        await markAsPaid(t.id, t.monthlyRent, 'RENT')
                                                    })}
                                                    className="flex-1 px-3 py-2 bg-emerald-500 text-white text-[10px] font-bold rounded-xl whitespace-nowrap"
                                                >Pay Rent</button>
                                            )}
                                            {!waterPaid && (
                                                <button
                                                    onClick={() => startTransition(async () => {
                                                        addOptimisticPayment({ tenantId: t.id, amount: t.waterCharges, month: currentMonth, type: 'WATER', receiptId: 'opt-w-' + t.id })
                                                        await markAsPaid(t.id, t.waterCharges, 'WATER')
                                                    })}
                                                    className="flex-1 px-3 py-2 bg-blue-500 text-white text-[10px] font-bold rounded-xl whitespace-nowrap"
                                                >Pay Water</button>
                                            )}
                                            <div className="shrink-0 h-9 w-32">
                                                <WhatsAppActionButton tenantId={t.id} amount={t.monthlyRent + t.waterCharges} month={currentMonth} phone={t.phone} isPaid={isPaid} />
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                    </div>
                </div>

                <div
                    className="bg-white premium-shadow p-6 md:p-8 rounded-[2rem] relative overflow-hidden h-fit"
                >
                    <h2 className="text-xl font-bold mb-6 text-slate-800">Add New Tenant</h2>
                    <form action={addTenant} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[12px] font-medium text-slate-700 ml-1">Name</label>
                            <input name="name" required className="w-full bg-[#F3F4F6] border-none rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-600 font-medium" placeholder="Full Name" />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[12px] font-medium text-slate-700 ml-1">Phone Number</label>
                            <input name="phone" required className="w-full bg-[#F3F4F6] border-none rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-600 font-medium" placeholder="+92 ..." />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12px] font-medium text-slate-700 ml-1">Office Numbers (Comma separated)</label>
                            <input name="offices" required className="w-full bg-[#F3F4F6] border-none rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-600 font-medium" placeholder="A1, A2" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-medium text-slate-700 ml-1">Monthly Rent</label>
                                <input name="monthlyRent" type="number" required className="w-full bg-[#F3F4F6] border-none rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-600 font-medium" placeholder="0" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-medium text-slate-700 ml-1">Water</label>
                                <input name="waterCharges" type="number" defaultValue="500" className="w-full bg-[#F3F4F6] border-none rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-600 font-medium" />
                            </div>
                        </div>

                        <div className="space-y-1.5 mt-2">
                            <label className="text-[12px] font-medium text-slate-700 ml-1">Security Deposit</label>
                            <input name="totalSecurityAmount" type="number" defaultValue="0" className="w-full bg-[#F3F4F6] border-none rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-600 font-medium" placeholder="0" />
                        </div>

                        <input type="hidden" name="startDate" value={new Date().toISOString().split('T')[0]} />

                        <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-500/30 transition-all mt-6 tracking-wide text-sm">
                            Register Tenant
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
