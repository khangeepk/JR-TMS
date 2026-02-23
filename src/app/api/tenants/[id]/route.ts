import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // A tenant can only view their own profile, Admin can view any
        const tenant = await prisma.tenantProfile.findUnique({
            where: { id },
            include: {
                user: true,
                offices: true,
            },
        });

        if (!tenant) {
            return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
        }

        if (session.user.role !== "ADMIN" && session.user.id !== tenant.userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        return NextResponse.json(tenant);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch tenant" }, { status: 500 });
    }
}

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
        const {
            name,
            phone,
            officeNumbers, // Array of strings/numbers
            leaseStart,
            leaseEnd,
            monthlyRent,
            securityDeposit,
        } = data;

        const result = await prisma.$transaction(async (tx) => {
            const tenant = await tx.tenantProfile.update({
                where: { id },
                // @ts-ignore - Bypass old schema check
                data: {
                    name,
                    phone,
                    leaseStart: leaseStart ? new Date(leaseStart) : undefined,
                    leaseEnd: leaseEnd ? new Date(leaseEnd) : undefined,
                    monthlyRent: monthlyRent ? parseFloat(monthlyRent) : undefined,
                    securityDeposit: securityDeposit ? parseFloat(securityDeposit) : undefined,
                },
            });

            if (officeNumbers && Array.isArray(officeNumbers)) {
                // Release all existing offices assigned to this tenant
                await tx.office.updateMany({
                    where: { tenantId: id },
                    data: { isOccupied: false, tenantId: null },
                });

                // Reassign the newly selected ones
                for (const num of officeNumbers) {
                    await tx.office.upsert({
                        where: { officeNumber: Number(num) },
                        update: { isOccupied: true, tenantId: id },
                        create: {
                            officeNumber: Number(num),
                            floor: Math.ceil(Number(num) / 5),
                            isOccupied: true,
                            tenantId: id,
                        }
                    });
                }
            }

            return tenant;
        });

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message || String(error) || "Failed to update tenant" }, { status: 500 });
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

        const tenant = await prisma.tenantProfile.findUnique({
            where: { id },
        });

        if (!tenant) {
            return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
        }

        // Free up the multiple offices assigned to the tenant
        await prisma.office.updateMany({
            where: { tenantId: tenant.id },
            data: {
                isOccupied: false,
                tenantId: null,
            },
        });

        // Delete user will cascade and delete the tenant profile
        await prisma.user.delete({
            where: { id: tenant.userId },
        });

        return NextResponse.json({ message: "Tenant deleted successfully" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete tenant" }, { status: 500 });
    }
}
