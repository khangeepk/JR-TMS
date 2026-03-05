import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto relative p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
                {/* Footer */}
                <div className="max-w-7xl mx-auto pt-8 pb-4 mt-8 border-t border-border">
                    <p className="text-center text-[11px] text-muted-foreground/50 font-medium tracking-widest uppercase">
                        Software designed by{' '}
                        <span className="text-emerald-500 font-bold">SamiKhan</span>
                    </p>
                </div>
            </main>
        </div>
    )
}
