import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarRange, Info, CreditCard, Building, Bell } from "lucide-react";

export default async function UserDashboard() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
        return <div>Access Denied</div>;
    }

    // Fetch the tenant profile using the userId from session
    const tenant = await prisma.tenantProfile.findUnique({
        where: { userId: session.user.id as string },
        include: {
            offices: true,
            payments: {
                orderBy: { dueDate: "desc" },
            },
            user: {
                include: { notifications: { orderBy: { createdAt: "desc" } } }
            }
        },
    });

    if (!tenant) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
                <Info className="h-12 w-12 text-slate-400" />
                <h2 className="text-2xl font-bold text-slate-900">Profile Not Found</h2>
                <p className="text-slate-500 max-w-sm">
                    Your tenant profile hasn't been set up yet. Please contact JR Arcade administration.
                </p>
            </div>
        );
    }

    const rentPayments = tenant.payments.filter(p => p.type === "RENT" && p.status === "UNPAID");
    const unpaidTotal = tenant.payments.filter(p => p.status === "UNPAID").reduce((sum, p) => sum + p.amount, 0);

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome, {tenant.name}</h1>
                <p className="text-slate-500">View your lease details and payment status below.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Lease Details Box */}
                <Card className="border-none shadow-sm bg-white overflow-hidden">
                    <div className="h-2 bg-blue-600 w-full" />
                    <CardHeader>
                        <CardTitle className=" flex items-center gap-2">
                            <Building className="h-5 w-5 text-blue-600" />
                            Office Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                            <span className="text-slate-500 font-medium tracking-tight">Office Number(s)</span>
                            <div className="flex gap-2 flex-wrap justify-end max-w-[50%]">
                                {tenant.offices.length > 0 ? tenant.offices.map(o => (
                                    <span key={o.officeNumber} className="font-bold text-slate-900 text-lg bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">
                                        No. {o.officeNumber}
                                    </span>
                                )) : (
                                    <span className="font-bold text-slate-500 text-sm">Unassigned</span>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                            <span className="text-slate-500 font-medium">Monthly Rent</span>
                            <span className="font-bold text-slate-900">Rs. {tenant.monthlyRent.toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                            <span className="text-slate-500 font-medium">Security Deposit</span>
                            <span className="font-bold text-slate-900">Rs. {tenant.securityDeposit.toFixed(2)}</span>
                        </div>

                        <div className="p-4 border border-slate-100 rounded-lg flex items-start gap-3 mt-4">
                            <CalendarRange className="h-5 w-5 text-slate-400 shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-slate-900">Lease Term</p>
                                <p className="text-sm text-slate-500 mt-1" suppressHydrationWarning>
                                    {new Date(tenant.leaseStart).toLocaleDateString()} &mdash; {new Date(tenant.leaseEnd).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Notifications Box */}
                <Card className="border-none shadow-sm bg-white overflow-hidden flex flex-col">
                    <div className="h-2 bg-amber-500 w-full" />
                    <CardHeader>
                        <CardTitle className=" flex items-center gap-2">
                            <Bell className="h-5 w-5 text-amber-500" />
                            Notifications
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto max-h-[300px]">
                        {tenant.user.notifications.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm py-8 space-y-2">
                                <Bell className="h-8 w-8 opacity-20" />
                                <p>You have no new notifications.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {tenant.user.notifications.map((notif) => (
                                    <div key={notif.id} className="p-3 bg-amber-50/50 border border-amber-100 rounded-lg text-sm text-amber-900">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-medium">System Update</span>
                                            <span className="text-xs text-amber-600 opacity-70">
                                                {new Date(notif.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p>{notif.message}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Payment Tracker */}
            <Card className="border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="space-y-1">
                        <CardTitle className=" flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-slate-700" />
                            Payment Record Tracker
                        </CardTitle>
                        <CardDescription>View your status for Rent, Security, and pending Water charges.</CardDescription>
                    </div>
                    {unpaidTotal > 0 && (
                        <div className="text-right">
                            <span className="text-sm text-slate-500 mr-2">Total Due:</span>
                            <span className="text-xl font-bold text-red-600">Rs. {unpaidTotal.toFixed(2)}</span>
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Type</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tenant.payments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                                        No payment records generated yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                tenant.payments.map((payment) => (
                                    <TableRow key={payment.id}>
                                        <TableCell className="font-medium text-slate-900">{payment.type}</TableCell>
                                        <TableCell className="text-slate-600">
                                            {new Date(payment.dueDate).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="font-medium">Rs. {payment.amount.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">
                                            {payment.status === "PAID" ? (
                                                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200">
                                                    PAID
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50">
                                                    UNPAID
                                                </Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
