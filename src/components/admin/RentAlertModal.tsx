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
            <DialogContent className="sm:max-w-[500px] border-rose-200 dark:border-rose-900/50 shadow-rose-100 dark:shadow-none shadow-2xl bg-white dark:bg-neutral-900">
                <DialogHeader>
                    <div className="mx-auto bg-rose-100 dark:bg-rose-500/10 p-3 rounded-full mb-2 w-fit">
                        <AlertCircle className="h-8 w-8 text-rose-600 dark:text-rose-500" />
                    </div>
                    <DialogTitle className="text-center text-xl font-bold text-rose-700 dark:text-rose-400">Unpaid Rent Alert!</DialogTitle>
                    <DialogDescription className="text-center text-neutral-600 dark:text-neutral-400">
                        Today is past the 10th of {data.month}. The following active tenants have not logged any "Office Rent" payments in the Ledger for this month yet.
                    </DialogDescription>
                </DialogHeader>

                <div className="max-h-[300px] overflow-y-auto pr-2 mt-4 space-y-3">
                    {data.unpaidTenants.map((tenant, idx) => (
                        <div key={idx} className="bg-neutral-50 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 flex flex-col justify-between transition-colors">
                            <div className="flex justify-between items-start w-full">
                                <div className="font-bold text-neutral-900 dark:text-white text-base">{tenant.tenantName}</div>
                                <div className="text-[10px] font-black tracking-widest bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-500/20 flex items-center gap-1.5 uppercase">
                                    <CalendarClock className="h-3 w-3" /> Unpaid
                                </div>
                            </div>
                            <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-2 flex items-center gap-2">
                                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Offices:</span>
                                <span className="text-neutral-700 dark:text-neutral-300">{tenant.unpaidOffices.join(", ")}</span>
                            </div>
                            <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-1 flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5 text-neutral-400" />
                                <span className="font-mono">{tenant.phone}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6">
                    <Button
                        onClick={() => setIsOpen(false)}
                        className="w-full bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 text-white dark:text-black font-bold uppercase tracking-widest text-xs py-6 rounded-xl transition-all"
                    >
                        Acknowledge & Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
