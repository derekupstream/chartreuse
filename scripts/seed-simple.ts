/**
 * Simple seed script - just seed users for testing
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const LOCAL_ADMIN_USER_ID = 'local-seed-admin';
const LOCAL_ADMIN_EMAIL = 'admin@chartreuse.local';

async function seedLocalAdminUser() {
  console.log('Creating local admin user...');

  // Find an org to link user to
  const anyOrg = await prisma.org.findFirst();

  await prisma.user.upsert({
    where: { id: LOCAL_ADMIN_USER_ID },
    update: {},
    create: {
      id: LOCAL_ADMIN_USER_ID,
      name: 'Local Admin',
      email: LOCAL_ADMIN_EMAIL,
      orgId: anyOrg?.id || 'default-org',
      role: 'ORG_ADMIN',
    },
  });
  console.log(`  ✓ Admin user created: ${LOCAL_ADMIN_EMAIL}`);
}

async function main() {
  console.log('🌱 Starting simple seed...\n');
  
  await seedLocalAdminUser();
  
  console.log('\n✅ Simple seed complete!');
  console.log(`\nLocal admin user: ${LOCAL_ADMIN_EMAIL}`);
  console.log('You can now use this email for testing (no password required in dev mode).');
}

main()
  .catch(e => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
