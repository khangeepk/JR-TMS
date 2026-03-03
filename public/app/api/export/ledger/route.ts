import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const targetMonth = searchParams.get("month");
        const targetYear = parseInt(searchParams.get("year") || "2026");

        if (!targetMonth) {
            return NextResponse.json({ error: "Month parameter is required." }, { status: 400 });
        }

        // 1. Calculate Date Bounds
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const monthIndex = monthNames.findIndex(m => m.toLowerCase() === targetMonth.toLowerCase());

        if (monthIndex === -1) {
            return NextResponse.json({ error: "Invalid month name." }, { status: 400 });
        }

        const startOfMonth = new Date(targetYear, monthIndex, 1);
        const endOfMonth = new Date(targetYear, monthIndex + 1, 0, 23, 59, 59, 999);

        // 2. Fetch SQLite Data
        const entries = await prisma.ledgerEntry.findMany({
            where: {
                date: {
                    gte: startOfMonth,
                    lte: endOfMonth
                }
            },
            orderBy: { date: 'asc' }
        });

        // 3. Initialize CSV Output
        const csvRows = [];

        // CSV Header
        csvRows.push(["Date", "Type", "Category / Source", "Details", "Amount (Rs)"]);

        let totalIncome = 0;
        let totalExpense = 0;

        // 4. Transform and Insert Data Rows
        entries.forEach(entry => {
            let category = entry.description;
            let details = "-";
            let amount = entry.amount;

            // Handle Smart Parsing for the UI categories we mapped earlier
            if (entry.description.startsWith("Rent - Office ")) {
                category = "Office Rent";
                const stripped = entry.description.replace("Rent - Office ", "");
                if (stripped.includes(" - Water ")) {
                    const parts = stripped.split(" - Water ");
                    details = `Office(s) ${parts[0]} | Water Charges: Rs. ${parts[1]}`;
                } else {
                    details = `Office(s) ${stripped}`;
                }
            } else {
                const isSystemPreset = ["Snooker Club", "Saloon", "Office Management", "Utility Bill", "Maintenance", "Staff Salary"].includes(entry.description);
                if (!isSystemPreset) {
                    category = "Other";
                    details = entry.description;
                }
            }

            if (entry.type === "INCOME") {
                totalIncome += amount;
            } else {
                totalExpense += amount;
            }

            const formattedDate = new Date(entry.date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }).replace(/,/g, '');

            // Push formatted string row protecting interior commas
            csvRows.push([
                formattedDate,
                entry.type,
                category,
                details.replace(/,/g, ' '), // strip commas since CSV relies on them
                amount.toFixed(2)
            ]);
        });

        // 5. Add Summary Footer
        csvRows.push([]);
        csvRows.push(["", "", "", "Total Income:", totalIncome.toFixed(2)]);
        csvRows.push(["", "", "", "Total Expenses:", totalExpense.toFixed(2)]);
        csvRows.push(["", "", "", "Net Profit/Loss:", (totalIncome - totalExpense).toFixed(2)]);

        const csvString = csvRows.map(e => e.join(",")).join("\n");

        // 6. Define the Save Directory per User Constraints
        const baseDocDir = "d:\\Backup\\OneDrive\\Documents\\JR TMS";
        const targetFolder = path.join(baseDocDir, `${targetMonth}, ${targetYear}`);

        if (!fs.existsSync(targetFolder)) {
            fs.mkdirSync(targetFolder, { recursive: true });
        }

        const filePath = path.join(targetFolder, `${targetMonth}_${targetYear}_Ledger.csv`);

        // 7. Write to File physically on OS Server Side
        fs.writeFileSync(filePath, csvString, "utf8");

        return NextResponse.json({
            success: true,
            message: `Excel File created successfully at ${filePath}`,
            entriesFound: entries.length,
            path: filePath
        });

    } catch (error: any) {
        console.error("Excel Generation Error:", error);
        return NextResponse.json({ error: "Error: " + error?.message + " " + error?.stack }, { status: 200 });
    }
}
