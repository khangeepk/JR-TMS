import prisma from '@/lib/prisma'
import ExpensesClient from '@/components/ExpensesClient'

export const dynamic = 'force-dynamic'

export default async function ExpensesPage() {
    const expenses = await prisma.expense.findMany({
        orderBy: { date: 'desc' }
    })

    // Serialize dates for client component
    const serialized = expenses.map(e => ({
        ...e,
        date: e.date.toISOString(),
        createdAt: e.createdAt.toISOString()
    }))

    return <ExpensesClient initialExpenses={serialized} />
}
