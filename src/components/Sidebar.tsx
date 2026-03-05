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
            className="relative flex flex-col h-screen bg-card border-r border-border transition-all duration-300 ease-in-out glass"
        >
            {/* Brand Header */}
            <div className="flex items-center h-20 px-6 overflow-hidden">
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                        <Building2 size={24} />
                    </div>
                    <AnimatePresence>
                        {!isCollapsed && (
                            <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="text-lg font-bold tracking-tight whitespace-nowrap"
                            >
                                JR Arcade <span className="text-emerald-500">TMS</span>
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
                                    "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative",
                                    isActive
                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                        : "text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-foreground"
                                )}
                            >
                                <item.icon size={22} className={cn("flex-shrink-0", isActive ? "text-emerald-600 dark:text-emerald-400" : "group-hover:scale-110 transition-transform")} />
                                {!isCollapsed && (
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="font-medium text-sm"
                                    >
                                        {item.label}
                                    </motion.span>
                                )}
                                {isActive && (
                                    <motion.div
                                        layoutId="active-pill"
                                        className="absolute left-0 w-1 h-6 bg-emerald-500 rounded-r-full"
                                    />
                                )}
                            </div>
                        </Link>
                    )
                })}
            </nav>

            {/* Footer / Toggle */}
            <div className="p-3 border-t border-border">
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all font-medium text-sm"
                >
                    {isCollapsed ? <ChevronRight size={22} /> : <ChevronLeft size={22} />}
                    {!isCollapsed && <span>Collapse Menu</span>}
                </button>
                <button className="flex items-center gap-3 w-full px-3 py-3 mt-1 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all font-medium text-sm">
                    <LogOut size={22} />
                    {!isCollapsed && <span>Logout</span>}
                </button>
            </div>
        </motion.aside>
    )
}
