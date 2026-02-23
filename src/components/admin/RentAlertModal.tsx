"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertCircle, Phone, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";

type UnpaidTenant = {
    tenantName: string;
    phone: string;
    unpaidOffices: number[];
};

export default function RentAlertModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{ month: string; unpaidTenants: UnpaidTenant[]; isAlertDay: boolean } | null>(null);

    useEffect(() => {
        const fetchRentStatus = async () => {
            try {
                const res = await fetch("/api/scanner/rent");
                if (res.ok) {
                    const result = await res.json();
                    setData(result);

                    // Only pop open the modal if it's the 10th or later AND there are people who haven't paid
                    if (result.isAlertDay && result.totalUnpaidGroups > 0) {
                        setIsOpen(true);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch rent alert status");
            } finally {
                setLoading(false);
            }
        };

        fetchRentStatus();
    }, []);

    if (loading || !data || data.unpaidTenants.length === 0) return null;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[500px] border-red-200 shadow-red-100 shadow-2xl">
                <DialogHeader>
                    <div className="mx-auto bg-red-100 p-3 rounded-full mb-2 w-fit">
                        <AlertCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <DialogTitle className="text-center text-xl text-red-700">Unpaid Rent Alert!</DialogTitle>
                    <DialogDescription className="text-center text-slate-600">
                        Today is past the 10th of {data.month}. The following active tenants have not logged any "Office Rent" payments in the Ledger for this month yet.
                    </DialogDescription>
                </DialogHeader>

                <div className="max-h-[300px] overflow-y-auto pr-2 mt-4 space-y-3">
                    {data.unpaidTenants.map((tenant, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col justify-between">
                            <div className="flex justify-between items-start w-full">
                                <div className="font-semibold text-slate-800 text-base">{tenant.tenantName}</div>
                                <div className="text-sm font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded-md border border-red-200 flex items-center gap-1.5"><CalendarClock className="h-3 w-3" /> Unpaid</div>
                            </div>
                            <div className="text-sm text-slate-500 mt-1">
                                <span className="font-medium text-slate-700">Offices:</span> {tenant.unpaidOffices.join(", ")}
                            </div>
                            <div className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5" />
                                {tenant.phone}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-4">
                    <Button onClick={() => setIsOpen(false)} className="w-full bg-slate-900 hover:bg-slate-800 text-white">Acknowledge & Close</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
