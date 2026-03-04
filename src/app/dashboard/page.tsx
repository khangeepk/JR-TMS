import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function DashboardPage() {
  // Database se asali tenants ka data mangwana
  const tenants = await prisma.tenantProfile.findMany();

  return (
    <div style={{ padding: '40px', fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h1 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>
          JR Arcade - Management Dashboard
        </h1>
        <p style={{ color: '#7f8c8d' }}>Total Active Tenants: <strong>{tenants.length}</strong></p>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#3498db', color: '#fff', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>Name</th>
              <th style={{ padding: '12px' }}>Phone</th>
              <th style={{ padding: '12px' }}>Monthly Rent</th>
              <th style={{ padding: '12px' }}>Office No</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <tr key={tenant.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px' }}>{tenant.name}</td>
                <td style={{ padding: '12px' }}>{tenant.phone}</td>
                <td style={{ padding: '12px' }}>Rs. {tenant.monthlyRent}</td>
                <td style={{ padding: '12px' }}>{tenant.office}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}