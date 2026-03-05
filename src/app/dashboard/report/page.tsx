import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function ReportPage() {
    const currentMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })
    const tenants = await prisma.tenantProfile.findMany({
        include: { payments: { where: { month: currentMonth } } }
    })

    return (
        <div className="p-10 font-sans max-w-4xl mx-auto bg-white text-black print:p-0">
            <header className="border-b-2 border-black pb-4 mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter">JR Arcade - Monthly Ledger</h1>
                    <p className="text-sm font-bold text-neutral-500 uppercase">{currentMonth}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-bold uppercase">Printed on: {new Date().toLocaleDateString()}</p>
                </div>
            </header>

            <table className="w-full border-collapse border border-neutral-300">
                <thead>
                    <tr className="bg-neutral-100">
                        <th className="border border-neutral-300 p-2 text-left text-[10px] uppercase font-bold">Tenant Name</th>
                        <th className="border border-neutral-300 p-2 text-left text-[10px] uppercase font-bold">Offices</th>
                        <th className="border border-neutral-300 p-2 text-right text-[10px] uppercase font-bold">Rent</th>
                        <th className="border border-neutral-300 p-2 text-right text-[10px] uppercase font-bold">Water</th>
                        <th className="border border-neutral-300 p-2 text-right text-[10px] uppercase font-bold">Total Paid</th>
                        <th className="border border-neutral-300 p-2 text-right text-[10px] uppercase font-bold">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {tenants.map(t => {
                        const rentPaid = t.payments.find(p => p.type === 'RENT')?.amount || 0;
                        const waterPaid = t.payments.find(p => p.type === 'WATER')?.amount || 0;
                        const totalPaid = rentPaid + waterPaid;
                        const isFullyPaid = t.rentStatus === 'paid' && t.waterStatus === 'paid';

                        return (
                            <tr key={t.id} className="border-b border-neutral-200">
                                <td className="border border-neutral-300 p-2 font-bold text-xs">{t.name}</td>
                                <td className="border border-neutral-300 p-2 text-xs">{t.offices.join(', ')}</td>
                                <td className="border border-neutral-300 p-2 text-right text-xs">Rs. {t.monthlyRent.toLocaleString()}</td>
                                <td className="border border-neutral-300 p-2 text-right text-xs">Rs. {t.waterCharges.toLocaleString()}</td>
                                <td className="border border-neutral-300 p-2 text-right text-xs font-bold">Rs. {totalPaid.toLocaleString()}</td>
                                <td className="border border-neutral-300 p-2 text-right text-[9px] font-black uppercase">
                                    {isFullyPaid ? <span className="text-emerald-600">CLEARED</span> : <span className="text-rose-600">PENDING</span>}
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>

            <footer className="mt-12 text-[10px] text-neutral-400 font-bold uppercase text-center border-t pt-4">
                This is a system generated report by JR TMS Dashboard
            </footer>

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { margin: 1cm; }
                    body { -webkit-print-color-adjust: exact; }
                }
            `}} />
        </div>
    )
}
