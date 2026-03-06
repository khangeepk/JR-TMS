const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
    const existingAdmin = await prisma.user.findUnique({
        where: { username: 'admin' }
    })

    if (existingAdmin) {
        console.log('Admin user already exists.')
        return
    }

    const hashedPassword = await bcrypt.hash('admin123', 10)

    await prisma.user.create({
        data: {
            username: 'admin',
            passwordHash: hashedPassword,
            name: 'Super Admin',
            isAdmin: true,
            canEdit: true,
            canAdd: true,
            canDelete: true,
        }
    })

    console.log('Admin user created successfully! Username: admin | Password: admin123')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
