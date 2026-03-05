"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, CheckCircle2, AlertCircle } from "lucide-react";

type UnpaidTenant = {
    tenantName: string;
    phone: string;
    unpaidOffices: number[];
};

export default function WhatsAppReminders() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{ month: string; unpaidTenants: UnpaidTenant[]; isAlertDay: boolean } | null>(null);

    useEffect(() => {
        const fetchRentStatus = async () => {
            try {
                const res = await fetch("/api/scanner/rent");
                if (res.ok) {
                    const result = await res.json();
                    setData(result);
                }
            } catch (error) {
                console.error("Failed to fetch rent alert status");
            } finally {
                setLoading(false);
            }
        };

        fetchRentStatus();
    }, []);

    const formatWhatsAppNumber = (phone: string) => {
        // Remove spaces, dashes, parentheses
        let cleaned = phone.replace(/[\s\-\(\)]/g, "");

        // If it starts with 0 (like 0300...), replace it with country code 92
        if (cleaned.startsWith("0")) {
            cleaned = "92" + cleaned.substring(1);
        } else if (!cleaned.startsWith("92") && !cleaned.startsWith("+92")) {
            // If it doesn't have a country code, assume Pakistan
            cleaned = "92" + cleaned;
        }

        return cleaned.replace("+", ""); // wa.me requires no plus sign
    };

    const handleSendReminder = (tenant: UnpaidTenant) => {
        const formattedPhone = formatWhatsAppNumber(tenant.phone);
        const offices = tenant.unpaidOffices.join(", ");

        const message = `Hello ${tenant.tenantName}, this is a gentle reminder from JR Arcade Management that your rent and water charges for Office(s) ${offices} for the month of ${data?.month || "this month"} is due. Kindly clear the dues at your earliest convenience. Thank you!`;

        const encodedMessage = encodeURIComponent(message);

        // Open WhatsApp Web/App
        window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, "_blank");
    };

    if (loading) {
        return (
            <Card className="border-neutral-200 dark:border-neutral-800 shadow-sm dark:shadow-none bg-white dark:bg-neutral-900 overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-neutral-900 dark:text-white font-bold">
                        <MessageCircle className="h-5 w-5 text-emerald-500" /> WhatsApp Reminders
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-24 flex items-center justify-center text-neutral-500 dark:text-neutral-400 font-medium italic">
                    Scanning Ledger...
                </CardContent>
            </Card>
        );
    }

    if (!data || data.unpaidTenants.length === 0) {
        return (
            <Card className="border-emerald-200 dark:border-emerald-500/20 shadow-sm dark:shadow-none bg-emerald-50/50 dark:bg-emerald-500/5 overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-bold">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-500" /> All Caught Up!
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-emerald-700 dark:text-emerald-300 font-medium">
                    Everybody has paid their rent and water charges for {data?.month}. No WhatsApp reminders needed!
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-neutral-200 dark:border-neutral-800 shadow-sm dark:shadow-none bg-white dark:bg-neutral-900 overflow-hidden">
            <CardHeader className="pb-3 px-6 pt-6">
                <CardTitle className="text-lg flex items-center gap-2 text-neutral-900 dark:text-white font-bold">
                    {data.isAlertDay ? (
                        <AlertCircle className="h-5 w-5 text-rose-500" />
                    ) : (
                        <MessageCircle className="h-5 w-5 text-emerald-500" />
                    )}
                    WhatsApp Reminders
                </CardTitle>
                <CardDescription className="text-neutral-500 dark:text-neutral-400 font-medium">
                    {data.unpaidTenants.length} tenant(s) have not cleared their dues for {data.month}.
                    {data.isAlertDay ? " (Alert: Past due date!)" : " (Optional early reminder)"}
                </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                    {data.unpaidTenants.map((tenant, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between p-4 border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50 rounded-xl transition-colors hover:border-neutral-200 dark:hover:border-neutral-700">
                            <div>
                                <div className="font-bold text-neutral-900 dark:text-white">{tenant.tenantName}</div>
                                <div className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 mt-1 uppercase tracking-widest">
                                    Offices: {tenant.unpaidOffices.join(", ")} <span className="mx-2 text-neutral-300 dark:text-neutral-700">|</span> {tenant.phone}
                                </div>
                            </div>
                            <Button
                                onClick={() => handleSendReminder(tenant)}
                                className="bg-[#25D366] hover:bg-[#128C7E] active:scale-[0.98] text-white font-bold flex gap-2 w-full sm:w-auto rounded-xl shadow-lg shadow-[#25D366]/20 transition-all uppercase tracking-widest text-[10px] py-5"
                            >
                                <MessageCircle className="h-4 w-4" /> Send Reminder
                            </Button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
