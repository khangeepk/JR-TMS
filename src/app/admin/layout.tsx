import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut, LayoutDashboard, Users, BookOpen } from "lucide-react";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session) {
        // If not signed in, show nothing layout-wise, page will handle redirect or popup
        return null;
    }

    if (session.user.role !== "ADMIN") {
        redirect("/user/dashboard");
    }

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-slate-50/50" suppressHydrationWarning>
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-white border-r border-slate-200 px-4 py-6 flex flex-col gap-6" suppressHydrationWarning>
                <div className="flex items-center gap-2 px-2" suppressHydrationWarning>
                    <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-xl">JR</span>
                    </div>
                    <span className="text-xl font-semibold tracking-tight text-slate-900">Arcade</span>
                </div>

                <nav className="flex-1 space-y-1">
                    <Link href="/admin/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors">
                        <LayoutDashboard className="h-5 w-5" />
                        <span className="font-medium">Dashboard</span>
                    </Link>
                    <Link href="/admin/tenants" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors">
                        <Users className="h-5 w-5" />
                        <span className="font-medium">Tenants</span>
                    </Link>
                    <Link href="/admin/ledger" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors">
                        <BookOpen className="h-5 w-5" />
                        <span className="font-medium">Daily Ledger</span>
                    </Link>
                </nav>

                <div className="mt-auto px-3">
                    <div className="flex items-center gap-3 py-3 text-sm text-slate-500">
                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">A</div>
                        <div className="flex-1 truncate">
                            <p className="font-medium text-slate-900 truncate">Admin User</p>
                            <p className="truncate">admin@jrarcade.com</p>
                        </div>
                    </div>
                    <Link href="/api/auth/signout" className="flex items-center gap-2 mt-2 text-red-600 hover:text-red-700 transition-colors font-medium">
                        <LogOut className="h-4 w-4" /> Sign Out
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-8 shrink-0 overflow-y-auto w-full max-w-[100vw] md:max-w-none">
                {children}
            </main>
        </div>
    );
}
