'use client'

import { useState, useTransition } from 'react'
import { addExpense, deleteExpense } from '@/app/dashboard/actions'
import { ShoppingCart, Plus, Trash2, X, CheckCircle2, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

const CATEGORIES = ['Utility Bills', 'Maintenance & Repairing', 'Misc Charges']

const CATEGORY_COLORS: Record<string, string> = {
    'Utility Bills': 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    'Maintenance & Repairing': 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    'Misc Charges': 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
}

export default function ExpensesClient({ initialExpenses }: { initialExpenses: any[] }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [expenses, setExpenses] = useState(initialExpenses)
    const [error, setError] = useState<string | null>(null)
    const [toast, setToast] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<number | null>(null)

    const showToast = (msg: string) => {
        setToast(msg)
        setTimeout(() => setToast(null), 3000)
    }

    const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)
        const form = e.currentTarget
        const formData = new FormData(form)

        // Optimistic UI: add immediately
        const optimistic = {
            id: Date.now(),
            category: formData.get('category') as string,
            description: formData.get('description') as string,
            amount: parseFloat(formData.get('amount') as string),
            date: formData.get('date') ? new Date(formData.get('date') as string) : new Date(),
            _optimistic: true
        }
        setExpenses(prev => [optimistic, ...prev])
        form.reset()

        startTransition(async () => {
            try {
                await addExpense(formData)
                router.refresh()
                showToast('Expense added successfully!')
            } catch (err: any) {
                setExpenses(prev => prev.filter(e => e.id !== optimistic.id))
                setError(err.message)
            }
        })
    }

    const handleDelete = (id: number) => {
        setDeletingId(id)
        const prev = [...expenses]
        setExpenses(exp => exp.filter(e => e.id !== id))
        startTransition(async () => {
            try {
                await deleteExpense(id)
                router.refresh()
                showToast('Expense deleted.')
            } catch (err: any) {
                setExpenses(prev)
                setError(err.message)
            } finally {
                setDeletingId(null)
            }
        })
    }

    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0)

    return (
        <div className="space-y-6">
            {/* Toast */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-[200] flex items-center gap-3 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl shadow-emerald-600/30 animate-in slide-in-from-bottom-4 fade-in duration-300">
                    <CheckCircle2 size={18} />
                    <span className="text-sm font-bold">{toast}</span>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <ShoppingCart className="text-rose-500" size={24} />
                        Expenses
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Track all property expenses</p>
                </div>
                <div className="glass-card px-5 py-3 rounded-2xl">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Total Expenses</p>
                    <p className="text-xl font-bold text-rose-500">Rs. {totalExpenses.toLocaleString()}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
                {/* Add Expense Form */}
                <div className="glass-card p-6 rounded-2xl">
                    <div className="flex items-center gap-2 mb-5">
                        <div className="w-1 h-6 bg-rose-500 rounded-full" />
                        <h2 className="text-sm font-bold uppercase tracking-wider">Add New Expense</h2>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
                            <AlertCircle size={14} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleAdd} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Category</label>
                            <select
                                name="category"
                                required
                                className="w-full bg-neutral-100 dark:bg-neutral-800/50 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 transition-all font-medium appearance-none"
                            >
                                <option value="">Select Category...</option>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Description</label>
                            <input
                                name="description"
                                required
                                placeholder="E.g. Electricity bill for Feb"
                                className="w-full bg-neutral-100 dark:bg-neutral-800/50 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 transition-all font-medium"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Amount (Rs.)</label>
                                <input
                                    name="amount"
                                    type="number"
                                    min="1"
                                    required
                                    placeholder="5000"
                                    className="w-full bg-neutral-100 dark:bg-neutral-800/50 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 transition-all font-medium"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Date</label>
                                <input
                                    name="date"
                                    type="date"
                                    defaultValue={new Date().toISOString().split('T')[0]}
                                    className="w-full bg-neutral-100 dark:bg-neutral-800/50 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 transition-all font-medium [color-scheme:light] dark:[color-scheme:dark]"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full bg-rose-600 hover:bg-rose-500 active:scale-[0.98] disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg shadow-rose-600/20 transition-all uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2"
                        >
                            <Plus size={14} />
                            {isPending ? 'Recording...' : 'Record Expense'}
                        </button>
                    </form>
                </div>

                {/* Expenses Table */}
                <div className="xl:col-span-2 glass-card rounded-2xl overflow-hidden">
                    <div className="px-6 py-5 border-b border-border flex items-center justify-between">
                        <h2 className="text-sm font-bold uppercase tracking-wider">All Expenses</h2>
                        <span className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            {expenses.length} Records
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-950/20">
                                    <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Date</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Category</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Description</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] text-right">Amount</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {expenses.map((exp, index) => (
                                    <tr
                                        key={exp.id}
                                        className={`hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-neutral-900/10' : 'bg-neutral-50/10'} ${exp._optimistic ? 'opacity-60' : ''}`}
                                    >
                                        <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">
                                            {new Date(exp.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${CATEGORY_COLORS[exp.category] || 'bg-neutral-100 text-neutral-600'}`}>
                                                {exp.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium">{exp.description}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-right text-rose-500">
                                            Rs. {exp.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handleDelete(exp.id)}
                                                disabled={exp._optimistic || deletingId === exp.id}
                                                className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all disabled:opacity-30"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {expenses.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground text-sm">
                                            No expenses recorded yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            {expenses.length > 0 && (
                                <tfoot>
                                    <tr className="bg-neutral-50 dark:bg-neutral-900/50">
                                        <td colSpan={3} className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-muted-foreground">Total</td>
                                        <td className="px-6 py-4 text-right font-black text-rose-500">Rs. {totalExpenses.toLocaleString()}</td>
                                        <td />
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
