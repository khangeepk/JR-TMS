'use client'

import { Search, Bell, Menu } from 'lucide-react'
import { useSession } from 'next-auth/react'
import LogoutButton from './LogoutButton'
import { useMobileSidebar } from '@/lib/MobileSidebarContext'

export default function Header() {
    const { data: session } = useSession()
    const { toggle } = useMobileSidebar()

    // Get initials. Default to "AD" for admin if name is missing
    const username = session?.user?.name || 'Admin'
    const initials = username.substring(0, 2).toUpperCase()

    return (
        <header className="flex items-center justify-between h-16 md:h-20 px-4 md:px-8 bg-[#F1F5F9] border-b border-neutral-200/50 md:border-none flex-shrink-0">
            {/* Left side: Hamburger (Mobile Only) and Page Title */}
            <div className="flex items-center gap-4">
                <button
                    onClick={toggle}
                    className="p-2 -ml-2 md:hidden text-slate-600 hover:bg-white rounded-lg transition-colors"
                    aria-label="Toggle Menu"
                >
                    <Menu size={24} />
                </button>
            </div>

            {/* Right side: Search, Notifications, Profile */}
            <div className="flex items-center gap-2 md:gap-4 ml-auto">
                {/* Search Bar - hidden on very small screens */}
                <div className="relative hidden sm:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <input
                        type="text"
                        placeholder="Search"
                        style={{ width: undefined }}
                        className="w-32 md:w-64 pl-10 pr-4 py-2 bg-white rounded-full text-sm outline-none border border-transparent focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm"
                    />
                </div>

                {/* Mobile Search Icon */}
                <button className="p-2 sm:hidden text-muted-foreground hover:text-foreground">
                    <Search size={18} />
                </button>

                {/* Notification Bell */}
                <button className="relative p-2 md:p-2.5 bg-white rounded-full text-muted-foreground hover:text-foreground shadow-sm transition-colors border border-neutral-100">
                    <Bell size={18} />
                    <span className="absolute top-2 right-2.5 w-1.5 h-1.5 md:w-2 md:h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                </button>

                {/* Profile Badge */}
                <div className="flex items-center gap-1 md:gap-2 bg-white p-1 rounded-full shadow-sm border border-neutral-100">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {initials}
                    </div>
                    <div className="hidden sm:flex pr-2 items-center">
                        <LogoutButton />
                    </div>
                </div>
            </div>
        </header>
    )
}
