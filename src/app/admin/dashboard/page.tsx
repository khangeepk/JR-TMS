import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DoorClosed, User, CalendarRange } from "lucide-react";
import RentAlertModal from "@/components/admin/RentAlertModal";
import WhatsAppReminders from "@/components/admin/WhatsAppReminders";

export default async function AdminDashboard() {
    // Fetch 15 offices cleanly without complex includes to avoid Prisma Cache relation errors
    let rawOffices = await prisma.office.findMany();

    // Since it's an MVP, automatically seed 15 offices if they don't exist
    if (rawOffices.length === 0) {
        const defaultOffices = Array.from({ length: 15 }).map((_, i) => ({
            officeNumber: i + 1,
            floor: Math.ceil((i + 1) / 5),
            isOccupied: false,
        }));
        await prisma.office.createMany({ data: defaultOffices });
        rawOffices = await prisma.office.findMany();
    }

    // Safely map the tenants to the offices manually to prevent "Missing column" relational join crashes on outdated DB cache logic
    const allTenants = await prisma.tenantProfile.findMany();
    let offices = rawOffices.map(office => {
        return {
            ...office,
            tenant: allTenants.find(t => t.id === office.tenantId) || null
        }
    });

    offices.sort((a, b) => a.officeNumber - b.officeNumber);

    const occupiedCount = offices.filter((o) => o.isOccupied).length;
    const vacantCount = 15 - occupiedCount;

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500" suppressHydrationWarning>
            <RentAlertModal />
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Office Directory</h1>
                <p className="text-slate-500">Overview of all 15 offices in JR Arcade.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <Card className="bg-white border-none shadow-sm shadow-slate-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Offices</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900">15</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-none shadow-sm shadow-slate-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Occupied</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-blue-600">{occupiedCount}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-none shadow-sm shadow-slate-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Vacant</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-emerald-600">{vacantCount}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* WhatsApp Reminders Widget */}
                <div className="lg:col-span-1">
                    <WhatsAppReminders />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {offices.map((office) => (
                    <Card
                        key={office.id}
                        className={`transition-all duration-300 hover:shadow-md ${office.isOccupied ? "border-blue-100 bg-blue-50/50" : "border-emerald-100 bg-emerald-50/30"
                            }`}
                    >
                        <CardHeader className="p-4 pb-2">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2 text-slate-900 font-semibold text-lg">
                                    <DoorClosed className="h-5 w-5 text-slate-400" />
                                    No. {office.officeNumber}
                                </div>
                                {office.isOccupied ? (
                                    <Badge className="bg-blue-600 hover:bg-blue-700">Occupied</Badge>
                                ) : (
                                    <Badge variant="outline" className="border-emerald-500 text-emerald-700">Available</Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-2 text-sm text-slate-600 flex flex-col gap-2">
                            <div><span className="font-medium text-slate-900">Floor:</span> {office.floor}</div>

                            {office.isOccupied && office.tenant ? (
                                <>
                                    <div className="flex items-center gap-1.5 mt-2 text-slate-900 font-medium">
                                        <User className="h-4 w-4 text-blue-600" />
                                        <span className="truncate">{office.tenant.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500" suppressHydrationWarning>
                                        <CalendarRange className="h-3.5 w-3.5" />
                                        {new Date(office.tenant.leaseEnd).toLocaleDateString()}
                                    </div>
                                </>
                            ) : (
                                <div className="mt-2 text-slate-400 italic">Ready for tenant</div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
