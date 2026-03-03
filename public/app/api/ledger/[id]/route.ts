import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await req.json();
        const { type, description, amount, date } = data;

        const entry = await prisma.ledgerEntry.update({
            where: { id },
            data: {
                type,
                description,
                amount: amount ? parseFloat(amount) : undefined,
                date: date ? new Date(date) : undefined,
            },
        });

        return NextResponse.json(entry);
    } catch (error: any) {
        return NextResponse.json({ error: error.message || String(error) || "Failed to update ledger entry" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await prisma.ledgerEntry.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Entry deleted successfully" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || String(error) || "Failed to delete ledger entry" }, { status: 500 });
    }
}
