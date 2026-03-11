import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { MobileSidebarProvider } from '@/lib/MobileSidebarContext'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <MobileSidebarProvider>
            <div className="flex h-screen bg-[#F1F5F9] overflow-hidden w-full max-w-[100vw]">
                <Sidebar />
                <div className="flex flex-col flex-1 overflow-hidden relative min-w-0">
                    <Header />
                    <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8">
                        {children}
                    </main>
                </div>
            </div>
        </MobileSidebarProvider>
    )
}
