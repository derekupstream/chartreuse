import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const ORG_ID = process.argv[2];
if (!ORG_ID) {
  console.error('Usage: npx tsx scripts/delete-org.ts <orgId>');
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const before = await prisma.org.findUnique({
    where: { id: ORG_ID },
    include: {
      users: { select: { id: true, email: true } },
      accounts: {
        include: {
          projects: { select: { id: true, name: true } },
        },
      },
    },
  });
  if (!before) {
    console.log(`No org ${ORG_ID} — nothing to delete`);
    return;
  }
  console.log(`Deleting org ${ORG_ID} (${before.name})`);
  console.log(`  users:    ${before.users.length} (${before.users.map((u) => u.email).join(', ')})`);
  console.log(`  accounts: ${before.accounts.length}`);
  for (const a of before.accounts) {
    console.log(`    - ${a.id} (${a.name}) projects: ${a.projects.length}`);
  }

  const result = await prisma.org.delete({ where: { id: ORG_ID } });
  console.log(`Deleted org ${result.id}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
