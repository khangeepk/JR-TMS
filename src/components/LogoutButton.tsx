'use client'
import { LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'

export default function LogoutButton() {
    return (
        <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-slate-400 hover:text-rose-500 transition-colors p-1"
            title="Sign Out"
        >
            <LogOut size={16} />
        </button>
    )
}
