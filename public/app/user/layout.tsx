import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut, Home, ReceiptText } from "lucide-react";

export default async function UserLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return null;
    }

    if (session.user.role !== "TENANT") {
        redirect("/admin/dashboard");
    }

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-slate-50/50">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 px-4 py-6 flex flex-col gap-6 text-slate-300">
                <div className="flex items-center gap-2 px-2 text-white">
                    <div className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-xl">JR</span>
                    </div>
                    <span className="text-xl font-semibold tracking-tight">Tenant Portal</span>
                </div>

                <nav className="flex-1 space-y-1">
                    <Link href="/user/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition-colors">
                        <Home className="h-5 w-5" />
                        <span className="font-medium">My Dashboard</span>
                    </Link>
                </nav>

                <div className="mt-auto px-3 border-t border-slate-800 pt-4">
                    <div className="flex items-center gap-3 py-3 text-sm">
                        <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-white">
                            {session.user.name?.[0].toUpperCase() || "U"}
                        </div>
                        <div className="flex-1 truncate">
                            <p className="font-medium text-white truncate text-base">{session.user.name}</p>
                            <p className="truncate text-slate-400">Tenant Account</p>
                        </div>
                    </div>
                    <Link href="/api/auth/signout" className="flex items-center gap-2 mt-2 text-red-400 hover:text-red-300 transition-colors font-medium">
                        <LogOut className="h-4 w-4" /> Sign Out
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-8 shrink-0 overflow-y-auto w-full max-w-[100vw] md:max-w-none bg-slate-50">
                {children}
            </main>
        </div>
    );
}
