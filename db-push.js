const { execSync } = require('child_process');

console.log('--- Database Setup Check ---');
if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
  console.log('Vercel/Production environment detected.');
  
  if (!process.env.DATABASE_URL) {
    console.warn('WARNING: DATABASE_URL environment variable is not defined on Vercel.');
    console.warn('Please add it in Vercel project Settings -> Environment Variables.');
  } else {
    try {
      console.log('Automatically pushing database schema using Prisma...');
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
      console.log('Database schema pushed successfully!');
    } catch (err) {
      console.error('Error: Database schema push failed. Detailed error below:');
      console.error(err.message || err);
      // We do not crash the build to allow Next.js compilation to finish
    }
  }
} else {
  console.log('Local development environment detected. Skipping automatic db push.');
}
console.log('----------------------------');
