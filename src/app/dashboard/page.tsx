import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export default async function DashboardPage() {
  const tenants = await prisma.tenantProfile.findMany();

  // Form submit karne ka function
  async function addTenant(formData) {
    'use server';
    const name = formData.get('name');
    const phone = formData.get('phone');
    const rent = parseFloat(formData.get('rent'));
    const office = formData.get('office');

    await prisma.tenantProfile.create({
      data: { name, phone, monthlyRent: rent, office }
    });
    revalidatePath('/dashboard');
  }

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial' }}>
      <h1>JR Arcade - Management</h1>

      {/* Naya Tenant Add Karne Ka Form */}
      <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ccc' }}>
        <h3>Add New Client</h3>
        <form action={addTenant}>
          <input name="name" placeholder="Name" required style={{marginRight: '10px'}} />
          <input name="phone" placeholder="Phone" required style={{marginRight: '10px'}} />
          <input name="rent" type="number" placeholder="Rent" required style={{marginRight: '10px'}} />
          <input name="office" placeholder="Office No" required style={{marginRight: '10px'}} />
          <button type="submit">Add Now</button>
        </form>
      </div>

      {/* Tenants Ki List */}
      <table border="1" width="100%" style={{ borderCollapse: 'collapse' }}>
        <thead style={{ backgroundColor: '#f2f2f2' }}>
          <tr>
            <th>Name</th>
            <th>Office</th>
            <th>Monthly Rent</th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((t) => (
            <tr key={t.id}>
              <td>{t.name}</td>
              <td>{t.office}</td>
              <td>Rs. {t.monthlyRent}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}