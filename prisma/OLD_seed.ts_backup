import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('Starting execution of seed script...')

    // 1. Create Admin User
    const adminPasswordHash = await bcrypt.hash('admin123', 10)

    const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            passwordHash: adminPasswordHash,
            role: 'ADMIN',
        },
    })
    console.log(`Admin user ready: ${admin.username} (password: admin123)`)

    // 2. Create the 15 Offices if they don't exist
    const existingOffices = await prisma.office.count()
    if (existingOffices === 0) {
        const defaultOffices = Array.from({ length: 15 }).map((_, i) => ({
            officeNumber: i + 1,
            floor: Math.ceil((i + 1) / 5),
            isOccupied: false,
        }))
        await prisma.office.createMany({ data: defaultOffices })
        console.log('Generated 15 offices directory.')
    }

    // 3. Create a Demo Tenant User
    const tenantPasswordHash = await bcrypt.hash('tenant123', 10)

    const tenantUser = await prisma.user.upsert({
        where: { username: 'johndoe' },
        update: {},
        create: {
            username: 'johndoe',
            passwordHash: tenantPasswordHash,
            role: 'TENANT',
        },
    })

    // 4. Create Tenant Profile for Demo User
    const existingProfile = await prisma.tenantProfile.findUnique({
        where: { userId: tenantUser.id }
    })

    if (!existingProfile) {
        const tenantProfile = await prisma.tenantProfile.create({
            data: {
                userId: tenantUser.id,
                name: 'John Doe',
                phone: '555-0199',
                leaseStart: new Date('2026-01-01'),
                leaseEnd: new Date('2027-01-01'),
                monthlyRent: 1500.00,
                securityDeposit: 3000.00,
            }
        })

        // Update office occupancy
        await prisma.office.update({
            where: { officeNumber: 1 },
            data: {
                isOccupied: true,
                tenantId: tenantProfile.id
            }
        })

        // Create a demo payment record
        await prisma.paymentRecord.create({
            data: {
                tenantId: tenantProfile.id,
                type: 'RENT',
                amount: 1500.00,
                status: 'UNPAID',
                dueDate: new Date('2026-02-01')
            }
        })

        // Create a demo notification
        await prisma.notification.create({
            data: {
                userId: tenantUser.id,
                message: 'Welcome to JR Arcade! Your lease starts on Jan 1st, 2026.'
            }
        })

        // Create a demo ledger entry
        await prisma.ledgerEntry.create({
            data: {
                type: 'INCOME',
                amount: 3000.00,
                description: 'Security Deposit for Office 1 - John Doe'
            }
        })

        console.log(`Demo tenant ready: ${tenantUser.username} (password: tenant123) residing in Office #1`)
    }

    console.log('Seeding finished successfully!')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
