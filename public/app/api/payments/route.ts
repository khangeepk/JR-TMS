import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await req.json();
        const { tenantId, type, amount, dueDate } = data;

        const payment = await prisma.paymentRecord.create({
            data: {
                tenantId,
                type, // "RENT", "SECURITY", "WATER"
                amount: parseFloat(amount),
                dueDate: new Date(dueDate),
                status: "UNPAID",
            },
        });

        return NextResponse.json(payment, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create payment record" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await req.json();
        const { id, status } = data;

        const existingPayment = await prisma.paymentRecord.findUnique({
            where: { id },
        });

        if (!existingPayment) {
            return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
        }

        const payment = await prisma.paymentRecord.update({
            where: { id },
            data: { status }, // "PAID" or "UNPAID"
        });

        // If transitioned to PAID, log it in the daily ledger
        if (existingPayment.status !== "PAID" && status === "PAID") {
            await prisma.ledgerEntry.create({
                data: {
                    type: "INCOME",
                    amount: existingPayment.amount,
                    description: `${existingPayment.type} Payment from Tenant ID ${existingPayment.tenantId}`,
                },
            });
        }

        // If transitioned to UNPAID from PAID, we might need a reversing ledger entry
        // But for simplicity, we will just cover the payment status update logic here
        if (existingPayment.status === "PAID" && status === "UNPAID") {
            await prisma.ledgerEntry.create({
                data: {
                    type: "EXPENSE", // Reversing the income
                    amount: existingPayment.amount,
                    description: `REVERSAL: ${existingPayment.type} Payment reversed for Tenant ID ${existingPayment.tenantId}`,
                },
            });
        }

        return NextResponse.json(payment);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update payment record" }, { status: 500 });
    }
}
