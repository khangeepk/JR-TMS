'use client'

import { useState, useEffect } from 'react'
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
    ShoppingCart,
    X
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useMobileSidebar } from '@/lib/MobileSidebarContext'

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
    const [isMobile, setIsMobile] = useState(false)
    const pathname = usePathname()
    // const { isOpen, setIsOpen, toggle } = useMobileSidebar()
    const isOpen = false
    const setIsOpen = (val: boolean) => {}
    const toggle = () => {}

    // Handle hydration safely
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // Close sidebar on route change on mobile
    useEffect(() => {
        setIsOpen(false)
    }, [pathname, setIsOpen])

    return (
        <>
            <aside
                className={cn(
                    "fixed md:relative flex flex-col h-screen bg-[#1C2434] text-white transition-all duration-300 ease-in-out z-50 md:z-20",
                    !isOpen && "hidden md:flex",
                    isCollapsed ? "w-20" : "w-[260px]"
                )}
            >
                {/* Brand Header */}
                <div className="flex items-center h-20 px-6 overflow-hidden">
                    <div className="flex items-center gap-3 w-full justify-between md:justify-start">
                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 flex items-center justify-center text-emerald-500">
                                <span className="text-3xl font-black tracking-tighter">JR</span>
                            </div>
                            {!isCollapsed && (
                                <span
                                    className="text-lg font-bold tracking-tight whitespace-nowrap text-white"
                                >
                                    JR Arcade <span className="text-emerald-500 font-medium">TMS</span>
                                </span>
                            )}
                        </div>
                        
                        {/* Close button for mobile */}
                        <button 
                            onClick={toggle}
                            className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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
                                    {(!isCollapsed || isMobile) && (
                                        <span className="font-medium text-sm">
                                            {item.label}
                                        </span>
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
                        className="hidden md:flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all font-medium text-sm"
                    >
                        {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                        {!isCollapsed && <span>Collapse Menu</span>}
                    </button>
                    <button className="flex items-center gap-3 w-full px-4 py-3 mt-1 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all font-medium text-sm">
                        <LogOut size={20} />
                        {(!isCollapsed || isMobile) && <span>Logout</span>}
                    </button>
                </div>
            </aside>
        </>
    )
}
