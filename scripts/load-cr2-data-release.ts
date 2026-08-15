/**
 * Loads Data Release 2.0 — the reference tables from Madhavi's "Combined Data & Calculation
 * Model (Draft)" workbook (2026-08-14) — into the Databases area, one database per workbook
 * tab, named exactly as she names them, so updating a database feels like updating the tab
 * it came from.
 *
 *   npx tsx scripts/load-cr2-data-release.ts
 *
 * Version semantics (per Derek, 2026-08-15):
 * - kind 'factors' (GHG, Water, Transport, Purchase Frequency, Utility Rates, Dishwasher):
 *   changing these changes calculations, so changes bump the version.
 * - kind 'reference' (the two product directories): they grow without a version change;
 *   the changelog still records every upload.
 * - Everything in this release is stamped 2.0.
 *
 * Also cleans up: the pre-2.0 seeded tables ("Single-Use Material Factors", "Reusable
 * Material Factors", "State & Province Utility Rates") and the short-lived "(2.0 Model)"
 * suffixed names. Canadian provinces from the old rates table are folded into Utility Rates
 * so the Hydro-Québec work isn't lost. Removing the "* Material Factors" tables is
 * result-neutral for the live engine: they were seeded from the compiled constants the
 * engine falls back to.
 *
 * Data payload: scripts/data/cr2-release-2.0.json, exported verbatim from the workbook minus
 * one dangling annotation row. The workbook's known FORMULA issues don't affect these tables.
 */
import { readFileSync } from 'fs';
import path from 'path';

import prisma from 'lib/prisma';

const RELEASE_VERSION = '2.0';
const SOURCE_NOTE = 'Combined Data & Calculation Model (Draft) — Madhavi, 2026-08-14';

const PROVINCES = [
  'British Columbia',
  'Alberta',
  'Saskatchewan',
  'Manitoba',
  'Ontario',
  'Quebec',
  'New Brunswick',
  'Nova Scotia',
  'Prince Edward Island',
  'Newfoundland and Labrador',
  'Yukon',
  'Northwest Territories',
  'Nunavut'
];

const REMOVE_AFTER_LOAD = [
  'Single-Use Material Factors',
  'Reusable Material Factors',
  'State & Province Utility Rates',
  'GHG Factors (2.0 Model)',
  'Water Factors (2.0 Model)',
  'Transportation Factors (2.0 Model)',
  'Purchase Frequency (2.0 Model)',
  'Utility Rates (2.0 Model)',
  'Dishwasher Factors (2.0 Model)'
];

type Row = Record<string, string | number | null>;
type Payload = Record<string, Row[]>;

type TableSpec = {
  payloadKey: string;
  name: string;
  kind: 'factors' | 'reference';
  description: string;
  keyColumn: string;
};

// One database per workbook tab, named as the tab reads.
const TABLES: TableSpec[] = [
  {
    payloadKey: 'single_use_products',
    name: 'Single-Use Products',
    kind: 'reference',
    description: 'Single-use product directory (workbook tab: Single_Use_Products). Grows without a version bump.',
    keyColumn: 'product_id'
  },
  {
    payloadKey: 'reusable_products',
    name: 'Reusable Products',
    kind: 'reference',
    description:
      'Reusable product directory (workbook tab: Reusable_Products). Prices are reference-only; costs are user inputs.',
    keyColumn: 'product_id'
  },
  {
    payloadKey: 'ghg_factors',
    name: 'GHG Factors',
    kind: 'factors',
    description:
      'Material GHG factors, scoped Single-Use vs Reusable, MTCO2e/lb (workbook tab: GHG_Factors). Not yet wired to the live v1 engine.',
    keyColumn: 'material'
  },
  {
    payloadKey: 'water_factors',
    name: 'Water Factors',
    kind: 'factors',
    description:
      'Material water factors, CTGT boundary, scoped Single-Use vs Reusable, gal/lb (workbook tab: Water_Factors). Not yet wired to the live v1 engine.',
    keyColumn: 'material'
  },
  {
    payloadKey: 'transport_factors',
    name: 'Transport Factors',
    kind: 'factors',
    description: 'Applied once to full shipped mass, product + box (workbook tab: Transport_Factors). Approved 2026-08-07.',
    keyColumn: 'Mode'
  },
  {
    payloadKey: 'purchase_frequency',
    name: 'Purchase Frequency',
    kind: 'factors',
    description: 'Annualization factors for purchase/cost frequencies (workbook tab: Purchase_Frequency).',
    keyColumn: 'Frequency'
  },
  {
    payloadKey: 'utility_rates',
    name: 'Utility Rates',
    kind: 'factors',
    description:
      'US state rates from the workbook (gas corrected to $/therm, Q-001) plus Canadian provinces carried over from the Hydro-Québec work (workbook tab: Utility_Rates).',
    keyColumn: 'state'
  },
  {
    payloadKey: 'dishwasher_factors',
    name: 'Dishwasher Factors',
    kind: 'factors',
    description:
      'ENERGY STAR CFS machine table, March 2021 (workbook tab: Dishwasher_Factors). Heater/emission constants live in the methodology spec.',
    keyColumn: 'machine_type'
  }
];

function columnsFrom(rows: Row[]): { key: string; label: string; type: 'text' | 'number' }[] {
  const keys = Array.from(new Set(rows.flatMap(row => Object.keys(row))));
  return keys.map(key => ({
    key,
    label: key,
    type: rows.some(row => typeof row[key] === 'number') ? 'number' : 'text'
  }));
}

/** Provinces from the legacy rates table, reshaped to the workbook's Utility_Rates columns. */
async function provinceRows(): Promise<Row[]> {
  const legacy = await prisma.factorDatabase.findUnique({
    where: { name: 'State & Province Utility Rates' },
    include: { rows: { orderBy: { rowIndex: 'asc' } } }
  });
  if (!legacy) return [];
  return legacy.rows
    .map(r => r.data as Record<string, unknown>)
    .filter(row => PROVINCES.includes(String(row.name)))
    .map(row => ({
      state: String(row.name),
      electric_rate_usd_per_kwh: Number(row.electric),
      gas_rate_usd_per_therm: Number(row.gas),
      water_rate_usd_per_1000_gal: 11.0,
      source_status:
        'Hydro-Québec 2025 comparison (electric, C$/kWh); gas and water are US placeholders pending a 2.0 Canadian set'
    }));
}

async function loadTable(spec: TableSpec, rows: Row[]) {
  const existing = await prisma.factorDatabase.findUnique({
    where: { name: spec.name },
    include: { _count: { select: { rows: true } } }
  });

  const columns = columnsFrom(rows);
  const data = {
    name: spec.name,
    description: spec.description,
    sourceName: SOURCE_NOTE,
    version: RELEASE_VERSION,
    kind: spec.kind,
    keyColumn: spec.keyColumn,
    columns: columns as unknown as object
  };

  const database = existing
    ? await prisma.factorDatabase.update({ where: { id: existing.id }, data })
    : await prisma.factorDatabase.create({ data });

  if (existing) await prisma.factorDatabaseRow.deleteMany({ where: { databaseId: database.id } });

  const CHUNK = 200;
  for (let i = 0; i < rows.length; i += CHUNK) {
    await prisma.factorDatabaseRow.createMany({
      data: rows.slice(i, i + CHUNK).map((row, j) => ({
        databaseId: database.id,
        rowIndex: i + j,
        data: row as unknown as object
      }))
    });
  }

  await prisma.factorDatabaseChange.create({
    data: {
      databaseId: database.id,
      action: existing ? 'replace' : 'create',
      versionBefore: existing?.version ?? null,
      versionAfter: RELEASE_VERSION,
      rowsAdded: rows.length,
      rowsRemoved: existing?._count.rows ?? 0,
      rowCountAfter: rows.length,
      columnsTouched: columns.map(c => c.key) as unknown as object,
      sourceNote: SOURCE_NOTE
    }
  });

  console.log(
    `${existing ? 'replaced' : 'created'}  ${spec.name} [${spec.kind}]  ${existing ? `${existing.version} → ` : ''}${RELEASE_VERSION}  (${rows.length} rows)`
  );
}

async function main() {
  const payloadPath = path.join(process.cwd(), 'scripts/data/cr2-release-2.0.json');
  const payload = JSON.parse(readFileSync(payloadPath, 'utf8')) as Payload;

  // Provinces first — read from the legacy table before it is removed.
  const provinces = await provinceRows();

  for (const spec of TABLES) {
    let rows = payload[spec.payloadKey];
    if (!rows?.length) {
      console.warn(`SKIP ${spec.name} — no rows in payload`);
      continue;
    }
    if (spec.payloadKey === 'utility_rates' && provinces.length) {
      rows = [...rows, ...provinces];
      console.log(`  (folding ${provinces.length} Canadian provinces into Utility Rates)`);
    }
    await loadTable(spec, rows);
  }

  for (const name of REMOVE_AFTER_LOAD) {
    const gone = await prisma.factorDatabase.deleteMany({ where: { name } });
    if (gone.count) console.log(`removed  ${name}`);
  }

  console.log('\nData Release 2.0 loaded — one database per workbook tab.');
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
