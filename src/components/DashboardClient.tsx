'use client'

import { useState, useTransition } from 'react'
import {
    Users, Building2, TrendingUp, TrendingDown, CheckCircle2, XCircle,
    MessageCircle, Plus, LayoutDashboard, AlertTriangle, CreditCard
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { markAsPaid } from '@/app/dashboard/actions'
import { useRouter } from 'next/navigation'
import WhatsAppActionButton from './WhatsAppActionButton'
import SecurityInstallmentButton from './SecurityInstallmentButton'
import WhatsAppConfigModal from './WhatsAppConfigModal'
import { Webhook } from 'lucide-react'

interface Tenant {
    id: number
    name: string
    phone: string
    monthlyRent: number
    waterCharges: number
    offices: string[]
    isShared: boolean
    startDate: Date | string
    totalSecurityAmount: number
    securityPaidSoFar: number
    securityStatus: string
    rentStatus?: string
    waterStatus?: string
}

interface Payment {
    id: number
    tenantId: number
    month: string
    type: string
    amount: number
}

interface Props {
    initialTenants: Tenant[]
    initialPayments: Payment[]
    currentMonth: string
}

export default function DashboardClient({ initialTenants, initialPayments, currentMonth }: Props) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [toast, setToast] = useState<string | null>(null)
    const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false)

    const showToast = (msg: string) => {
        setToast(msg)
        setTimeout(() => setToast(null), 3000)
    }

    const handleRentPaid = (tenantId: number, amount: number) => {
        startTransition(async () => {
            try {
                await markAsPaid(tenantId, amount, 'RENT')
                router.refresh()
                showToast('Rent payment recorded!')
            } catch (e: any) {
                showToast('Error: ' + e.message)
            }
        })
    }

    const handleWaterPaid = (tenantId: number, amount: number) => {
        startTransition(async () => {
            try {
                await markAsPaid(tenantId, amount, 'WATER')
                router.refresh()
                showToast('Water payment recorded!')
            } catch (e: any) {
                showToast('Error: ' + e.message)
            }
        })
    }

    // ── Derived metrics ───────────────────────────────────────────────────────
    const rentPaidIds = new Set(initialPayments.filter(p => p.type === 'RENT').map(p => p.tenantId))
    const waterPaidIds = new Set(initialPayments.filter(p => p.type === 'WATER').map(p => p.tenantId))

    const totalExpectedRent = initialTenants.reduce((a, t) => a + t.monthlyRent, 0)
    const totalCollectedRent = initialTenants.filter(t => rentPaidIds.has(t.id)).reduce((a, t) => a + t.monthlyRent, 0)
    const totalCollectedWater = initialTenants.filter(t => waterPaidIds.has(t.id)).reduce((a, t) => a + t.waterCharges, 0)
    const totalCollected = totalCollectedRent + totalCollectedWater
    const pendingCount = initialTenants.filter(t => !rentPaidIds.has(t.id)).length
    const paidCount = initialTenants.filter(t => rentPaidIds.has(t.id)).length

    const statCards = [
        {
            label: 'Total Tenants',
            value: initialTenants.length,
            icon: Users,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            border: 'border-blue-500',
            suffix: ''
        },
        {
            label: 'Collected This Month',
            value: totalCollected,
            icon: TrendingUp,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            border: 'border-emerald-500',
            suffix: 'Rs. ',
            prefix: true
        },
        {
            label: 'Rent Pending',
            value: pendingCount,
            icon: AlertTriangle,
            color: 'text-rose-600',
            bg: 'bg-rose-50',
            border: 'border-rose-500',
            suffix: pendingCount === 1 ? ' tenant' : ' tenants'
        },
        {
            label: 'Rent Paid',
            value: paidCount,
            icon: CheckCircle2,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            border: 'border-emerald-400',
            suffix: paidCount === 1 ? ' tenant' : ' tenants'
        },
    ]

    return (
        <div className="space-y-6">
            {/* Toast */}
            {toast && (
                <div className="fixed bottom-6 right-4 left-4 sm:left-auto sm:right-6 z-[200] flex items-center gap-3 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl shadow-emerald-600/30">
                    <CheckCircle2 size={18} />
                    <span className="text-sm font-bold">{toast}</span>
                </div>
            )}

            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <LayoutDashboard className="text-emerald-500" size={24} />
                        Dashboard
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Overview for <span className="font-semibold text-slate-700">{currentMonth}</span></p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => setIsWhatsAppModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 active:scale-[0.97] text-xs font-bold rounded-xl uppercase tracking-wider transition-all shadow-sm w-fit group"
                    >
                        <Webhook size={14} className="group-hover:animate-spin-slow" />
                        Configure Global WhatsApp Settings
                    </button>
                    <Link
                        href="/dashboard/tenants"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.97] text-white text-xs font-bold rounded-xl uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/20 w-fit"
                    >
                        <Users size={14} />
                        Manage Tenants
                    </Link>
                </div>
            </div>

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statCards.map((card) => (
                    <div key={card.label} className={`bg-white premium-shadow rounded-2xl p-5 border-l-4 ${card.border} relative`}>
                        {/* Active Indicator for Rent Pending */}
                        {card.label === 'Rent Pending' && (
                            <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100" title="Automated Reminders Active">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Active</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] leading-tight pr-12">{card.label}</p>
                            <div className={`p-2 ${card.bg} rounded-xl`}>
                                <card.icon size={16} className={card.color} />
                            </div>
                        </div>
                        <p className={`text-2xl font-black ${card.color}`}>
                            {card.prefix ? `Rs. ${card.value.toLocaleString()}` : `${card.value}${card.suffix}`}
                        </p>
                    </div>
                ))}
            </div>

            {/* ── Month Summary Bar ── */}
            <div className="bg-white premium-shadow rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Collection Progress</span>
                        <span className="text-xs font-bold text-emerald-600">
                            Rs. {totalCollectedRent.toLocaleString()} / {totalExpectedRent.toLocaleString()}
                        </span>
                    </div>
                    <div className="h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                            style={{ width: totalExpectedRent > 0 ? `${Math.min(100, Math.round((totalCollectedRent / totalExpectedRent) * 100))}%` : '0%' }}
                        />
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Rent</p>
                        <p className="font-black text-emerald-600">Rs. {totalCollectedRent.toLocaleString()}</p>
                    </div>
                    <div className="w-px h-8 bg-neutral-200 hidden sm:block" />
                    <div className="text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Water</p>
                        <p className="font-black text-blue-600">Rs. {totalCollectedWater.toLocaleString()}</p>
                    </div>
                    <div className="w-px h-8 bg-neutral-200 hidden sm:block" />
                    <div className="text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Total</p>
                        <p className="font-black text-slate-800">Rs. {totalCollected.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* ── Tenant Payment Status Table ── */}
            <div className="bg-white premium-shadow rounded-[2rem] overflow-hidden text-slate-800">
                <div className="px-5 py-5 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                        Tenant Payments — {currentMonth}
                    </h2>
                    <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full uppercase tracking-wider">
                            <CheckCircle2 size={11} />
                            {paidCount} Paid
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-700 text-[10px] font-black rounded-full uppercase tracking-wider">
                            <XCircle size={11} />
                            {pendingCount} Pending
                        </span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[700px]">
                        <thead>
                            <tr className="border-b border-neutral-100 bg-neutral-50/50">
                                <th className="px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tenant</th>
                                <th className="px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Office</th>
                                <th className="px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Rent</th>
                                <th className="px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Rent Status</th>
                                <th className="px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Water</th>
                                <th className="px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Water Status</th>
                                <th className="px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">WA</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-50">
                            {initialTenants.map((tenant) => {
                                const isRentPaid = rentPaidIds.has(tenant.id)
                                const isWaterPaid = waterPaidIds.has(tenant.id)

                                return (
                                    <tr key={tenant.id} className="hover:bg-neutral-50/60 transition-colors group">
                                        <td className="px-5 py-4">
                                            <div>
                                                <span className="font-bold text-sm text-slate-800 block">{tenant.name}</span>
                                                <span className="text-[10px] text-muted-foreground">{tenant.phone}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {tenant.offices.map((off) => (
                                                    <span key={off} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-100 text-slate-500 border border-neutral-200 uppercase">{off}</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-sm font-bold text-right whitespace-nowrap">
                                            Rs. {tenant.monthlyRent.toLocaleString()}
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            {isRentPaid ? (
                                                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-[9px] font-black uppercase">
                                                    <CheckCircle2 size={11} /> Paid
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleRentPaid(tenant.id, tenant.monthlyRent)}
                                                    disabled={isPending}
                                                    className="inline-flex items-center gap-1 bg-rose-100 hover:bg-rose-500 text-rose-700 hover:text-white px-2.5 py-1 rounded-full text-[9px] font-black uppercase transition-all disabled:opacity-50"
                                                >
                                                    <CreditCard size={11} /> Mark Paid
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-sm font-bold text-right text-blue-600 whitespace-nowrap">
                                            Rs. {tenant.waterCharges.toLocaleString()}
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            {tenant.waterCharges === 0 ? (
                                                <span className="text-[9px] text-slate-300 font-bold uppercase">N/A</span>
                                            ) : isWaterPaid ? (
                                                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-[9px] font-black uppercase">
                                                    <CheckCircle2 size={11} /> Paid
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleWaterPaid(tenant.id, tenant.waterCharges)}
                                                    disabled={isPending}
                                                    className="inline-flex items-center gap-1 bg-blue-100 hover:bg-blue-500 text-blue-700 hover:text-white px-2.5 py-1 rounded-full text-[9px] font-black uppercase transition-all disabled:opacity-50"
                                                >
                                                    <CreditCard size={11} /> Mark Paid
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <WhatsAppActionButton
                                                tenantId={tenant.id}
                                                phone={tenant.phone}
                                                isPaid={isRentPaid}
                                                amount={tenant.monthlyRent}
                                                month={currentMonth}
                                            />
                                        </td>
                                    </tr>
                                )
                            })}
                            {initialTenants.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center text-muted-foreground text-sm">
                                        No tenants registered yet.{' '}
                                        <Link href="/dashboard/tenants" className="text-emerald-600 font-bold hover:underline">Add one →</Link>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Quick Actions ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link href="/dashboard/ledger" className="flex items-center gap-4 bg-white premium-shadow rounded-2xl p-5 hover:shadow-md transition-all group">
                    <div className="p-3 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition-colors">
                        <TrendingUp size={20} className="text-emerald-600" />
                    </div>
                    <div>
                        <p className="font-bold text-sm text-slate-800">Financial Ledger</p>
                        <p className="text-[11px] text-muted-foreground">View income vs expenses</p>
                    </div>
                </Link>
                <Link href="/dashboard/expenses" className="flex items-center gap-4 bg-white premium-shadow rounded-2xl p-5 hover:shadow-md transition-all group">
                    <div className="p-3 bg-rose-50 rounded-xl group-hover:bg-rose-100 transition-colors">
                        <TrendingDown size={20} className="text-rose-500" />
                    </div>
                    <div>
                        <p className="font-bold text-sm text-slate-800">Add Expense</p>
                        <p className="text-[11px] text-muted-foreground">Record bills & maintenance</p>
                    </div>
                </Link>
                <Link href="/dashboard/tenants" className="flex items-center gap-4 bg-white premium-shadow rounded-2xl p-5 hover:shadow-md transition-all group">
                    <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                        <Building2 size={20} className="text-blue-600" />
                    </div>
                    <div>
                        <p className="font-bold text-sm text-slate-800">Manage Tenants</p>
                        <p className="text-[11px] text-muted-foreground">Edit tenant profiles</p>
                    </div>
                </Link>
            </div>

            {/* WhatsApp Configuration Modal */}
            <WhatsAppConfigModal 
                isOpen={isWhatsAppModalOpen} 
                onClose={() => setIsWhatsAppModalOpen(false)} 
            />
        </div>
    )
}
