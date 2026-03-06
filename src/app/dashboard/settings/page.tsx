import prisma from '@/lib/prisma'
import { Settings, Building2, Phone, Mail, MapPin, CheckCircle2 } from 'lucide-react'
import { savePropertyInfo } from '@/app/dashboard/actions'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
    // Fetch or create default PropertyInfo (singleton id=1)
    const info = await prisma.propertyInfo.upsert({
        where: { id: 1 },
        update: {},
        create: { id: 1, propertyName: 'JR Arcade', phone: '', email: '', address: '' }
    })

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
        </div>
    )
}
