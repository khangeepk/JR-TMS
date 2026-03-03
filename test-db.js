const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function testConnection(region) {
    const url = `postgresql://postgres.rziqajggcfmlbcejgugh:khangee786786@aws-0-${region}.pooler.supabase.com:6543/postgres?pgbouncer=true`;
    const prisma = new PrismaClient({ datasourceUrl: url });
    try {
        const res = await prisma.$queryRaw`SELECT 1`;
        console.log(`[SUCCESS] Region found: ${region}`);
        fs.appendFileSync('pooler_results.txt', `SUCCESS: ${region}\n`);
        await prisma.$disconnect();
        return true;
    } catch (e) {
        fs.appendFileSync('pooler_results.txt', `FAIL ${region}: ${e.message}\n---------------------\n`);
        return false;
    }
}

async function run() {
    fs.writeFileSync('pooler_results.txt', '');
    const regions = [
        'eu-west-3', 'eu-central-1', 'eu-west-1', 'eu-west-2', 'eu-central-2', 'eu-north-1', 'eu-south-1',
        'ap-south-1', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2', 'ap-northeast-3', 'ap-east-1',
        'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
        'sa-east-1', 'ca-central-1', 'me-south-1', 'af-south-1'
    ];

    const promises = regions.map(r => testConnection(r).catch(() => false));
    await Promise.all(promises);
}

run();
