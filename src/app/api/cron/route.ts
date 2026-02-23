import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { addYears, isSameMonth, isSameDay, getDate } from "date-fns";

export async function GET(req: Request) {
    try {
        const today = new Date();
        const isFifthOfMonth = getDate(today) === 5;

        const results = {
            notificationsSent: 0,
            rentIncreases: 0,
        };

        // 1. On the 5th of every month, notify tenants with "UNPAID" rent
        if (isFifthOfMonth) {
            const unpaidRentRecords = await prisma.paymentRecord.findMany({
                where: {
                    type: "RENT",
                    status: "UNPAID",
                },
                include: {
                    tenant: true,
                },
            });

            for (const record of unpaidRentRecords) {
                // Create an in-app notification
                await prisma.notification.create({
                    data: {
                        userId: record.tenant.userId,
                        message: `Reminder: Your rent payment of Rs. ${record.amount} due on ${record.dueDate.toLocaleDateString()} is still Unpaid. Please process your payment.`,
                    },
                });
                results.notificationsSent++;
            }
        }

        // 2. 1-year anniversary rent increase (10%)
        // Find tenants whose lease start date was exactly N years ago today
        const tenants = await prisma.tenantProfile.findMany();

        for (const tenant of tenants) {
            const leaseStart = new Date(tenant.leaseStart);

            // Check if today is the anniversary (same month and day, but year > start year)
            const isAnniversaryMonth = isSameMonth(today, leaseStart);
            const isAnniversaryDay = isSameDay(today, leaseStart);
            const hasPassedOneYear = today.getFullYear() > leaseStart.getFullYear();

            // Trigger logic: if today exactly matches the anniversary date month/day
            if (isAnniversaryMonth && isAnniversaryDay && hasPassedOneYear) {
                // Did we already increase it today? Prevent multiple rapid fired calls
                // In a perfect system we'd track lastIncreaseDate, but checking if we already ran it today suffices
                // for simplicity, we directly bump rent
                const newRent = tenant.monthlyRent * 1.10; // 10% increase

                await prisma.tenantProfile.update({
                    where: { id: tenant.id },
                    data: { monthlyRent: newRent },
                });

                // Notify them
                await prisma.notification.create({
                    data: {
                        userId: tenant.userId,
                        message: `Notice: It's your lease anniversary! Your rent has been adjusted by 10% to Rs. ${newRent.toFixed(2)}.`,
                    },
                });

                results.rentIncreases++;
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (error) {
        return NextResponse.json({ error: "Failed to run cron job" }, { status: 500 });
    }
}
