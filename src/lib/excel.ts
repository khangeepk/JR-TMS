import ExcelJS from 'exceljs';

export async function generateExcelBase64(data: any[], month: string) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'JR TMS';
    workbook.lastModifiedBy = 'JR TMS';
    workbook.created = new Date();
    workbook.modified = new Date();

    const sheet = workbook.addWorksheet(`Ledger ${month}`);

    // Define Columns
    sheet.columns = [
        { header: 'Tenant Name', key: 'tenantName', width: 30 },
        { header: 'Office No', key: 'offices', width: 25 },
        { header: 'Rent Received', key: 'rentPaid', width: 15 },
        { header: 'Water Received', key: 'waterPaid', width: 15 },
        { header: 'Total Paid', key: 'totalReceived', width: 15 },
        { header: 'Date of Payment', key: 'date', width: 20 },
    ];

    // Style Header
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E293B' }
    };
    sheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };

    // Add Data
    data.forEach(item => {
        sheet.addRow({
            tenantName: item['Tenant Name'],
            offices: item['Office No'],
            rentPaid: item['Rent Paid'],
            waterPaid: item['Water Paid'],
            totalReceived: item['Total Received'],
            date: item['Date of Payment']
        });
    });

    // Format Currency Columns
    ['C', 'D', 'E'].forEach(col => {
        sheet.getColumn(col).numFmt = '"Rs. "#,##0.00';
    });

    // Final alignment
    sheet.eachRow((row, rowNumber) => {
        row.alignment = { vertical: 'middle', horizontal: rowNumber === 1 ? 'center' : 'left' };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer).toString('base64');
}
