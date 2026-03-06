'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Lock, User as UserIcon } from 'lucide-react'

export default function LoginPage() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        const result = await signIn('credentials', {
            username,
            password,
            redirect: false,
        })

        if (result?.error) {
            setError(result.error)
            setIsLoading(false)
        } else {
            router.push('/dashboard')
            router.refresh()
        }
    }

    return (
        <div className="min-h-screen bg-[#F1F5F9] dark:bg-[#0B1120] flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-[#1C2434] premium-shadow rounded-[2rem] p-8 lg:p-12 relative overflow-hidden">
                {/* Decorative header */}
                <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />

                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4 text-emerald-600">
                        <Building2 size={32} />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Access Portal</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Please sign in to manage JR Arcade</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 text-[13px] font-bold rounded-xl text-center">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1.5">
                            <UserIcon size={12} /> Username
                        </label>
                        <input
                            type="text"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="e.g. admin"
                            className="w-full bg-[#F3F4F6] border-none rounded-full px-5 py-3.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-800 font-medium placeholder:text-slate-400 transition-all"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1.5">
                            <Lock size={12} /> Password
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-[#F3F4F6] border-none rounded-full px-5 py-3.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-800 font-medium placeholder:text-slate-400 transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold py-4 rounded-full text-[13px] uppercase tracking-[0.2em] transition-all shadow-lg shadow-emerald-500/30 mt-4 disabled:opacity-70"
                    >
                        {isLoading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>
            </div>

            <div className="mt-8 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                JR Arcade Management System
            </div>
        </div>
    )
}
