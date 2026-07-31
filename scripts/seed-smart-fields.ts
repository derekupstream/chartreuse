/**
 * Seeds the Smart Field library with the calculations the Projections product actually
 * performs, so the builder opens with real metric logic rather than an empty page.
 *
 * Each field mirrors a formula in lib/calculator — the comments name the source — and
 * references real variables: user inputs, product-catalog columns, and factor cells from
 * the uploaded databases. Factor variable keys are resolved from the live catalog at run
 * time so a renamed database row shows up as a missing factor rather than silently drifting.
 *
 * Usage (local):      npx tsx scripts/seed-smart-fields.ts
 *        (production): npx dotenv-cli -e .env.production -- npx tsx scripts/seed-smart-fields.ts
 */
import { PrismaClient } from '@prisma/client';

import { toVariableKey } from '../lib/smartFields/variables';
import type { EquationToken } from '../lib/smartFields/variables';

function buildUrl() {
  const url = new URL(process.env.DATABASE_URL!);
  if (url.hostname.includes('supabase')) {
    url.searchParams.set('pgbouncer', 'true');
    url.searchParams.set('sslmode', 'require');
  }
  return url.toString();
}
const prisma = new PrismaClient({ datasourceUrl: buildUrl() });

const v = (key: string): EquationToken => ({ kind: 'variable', key });
const n = (value: number): EquationToken => ({ kind: 'number', value });
const op = (value: '+' | '-' | '*' | '/'): EquationToken => ({ kind: 'operator', value });
const open = (): EquationToken => ({ kind: 'paren', value: '(' });
const close = (): EquationToken => ({ kind: 'paren', value: ')' });

type Seed = {
  name: string;
  description: string;
  unit: string;
  equation: EquationToken[];
  testInputs?: Record<string, number>;
  publish?: boolean;
};

async function main() {
  // Resolve the factor keys the same way the catalog does, so the equations point at
  // whatever the databases actually contain today.
  const databases = await prisma.factorDatabase.findMany({
    where: { isActive: true },
    include: { rows: { orderBy: { rowIndex: 'asc' } } }
  });

  const factorKeyByLabel = new Map<string, string>();
  for (const database of databases) {
    const columns = (database.columns as unknown as { key: string; label?: string; type?: string }[]) ?? [];
    const nameColumn = columns.find(c => ['name', 'material', 'factor'].includes(c.key.toLowerCase()));
    if (!nameColumn) continue;
    const numeric = columns.filter(
      c => c.type === 'number' && c.key !== nameColumn.key && !/id$/i.test(c.label ?? c.key)
    );
    for (const row of database.rows) {
      const rowName = String((row.data as any)[nameColumn.key] ?? '').trim();
      if (!rowName) continue;
      for (const column of numeric) {
        const label = `${rowName}${numeric.length > 1 ? ` ${column.label ?? column.key}` : ''}`;
        factorKeyByLabel.set(label.toLowerCase(), toVariableKey(label));
      }
    }
  }

  const factor = (label: string): string => factorKeyByLabel.get(label.toLowerCase()) ?? toVariableKey(label);

  const cardboardGhg = factor('Corrugated Cardboard GHG (MTCO2e/lb)');
  const cardboardWater = factor('Corrugated Cardboard Water (gal/lb)');
  const ceramicGhg = factor('Ceramic GHG (MTCO2e/lb)');

  const seeds: Seed[] = [
    // ── lineItemUtils.annualLineItemCaseCount / annualLineItemWeight
    {
      name: 'Annual Items',
      description:
        'How many single-use items an operation gets through in a year. Every waste, emissions and water figure builds on this.',
      unit: 'items/year',
      equation: [v('casesPurchased'), op('*'), v('unitsPerCase')],
      testInputs: { casesPurchased: 1000, unitsPerCase: 400 },
      publish: true
    },
    // ── lineItemUtils.annualLineItemCost
    {
      name: 'Annual Purchasing Cost',
      description: 'What the operation spends on a single-use item each year. The baseline side of the savings case.',
      unit: '$/year',
      equation: [v('caseCost'), op('*'), v('casesPurchased')],
      testInputs: { caseCost: 72, casesPurchased: 1000 },
      publish: true
    },
    // ── getSingleUseResults: baseline minus forecast
    {
      name: 'Single-Use Items Avoided',
      description: 'Items no longer bought after switching to reuse: baseline items minus the forecast.',
      unit: 'items/year',
      equation: [
        open(),
        v('casesPurchased'),
        op('-'),
        v('forecastCases'),
        close(),
        op('*'),
        v('unitsPerCase')
      ],
      testInputs: { casesPurchased: 1000, forecastCases: 0, unitsPerCase: 400 },
      publish: true
    },
    // ── ReusableForecastForm: repurchase = 1 - returnRate/100
    {
      name: 'Repurchase Rate',
      description:
        'The share of a reusable fleet that has to be replaced each year — whatever does not come back. Complement of the return rate.',
      unit: 'fraction',
      equation: [n(1), op('-'), v('returnRate'), op('/'), n(100)],
      testInputs: { returnRate: 95 },
      publish: true
    },
    // ── getFinancialResults: oneTimeCost * annualRepurchasePercentage
    {
      name: 'Reusable Restocking Cost',
      description: 'Annual cost of replacing reusables that are lost or broken, driven by the return rate.',
      unit: '$/year',
      equation: [
        v('caseCost'),
        op('*'),
        v('casesPurchased'),
        op('*'),
        open(),
        n(1),
        op('-'),
        v('returnRate'),
        op('/'),
        n(100),
        close()
      ],
      testInputs: { caseCost: 120, casesPurchased: 13, returnRate: 95 },
      publish: true
    },
    // ── getDishwasherUtilityUsage: racksUsed = racksPerDay * operatingDays
    {
      name: 'Dishwasher Racks Per Year',
      description: 'Total racks washed annually. Drives dishwashing water, energy and their costs.',
      unit: 'racks/year',
      equation: [v('racksPerDay'), op('*'), v('operatingDays')],
      testInputs: { racksPerDay: 112, operatingDays: 260 },
      publish: true
    },
    // ── getAnnualWasteChanges: itemWeight * items
    {
      name: 'Annual Product Weight',
      description:
        'Weight of the products themselves over a year. Requires choosing a product, whose item weight comes from the product catalog.',
      unit: 'lb/year',
      equation: [v('annualItems'), op('*'), v(toVariableKey('Item Weight (lbs)'))],
      testInputs: { annualItems: 400000 }
    },
    // ── getLineItemGasEmissions: annualBoxWeight * CORRUGATED_CARDBOARD_GAS
    {
      name: 'Shipping Box Emissions',
      description:
        'Emissions from the corrugated cartons products ship in. Uses the cardboard factor from the material factor database.',
      unit: 'MTCO2e/year',
      equation: [v('annualBoxWeight'), op('*'), v(cardboardGhg)],
      testInputs: { annualBoxWeight: 2812 }
    },
    // ── getAnnualWaterUsageChanges: box weight * cardboard water factor
    {
      name: 'Shipping Box Water',
      description: 'Water embodied in the shipping cartons, using the cardboard water factor.',
      unit: 'gal/year',
      equation: [v('annualBoxWeight'), op('*'), v(cardboardWater)],
      testInputs: { annualBoxWeight: 2812 }
    },
    // ── getEnvBreakEven: embodied CO2 / annual CO2 savings, in months
    {
      name: 'Ceramic Mug Embodied Carbon',
      description:
        'Manufacturing carbon for a ceramic reusable order — the debt that has to be paid back before reuse is a net win. Uses the ceramic factor.',
      unit: 'MTCO2e',
      equation: [v('casesPurchased'), op('*'), v('unitsPerCase'), op('*'), n(0.9959), op('*'), v(ceramicGhg)],
      testInputs: { casesPurchased: 13, unitsPerCase: 70 }
    },
    // ── getFinancialResults.summary.annualROIPercent
    {
      name: 'Annual Program ROI',
      description: 'Annual net savings as a percentage of what it cost to start. Needs both figures as inputs.',
      unit: '%',
      equation: [v('annualNetSavings'), op('/'), v('oneTimeCosts'), op('*'), n(100)],
      testInputs: { annualNetSavings: 31032, oneTimeCosts: 21006 }
    },
    // ── getFinancialResults.summary.paybackPeriodsMonths
    {
      name: 'Payback Period',
      description: 'How many months of savings it takes to recover the start-up cost.',
      unit: 'months',
      equation: [v('oneTimeCosts'), op('/'), open(), v('annualNetSavings'), op('/'), n(12), close()],
      testInputs: { oneTimeCosts: 21006, annualNetSavings: 31032 }
    }
  ];

  console.log('Seeding smart fields from the Projections product:\n');
  for (const seed of seeds) {
    const existing = await prisma.smartField.findUnique({ where: { name: seed.name } });
    const data = {
      name: seed.name,
      description: seed.description,
      unit: seed.unit,
      equation: seed.equation as unknown as object,
      testInputs: (seed.testInputs ?? {}) as unknown as object,
      isPublished: seed.publish ?? false
    };
    await (existing
      ? prisma.smartField.update({ where: { id: existing.id }, data })
      : prisma.smartField.create({ data }));
    console.log(
      `  ${existing ? 'updated' : 'created'}  ${seed.name.padEnd(32)} ${seed.equation.length} tokens${seed.publish ? '  (published)' : ''}`
    );
  }

  console.log(`\n${await prisma.smartField.count()} smart fields at /admin/data-science/smart-fields`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
