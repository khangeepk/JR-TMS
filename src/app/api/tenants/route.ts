import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const tenants = await prisma.tenantProfile.findMany({
            include: {
                user: true,
                offices: true,
            },
        });

        return NextResponse.json(tenants);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch tenants" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await req.json();
        const {
            username,
            password,
            name,
            phone,
            officeNumbers, // Array of numbers
            officeNumber,  // Fallback property
            leaseStart,
            leaseEnd,
            monthlyRent,
            securityDeposit,
        } = data;

        if (!Array.isArray(officeNumbers) || officeNumbers.length === 0) {
            return NextResponse.json({ error: "At least one office number must be provided" }, { status: 400 });
        }

        // Validate if user exists
        const existingUser = await prisma.user.findUnique({
            where: { username },
        });

        if (existingUser) {
            return NextResponse.json({ error: "Username already exists" }, { status: 400 });
        }

        // Validate if chosen offices are already occupied
        const existingOffices = await prisma.office.findMany({
            where: { officeNumber: { in: officeNumbers.map(Number) } },
        });

        const occupiedOffices = existingOffices.filter(o => o.isOccupied);
        if (occupiedOffices.length > 0) {
            return NextResponse.json({ error: `Offices ${occupiedOffices.map(o => o.officeNumber).join(', ')} are already occupied` }, { status: 400 });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const result = await prisma.$transaction(async (prisma) => {
            // Create user
            const user = await prisma.user.create({
                data: {
                    username,
                    passwordHash,
                    role: "TENANT",
                },
            });

            // Create tenant profile
            const tenant = await prisma.tenantProfile.create({
                data: {
                    userId: user.id,
                    name,
                    phone,
                    leaseStart: new Date(leaseStart),
                    leaseEnd: new Date(leaseEnd),
                    monthlyRent: parseFloat(monthlyRent),
                    securityDeposit: parseFloat(securityDeposit),
                },
            });

            // Upsert all offices to associate them with this new tenant
            for (const num of officeNumbers) {
                await prisma.office.upsert({
                    where: { officeNumber: Number(num) },
                    update: {
                        isOccupied: true,
                        tenantId: tenant.id,
                    },
                    create: {
                        officeNumber: Number(num),
                        floor: Math.ceil(Number(num) / 5), // Basic floor logic
                        isOccupied: true,
                        tenantId: tenant.id,
                    },
                });
            }

            // Create initial payment records if needed, or simply let the logic handle it later
            return tenant;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
        console.error("Tenant Creation Error:", error);
        return NextResponse.json({ error: error.message || String(error) || "Failed to create tenant" }, { status: 500 });
    }
}
