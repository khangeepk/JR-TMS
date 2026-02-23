const { execSync } = require('child_process');

try {
    console.log('Running prisma db push...');
    execSync('npx prisma db push', { stdio: 'inherit' });
    console.log('Successfully pushed DB schema.');
} catch (error) {
    console.error('Failed to push schema:', error.message);
}
