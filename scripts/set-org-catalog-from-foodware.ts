import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import neatCsv from 'neat-csv';

// Sets an org's catalogSettings to exactly the products in the curated
// foodware-options.csv (the SES/Eugene program list).
// Usage: npx dotenv-cli -e .env.production -- npx tsx scripts/set-org-catalog-from-foodware.ts <orgId>

const orgId = process.argv[2];
if (!orgId) {
  console.error('Usage: npx tsx scripts/set-org-catalog-from-foodware.ts <orgId>');
  process.exit(1);
}

const url = new URL(process.env.DATABASE_URL!);
url.searchParams.set('pgbouncer', 'true');
url.searchParams.set('sslmode', 'require');
const prisma = new PrismaClient({ datasourceUrl: url.toString() });

async function main() {
  const csv = readFileSync(process.cwd() + '/lib/inventory/assets/event-foodware/foodware-options.csv');
  const rows = await neatCsv<{ crrid: string; crsuid: string; eugenename: string }>(csv);

  const reusableProductIds = Array.from(new Set(rows.map(r => r.crrid)));
  const singleUseProductIds = Array.from(new Set(rows.map(r => r.crsuid)));

  const org = await prisma.org.update({
    where: { id: orgId },
    data: { catalogSettings: { reusableProductIds, singleUseProductIds } },
    select: { name: true, catalogSettings: true }
  });

  console.log(`Catalog set for org "${org.name}" (${orgId}):`);
  console.log(JSON.stringify(org.catalogSettings, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
