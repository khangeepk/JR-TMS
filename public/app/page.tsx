export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  let session = null;
  let errorMsg = null;

  try {
    session = await getServerSession(authOptions);
  } catch (error: any) {
    errorMsg = error?.message || error?.toString() || "Unknown error";
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 text-red-900 p-8">
        <div>
          <h1 className="text-2xl font-bold mb-4">Server Error Detected</h1>
          <pre className="bg-red-100 p-4 rounded text-sm overflow-auto max-w-2xl">{errorMsg}</pre>
          <p className="mt-4 text-sm opacity-80">(Please share this with the AI assistant)</p>
        </div>
      </div>
    );
  }

  if (session?.user?.role === "ADMIN") {
    redirect("/admin/dashboard");
  }

  if (session?.user?.role === "TENANT") {
    redirect("/user/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-xl bg-blue-600 flex items-center justify-center animate-pulse shadow-lg shadow-blue-500/30">
          <span className="text-white font-bold text-2xl tracking-tighter">JR</span>
        </div>
        <p className="text-slate-500 font-medium">Please sign in to continue</p>
      </div>
    </div>
  );
}
