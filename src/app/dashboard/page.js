import { PrismaClient } from '@prisma/client'
import { addTenant } from './actions' // Hum ne action ko alag file se bulaya

const prisma = new PrismaClient()

export default async function DashboardPage() {
  const tenants = await prisma.tenantProfile.findMany()

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial' }}>
      <h1 style={{ color: '#1a73e8' }}>JR Arcade - Management</h1>

      <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>Add New Client</h3>
        <form action={addTenant}>
          <input name="name" placeholder="Name" required style={{marginRight: '10px', padding: '5px'}} />
          <input name="phone" placeholder="923xxxxxxxxx" required style={{marginRight: '10px', padding: '5px'}} />
          <input name="rent" type="number" placeholder="Rent" required style={{marginRight: '10px', padding: '5px'}} />
          <input name="office" placeholder="Office No" required style={{marginRight: '10px', padding: '5px'}} />
          <button type="submit" style={{backgroundColor: '#1a73e8', color: 'white', border: 'none', padding: '6px 15px', borderRadius: '4px', cursor: 'pointer'}}>
            Add Client
          </button>
        </form>
      </div>

      <table border="1" width="100%" style={{ borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead style={{ backgroundColor: '#f8f9fa' }}>
          <tr>
            <th style={{padding: '10px'}}>Name</th>
            <th style={{padding: '10px'}}>Office</th>
            <th style={{padding: '10px'}}>Monthly Rent</th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((t) => (
            <tr key={t.id}>
              <td style={{padding: '10px'}}>{t.name}</td>
              <td style={{padding: '10px'}}>{t.office}</td>
              <td style={{padding: '10px'}}>Rs. {t.monthlyRent}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}