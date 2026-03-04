'use server'
import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export async function addTenant(formData) {
  const name = formData.get('name')
  const phone = formData.get('phone')
  const rent = parseFloat(formData.get('rent'))
  const office = formData.get('office')

  await prisma.tenantProfile.create({
    data: { name, phone, monthlyRent: rent, office }
  })
  revalidatePath('/dashboard')
}