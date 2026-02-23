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
            <Card className="border-none shadow-sm shadow-slate-200">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-green-500" /> WhatsApp Reminders
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-24 flex items-center justify-center text-slate-500">
                    Scanning Ledger...
                </CardContent>
            </Card>
        );
    }

    if (!data || data.unpaidTenants.length === 0) {
        return (
            <Card className="border-none shadow-sm shadow-emerald-100 bg-emerald-50/50">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-emerald-800">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" /> All Caught Up!
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-emerald-700">
                    Everybody has paid their rent and water charges for {data?.month}. No WhatsApp reminders needed!
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-none shadow-sm shadow-slate-200">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    {data.isAlertDay ? (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                    ) : (
                        <MessageCircle className="h-5 w-5 text-green-500" />
                    )}
                    WhatsApp Reminders
                </CardTitle>
                <CardDescription>
                    {data.unpaidTenants.length} tenant(s) have not cleared their dues for {data.month}.
                    {data.isAlertDay ? " (Alert: Past due date!)" : " (Optional early reminder)"}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                    {data.unpaidTenants.map((tenant, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between p-3 border border-slate-100 bg-slate-50 rounded-lg">
                            <div>
                                <div className="font-semibold text-slate-900">{tenant.tenantName}</div>
                                <div className="text-sm text-slate-500">Office(s) {tenant.unpaidOffices.join(", ")} | {tenant.phone}</div>
                            </div>
                            <Button
                                onClick={() => handleSendReminder(tenant)}
                                className="bg-[#25D366] hover:bg-[#128C7E] text-white flex gap-2 w-full sm:w-auto"
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
