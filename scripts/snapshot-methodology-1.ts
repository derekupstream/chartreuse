/**
 * Cuts the "Methodology 1.0" snapshot — the immutable record of what the legacy engine
 * calculated with, so the version every existing project is pinned to is a real branch and
 * not just a default string.
 *
 * 1.0's factors live in compiled code, not tables, so this snapshot captures the actual
 * values from the constants the engine reads: the material map (GHG + water factors), the
 * state utility rates, and the named engine constants. Idempotent.
 *
 *   npx tsx scripts/snapshot-methodology-1.ts
 */
import { MATERIAL_MAP, CORRUGATED_CARDBOARD_GAS } from 'lib/calculator/constants/materials';
import { TRANSPORTATION_CO2_EMISSIONS_FACTOR } from 'lib/calculator/constants/carbon-dioxide-emissions';
import prisma from 'lib/prisma';

const NAME = 'Methodology 1.0 — legacy engine';

async function main() {
  const existing = await prisma.methodologySnapshot.findFirst({ where: { name: NAME } });
  if (existing) {
    console.log('Methodology 1.0 snapshot already exists — nothing to do.');
    return;
  }

  const upstreamUsers = await prisma.user.findMany({ where: { org: { isUpstream: true } }, select: { id: true } });
  const author = upstreamUsers.find(u => /^[0-9a-f-]{36}$/i.test(u.id));
  if (!author) throw new Error('No UUID-shaped upstream user found for createdBy');

  const materials = Object.entries(MATERIAL_MAP).map(([id, m]) => ({
    materialId: Number(id),
    name: m.name,
    mtco2ePerLb: m.mtco2ePerLb,
    waterUsageGalPerLb: m.waterUsageGalPerLb ?? null
  }));

  await prisma.methodologySnapshot.create({
    data: {
      createdBy: author.id,
      name: NAME,
      status: 'published',
      publishedAt: new Date(),
      notes:
        'The methodology every pre-2.0 project is pinned to. Factors compiled into the engine ' +
        '(lib/calculator/constants), captured here verbatim so 1.0 is reconstructible without ' +
        'reading git history. Known 1.0 characteristics, superseded in 2.0: ocean freight applied ' +
        'to product mass and box mass separately; unscoped material factors; non-CTGT water ' +
        'boundary; flat $0.92/therm gas rate for every state; waste excludes reusable mass.',
      databaseVersionsJson: {
        source: 'compiled constants (lib/calculator/constants), not database tables',
        engine: 'v1 (lib/calculator/getProjections.ts)',
        constants: {
          CORRUGATED_CARDBOARD_GAS,
          TRANSPORTATION_CO2_EMISSIONS_FACTOR,
          flatGasRateUsdPerTherm: 0.92
        },
        materials
      } as unknown as object
    }
  });

  console.log(`snapshot  ${NAME} (${materials.length} material factor sets captured)`);
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
