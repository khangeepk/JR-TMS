import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Get current month and year
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        // 2. Fetch all currently OCCUPIED offices
        const rawOffices = await prisma.office.findMany({
            where: {
                isOccupied: true,
                tenantId: { not: null }
            }
        });

        const allTenants = await prisma.tenantProfile.findMany();
        const occupiedOffices = rawOffices.map(office => ({
            ...office,
            tenant: allTenants.find(t => t.id === office.tenantId) || null
        }));

        // 3. Fetch all Rent Income Ledger entries for the current month
        const rentEntriesThisMonth = await prisma.ledgerEntry.findMany({
            where: {
                type: "INCOME",
                date: {
                    gte: startOfMonth,
                    lte: endOfMonth
                },
                description: {
                    startsWith: "Rent - Office"
                }
            }
        });

        // 4. Extract which particular Office numbers HAVE paid this month
        const paidOfficeNumbers = new Set<number>();

        rentEntriesThisMonth.forEach(entry => {
            // Description format is like: "Rent - Office 5, 6 - Water 2000" or "Rent - Office 5"
            try {
                const stripped = entry.description.replace("Rent - Office ", "");
                const officePart = stripped.includes(" - Water ") ? stripped.split(" - Water ")[0] : stripped;

                // Parse comma separated values like "5, 6" into [5, 6]
                const numbers = officePart.split(",").map(n => parseInt(n.trim())).filter(n => !isNaN(n));
                numbers.forEach(num => paidOfficeNumbers.add(num));
            } catch (e) {
                console.error("Error parsing office number from ledger description", e);
            }
        });

        // 5. Cross-reference: Who hasn't paid?
        const unpaidOffices = occupiedOffices.filter(office => !paidOfficeNumbers.has(office.officeNumber));

        // Group unpaid offices by Tenant to avoid spamming the same tenant 5 times if they own 5 unpaid offices
        const unpaidTenantsMap = new Map();

        unpaidOffices.forEach(office => {
            if (!office.tenant) return;

            const tenantId = office.tenant.id;
            if (!unpaidTenantsMap.has(tenantId)) {
                unpaidTenantsMap.set(tenantId, {
                    tenantName: office.tenant.name,
                    phone: office.tenant.phone,
                    unpaidOffices: []
                });
            }
            unpaidTenantsMap.get(tenantId).unpaidOffices.push(office.officeNumber);
        });

        const unpaidTenantsList = Array.from(unpaidTenantsMap.values());

        return NextResponse.json({
            month: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
            unpaidTenants: unpaidTenantsList,
            totalUnpaidGroups: unpaidTenantsList.length,
            isAlertDay: now.getDate() >= 10 // Flag if it's past the 10th
        });

    } catch (error: any) {
        console.error("Rent Scanner Error:", error);
        return NextResponse.json({ error: "Failed to scan rent status" }, { status: 500 });
    }
}
