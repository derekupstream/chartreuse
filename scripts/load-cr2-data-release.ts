/**
 * Loads Data Release 2.0 — the reference tables from Madhavi's "Combined Data & Calculation
 * Model (Draft)" workbook (2026-08-14) — into the Databases area, with a changelog entry per
 * table so the release is citable.
 *
 *   npx tsx scripts/load-cr2-data-release.ts
 *
 * What it does, deliberately:
 * - "Single-Use Products" and "Reusable Products" are REPLACED in place (1 → 2.0): they are
 *   reference data; the running v1 engine does not read products from the Databases area.
 * - The factor tables load under names that do NOT end in "Material Factors", because
 *   lib/calculator/factors/loadMaterialFactorOverrides.ts feeds the LIVE engine from any
 *   active database with that suffix. The 2.0 factors must not change v1 results until the
 *   consent-based upgrade flow exists (docs/CR2-CALC-MODEL.md).
 *
 * Data payload: scripts/data/cr2-release-2.0.json, exported from the workbook verbatim except
 * that one dangling annotation row ("CTGT") in Water_Factors was dropped. The known issues in
 * the workbook's FORMULAS (unscoped box-water lookup) do not affect these tables.
 *
 * Idempotent: re-running replaces the 2.0 tables and appends new changelog entries.
 */
import { readFileSync } from 'fs';
import path from 'path';

import prisma from 'lib/prisma';

const RELEASE_VERSION = '2.0';
const SOURCE_NOTE = 'Combined Data & Calculation Model (Draft) — Madhavi, 2026-08-14';

type Row = Record<string, string | number | null>;
type Payload = Record<string, Row[]>;

type TableSpec = {
  payloadKey: string;
  name: string;
  description: string;
  keyColumn: string;
};

const TABLES: TableSpec[] = [
  {
    payloadKey: 'single_use_products',
    name: 'Single-Use Products',
    description: 'Single-use product directory — 2.0 model. Item weight derived from net case weight / case count.',
    keyColumn: 'product_id'
  },
  {
    payloadKey: 'reusable_products',
    name: 'Reusable Products',
    description: 'Reusable product directory — 2.0 model. Prices are reference-only; costs are user inputs.',
    keyColumn: 'product_id'
  },
  {
    payloadKey: 'ghg_factors',
    name: 'GHG Factors (2.0 Model)',
    description:
      'Material GHG factors, scoped Single-Use vs Reusable (same material can carry two values). MTCO2e/lb. Not yet wired to the live engine.',
    keyColumn: 'material'
  },
  {
    payloadKey: 'water_factors',
    name: 'Water Factors (2.0 Model)',
    description:
      'Material water factors, CTGT boundary, scoped Single-Use vs Reusable. gal/lb. Not yet wired to the live engine.',
    keyColumn: 'material'
  },
  {
    payloadKey: 'transport_factors',
    name: 'Transportation Factors (2.0 Model)',
    description: 'Applied once to full shipped mass (product + box). Approved 2026-08-07.',
    keyColumn: 'Mode'
  },
  {
    payloadKey: 'purchase_frequency',
    name: 'Purchase Frequency (2.0 Model)',
    description: 'Annualization factors for purchase/cost frequencies.',
    keyColumn: 'Frequency'
  },
  {
    payloadKey: 'utility_rates',
    name: 'Utility Rates (2.0 Model)',
    description:
      'US state rates. Gas corrected to $/therm from EIA 2019 $/Mcf (÷10.37) — resolves Q-001. Provinces remain in "State & Province Utility Rates" pending a 2.0 Canadian set.',
    keyColumn: 'state'
  },
  {
    payloadKey: 'dishwasher_factors',
    name: 'Dishwasher Factors (2.0 Model)',
    description: 'ENERGY STAR CFS machine table (March 2021). Heater/emission constants live in the methodology spec.',
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
    `${existing ? 'replaced' : 'created'}  ${spec.name}  ${existing ? `${existing.version} → ` : ''}${RELEASE_VERSION}  (${rows.length} rows)`
  );
}

async function main() {
  const payloadPath = path.join(process.cwd(), 'scripts/data/cr2-release-2.0.json');
  const payload = JSON.parse(readFileSync(payloadPath, 'utf8')) as Payload;

  for (const spec of TABLES) {
    const rows = payload[spec.payloadKey];
    if (!rows?.length) {
      console.warn(`SKIP ${spec.name} — no rows in payload`);
      continue;
    }
    await loadTable(spec, rows);
  }

  console.log('\nData Release 2.0 loaded. History is visible on each database in Super Admin → Data Science → Databases.');
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
