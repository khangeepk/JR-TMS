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

// Sub-component for individual Stat Cards
function StatCard({ title, value, subValue, icon: Icon, colorClass, trend }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 rounded-2xl flex items-center gap-5 group hover:scale-[1.02] transition-all duration-300"
        >
            <div className={cn("p-4 rounded-xl shadow-lg", colorClass)}>
                <Icon size={24} className="text-white" />
            </div>
            <div className="flex-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{title}</p>
                <div className="flex items-end gap-2 mt-1">
                    <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
                    {trend && (
                        <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-0.5 pb-1">
                            <TrendingUp size={10} /> {trend}
                        </span>
                    )}
                </div>
                <p className="text-[10px] font-medium text-muted-foreground/60 mt-0.5">{subValue}</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Revenue"
                    value={`Rs. ${grandTotalReceived.toLocaleString()}`}
                    subValue={`Target: Rs. ${grandTotalExpected.toLocaleString()}`}
                    icon={CreditCard}
                    colorClass="bg-blue-600 shadow-blue-500/20"
                    trend="+12%"
                />
                <StatCard
                    title="Recovery Progress"
                    value={`${recoveryRate}%`}
                    subValue={`${grandTotalReceived.toLocaleString()} of ${grandTotalExpected.toLocaleString()}`}
                    icon={TrendingUp}
                    colorClass="bg-emerald-600 shadow-emerald-500/20"
                />
                <StatCard
                    title="Active Tenants"
                    value={activeTenantsCount}
                    subValue="Total rented spaces"
                    icon={Users}
                    colorClass="bg-violet-600 shadow-violet-500/20"
                />
                <StatCard
                    title="Pending Alerts"
                    value={unpaidTenantsCount}
                    subValue="Unpaid after 5th"
                    icon={AlertCircle}
                    colorClass="bg-rose-500 shadow-rose-500/20"
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
                {/* Enhanced Tenant List Table */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="xl:col-span-2 glass-card rounded-2xl overflow-hidden"
                >
                    <div className="px-6 py-5 border-b border-border flex items-center justify-between">
                        <h2 className="text-xl font-bold tracking-tight">Active Tenants</h2>
                        <span className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{filteredTenants.length} Found</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-950/20">
                                    <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Tenant</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Offices</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] text-right">Rent</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] text-right">Water</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] text-center">Action</th>
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
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-sm">{t.name}</span>
                                                            {isPaid && <CheckCircle2 size={14} className="text-emerald-500" />}
                                                        </div>
                                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                                                            Since {new Date(t.startDate).toLocaleDateString()}
                                                        </span>
                                                        {/* Security Deposit Progress Widget */}
                                                        <SecurityInstallmentButton tenant={t} />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <div className="flex flex-wrap gap-1">
                                                        {t.offices.map((off: string) => (
                                                            <span key={off} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-muted-foreground border border-border uppercase">
                                                                {off}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-sm font-bold">Rs. {t.monthlyRent.toLocaleString()}</span>
                                                        <span className={cn("text-[9px] font-black uppercase tracking-tighter", rentPaid ? "text-emerald-500" : "text-rose-500")}>
                                                            {rentPaid ? 'Paid' : 'Unpaid'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-sm font-bold">Rs. {t.waterCharges.toLocaleString()}</span>
                                                        <span className={cn("text-[9px] font-black uppercase tracking-tighter", waterPaid ? "text-emerald-500" : "text-rose-500")}>
                                                            {waterPaid ? 'Paid' : 'Unpaid'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap text-center">
                                                    <div className="flex items-center justify-center gap-4">
                                                        {/* Integrated Actions with context Menu feel */}
                                                        <div className="flex items-center gap-2">
                                                            {!rentPaid && (
                                                                <button
                                                                    onClick={() => startTransition(async () => {
                                                                        addOptimisticPayment({ tenantId: t.id, amount: t.monthlyRent, month: currentMonth, type: 'RENT', receiptId: 'opt' })
                                                                        await markAsPaid(t.id, t.monthlyRent, 'RENT')
                                                                    })}
                                                                    className="px-2 py-1 bg-emerald-500/10 text-emerald-600 text-[10px] font-bold rounded-lg hover:bg-emerald-500 hover:text-white transition-all uppercase"
                                                                >Pay Rent</button>
                                                            )}
                                                            {!waterPaid && (
                                                                <button
                                                                    onClick={() => startTransition(async () => {
                                                                        addOptimisticPayment({ tenantId: t.id, amount: t.waterCharges, month: currentMonth, type: 'WATER', receiptId: 'opt' })
                                                                        await markAsPaid(t.id, t.waterCharges, 'WATER')
                                                                    })}
                                                                    className="px-2 py-1 bg-blue-500/10 text-blue-600 text-[10px] font-bold rounded-lg hover:bg-blue-500 hover:text-white transition-all uppercase"
                                                                >Pay Water</button>
                                                            )}
                                                            <WhatsAppActionButton tenantId={t.id} amount={t.monthlyRent + t.waterCharges} month={currentMonth} phone={t.phone} isPaid={isPaid} />
                                                        </div>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        )
                                    })}
                                </AnimatePresence>
                                {filteredTenants.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center gap-2 opacity-50">
                                                <Users size={48} className="mb-2" />
                                                <p className="text-sm font-medium">No tenants match your search.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* SaaS Side Panel (Add Tenant) */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass-card p-6 rounded-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                        <Plus size={120} />
                    </div>
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Plus className="text-emerald-500" /> Register Tenant
                    </h2>
                    <form action={addTenant} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1">Full Name</label>
                            <input name="name" required className="w-full bg-neutral-100 dark:bg-neutral-800/50 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium" placeholder="E.g. Hassan Ahmed" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1">Office No.</label>
                                <input name="offices" required className="w-full bg-neutral-100 dark:bg-neutral-800/50 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium" placeholder="G-10" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1">Monthly Rent</label>
                                <input name="monthlyRent" type="number" required className="w-full bg-neutral-100 dark:bg-neutral-800/50 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium" placeholder="25000" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1">Phone</label>
                                <input name="phone" required className="w-full bg-neutral-100 dark:bg-neutral-800/50 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium" placeholder="+92 3..." />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1">Water Charges</label>
                                <input name="waterCharges" type="number" defaultValue="500" className="w-full bg-neutral-100 dark:bg-neutral-800/50 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1">Start Date</label>
                            <input name="startDate" type="date" required className="w-full bg-neutral-100 dark:bg-neutral-800/50 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium [color-scheme:light] dark:[color-scheme:dark]" />
                        </div>

                        {/* Security Deposit Section */}
                        <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5 space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-4 bg-amber-500 rounded-full" />
                                <label className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-[0.2em]">Security Deposit</label>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] ml-1">Total Security Amount</label>
                                <input
                                    name="totalSecurityAmount"
                                    type="number"
                                    defaultValue="0"
                                    min="0"
                                    className="w-full bg-white dark:bg-neutral-800 border border-amber-200 dark:border-amber-500/20 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-500/30 transition-all font-medium"
                                    placeholder="E.g. 50000"
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground">Set to 0 if no security deposit is required. You can collect installments after registration.</p>
                        </div>
                        <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-600/20 transition-all mt-4 uppercase tracking-[0.2em] text-[10px]">
                            Establish Occupancy
                        </button>
                    </form>
                </motion.div>
            </div>
        </motion.div>
    )
}
