const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function generateMonthlyLedger(targetMonth, targetYear) {
    try {
        console.log(`Generating Ledger Excel report for ${targetMonth} ${targetYear}...`);

        // 1. Calculate Date Bounds
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const monthIndex = monthNames.findIndex(m => m.toLowerCase() === targetMonth.toLowerCase());

        if (monthIndex === -1) {
            throw new Error("Invalid month name provided.");
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

        console.log(`Found ${entries.length} Ledger entries.`);

        // 3. Initialize Workbook
        const workbook = new ExcelJS.Workbook();
        workbook.creator = "JR TMS Automated System";

        const sheet = workbook.addWorksheet(`${targetMonth} ${targetYear} Ledger`);

        // Define Columns
        sheet.columns = [
            { header: 'Date', key: 'date', width: 20 },
            { header: 'Type', key: 'type', width: 15 },
            { header: 'Category / Source', key: 'category', width: 25 },
            { header: 'Details', key: 'details', width: 30 },
            { header: 'Amount (Rs)', key: 'amount', width: 15 }
        ];

        // Format Header Row
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
        sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

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

            const row = sheet.addRow({
                date: new Date(entry.date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
                type: entry.type,
                category: category,
                details: details,
                amount: amount
            });

            // Color code Income vs Expense
            const amountCell = row.getCell('amount');
            amountCell.font = { color: { argb: entry.type === "INCOME" ? 'FF059669' : 'FFDC2626' }, bold: true };
            amountCell.numFmt = 'Rs. #,##0.00';
            row.getCell('type').alignment = { horizontal: 'center' };
        });

        // 5. Add Summary Footer
        sheet.addRow([]);
        const footerIncome = sheet.addRow({ details: 'Total Income:', amount: totalIncome });
        footerIncome.getCell('details').font = { bold: true };
        footerIncome.getCell('amount').font = { bold: true, color: { argb: 'FF059669' } };
        footerIncome.getCell('amount').numFmt = 'Rs. #,##0.00';

        const footerExpense = sheet.addRow({ details: 'Total Expenses:', amount: totalExpense });
        footerExpense.getCell('details').font = { bold: true };
        footerExpense.getCell('amount').font = { bold: true, color: { argb: 'FFDC2626' } };
        footerExpense.getCell('amount').numFmt = 'Rs. #,##0.00';

        const footerProfit = sheet.addRow({ details: 'Net Profit/Loss:', amount: totalIncome - totalExpense });
        footerProfit.getCell('details').font = { bold: true };
        footerProfit.getCell('amount').font = { bold: true };
        footerProfit.getCell('amount').numFmt = 'Rs. #,##0.00';

        // 6. Define the Save Directory
        const baseDocDir = "d:\\Backup\\OneDrive\\Documents\\JR TMS";
        const targetFolder = path.join(baseDocDir, `${targetMonth}, ${targetYear}`);

        if (!fs.existsSync(targetFolder)) {
            console.log(`Directory ${targetFolder} does not exist. Creating it now...`);
            fs.mkdirSync(targetFolder, { recursive: true });
        }

        const filePath = path.join(targetFolder, `${targetMonth}_${targetYear}_Ledger.xlsx`);

        // 7. Write to File
        await workbook.xlsx.writeFile(filePath);
        console.log(`\nSUCCESS: Financial Excel Report saved to -> ${filePath}\n`);

    } catch (error) {
        console.error("\nERROR: Failed to generate Excel report:", error);
    } finally {
        await prisma.$disconnect();
    }
}

// Extract arguments from CLI (e.g., node export-ledger.js February 2026)
const args = process.argv.slice(2);
const reqMonth = args[0] || "February";
const reqYear = parseInt(args[1]) || 2026;

generateMonthlyLedger(reqMonth, reqYear);
