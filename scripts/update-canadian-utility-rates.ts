/**
 * Sync the 13 Canadian province rows of the "Utility Rates" versioned database with the
 * compiled constants in lib/calculator/constants/utilities.ts.
 *
 * Needed because the 2.0 engine reads utility rates from this database (not the compiled
 * constants), and provinceRows() in the release loader preserves whatever the database
 * already holds — so new Canadian gas/water values must be written here once.
 *
 *   npx dotenv-cli -e .env -- npx tsx scripts/update-canadian-utility-rates.ts
 *
 * Prints a before/after diff per province. After running, cut a release
 * (scripts/cut-release.ts) so the change is a restorable, citable version.
 */
import { CANADIAN_REGIONS, STATES } from 'lib/calculator/constants/utilities';
import prisma from 'lib/prisma';

const SOURCE_STATUS =
  'Electric: Hydro-Québec 2025 comparison (C$/kWh). Gas: StatCan 25-10-0086-01, commercial value ÷ energy, ' +
  '12 mo ending Jun 2026 (C$/therm; PEI/NL/YT/NU have no piped gas — Canadian average used). ' +
  'Water: average of 7 major cities’ 2025–26 commercial water+wastewater schedules (C$/1000 gal). ' +
  'See docs/CANADIAN-UTILITY-RATES.md';

async function main() {
  const db = await prisma.factorDatabase.findUnique({
    where: { name: 'Utility Rates' },
    include: { rows: { orderBy: { rowIndex: 'asc' } } }
  });
  if (!db) throw new Error('Utility Rates database not found — run the data-release loader first.');

  let updated = 0;
  for (const region of CANADIAN_REGIONS) {
    const constants = STATES.find(s => s.name === region);
    if (!constants || !('water' in constants)) throw new Error(`No compiled constants for ${region}`);

    const row = db.rows.find(r => (r.data as Record<string, unknown>).state === region);
    if (!row) {
      console.warn(`MISSING row for ${region} — run the data-release loader to create province rows.`);
      continue;
    }
    const before = row.data as Record<string, unknown>;
    const after = {
      ...before,
      electric_rate_usd_per_kwh: constants.electric,
      gas_rate_usd_per_therm: constants.gas,
      water_rate_usd_per_1000_gal: constants.water,
      source_status: SOURCE_STATUS
    };
    await prisma.factorDatabaseRow.update({ where: { id: row.id }, data: { data: after } });
    console.log(
      `${region.padEnd(26)} gas ${String(before.gas_rate_usd_per_therm)} -> ${constants.gas}  ` +
        `water ${String(before.water_rate_usd_per_1000_gal)} -> ${constants.water}`
    );
    updated++;
  }
  console.log(`\nUpdated ${updated}/${CANADIAN_REGIONS.length} province rows.`);
  console.log('Next: cut a release so this is a restorable version, e.g.');
  console.log('  npx dotenv-cli -e .env -- npx tsx scripts/cut-release.ts v2.2 "Canadian gas and water rates" <actor-id>');
}

main()
  .catch(err => {
    console.error(err.message ?? err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
