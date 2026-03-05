'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteTenant } from '@/app/dashboard/actions'
import { Trash2, AlertTriangle, X } from 'lucide-react'

export default function DeleteTenantButton({ id, name }: { id: number, name: string }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [showConfirm, setShowConfirm] = useState(false)

    const handleConfirmDelete = () => {
        startTransition(async () => {
            try {
                await deleteTenant(id)
                setShowConfirm(false)
                router.refresh()
            } catch (err: any) {
                alert(`Delete failed: ${err.message}`)
            }
        })
    }

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setShowConfirm(true)}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all uppercase tracking-wider"
            >
                <Trash2 size={14} />
                Delete
            </button>

            {/* Styled Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-2xl w-full max-w-sm relative animate-in fade-in zoom-in duration-200">

                        {/* Close button */}
                        <button
                            onClick={() => setShowConfirm(false)}
                            disabled={isPending}
                            className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors disabled:opacity-40"
                        >
                            <X size={18} />
                        </button>

                        {/* Warning Icon */}
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-500/10 flex items-center justify-center">
                                <AlertTriangle size={28} className="text-rose-500" />
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
                                    Delete Tenant?
                                </h3>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                    Are you sure you want to delete{' '}
                                    <span className="font-bold text-neutral-800 dark:text-neutral-200">
                                        {name}
                                    </span>
                                    ? All their payment records and security installments will also be permanently removed.
                                </p>
                                <p className="text-xs font-bold text-rose-500 mt-3 uppercase tracking-wider">
                                    This action cannot be undone.
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 w-full mt-2">
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    disabled={isPending}
                                    className="flex-1 px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
                                    disabled={isPending}
                                    className="flex-1 px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-rose-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isPending ? (
                                        <>
                                            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                            </svg>
                                            Removing...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 size={13} />
                                            Delete Permanently
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
