'use client'

import { useState, useTransition, useOptimistic, startTransition } from 'react'
import { addTenant, markAsPaid, exportMonthlyLedger } from '@/app/dashboard/actions'
import WhatsAppActionButton from '@/components/WhatsAppActionButton'
import SecurityInstallmentButton from '@/components/SecurityInstallmentButton'
import { ThemeToggle } from '@/components/ThemeToggle'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
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
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white premium-shadow rounded-2xl p-6 flex flex-col justify-between overflow-hidden relative group hover:-translate-y-1 transition-transform duration-300"
        >
            <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-semibold text-slate-800">{title}</p>
                {trendInfo && (
                    <span className={cn("text-xs font-bold", type === 'good' ? "text-emerald-500" : "text-rose-500")}>
                        {trendInfo}
                    </span>
                )}
            </div>

            <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
                <p className="text-[11px] font-medium text-slate-400 mt-1">{subValue}</p>
            </div>

            {/* Sparkline decoration at the bottom */}
            <div className="absolute bottom-0 left-0 right-0 pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity">
                {type === 'good' ? <SparklineGreen /> : <SparklineRed />}
            </div>
        </motion.div>
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
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8 pb-12"
        >
            {/* SaaS Metrics Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                <StatCard
                    title="Total Expected Card"
                    value={`Rs. ${grandTotalExpected.toLocaleString()}`}
                    subValue="Positive trend"
                    trendInfo="↑"
                    type="good"
                />
                <StatCard
                    title="Total Received Card"
                    value={`Rs. ${grandTotalReceived.toLocaleString()}`}
                    subValue="Spark Recovery"
                    trendInfo="↑"
                    type="good"
                />
                <StatCard
                    title="Total Pending Card"
                    value={`Rs. ${grandTotalPending.toLocaleString()}`}
                    subValue="Spark Pending"
                    trendInfo="↓"
                    type="bad"
                />
                <StatCard
                    title="Occupancy Rate"
                    value={`${Math.min(100, Math.round((activeTenantsCount / 50) * 100))}%`}
                    subValue="Based on 50 units"
                    trendInfo=""
                    type="good"
                />
            </div>

            {/* Actions & Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-4 rounded-2xl">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Search tenants or office numbers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-neutral-100 dark:bg-neutral-800 border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    />
                </div>
                <div className="flex items-center gap-3">
                    {!preparedExport ? (
                        <button
                            onClick={handlePrepareExport}
                            disabled={isPreparing}
                            className="flex items-center gap-2 px-5 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                        >
                            {isPreparing ? <><svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">...</svg> Preparing...</> : <><Download size={14} /> Export XL</>}
                        </button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPreparedExport(null)}
                                className="px-3 py-2 text-rose-500 hover:bg-rose-50 rounded-xl text-[10px] font-bold uppercase transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveToDevice}
                                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20"
                            >
                                <CheckCircle2 size={14} /> Save to Device
                            </button>
                        </div>
                    )}
                    <ThemeToggle />
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
                {/* Enhanced Tenant List Table based on Mockup */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="xl:col-span-2 bg-white premium-shadow rounded-[2rem] overflow-hidden"
                >
                    <div className="px-8 py-6 border-b border-neutral-100 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-slate-800">Tenants Overview</h2>
                            <p className="text-xs text-slate-400 mt-1">Clean UI, No internal borders, Increased vertical padding.</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto px-4 pb-4">
                        <table className="w-full text-left">
                            <thead>
                                <tr>
                                    <th className="px-4 py-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                                    <th className="px-4 py-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Office</th>
                                    <th className="px-4 py-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status Pill Badges</th>
                                    <th className="px-4 py-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                <AnimatePresence mode="popLayout">
                                    {filteredTenants.map((t: any, index: number) => {
                                        const rentPaid = optimisticPayments.some((p: any) => p.tenantId === t.id && p.type === 'RENT')
                                        const waterPaid = optimisticPayments.some((p: any) => p.tenantId === t.id && p.type === 'WATER')
                                        const isPaid = rentPaid && waterPaid

                                        return (
                                            <motion.tr
                                                layout
                                                key={t.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className={cn(
                                                    "hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors group",
                                                    index % 2 === 0 ? "bg-white dark:bg-neutral-900/10" : "bg-neutral-50/10 dark:bg-neutral-800/5"
                                                )}
                                            >
                                                <td className="px-4 py-4">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-xs">
                                                                {t.name.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <span className="font-bold text-sm text-slate-800 block">{t.name}</span>
                                                                <span className="text-xs text-slate-500">{t.name}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <div className="flex flex-wrap gap-1">
                                                        <span className="text-sm font-medium text-slate-700">
                                                            {t.offices.join(', ')}
                                                        </span>
                                                    </div>
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
                                                        {!isPaid && (
                                                            <button
                                                                onClick={() => startTransition(async () => {
                                                                    if (!rentPaid) {
                                                                        addOptimisticPayment({ tenantId: t.id, amount: t.monthlyRent, month: currentMonth, type: 'RENT', receiptId: 'opt' })
                                                                        await markAsPaid(t.id, t.monthlyRent, 'RENT')
                                                                    }
                                                                    if (!waterPaid) {
                                                                        addOptimisticPayment({ tenantId: t.id, amount: t.waterCharges, month: currentMonth, type: 'WATER', receiptId: 'opt2' })
                                                                        await markAsPaid(t.id, t.waterCharges, 'WATER')
                                                                    }
                                                                })}
                                                                className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-all uppercase"
                                                            >Pay</button>
                                                        )}
                                                        <WhatsAppActionButton tenantId={t.id} amount={t.monthlyRent + t.waterCharges} month={currentMonth} phone={t.phone} isPaid={isPaid} />
                                                        <button className="p-1 text-slate-400 hover:text-slate-600">
                                                            <MoreVertical size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        )
                                    })}
                                </AnimatePresence>
                                {filteredTenants.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                            No tenants match your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* SaaS Side Panel (Add Tenant) heavily styled based on mockup */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white premium-shadow p-8 rounded-[2rem] relative overflow-hidden h-fit"
                >
                    <h2 className="text-xl font-bold mb-6 text-slate-800">Add New Tenant</h2>
                    <form action={addTenant} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[12px] font-medium text-slate-700 ml-1">Name</label>
                            <input name="name" required className="w-full bg-[#F3F4F6] border-none rounded-full px-6 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-600 font-medium" placeholder="First Name" />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[12px] font-medium text-slate-700 ml-1">Email / Phone</label>
                            <input name="phone" required className="w-full bg-[#F3F4F6] border-none rounded-full px-6 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-600 font-medium" placeholder="Modern Input" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12px] font-medium text-slate-700 ml-1">Inputs / Office Num</label>
                            <input name="offices" required className="w-full bg-[#F3F4F6] border-none rounded-full px-6 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-600 font-medium" placeholder="Indent Inputs" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-medium text-slate-700 ml-1">Accounts (Rent)</label>
                                <input name="monthlyRent" type="number" required className="w-full bg-[#F3F4F6] border-none rounded-full px-6 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-600 font-medium" placeholder="Enter amount" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-medium text-slate-700 ml-1">Water</label>
                                <input name="waterCharges" type="number" defaultValue="500" className="w-full bg-[#F3F4F6] border-none rounded-full px-6 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-600 font-medium" />
                            </div>
                        </div>

                        <div className="space-y-1.5 mt-2">
                            <label className="text-[12px] font-medium text-slate-700 ml-1">Total Security</label>
                            <input name="totalSecurityAmount" type="number" defaultValue="0" className="w-full bg-[#F3F4F6] border-none rounded-full px-6 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-600 font-medium" placeholder="Amount" />
                        </div>

                        {/* Hidden start date to preserve backend logic */}
                        <input type="hidden" name="startDate" value={new Date().toISOString().split('T')[0]} />

                        <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-full shadow-lg shadow-emerald-500/30 transition-all mt-6 tracking-wide text-sm">
                            Action
                        </button>
                    </form>
                </motion.div>
            </div>
        </motion.div>
    )
}
