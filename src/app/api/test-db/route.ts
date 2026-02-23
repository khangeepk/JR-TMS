import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const userCount = await prisma.user.count();
        const admin = await prisma.user.findUnique({
            where: { username: "admin" },
            select: { id: true, username: true, role: true }
        });

        return NextResponse.json({
            status: "Database is working",
            userCount,
            adminExists: !!admin,
            adminDetails: admin,
            nextAuthUrl: process.env.NEXTAUTH_URL || "NOT SET",
            nextAuthSecret: process.env.NEXTAUTH_SECRET ? "SET" : "NOT SET",
        });
    } catch (error: any) {
        return NextResponse.json({
            status: "Database Error",
            error: error?.message || String(error)
        }, { status: 500 });
    }
}
