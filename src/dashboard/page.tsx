import { db } from '@vercel/postgres';

export default async function DashboardPage() {
  const client = await db.connect();
  
  // Database se tenants ki list mangwana
  const { rows: tenants } = await client.sql`SELECT * FROM "TenantProfile"`;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>JR Arcade - Rent Management Dashboard</h1>
      <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2' }}>
            <th>Name</th>
            <th>Phone</th>
            <th>Monthly Rent</th>
            <th>Office No</th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((tenant) => (
            <tr key={tenant.id}>
              <td>{tenant.name}</td>
              <td>{tenant.phone}</td>
              <td>{tenant.monthlyRent}</td>
              <td>{tenant.office}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}