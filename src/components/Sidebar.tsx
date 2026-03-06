'use client'

import { useState } from 'react'
import {
    LayoutDashboard,
    Users,
    Receipt,
    BarChart3,
    Settings,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Building2,
    ShoppingCart
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Users, label: 'Tenants', href: '/dashboard/tenants' },
    { icon: Receipt, label: 'Ledger', href: '/dashboard/ledger' },
    { icon: ShoppingCart, label: 'Expenses', href: '/dashboard/expenses' },
    { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
    { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
]

export default function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const pathname = usePathname()

    return (
        <motion.aside
            initial={false}
            animate={{ width: isCollapsed ? 80 : 260 }}
            className="relative flex flex-col h-screen bg-[#1C2434] text-white transition-all duration-300 ease-in-out z-20"
        >
            {/* Brand Header */}
            <div className="flex items-center h-20 px-6 overflow-hidden">
                <div className="flex items-center gap-3 w-full justify-center md:justify-start">
                    <div className="flex-shrink-0 flex items-center justify-center text-emerald-500">
                        {/* Custom JR typography logo based on mockup */}
                        <span className="text-3xl font-black tracking-tighter">JR</span>
                    </div>
                    <AnimatePresence>
                        {!isCollapsed && (
                            <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="text-lg font-bold tracking-tight whitespace-nowrap text-white"
                            >
                                <span className="opacity-0 w-0 hidden md:inline-block">JR</span> Arcade <span className="text-emerald-500 font-medium">TMS</span>
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link key={item.label} href={item.href}>
                            <div
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative my-1",
                                    isActive
                                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                )}
                            >
                                <item.icon size={20} className={cn("flex-shrink-0", isActive ? "text-white" : "group-hover:text-emerald-400 transition-colors")} />
                                {!isCollapsed && (
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="font-medium text-sm"
                                    >
                                        {item.label}
                                    </motion.span>
                                )}
                            </div>
                        </Link>
                    )
                })}
            </nav>

            {/* Footer / Toggle */}
            <div className="p-4 border-t border-slate-700/50">
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all font-medium text-sm"
                >
                    {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                    {!isCollapsed && <span>Collapse Menu</span>}
                </button>
                <button className="flex items-center gap-3 w-full px-4 py-3 mt-1 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all font-medium text-sm">
                    <LogOut size={20} />
                    {!isCollapsed && <span>Logout</span>}
                </button>
            </div>
        </motion.aside>
    )
}
