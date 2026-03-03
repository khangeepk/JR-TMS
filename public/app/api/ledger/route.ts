import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const month = searchParams.get("month"); // Format: YYYY-MM

        let whereClause = {};
        if (month) {
            const year = parseInt(month.split("-")[0]);
            const monthNum = parseInt(month.split("-")[1]);

            const startDate = new Date(year, monthNum - 1, 1);
            const endDate = new Date(year, monthNum, 0);

            whereClause = {
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            };
        }

        const entries = await prisma.ledgerEntry.findMany({
            where: whereClause,
            orderBy: { date: "desc" },
        });

        // Calculate P&L
        const income = entries
            .filter((e) => e.type === "INCOME")
            .reduce((sum, e) => sum + e.amount, 0);
        const expenses = entries
            .filter((e) => e.type === "EXPENSE")
            .reduce((sum, e) => sum + e.amount, 0);

        const profitAndLoss = income - expenses;

        return NextResponse.json({
            entries,
            summary: {
                income,
                expenses,
                profitAndLoss,
            }
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch ledger" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await req.json();
        const { type, description, amount, date } = data;

        const entry = await prisma.ledgerEntry.create({
            data: {
                type, // "INCOME" or "EXPENSE"
                description,
                amount: parseFloat(amount),
                date: date ? new Date(date) : undefined,
            },
        });

        return NextResponse.json(entry, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create ledger entry" }, { status: 500 });
    }
}
