import { PrismaClient } from '@prisma/client'
import { addTenant } from './actions'

const prisma = new PrismaClient()

export default async function DashboardPage() {
  const tenants = await prisma.tenantProfile.findMany()

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial' }}>
      <h1>JR Arcade - Management</h1>
      <form action={addTenant} style={{ marginBottom: '20px' }}>
        <input name="name" placeholder="Name" required />
        <input name="phone" placeholder="Phone" required />
        <input name="rent" type="number" placeholder="Rent" required />
        <input name="office" placeholder="Office" required />
        <button type="submit">Add Client</button>
      </form>
      <table border="1" width="100%">
        <thead>
  <tr>
    <th>Name</th>
    <th>Office No</th>
    <th>Monthly Rent</th>
  </tr>
</thead>
        <tbody>
          {tenants.map((t) => (
            <tr key={t.id}>
              <td>{t.name}</td><td>{t.office}</td><td>Rs. {t.monthlyRent}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}