import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen bg-[#1C2434] text-foreground overflow-x-hidden md:overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col bg-[#F1F5F9] md:rounded-l-[2.5rem] overflow-hidden shadow-2xl z-10 min-w-0">
                <Header />
                <main className="flex-1 overflow-y-auto relative p-4 md:p-8">
                    <div className="max-w-[1600px] mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
