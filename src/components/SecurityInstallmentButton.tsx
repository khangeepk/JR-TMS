'use client'

import { useState, useOptimistic, useTransition } from 'react'
import { collectSecurityInstallment } from '@/app/dashboard/actions'
import { ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
    tenant: {
        id: number
        name: string
        totalSecurityAmount?: number | null
        securityPaidSoFar?: number | null
        securityStatus?: string | null
        offices: string[]
    }
}

export default function SecurityInstallmentButton({ tenant }: Props) {
    const [isPending, startTransition] = useTransition()
    const [amount, setAmount] = useState('')
    const [showInput, setShowInput] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Safe defaults — handles the case where Prisma client hasn't regenerated yet
    const totalSecurity = tenant.totalSecurityAmount ?? 0
    const paidSoFarBase = tenant.securityPaidSoFar ?? 0
    const statusBase = tenant.securityStatus ?? 'Pending'

    const [optimisticSecurity, updateOptimisticSecurity] = useOptimistic(
        {
            paidSoFar: paidSoFarBase,
            status: statusBase,
            remaining: Math.max(0, totalSecurity - paidSoFarBase)
        },
        (state, newPaid: number) => {
            const newPaidSoFar = state.paidSoFar + newPaid
            const newRemaining = Math.max(0, totalSecurity - newPaidSoFar)
            return {
                paidSoFar: newPaidSoFar,
                remaining: newRemaining,
                status: newRemaining <= 0 ? 'Fully Paid' : 'Partial'
            }
        }
    )

    // Don't render if no security deposit was set
    if (!totalSecurity || totalSecurity <= 0) return null

    const progressPercent = Math.min(100, Math.round((optimisticSecurity.paidSoFar / totalSecurity) * 100))
    const isFullyPaid = optimisticSecurity.status === 'Fully Paid'

    const handleCollect = () => {
        const parsed = parseFloat(amount)
        if (isNaN(parsed) || parsed <= 0) {
            setError('Please enter a valid amount.')
            return
        }
        if (parsed > optimisticSecurity.remaining) {
            setError(`Cannot exceed remaining Rs. ${optimisticSecurity.remaining.toLocaleString()}`)
            return
        }
        setError(null)

        startTransition(async () => {
            updateOptimisticSecurity(parsed)
            setShowInput(false)
            setAmount('')
            try {
                const res = await collectSecurityInstallment(tenant.id, parsed)
                if (res?.fallbackUrl) window.open(res.fallbackUrl, '_blank')
            } catch (err: any) {
                setError(err.message)
            }
        })
    }

    return (
        <div className="mt-3 space-y-2.5 min-w-[180px]">
            {/* Security Label Row */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    {isFullyPaid
                        ? <ShieldCheck size={13} className="text-emerald-500" />
                        : <ShieldAlert size={13} className="text-amber-500" />
                    }
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Security
                    </span>
                </div>
                <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md",
                    isFullyPaid
                        ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : optimisticSecurity.status === 'Partial'
                            ? "bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                            : "bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400"
                )}>
                    {optimisticSecurity.status}
                </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
                <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div
                        className={cn(
                            "h-full rounded-full transition-all duration-700",
                            isFullyPaid ? "bg-emerald-500" : "bg-amber-500"
                        )}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[9px] text-muted-foreground font-medium">
                        Rs. {optimisticSecurity.paidSoFar.toLocaleString()} / {totalSecurity.toLocaleString()}
                    </span>
                    <span className="text-[9px] font-bold text-muted-foreground">{progressPercent}%</span>
                </div>
            </div>

            {/* Collect Button / Input */}
            {!isFullyPaid && (
                <>
                    {!showInput ? (
                        <button
                            onClick={() => setShowInput(true)}
                            disabled={isPending}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-bold rounded-lg hover:bg-amber-500 hover:text-white transition-all uppercase tracking-wider"
                        >
                            {isPending ? <Loader2 size={12} className="animate-spin" /> : null}
                            + Collect Installment
                        </button>
                    ) : (
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder={`Max: ${optimisticSecurity.remaining.toLocaleString()}`}
                                    className="flex-1 bg-neutral-100 dark:bg-neutral-800 border-none rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-amber-500/30 font-medium"
                                    autoFocus
                                />
                                <button
                                    onClick={handleCollect}
                                    className="px-3 py-2 bg-amber-500 text-white text-xs font-bold rounded-lg hover:bg-amber-400 transition-all"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => { setShowInput(false); setError(null); setAmount('') }}
                                    className="px-2 py-2 text-muted-foreground text-xs font-bold rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
                                >
                                    ✕
                                </button>
                            </div>
                            {error && <p className="text-[10px] text-rose-500 font-semibold">{error}</p>}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
