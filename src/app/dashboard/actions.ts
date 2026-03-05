'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import { generateExcelBase64 } from '@/lib/excel'
import { uploadReport } from '@/lib/supabase-storage'

const prisma = new PrismaClient()

// Zod validation schemas
const AddTenantSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(5, "Phone number is required"),
  rent: z.number().positive("Rent must be a positive number"),
  waterCharges: z.number().min(0, "Water charges cannot be negative"),
  officesString: z.string().min(1, "At least one office must be provided"),
  startDateStr: z.string().min(1, "Start Date is required"),
  isShared: z.boolean().default(false),
  totalSecurityAmount: z.number().min(0).default(0)
})

const UpdateTenantSchema = z.object({
  id: z.number(),
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(5, "Phone number is required"),
  rent: z.number().positive("Rent must be a positive number"),
  waterCharges: z.number().min(0, "Water charges cannot be negative"),
  officesString: z.string().min(1, "At least one office must be provided"),
  startDateStr: z.string().min(1, "Start Date is required"),
  isShared: z.boolean().default(false)
})

export async function addTenant(formData: FormData) {
  try {
    const rawData = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      rent: parseFloat(formData.get('monthlyRent') as string),
      waterCharges: parseFloat(formData.get('waterCharges') as string || "0"),
      officesString: formData.get('offices') as string,
      startDateStr: formData.get('startDate') as string,
      isShared: formData.get('isShared') === 'on',
      totalSecurityAmount: parseFloat(formData.get('totalSecurityAmount') as string || "0")
    }

    const parsed = AddTenantSchema.parse(rawData)

    // Split comma-separated string into array of strings and trim whitespace
    const officesArray = parsed.officesString.split(',').map(o => o.trim()).filter(o => o.length > 0)

    if (officesArray.length === 0) {
      throw new Error("Invalid Offices input.")
    }

    // Conflict Check: 
    // If ANY of the input offices are already occupied by someone who is NOT "isShared" (or if the new tenant is not "isShared"), it rejects.
    const existingTenantsInOffices = await prisma.tenantProfile.findMany({
      where: {
        offices: {
          hasSome: officesArray
        }
      }
    })

    if (existingTenantsInOffices.length > 0) {
      const anyNotShared = existingTenantsInOffices.some(t => !t.isShared) || !parsed.isShared
      if (anyNotShared) {
        throw new Error(`One or more of the offices [${officesArray.join(', ')}] are already occupied by a tenant and are not marked as Shared Space.`)
      }
    }

    const securityAmount = parsed.totalSecurityAmount || 0

    await prisma.tenantProfile.create({
      data: {
        name: parsed.name,
        phone: parsed.phone,
        monthlyRent: parsed.rent,
        waterCharges: parsed.waterCharges,
        offices: officesArray,
        isShared: parsed.isShared,
        startDate: new Date(parsed.startDateStr),
        rentStatus: 'unpaid',
        waterStatus: 'unpaid',
        totalSecurityAmount: securityAmount,
        securityPaidSoFar: 0,
        securityStatus: securityAmount > 0 ? 'Pending' : 'Fully Paid'
      }
    })

    revalidatePath('/dashboard')
  } catch (error: any) {
    throw new Error(error.message || "Failed to add tenant")
  }
}

export async function updateTenant(formData: FormData) {
  try {
    const rawData = {
      id: parseInt(formData.get('id') as string),
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      rent: parseFloat(formData.get('monthlyRent') as string),
      waterCharges: parseFloat(formData.get('waterCharges') as string || "0"),
      officesString: formData.get('offices') as string,
      startDateStr: formData.get('startDate') as string,
      isShared: formData.get('isShared') === 'on'
    }

    const parsed = UpdateTenantSchema.parse(rawData)

    const officesArray = parsed.officesString.split(',').map(o => o.trim()).filter(o => o.length > 0)

    if (officesArray.length === 0) {
      throw new Error("Invalid Offices input.")
    }

    // Conflict Check: 
    // Exclude the current tenant being updated from the conflict check
    const existingTenantsInOffices = await prisma.tenantProfile.findMany({
      where: {
        id: { not: parsed.id },
        offices: { hasSome: officesArray }
      }
    })

    if (existingTenantsInOffices.length > 0) {
      const anyNotShared = existingTenantsInOffices.some(t => !t.isShared) || !parsed.isShared
      if (anyNotShared) {
        throw new Error(`One or more of the offices [${officesArray.join(', ')}] are already occupied by another tenant and are not marked as Shared Space.`)
      }
    }

    await prisma.tenantProfile.update({
      where: { id: parsed.id },
      data: {
        name: parsed.name,
        phone: parsed.phone,
        monthlyRent: parsed.rent,
        waterCharges: parsed.waterCharges,
        offices: officesArray,
        isShared: parsed.isShared,
        startDate: new Date(parsed.startDateStr)
      }
    })

    revalidatePath('/dashboard')
  } catch (error: any) {
    throw new Error(error.message || "Failed to update tenant")
  }
}

export async function deleteTenant(tenantId: number) {
  try {
    // Because of onDelete: Cascade in Prisma, this will cleanly wipe all PaymentRecords linked to them as well
    await prisma.tenantProfile.delete({
      where: { id: tenantId }
    })
    revalidatePath('/dashboard')
  } catch (error: any) {
    throw new Error("Failed to delete tenant: " + error.message)
  }
}

export async function markAsPaid(tenantId: number, amount: number, type: 'RENT' | 'WATER') {
  try {
    const currentMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })

    const existingPayment = await prisma.paymentRecord.findFirst({
      where: { tenantId, month: currentMonth, type }
    })

    if (existingPayment) {
      throw new Error(`Already paid ${type} for this month`)
    }

    await prisma.paymentRecord.create({
      data: {
        tenantId,
        amount,
        type,
        month: currentMonth
      }
    })

    await prisma.tenantProfile.update({
      where: { id: tenantId },
      data: type === 'RENT' ? { rentStatus: 'paid' } : { waterStatus: 'paid' }
    })

    let fallbackUrl = null;
    try {
      const waRes = await sendReceiptWhatsApp(tenantId, amount, currentMonth, type)
      if (waRes && waRes.fallbackUrl) {
        fallbackUrl = waRes.fallbackUrl
      }
    } catch (waError) {
      console.error(`WhatsApp ${type} Receipt Delivery Failed:`, waError)
    }

    revalidatePath('/dashboard')
    return { success: true, fallbackUrl }
  } catch (error: any) {
    throw new Error(error.message || "Failed to process payment")
  }
}

export async function sendReceiptWhatsApp(tenantId: number, amount: number, month: string, type: 'RENT' | 'WATER') {
  try {
    const tenant = await prisma.tenantProfile.findUnique({
      where: { id: tenantId }
    })

    if (!tenant) throw new Error("Tenant not found")

    const typeUrdu = type === 'RENT' ? 'rent' : 'water charges'
    const message = `Assalam-o-Alaikum ${tenant.name} Sahab,\n\nShukriya! Hamein aapki taraf se Office/Shop ${tenant.offices.join(', ')} ka mahina ${month} ka ${typeUrdu} Rs. ${amount.toLocaleString()} kamyabi se wasool ho gaya hai.\n\nAapki payment status hamare record mein 'PAID' update ho gayi hai. Ye aik computer-generated digital receipt hai.\n\nJazakAllah,\nManagement - JR Arcade`

    const result = await sendWhatsAppMessage(tenant.phone, message)

    if (!result.success) {
      throw new Error("Failed to send WhatsApp message")
    }

    return { success: true, fallbackUrl: result.fallbackUrl }
  } catch (error: any) {
    throw new Error(error.message || "Failed to send receipt")
  }
}

export async function sendManualReminder(tenantId: number, month: string, type: 'RENT' | 'WATER') {
  try {
    const tenant = await prisma.tenantProfile.findUnique({
      where: { id: tenantId }
    })

    if (!tenant) throw new Error("Tenant not found")

    const amount = type === 'RENT' ? tenant.monthlyRent : tenant.waterCharges
    const typeUrdu = type === 'RENT' ? 'rent' : 'water charges'

    const message = `Assalam-o-Alaikum ${tenant.name} Sahab,\n\nUmeed hai aap khairiyat se honge. JR Arcade ki taraf se ye aik soft reminder hai ke aapke Office/Shop ${tenant.offices.join(', ')} ka mahina ${month} ka ${typeUrdu} Rs. ${amount.toLocaleString()} abhi tak pending hai.\n\nGuzarish hai ke jald az jald payment jama karwa dain takay ledger up-to-date rahay. Agar aap payment kar chuke hain, to baraye meherbani is message ko nazar-andaz (ignore) karein.\n\nShukriya,\nManagement - JR Arcade`

    const result = await sendWhatsAppMessage(tenant.phone, message)

    if (!result.success) {
      throw new Error("Failed to send WhatsApp message")
    }

    return { success: true, fallbackUrl: result.fallbackUrl }
  } catch (error: any) {
    throw new Error(error.message || "Failed to send reminder")
  }
}

export async function sendRemindersToAllUnpaid() {
  try {
    const currentMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })

    const unpaidTenants = await prisma.tenantProfile.findMany({
      where: {
        OR: [
          { rentStatus: 'unpaid' },
          { waterStatus: 'unpaid' }
        ]
      }
    })

    if (unpaidTenants.length === 0) {
      return { success: true, message: 'No unpaid tenants found.' }
    }

    let successCount = 0
    let failureCount = 0

    for (const tenant of unpaidTenants) {
      const officeStr = tenant.offices.join(', ')

      // Send for Rent if unpaid
      if (tenant.rentStatus === 'unpaid') {
        const message = `Assalam-o-Alaikum ${tenant.name} Sahab,\n\nUmeed hai aap khairiyat se honge. JR Arcade ki taraf se ye aik soft reminder hai ke aapke Office/Shop ${officeStr} ka mahina ${currentMonth} ka rent Rs. ${tenant.monthlyRent.toLocaleString()} abhi tak pending hai.\n\nGuzarish hai ke jald az jald payment jama karwa dain takay ledger up-to-date rahay. Agar aap payment kar chuke hain, to baraye meherbani is message ko nazar-andaz (ignore) karein.\n\nShukriya,\nManagement - JR Arcade`
        const result = await sendWhatsAppMessage(tenant.phone, message)
        if (result.success) successCount++; else failureCount++;
      }

      // Send for Water if unpaid
      if (tenant.waterStatus === 'unpaid') {
        const message = `Assalam-o-Alaikum ${tenant.name} Sahab,\n\nUmeed hai aap khairiyat se honge. JR Arcade ki taraf se ye aik soft reminder hai ke aapke Office/Shop ${officeStr} ka mahina ${currentMonth} ka water charges Rs. ${tenant.waterCharges.toLocaleString()} abhi tak pending hai.\n\nGuzarish hai ke jald az jald payment jama karwa dain takay ledger up-to-date rahay. Agar aap payment kar chuke hain, to baraye meherbani is message ko nazar-andaz (ignore) karein.\n\nShukriya,\nManagement - JR Arcade`
        const result = await sendWhatsAppMessage(tenant.phone, message)
        if (result.success) successCount++; else failureCount++;
      }
    }

    return {
      success: true,
      message: `Sent ${successCount} reminders successfully. ${failureCount} failed.`
    }
  } catch (error: any) {
    throw new Error(error.message || "Failed to send all reminders")
  }
}

export async function collectSecurityInstallment(tenantId: number, amount: number) {
  try {
    if (amount <= 0) throw new Error("Amount must be greater than zero")

    const tenant = await prisma.tenantProfile.findUnique({
      where: { id: tenantId }
    })

    if (!tenant) throw new Error("Tenant not found")
    if (tenant.securityStatus === 'Fully Paid') throw new Error("Security is already fully paid")

    const remainingBefore = tenant.totalSecurityAmount - tenant.securityPaidSoFar
    if (amount > remainingBefore) {
      throw new Error(`Amount Rs. ${amount} exceeds remaining balance Rs. ${remainingBefore}`)
    }

    // Create installment record
    await prisma.securityInstallment.create({
      data: { tenantId, amount }
    })

    // Update tenant security fields
    const newPaidSoFar = tenant.securityPaidSoFar + amount
    const newRemaining = tenant.totalSecurityAmount - newPaidSoFar
    const newStatus = newRemaining <= 0 ? 'Fully Paid' : newPaidSoFar > 0 ? 'Partial' : 'Pending'

    await prisma.tenantProfile.update({
      where: { id: tenantId },
      data: {
        securityPaidSoFar: newPaidSoFar,
        securityStatus: newStatus
      }
    })

    // WhatsApp notification
    let fallbackUrl = null
    try {
      const officeStr = tenant.offices.join(', ')
      const remaining = Math.max(0, newRemaining)
      const message = `Assalam-o-Alaikum ${tenant.name} Sahab,\n\nJR Arcade Management ne aapki taraf se Office ${officeStr} ka Security Deposit installment Rs. ${amount.toLocaleString()} wasool kar liya hai.\n\nRemaining Balance: Rs. ${remaining.toLocaleString()}\n${remaining <= 0 ? '✅ Aapka Security Deposit mukammal ho gaya hai. Shukriya!' : ''}\n\nJazakAllah,\nManagement - JR Arcade`
      const result = await sendWhatsAppMessage(tenant.phone, message)
      if (result?.fallbackUrl) fallbackUrl = result.fallbackUrl
    } catch (waError) {
      console.error('WhatsApp security notification failed:', waError)
    }

    revalidatePath('/dashboard')
    return {
      success: true,
      fallbackUrl,
      newPaidSoFar,
      newStatus,
      newRemaining: Math.max(0, newRemaining)
    }
  } catch (error: any) {
    throw new Error(error.message || "Failed to collect installment")
  }
}

export async function exportMonthlyLedger() {
  try {
    const currentMonthLong = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })
    const tenants = await prisma.tenantProfile.findMany({
      include: {
        payments: {
          where: { month: currentMonthLong }
        }
      }
    })

    const reportData = tenants.map(t => {
      const rentPayment = t.payments.find(p => p.type === 'RENT')
      const waterPayment = t.payments.find(p => p.type === 'WATER')
      const latestPaymentDate = t.payments.length > 0
        ? new Date(Math.max(...t.payments.map(p => p.date.getTime()))).toLocaleDateString()
        : 'N/A'

      return {
        'Tenant Name': t.name,
        'Office No': t.offices.join(', '),
        'Rent Paid': rentPayment?.amount || 0,
        'Water Paid': waterPayment?.amount || 0,
        'Total Received': (rentPayment?.amount || 0) + (waterPayment?.amount || 0),
        'Date of Payment': latestPaymentDate
      }
    })

    const base64Content = await generateExcelBase64(reportData, currentMonthLong)
    const fileName = `Ledger_${currentMonthLong.replace(/ /g, '_')}_${Date.now()}.xlsx`

    let uploadSuccess = false
    try {
      // Upload to Supabase Storage (Non-blocking backup)
      const fileBuffer = Buffer.from(base64Content, 'base64')
      await uploadReport(fileBuffer as any, fileName)
      uploadSuccess = true
    } catch (error) {
      console.warn("Supabase backup failed, but local download will proceed:", error)
    }

    return {
      success: true,
      fileName,
      uploadSuccess,
      base64: base64Content
    }
  } catch (error: any) {
    console.error("Export Ledger Error:", error)
    throw new Error(error.message || "Failed to export ledger")
  }
}

// ─── Expense Actions ──────────────────────────────────────────────────

export async function addExpense(formData: FormData) {
  try {
    const category = formData.get('category') as string
    const description = formData.get('description') as string
    const amount = parseFloat(formData.get('amount') as string)
    const dateStr = formData.get('date') as string

    if (!category || !description || isNaN(amount) || amount <= 0) {
      throw new Error('All fields are required and amount must be positive.')
    }

    await prisma.expense.create({
      data: {
        category,
        description,
        amount,
        date: dateStr ? new Date(dateStr) : new Date()
      }
    })

    revalidatePath('/dashboard/expenses')
    revalidatePath('/dashboard/ledger')
  } catch (error: any) {
    throw new Error(error.message || 'Failed to add expense')
  }
}

export async function deleteExpense(id: number) {
  try {
    await prisma.expense.delete({ where: { id } })
    revalidatePath('/dashboard/expenses')
    revalidatePath('/dashboard/ledger')
  } catch (error: any) {
    throw new Error(error.message || 'Failed to delete expense')
  }
}

// ─── Settings / PropertyInfo Actions ──────────────────────────────────────────

export async function savePropertyInfo(formData: FormData) {
  try {
    const propertyName = formData.get('propertyName') as string
    const phone = formData.get('phone') as string
    const email = formData.get('email') as string
    const address = formData.get('address') as string

    await prisma.propertyInfo.upsert({
      where: { id: 1 },
      update: { propertyName, phone, email, address },
      create: { id: 1, propertyName, phone, email, address }
    })

    revalidatePath('/dashboard/settings')
  } catch (error: any) {
    throw new Error(error.message || 'Failed to save settings')
  }
}
