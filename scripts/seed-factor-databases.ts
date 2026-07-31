/**
 * Loads the reference tables Chart-Reuse actually calculates from into the
 * Factor Databases area, each keeping its native column structure:
 *
 *   - Single-Use Products      (from assets/upstream/single-use-products-data.csv)
 *   - Reusable Products        (from assets/reusables/reusable-products-data.csv)
 *   - Single-Use Materials     (MATERIALS: emission + water factors per material)
 *   - Reusable Materials       (REUSABLE_MATERIALS)
 *   - State & Province Utility Rates (STATES)
 *
 * Usage (local):      npx tsx scripts/seed-factor-databases.ts
 *        (production): npx dotenv-cli -e .env.production -- npx tsx scripts/seed-factor-databases.ts
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import neatCsv from 'neat-csv';

import { MATERIALS, REUSABLE_MATERIALS } from '../lib/calculator/constants/materials';
import { STATES, isCanadianRegion } from '../lib/calculator/constants/utilities';

type Column = { key: string; label: string; type: 'text' | 'number' };
type Row = Record<string, string | number | null>;

function buildUrl() {
  const url = new URL(process.env.DATABASE_URL!);
  if (url.hostname.includes('supabase')) {
    url.searchParams.set('pgbouncer', 'true');
    url.searchParams.set('sslmode', 'require');
  }
  return url.toString();
}
const prisma = new PrismaClient({ datasourceUrl: buildUrl() });

const isNumeric = (v: unknown) => typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v.replace(/[$,%]/g, '')));

/** Infer column definitions from CSV rows, keeping the source header order and labels. */
function columnsFromCsv(rows: Record<string, string>[]): Column[] {
  const headers = Object.keys(rows[0] ?? {}).filter(h => h.trim() !== '');
  return headers.map(h => ({
    key: h,
    label: h,
    type: rows.some(r => isNumeric(r[h])) ? 'number' : 'text'
  }));
}

async function upsertDatabase(input: {
  name: string;
  description: string;
  sourceName: string;
  sourceUrl?: string;
  keyColumn?: string;
  columns: Column[];
  rows: Row[];
}) {
  const existing = await prisma.factorDatabase.findUnique({ where: { name: input.name } });
  const data = {
    name: input.name,
    description: input.description,
    sourceName: input.sourceName,
    sourceUrl: input.sourceUrl ?? null,
    keyColumn: input.keyColumn ?? null,
    columns: input.columns as unknown as object,
    version: '1'
  };
  const db = existing
    ? await prisma.factorDatabase.update({ where: { id: existing.id }, data })
    : await prisma.factorDatabase.create({ data });
  await prisma.factorDatabaseRow.deleteMany({ where: { databaseId: db.id } });

  const CHUNK = 200;
  for (let i = 0; i < input.rows.length; i += CHUNK) {
    await prisma.factorDatabaseRow.createMany({
      data: input.rows.slice(i, i + CHUNK).map((row, j) => ({
        databaseId: db.id,
        rowIndex: i + j,
        data: row as unknown as object
      }))
    });
  }
  console.log(`  ${existing ? 'updated' : 'created'}  ${input.name.padEnd(34)} ${input.columns.length} cols x ${input.rows.length} rows`);
}

async function main() {
  console.log('Loading reference databases:\n');

  // ── product catalogs, straight from the CSVs the calculator reads
  for (const [name, file, description] of [
    [
      'Single-Use Products',
      'lib/inventory/assets/upstream/single-use-products-data.csv',
      'Every single-use product the calculator can price and weigh: materials, item and case weights, box weights, case counts.'
    ],
    [
      'Reusable Products',
      'lib/inventory/assets/reusables/reusable-products-data.csv',
      'Every reusable product: materials, item and case weights, case counts and prices.'
    ]
  ] as const) {
    const csv = await neatCsv<Record<string, string>>(readFileSync(process.cwd() + '/' + file));
    await upsertDatabase({
      name,
      description,
      sourceName: file.split('/').pop()!,
      keyColumn: 'Product ID',
      columns: columnsFromCsv(csv),
      rows: csv as unknown as Row[]
    });
  }

  // ── material factor tables
  const materialColumns: Column[] = [
    { key: 'id', label: 'Material ID', type: 'number' },
    { key: 'name', label: 'Material', type: 'text' },
    { key: 'mtco2ePerLb', label: 'GHG (MTCO2e/lb)', type: 'number' },
    { key: 'waterUsageGalPerLb', label: 'Water (gal/lb)', type: 'number' }
  ];
  await upsertDatabase({
    name: 'Single-Use Material Factors',
    description: 'Emission and water factors for each single-use material, applied per pound of product.',
    sourceName: 'EPA WARM Model',
    keyColumn: 'name',
    columns: materialColumns,
    rows: MATERIALS.map(m => ({
      id: m.id,
      name: m.name,
      mtco2ePerLb: m.mtco2ePerLb,
      waterUsageGalPerLb: m.waterUsageGalPerLb ?? null
    }))
  });
  await upsertDatabase({
    name: 'Reusable Material Factors',
    description: 'Emission and water factors for each reusable material, applied per pound of product.',
    sourceName: 'EPA WARM Model',
    keyColumn: 'name',
    columns: materialColumns,
    rows: REUSABLE_MATERIALS.map(m => ({
      id: m.id,
      name: m.name,
      mtco2ePerLb: m.mtco2ePerLb,
      waterUsageGalPerLb: m.waterUsageGalPerLb ?? null
    }))
  });

  // ── utility rates
  await upsertDatabase({
    name: 'State & Province Utility Rates',
    description:
      'Commercial electricity and gas rates by US state and Canadian province, used for dishwashing utility costs.',
    sourceName: 'EIA (US) / Hydro-Québec 2025 comparison (Canada)',
    keyColumn: 'name',
    columns: [
      { key: 'name', label: 'State / Province', type: 'text' },
      { key: 'country', label: 'Country', type: 'text' },
      { key: 'electric', label: 'Electric ($/kWh)', type: 'number' },
      { key: 'gas', label: 'Gas ($/therm)', type: 'number' }
    ],
    rows: STATES.map(s => ({
      name: s.name,
      country: isCanadianRegion(s.name) ? 'Canada' : 'United States',
      electric: s.electric,
      gas: s.gas
    }))
  });

  const total = await prisma.factorDatabase.count();
  console.log(`\n${total} databases available at /admin/data-science/databases`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
