import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export default async function DashboardPage() {
  const tenants = await prisma.tenantProfile.findMany({
    include: { payments: true }
  });

  // Action: Naya Tenant Add Karna
  async function addTenant(formData: FormData) {
    'use server';
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const rent = parseFloat(formData.get('rent') as string);
    const office = formData.get('office') as string;

    await prisma.tenantProfile.create({
      data: { name, phone, monthlyRent: rent, office }
    });
    revalidatePath('/dashboard');
  }

  return (
    <div style={{ padding: '30px', fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', color: '#1a73e8' }}>JR Arcade - Smart Management</h1>

        {/* --- ADD NEW TENANT FORM --- */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', marginBottom: '30px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <h3>Add New Tenant</h3>
          <form action={addTenant} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input name="name" placeholder="Name" required style={inputStyle} />
            <input name="phone" placeholder="WhatsApp (e.g. 923...)" required style={inputStyle} />
            <input name="rent" type="number" placeholder="Monthly Rent" required style={inputStyle} />
            <input name="office" placeholder="Office No" required style={inputStyle} />
            <button type="submit" style={buttonStyle}>Add Client</button>
          </form>
        </div>

        {/* --- TENANTS TABLE --- */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <h3>Active Tenants & Ledger</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#1a73e8', color: 'white' }}>
              <tr>
                <th style={tdStyle}>Name</th>
                <th style={tdStyle}>Office</th>
                <th style={tdStyle}>Rent</th>
                <th style={tdStyle}>Last Payment</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={tdStyle}>{t.name}</td>
                  <td style={tdStyle}>{t.office}</td>
                  <td style={tdStyle}>Rs. {t.monthlyRent}</td>
                  <td style={tdStyle}>{t.payments.length > 0 ? 'Paid' : 'Pending'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Simple CSS Styles
const inputStyle = { padding: '10px', borderRadius: '5px', border: '1px solid #ccc', flex: '1' };
const buttonStyle = { padding: '10px 20px', backgroundColor: '#1a73e8', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' };
const tdStyle = { padding: '12px', textAlign: 'left' as const };