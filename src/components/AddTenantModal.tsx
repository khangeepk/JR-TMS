'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addTenant } from '@/app/dashboard/actions'
import { Plus, X, CheckCircle2, UserPlus, Building2, Phone, DollarSign, CalendarDays, Droplets, ShieldCheck, Users } from 'lucide-react'

export default function AddTenantModal() {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [showSuccess, setShowSuccess] = useState(false)

    const openModal = () => {
        setError(null)
        setIsOpen(true)
    }

    const closeModal = () => {
        setError(null)
        setIsOpen(false)
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)
        const formData = new FormData(e.currentTarget)

        startTransition(async () => {
            try {
                await addTenant(formData)
                closeModal()
                setShowSuccess(true)
                router.refresh()
                setTimeout(() => setShowSuccess(false), 3500)
            } catch (err: any) {
                setError(err.message || 'An unexpected error occurred.')
            }
        })
    }

    return (
        <>
            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed bottom-6 right-6 z-[300] flex items-center gap-3 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl shadow-emerald-600/30 animate-in slide-in-from-bottom-4 fade-in duration-300">
                    <CheckCircle2 size={18} />
                    <span className="text-sm font-bold">New tenant added successfully!</span>
                </div>
            )}

            {/* Trigger Button */}
            <button
                id="add-tenant-btn"
                onClick={openModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.97] text-white text-xs font-bold rounded-xl uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/20"
            >
                <Plus size={14} />
                Add New Tenant
            </button>

            {/* Modal Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                    style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
                    onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
                >
                    <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl">
                                    <UserPlus size={18} className="text-emerald-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add New Tenant</h2>
                                    <p className="text-[11px] text-slate-400 dark:text-neutral-500 font-medium">Fill in tenant details below</p>
                                </div>
                            </div>
                            <button
                                onClick={closeModal}
                                aria-label="Close modal"
                                className="p-2 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Scrollable Form Body */}
                        <div className="overflow-y-auto max-h-[70vh] px-6 py-5">
                            {error && (
                                <div className="mb-5 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-sm font-medium flex items-start gap-2">
                                    <span className="mt-0.5 shrink-0">⚠️</span>
                                    <span>{error}</span>
                                </div>
                            )}

                            <form id="add-tenant-form" onSubmit={handleSubmit} className="space-y-4">

                                {/* Full Name */}
                                <div>
                                    <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-[0.18em] mb-1.5">
                                        <Users size={10} /> Full Name
                                    </label>
                                    <input
                                        id="tenant-name"
                                        name="name"
                                        type="text"
                                        required
                                        placeholder="e.g. Ali Hassan"
                                        className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-medium"
                                    />
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-[0.18em] mb-1.5">
                                        <Phone size={10} /> Phone Number
                                    </label>
                                    <input
                                        id="tenant-phone"
                                        name="phone"
                                        type="tel"
                                        required
                                        placeholder="e.g. 03001234567"
                                        className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-medium"
                                    />
                                </div>

                                {/* Offices + Monthly Rent */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-[0.18em] mb-1.5">
                                            <Building2 size={10} /> Offices
                                        </label>
                                        <input
                                            id="tenant-offices"
                                            name="offices"
                                            type="text"
                                            required
                                            placeholder="e.g. A1, A2"
                                            className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-[0.18em] mb-1.5">
                                            <DollarSign size={10} /> Monthly Rent (Rs.)
                                        </label>
                                        <input
                                            id="tenant-monthly-rent"
                                            name="monthlyRent"
                                            type="number"
                                            min="0"
                                            required
                                            placeholder="e.g. 15000"
                                            className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-medium"
                                        />
                                    </div>
                                </div>

                                {/* Water Charges + Start Date */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-[0.18em] mb-1.5">
                                            <Droplets size={10} /> Water Charges (Rs.)
                                        </label>
                                        <input
                                            id="tenant-water-charges"
                                            name="waterCharges"
                                            type="number"
                                            min="0"
                                            defaultValue={0}
                                            placeholder="0"
                                            className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-[0.18em] mb-1.5">
                                            <CalendarDays size={10} /> Start Date
                                        </label>
                                        <input
                                            id="tenant-start-date"
                                            name="startDate"
                                            type="date"
                                            required
                                            className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-medium [color-scheme:light] dark:[color-scheme:dark]"
                                        />
                                    </div>
                                </div>

                                {/* Security Deposit */}
                                <div>
                                    <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-[0.18em] mb-1.5">
                                        <ShieldCheck size={10} /> Total Security Deposit (Rs.)
                                    </label>
                                    <input
                                        id="tenant-security-deposit"
                                        name="totalSecurityAmount"
                                        type="number"
                                        min="0"
                                        defaultValue={0}
                                        placeholder="0"
                                        className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all font-medium"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1 pl-1">Initial paid security is Rs. 0. Use the Security Installment feature to record payments.</p>
                                </div>

                                {/* Shared Space Checkbox */}
                                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                                    <input
                                        id="tenant-is-shared"
                                        type="checkbox"
                                        name="isShared"
                                        className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                                    />
                                    <label htmlFor="tenant-is-shared" className="cursor-pointer select-none">
                                        <span className="block text-[11px] font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider">Shared Space</span>
                                        <span className="block text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">Allow multiple tenants to occupy the same office(s)</span>
                                    </label>
                                </div>
                            </form>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 pb-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex gap-3">
                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={isPending}
                                className="flex-1 py-3 border border-neutral-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-300 text-xs font-bold rounded-xl uppercase tracking-wider hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="add-tenant-form"
                                disabled={isPending}
                                className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-60 text-white text-xs font-bold rounded-xl uppercase tracking-wider shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                            >
                                {isPending ? (
                                    <>
                                        <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full" />
                                        Adding Tenant...
                                    </>
                                ) : (
                                    <>
                                        <Plus size={14} />
                                        Add Tenant & Sync Ledger
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
