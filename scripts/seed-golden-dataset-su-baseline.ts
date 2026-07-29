/**
 * Golden dataset from Madhavi's `new-cr-test.xlsx` (2026-07-21) — single-use baseline block.
 *
 * Encodes the three single-use line items from her sheet as calculator inputs, and her
 * spreadsheet's row-16 dashboard values as expectedOutputs. It is EXPECTED TO FAIL today:
 * the per-metric diff is the artifact for data-science review (see docs/DATA-REVIEW-AGENDA.md §3).
 *
 * Why only the single-use block: her reuse rows (F19/G19) sum the single-use item columns
 * a second time (`=sum(W2:W4,W5:W7,Y5:Y7)`) and fold in dishwashing figures computed outside
 * the sheet, so those expected values need her confirmation before encoding.
 *
 * Usage (local):      npx tsx scripts/seed-golden-dataset-su-baseline.ts
 *        (production): npx dotenv-cli -e .env.production -- npx tsx scripts/seed-golden-dataset-su-baseline.ts
 */
import { PrismaClient } from '@prisma/client';

import { getSingleUseProducts } from '../lib/inventory/getSingleUseProducts';
import { getAnnualSummary } from '../lib/calculator/calculations/getAnnualSummary';
import { getEnvironmentalResults } from '../lib/calculator/calculations/getEnvironmentalResults';
import type { ProjectInventory, SingleUseLineItemPopulated } from '../lib/inventory/types/projects';

const UPSTREAM_ORG_ID = '79cb54a3-8b75-4841-93d4-a23fd1c07553';

// From her sheet, rows 2-4: [product id, units per case, cases purchased, cost per case]
const SHEET_ROWS = [
  { productId: '12', unitsPerCase: 400, casesPurchased: 1000, caseCost: 100, label: 'Ketchup - Plastic (LDPE)' },
  { productId: '9', unitsPerCase: 100, casesPurchased: 1000, caseCost: 50, label: 'Clamshell - EPS Foam' },
  { productId: '115', unitsPerCase: 100, casesPurchased: 1000, caseCost: 50, label: '8" Pizza box - Cardboard' }
];

// Her dashboard row 16 (single-use baseline)
const HER_EXPECTED = {
  items: 600000,
  massLb: 28263.3, // =sum(N2:N4,P2:P4)  item mass + cardboard
  ghgMtco2e: 62.8137205, // =sum(W2:W4,X2:X4) item ghg + cardboard ghg
  waterGal: 198780.4775, // =sum(AH2:AH4)     item water + cardboard water
  itemCosts: 200000 // =sum(H2:H4)
};

function buildUrl() {
  const url = new URL(process.env.DATABASE_URL!);
  if (url.hostname.includes('supabase')) {
    url.searchParams.set('pgbouncer', 'true');
    url.searchParams.set('sslmode', 'require');
  }
  return url.toString();
}

async function main() {
  const products = await getSingleUseProducts({ orgId: UPSTREAM_ORG_ID });

  const singleUseItems: SingleUseLineItemPopulated[] = SHEET_ROWS.map((row, i) => {
    const product = products.find(p => p.id === row.productId);
    if (!product) throw new Error(`Product ${row.productId} (${row.label}) not found in catalog`);
    return {
      id: `sheet-row-${i + 2}`,
      projectId: 'golden-su-baseline',
      productId: row.productId,
      caseCost: row.caseCost,
      casesPurchased: row.casesPurchased,
      unitsPerCase: row.unitsPerCase,
      // Baseline-only comparison: her sheet has no forecast column for these rows
      newCaseCost: row.caseCost,
      newCasesPurchased: 0,
      frequency: 'Annually',
      categoryName: product.category,
      createdAt: new Date('2026-07-21T00:00:00Z'),
      totalCost: row.caseCost * row.casesPurchased,
      totalUnits: row.unitsPerCase * row.casesPurchased,
      product,
      records: []
    } as SingleUseLineItemPopulated;
  });

  const inventory: ProjectInventory = {
    isEventProject: false,
    state: 'California',
    laborCosts: [],
    otherExpenses: [],
    reusableItems: [],
    singleUseItems,
    racksUsedForEventProjects: 0,
    dishwashers: [],
    dishwashersSimple: [],
    foodwareItems: [],
    utilityRates: { gas: 0.92, electric: 0.13, water: 0 },
    wasteHauling: [],
    truckTransportationCosts: []
  };

  // Expected outputs keyed by the paths the test runner flattens (lib/admin/testRunner.ts)
  const expectedOutputs = {
    annualSummary: {
      singleUseProductCount: { baseline: HER_EXPECTED.items },
      wasteWeight: { baseline: HER_EXPECTED.massLb },
      greenhouseGasEmissions: { total: { baseline: HER_EXPECTED.ghgMtco2e } }
    },
    environmentalResults: {
      annualWaterUsageChanges: { total: { baseline: HER_EXPECTED.waterGal } }
    }
  };

  // Report where we currently land, for the console log
  const actualSummary = getAnnualSummary(inventory);
  const actualEnv = getEnvironmentalResults(inventory);
  const rows: [string, number, number][] = [
    ['items', HER_EXPECTED.items, actualSummary.singleUseProductCount.baseline],
    ['mass (lb)', HER_EXPECTED.massLb, actualSummary.wasteWeight.baseline],
    ['ghg (MTCO2e)', HER_EXPECTED.ghgMtco2e, actualSummary.greenhouseGasEmissions.total.baseline],
    ['water (gal)', HER_EXPECTED.waterGal, actualEnv.annualWaterUsageChanges.total.baseline]
  ];
  console.log('\nmetric            spreadsheet        Chart-Reuse         diff');
  for (const [name, expected, actual] of rows) {
    const pct = expected === 0 ? 0 : ((actual - expected) / expected) * 100;
    console.log(
      `${name.padEnd(16)}${expected.toLocaleString(undefined, { maximumFractionDigits: 2 }).padStart(14)}` +
        `${actual.toLocaleString(undefined, { maximumFractionDigits: 2 }).padStart(19)}` +
        `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`.padStart(13)
    );
  }

  const prisma = new PrismaClient({ datasourceUrl: buildUrl() });
  try {
    const name = 'Single-use baseline — Madhavi spreadsheet 2026-07';
    const existing = await prisma.goldenDataset.findFirst({ where: { name } });
    const data = {
      name,
      description:
        "Three single-use items from Madhavi's new-cr-test.xlsx (Ketchup id 12, Clamshell id 9, 8\" Pizza box id 115), " +
        'baseline only. Expected values are her spreadsheet row 16 AS SUBMITTED and are NOT yet agreed: they embed ' +
        'her clamshell cardboard-per-item value (0.016833 vs our catalog 0.002520) and use the LDPE factor for the ' +
        "ketchup's aluminum lining. Known code-side causes: shipping-box mass ignores units-per-case, water factors " +
        'differ from source databases, and ocean freight is applied to box mass. See docs/DATA-REVIEW-AGENDA.md §3.',
      category: 'default',
      inputs: inventory as unknown as object,
      expectedOutputs,
      tolerance: 0.02,
      isActive: true,
      tags: ['madhavi-qa', 'single-use', 'mass-ghg-water', 'unreviewed-expectations']
    };
    const saved = existing
      ? await prisma.goldenDataset.update({ where: { id: existing.id }, data })
      : await prisma.goldenDataset.create({ data });
    console.log(`\n${existing ? 'Updated' : 'Created'} golden dataset ${saved.id}`);
    console.log('Run it from Admin → Data Science → Test Runs.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
