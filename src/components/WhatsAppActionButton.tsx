'use client'

import { useState, useTransition } from 'react'
import { sendReceiptWhatsApp, sendManualReminder } from '@/app/dashboard/actions'
import { MessageCircle, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
    tenantId: number
    phone: string
    isPaid: boolean
    amount: number
    month: string
}

export default function WhatsAppActionButton({ tenantId, phone, isPaid, amount, month }: Props) {
    const [isPending, startTransition] = useTransition()
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

    if (!phone || phone.length < 10) return null

    const handleAction = () => {
        setStatus('idle')
        startTransition(async () => {
            try {
                let res;
                if (isPaid) {
                    res = await sendReceiptWhatsApp(tenantId, amount, month, 'RENT')
                } else {
                    res = await sendManualReminder(tenantId, month, 'RENT')
                }

                if (res?.fallbackUrl) {
                    window.open(res.fallbackUrl, '_blank')
                }

                setStatus('success')
                setTimeout(() => setStatus('idle'), 3000)
            } catch (err) {
                setStatus('error')
                setTimeout(() => setStatus('idle'), 3000)
            }
        })
    }

    return (
        <button
            onClick={handleAction}
            disabled={isPending}
            title="Send Manual WhatsApp Message"
            className={cn(
                "p-2 rounded-full transition-all duration-300 disabled:opacity-50",
                "text-emerald-600 bg-emerald-50 hover:bg-emerald-100 shadow-sm"
            )}
        >
            {isPending ? (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : status === 'success' ? (
                <CheckCircle2 size={16} />
            ) : status === 'error' ? (
                <AlertCircle size={16} className="text-rose-500" />
            ) : (
                <MessageCircle size={16} />
            )}
        </button>
    )
}
