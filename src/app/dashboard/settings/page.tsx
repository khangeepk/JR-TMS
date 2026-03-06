import prisma from '@/lib/prisma'
import { Settings, Building2, Phone, Mail, MapPin, CheckCircle2, Shield, UserPlus, Trash2 } from 'lucide-react'
import { savePropertyInfo, createUser, deleteUser } from '@/app/dashboard/actions'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
    const session = await getServerSession(authOptions)
    const isAdmin = session?.user?.isAdmin

    // Fetch or create default PropertyInfo (singleton id=1)
    const info = await prisma.propertyInfo.upsert({
        where: { id: 1 },
        update: {},
        create: { id: 1, propertyName: 'JR Arcade', phone: '', email: '', address: '' }
    })

    // Fetch all users if admin
    const users = isAdmin ? await prisma.user.findMany({ orderBy: { createdAt: 'asc' } }) : []

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Settings className="text-emerald-500" size={24} />
                    Settings
                </h1>
                <p className="text-sm text-muted-foreground mt-1">Manage your property information</p>
            </div>

            {/* Property Info Card — now wired to savePropertyInfo server action */}
            <div className="bg-white premium-shadow rounded-[2rem] p-6 lg:p-8 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-1 h-6 bg-emerald-500 rounded-full" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">Property Information</h2>
                </div>

                <form action={savePropertyInfo} className="space-y-4">
                    {[
                        { label: 'Property Name', name: 'propertyName', value: info.propertyName, icon: Building2, placeholder: 'JR Arcade' },
                        { label: 'Contact Phone', name: 'phone', value: info.phone, icon: Phone, placeholder: '+92 3XX XXXXXXX' },
                        { label: 'Email', name: 'email', value: info.email, icon: Mail, placeholder: 'management@jrarcade.com' },
                        { label: 'Address', name: 'address', value: info.address, icon: MapPin, placeholder: 'JR Arcade, Pakistan' },
                    ].map(item => (
                        <div key={item.name} className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1.5 ml-2">
                                <item.icon size={11} />
                                {item.label}
                            </label>
                            <input
                                name={item.name}
                                defaultValue={item.value}
                                placeholder={item.placeholder}
                                className="w-full bg-[#F3F4F6] border-none rounded-full px-5 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium placeholder:text-slate-400"
                            />
                        </div>
                    ))}

                    <button
                        type="submit"
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-full text-[11px] uppercase tracking-[0.2em] transition-all shadow-lg shadow-emerald-500/30 mt-4 flex items-center justify-center gap-2"
                    >
                        <CheckCircle2 size={16} />
                        Save Changes
                    </button>
                </form>
            </div>

            {/* Saved Info Display */}
            <div className="bg-white premium-shadow rounded-[2rem] p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-6 bg-emerald-400 rounded-full" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">Currently Saved</h2>
                </div>
                <div className="space-y-2 text-sm">
                    {[
                        { label: 'Property', value: info.propertyName },
                        { label: 'Phone', value: info.phone || '—' },
                        { label: 'Email', value: info.email || '—' },
                        { label: 'Address', value: info.address || '—' },
                    ].map(row => (
                        <div key={row.label} className="flex justify-between items-center py-3 border-b border-neutral-100 last:border-0">
                            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{row.label}</span>
                            <span className="font-bold text-sm text-slate-800">{row.value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* App Info */}
            <div className="bg-white premium-shadow rounded-[2rem] p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-6 bg-slate-300 rounded-full" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">App Info</h2>
                </div>
                <div className="space-y-2 text-sm">
                    {[
                        { label: 'App Name', value: 'JR Arcade TMS' },
                        { label: 'Version', value: 'v2.0.0' },
                        { label: 'Built With', value: 'Next.js · Prisma · PostgreSQL' },
                    ].map(row => (
                        <div key={row.label} className="flex justify-between items-center py-3 border-b border-neutral-100 last:border-0">
                            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{row.label}</span>
                            <span className="font-bold text-sm text-slate-800">{row.value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* User Management (Admin Only) */}
            {isAdmin && (
                <div className="bg-white premium-shadow rounded-[2rem] p-6 lg:p-8 relative">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-1 h-6 bg-blue-500 rounded-full" />
                        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                            <Shield size={16} className="text-blue-500" /> User Management
                        </h2>
                    </div>

                    {/* Existing Users */}
                    <div className="space-y-4 mb-8">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-2">System Users</h3>
                        <div className="rounded-2xl border border-neutral-100 overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-neutral-50/50">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold text-slate-500">User</th>
                                        <th className="px-4 py-3 font-semibold text-slate-500">Role</th>
                                        <th className="px-4 py-3 font-semibold text-slate-500">Rights</th>
                                        <th className="px-4 py-3 font-semibold text-slate-500 text-right">Delete</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {users.map(u => (
                                        <tr key={u.id}>
                                            <td className="px-4 py-3 font-medium text-slate-800 flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                                                    {u.username.substring(0, 2).toUpperCase()}
                                                </div>
                                                {u.name} <span className="text-xs text-slate-400">({u.username})</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {u.isAdmin ? <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase">Admin</span> : <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-[10px] font-bold rounded-full uppercase">User</span>}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-1">
                                                    {u.canAdd && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[9px] rounded-md font-bold">ADD</span>}
                                                    {u.canEdit && <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[9px] rounded-md font-bold">EDIT</span>}
                                                    {u.canDelete && <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 text-[9px] rounded-md font-bold">DEL</span>}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {u.username !== 'admin' && (
                                                    <form action={deleteUser.bind(null, u.id)}>
                                                        <button className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </form>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Add New User */}
                    <div className="pt-6 border-t border-neutral-100">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-2 mb-4">Create New Account</h3>
                        <form action={createUser} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <input name="name" required placeholder="Full Name" className="w-full bg-[#F3F4F6] border-none rounded-full px-5 py-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/50" />
                                <input name="username" required placeholder="Username" className="w-full bg-[#F3F4F6] border-none rounded-full px-5 py-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/50" />
                                <input name="password" required type="password" placeholder="Password" className="w-full bg-[#F3F4F6] border-none rounded-full px-5 py-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/50" />
                            </div>

                            <div className="flex flex-wrap gap-4 px-2">
                                <label className="flex items-center gap-2 text-sm text-slate-700 font-medium cursor-pointer">
                                    <input type="checkbox" name="isAdmin" className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                                    Administrator
                                </label>
                                <label className="flex items-center gap-2 text-sm text-slate-700 font-medium cursor-pointer">
                                    <input type="checkbox" name="canAdd" className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" defaultChecked />
                                    Can Create/Add
                                </label>
                                <label className="flex items-center gap-2 text-sm text-slate-700 font-medium cursor-pointer">
                                    <input type="checkbox" name="canEdit" className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" defaultChecked />
                                    Can Edit
                                </label>
                                <label className="flex items-center gap-2 text-sm text-slate-700 font-medium cursor-pointer">
                                    <input type="checkbox" name="canDelete" className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                                    Can Delete
                                </label>
                            </div>

                            <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3.5 rounded-full text-[11px] uppercase tracking-[0.2em] transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2">
                                <UserPlus size={16} /> Create User
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
