import { Search, Bell } from 'lucide-react'

export default function Header() {
    return (
        <header className="flex items-center justify-between h-20 px-4 md:px-8 bg-[#F1F5F9]">
            {/* Left side: Page Title (Dynamic mapping conceptually, handled in layout usually, but we'll place it here or keep it simple) */}
            <div className="flex-1">
                {/* The page titles are rendered within the pages themselves in JR TMS, so the header left side can be empty or have a breadcrumb */}
            </div>

            {/* Right side: Search, Notifications, Profile */}
            <div className="flex items-center gap-4">
                {/* Search Bar */}
                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <input
                        type="text"
                        placeholder="Search"
                        className="w-64 pl-10 pr-4 py-2 bg-white rounded-full text-sm outline-none border border-transparent focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm"
                    />
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                        <Search className="text-white" size={12} />
                    </div>
                </div>

                {/* Notification Bell */}
                <button className="relative p-2.5 bg-white rounded-full text-muted-foreground hover:text-foreground shadow-sm transition-colors">
                    <Bell size={18} />
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                </button>

                {/* Profile Badges */}
                <div className="flex items-center gap-2 bg-white p-1 rounded-full shadow-sm border border-neutral-100">
                    <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
                        SK
                    </div>
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                        SK
                    </div>
                    <div className="pr-2">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="m6 9 6 6 6-6" /></svg>
                    </div>
                </div>
            </div>
        </header>
    )
}
