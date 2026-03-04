'use server'
import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export async function addTenant(formData) {
  const name = formData.get('name')
  const phone = formData.get('phone')
  const rentStr = formData.get('rent')
  const office = formData.get('office')

  const rent = parseFloat(rentStr)

  await prisma.tenantProfile.create({
    data: { 
      name: name, 
      phone: phone, 
      monthlyRent: rent, 
      office: office 
    }
  })
  revalidatePath('/dashboard')
}