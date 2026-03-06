'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateTenant } from '@/app/dashboard/actions'
import { Pencil, X, CheckCircle2 } from 'lucide-react'

type Tenant = {
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
}

// Helper: convert any date value to yyyy-MM-dd for <input type="date">
function toDateInputValue(date: Date | string): string {
    try {
        return new Date(date).toISOString().split('T')[0]
    } catch {
        return ''
    }
}

export default function EditTenantModal({ tenant }: { tenant: Tenant }) {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [showSuccess, setShowSuccess] = useState(false)

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)
        const formData = new FormData(e.currentTarget)

        const total = parseFloat(formData.get('totalSecurityAmount') as string || "0")
        const paid = parseFloat(formData.get('securityPaidSoFar') as string || "0")

        if (paid > total) {
            setError("Paid Security cannot be more than Total Security.")
            return
        }

        startTransition(async () => {
            try {
                await updateTenant(formData)
                setIsOpen(false)
                setShowSuccess(true)
                router.refresh()
                setTimeout(() => setShowSuccess(false), 3000)
            } catch (err: any) {
                setError(err.message)
            }
        })
    }

    return (
        <>
            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed bottom-6 right-6 z-[200] flex items-center gap-3 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl shadow-emerald-600/30 animate-in slide-in-from-bottom-4 fade-in duration-300">
                    <CheckCircle2 size={18} />
                    <span className="text-sm font-bold">Tenant details updated successfully!</span>
                </div>
            )}

            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all uppercase tracking-wider"
            >
                <Pencil size={14} />
                Edit
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-2xl w-full max-w-md relative animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                        <h2 className="text-xl font-bold mb-6 text-neutral-900 dark:text-white flex items-center gap-2">
                            <div className="w-1 h-6 bg-emerald-500 rounded-full" />
                            Edit Tenant: {tenant.name}
                        </h2>

                        {error && (
                            <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <input type="hidden" name="id" value={tenant.id} />

                            {/* Full Name */}
                            <div>
                                <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.2em] mb-1.5 block">Full Name</label>
                                <input
                                    name="name"
                                    defaultValue={tenant.name}
                                    required
                                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Offices */}
                                <div>
                                    <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.2em] mb-1.5 block">Offices</label>
                                    <input
                                        name="offices"
                                        defaultValue={tenant.offices.join(', ')}
                                        required
                                        className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                                    />
                                </div>
                                {/* Monthly Rent */}
                                <div>
                                    <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.2em] mb-1.5 block">Monthly Rent</label>
                                    <input
                                        name="monthlyRent"
                                        type="number"
                                        defaultValue={tenant.monthlyRent}
                                        required
                                        className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Phone */}
                                <div>
                                    <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.2em] mb-1.5 block">Phone</label>
                                    <input
                                        name="phone"
                                        defaultValue={tenant.phone}
                                        required
                                        className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                                    />
                                </div>
                                {/* Water Charges */}
                                <div>
                                    <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.2em] mb-1.5 block">Water Charges</label>
                                    <input
                                        name="waterCharges"
                                        type="number"
                                        defaultValue={tenant.waterCharges}
                                        required
                                        className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Total Security */}
                                <div>
                                    <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.2em] mb-1.5 block">Total Security</label>
                                    <input
                                        name="totalSecurityAmount"
                                        type="number"
                                        defaultValue={tenant.totalSecurityAmount}
                                        required
                                        className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                                    />
                                </div>
                                {/* Paid Security Amount */}
                                <div>
                                    <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.2em] mb-1.5 block">Enter Paid Security Amount</label>
                                    <input
                                        name="securityPaidSoFar"
                                        type="number"
                                        defaultValue={tenant.securityPaidSoFar}
                                        required
                                        className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 items-end">
                                {/* Start Date */}
                                <div>
                                    <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.2em] mb-1.5 block">Start Date</label>
                                    <input
                                        name="startDate"
                                        type="date"
                                        defaultValue={toDateInputValue(tenant.startDate)}
                                        required
                                        className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium [color-scheme:light] dark:[color-scheme:dark]"
                                    />
                                </div>
                                {/* Shared Space */}
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 h-[42px]">
                                    <input
                                        type="checkbox"
                                        name="isShared"
                                        id={`isShared-${tenant.id}`}
                                        defaultChecked={tenant.isShared}
                                        className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                                    />
                                    <label
                                        htmlFor={`isShared-${tenant.id}`}
                                        className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider cursor-pointer select-none"
                                    >
                                        Shared Space
                                    </label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isPending}
                                className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all mt-4 uppercase tracking-[0.2em] text-[10px]"
                            >
                                {isPending ? 'Syncing...' : 'UPDATE RECORDS (V2)'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
