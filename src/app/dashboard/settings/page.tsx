import { PrismaClient } from '@prisma/client'
import { Settings, Building2, Phone, Mail, MapPin, CheckCircle2 } from 'lucide-react'
import { savePropertyInfo } from '@/app/dashboard/actions'

const prisma = new PrismaClient()

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
            <div className="glass-card rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-6 bg-emerald-500 rounded-full" />
                    <h2 className="text-sm font-bold uppercase tracking-wider">Property Information</h2>
                </div>

                <form action={savePropertyInfo} className="space-y-4">
                    {[
                        { label: 'Property Name', name: 'propertyName', value: info.propertyName, icon: Building2, placeholder: 'JR Arcade' },
                        { label: 'Contact Phone', name: 'phone', value: info.phone, icon: Phone, placeholder: '+92 3XX XXXXXXX' },
                        { label: 'Email', name: 'email', value: info.email, icon: Mail, placeholder: 'management@jrarcade.com' },
                        { label: 'Address', name: 'address', value: info.address, icon: MapPin, placeholder: 'JR Arcade, Pakistan' },
                    ].map(item => (
                        <div key={item.name} className="space-y-1.5">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-1.5">
                                <item.icon size={11} />
                                {item.label}
                            </label>
                            <input
                                name={item.name}
                                defaultValue={item.value}
                                placeholder={item.placeholder}
                                className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                            />
                        </div>
                    ))}

                    <button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-[11px] uppercase tracking-[0.2em] transition-all shadow-lg shadow-emerald-600/20 mt-2 flex items-center justify-center gap-2"
                    >
                        <CheckCircle2 size={14} />
                        Save Changes
                    </button>
                </form>
            </div>

            {/* Saved Info Display */}
            <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-emerald-400 rounded-full" />
                    <h2 className="text-sm font-bold uppercase tracking-wider">Currently Saved</h2>
                </div>
                <div className="space-y-2 text-sm">
                    {[
                        { label: 'Property', value: info.propertyName },
                        { label: 'Phone', value: info.phone || '—' },
                        { label: 'Email', value: info.email || '—' },
                        { label: 'Address', value: info.address || '—' },
                    ].map(row => (
                        <div key={row.label} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{row.label}</span>
                            <span className="font-bold text-xs">{row.value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* App Info */}
            <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-neutral-400 rounded-full" />
                    <h2 className="text-sm font-bold uppercase tracking-wider">App Info</h2>
                </div>
                <div className="space-y-3 text-sm">
                    {[
                        { label: 'App Name', value: 'JR Arcade TMS' },
                        { label: 'Version', value: 'v2.0.0' },
                        { label: 'Built With', value: 'Next.js · Prisma · PostgreSQL' },
                    ].map(row => (
                        <div key={row.label} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{row.label}</span>
                            <span className="font-bold text-xs">{row.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
