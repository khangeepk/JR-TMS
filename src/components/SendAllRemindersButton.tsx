'use client'

import { useState, useTransition } from 'react'
import { sendRemindersToAllUnpaid } from '@/app/dashboard/actions'

export default function SendAllRemindersButton() {
    const [isPending, startTransition] = useTransition()
    const [resultMsg, setResultMsg] = useState<string | null>(null)

    const handleSendAll = () => {
        setResultMsg(null)
        // confirm before sending mass messages
        if (!confirm('Are you sure you want to send a WhatsApp reminder to ALL unpaid tenants?')) return;

        startTransition(async () => {
            try {
                const res = await sendRemindersToAllUnpaid()
                setResultMsg(res.message)
                setTimeout(() => setResultMsg(null), 5000)
            } catch (err: any) {
                setResultMsg(err.message || 'Failed to send reminders')
                setTimeout(() => setResultMsg(null), 5000)
            }
        })
    }

    return (
        <div className="flex items-center gap-3">
            {resultMsg && (
                <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
                    {resultMsg}
                </span>
            )}
            <button
                onClick={handleSendAll}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-bold text-neutral-900 dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all rounded-xl shadow-sm dark:shadow-none disabled:opacity-50 uppercase tracking-widest active:scale-[0.98]"
            >
                {isPending ? (
                    <svg className="animate-spin h-4 w-4 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /><path d="M14.05 2a9 9 0 0 1 8 7.94" /><path d="M14.05 6A5 5 0 0 1 18 10" /></svg>
                )}
                Mass Reminder
            </button>
        </div>
    )
}
