/**
 * Rebuilds the Annual Projections product WITH THE PRODUCT STUDIO — the test Derek asked
 * for (2026-09-20): "we should be able to rebuild this entire product using our builders".
 *
 * The screens mirror the real advanced-projection wizard (Single-Use purchasing →
 * Reusables purchasing → Dishwashing → Additional costs → Dashboard), using the new
 * purchasing widgets for line-by-line catalog entry and half-row (2-column) layout on
 * the results screen. Smart fields are written in the console grammar and validated by
 * the same parser the builder uses.
 *
 * Honest scope: this reproduces the product's SHAPE and its core purchasing math
 * (items, costs, savings, waste). It does not re-implement the full v1 engine — GHG
 * decomposition, per-material factors and utility-rate lookups stay with the engine
 * until smart fields can reach those tables per row (spec phases 3+).
 *
 * Run:  npx dotenv-cli -e .env -- npx tsx scripts/seed-annual-projections-studio.ts
 * Re-runnable: existing smart fields and the product are left alone unless --force.
 */
import { parseEquation } from '../lib/smartFields/console';
import type { ComposedScreen, InputFieldDef } from '../lib/products/composed';
import prisma from '../lib/prisma';

const DEREK_USER_ID = '6cf4d79c-254d-42c6-90eb-ad0a084be01b';
const SLUG = 'annual-projections-studio';
const FORCE = process.argv.includes('--force');

type FieldSeed = {
  name: string;
  unit: string;
  category: string;
  description: string;
  equation: string;
  baseline?: string;
  forecast?: string;
  testInputs?: Record<string, unknown>;
};

// Shared sample rows so every field previews something real-looking in the builder.
const SAMPLE_ROWS = {
  singleUseProducts: [
    { productName: 'Hot cup', casesPerYear: 100, unitsPerCase: 1000, caseCost: 85, newCaseCost: 85, itemWeightLbs: 0.03, newCasesPerYear: 20 },
    { productName: 'Clamshell', casesPerYear: 50, unitsPerCase: 200, caseCost: 60, newCaseCost: 60, itemWeightLbs: 0.02, newCasesPerYear: 10 }
  ],
  reusableProducts: [
    { productName: 'Reusable cup', casesPurchased: 10, unitsPerCase: 24, caseCost: 55, repurchasePercent: 10 }
  ],
  dishwashers: [
    { machineType: 'Under Counter', temperature: 'Low', energyStar: 'Yes', racksPerDay: 6, operatingDays: 300, utilityCostPerRack: 0.21, oneTimeCost: 5000 }
  ],
  additionalCosts: [
    { description: 'Dish room staffing', category: 'Labor', frequency: 'Annually', cost: 4000, amountPerYear: 4000, oneTimeAmount: 0 },
    { description: 'Collection bins', category: 'Other', frequency: 'One Time', cost: 500, amountPerYear: 0, oneTimeAmount: 500 }
  ]
};

const BASELINE_COST = 'SUM(singleUseProducts, casesPerYear * caseCost)';
const FORECAST_COST =
  'SUM(singleUseProducts, newCasesPerYear * newCaseCost)' +
  ' + SUM(reusableProducts, casesPurchased * caseCost * repurchasePercent / 100)' +
  ' + SUM(dishwashers, racksPerDay * operatingDays * utilityCostPerRack)' +
  ' + SUM(additionalCosts, amountPerYear)';

const FIELDS: FieldSeed[] = [
  {
    name: 'Annual Single-Use Items (Studio)',
    unit: 'items/year',
    category: 'Operational',
    description: 'Every single-use item purchased per year: for each product line, cases per year × units per case.',
    equation: 'SUM(singleUseProducts, casesPerYear * unitsPerCase)',
    testInputs: SAMPLE_ROWS
  },
  {
    name: 'Single-Use Items Avoided (Studio)',
    unit: 'items/year',
    category: 'Operational',
    description: 'Items no longer bought after the switch: (cases before − cases after) × units per case, per line.',
    equation: 'SUM(singleUseProducts, (casesPerYear - newCasesPerYear) * unitsPerCase)',
    baseline: 'SUM(singleUseProducts, casesPerYear * unitsPerCase)',
    forecast: 'SUM(singleUseProducts, newCasesPerYear * unitsPerCase)',
    testInputs: SAMPLE_ROWS
  },
  {
    name: 'Single-Use Purchasing Cost (Studio)',
    unit: '$',
    category: 'Cost',
    description: 'What the operation spends on single-use per year today: cases per year × cost per case, per line.',
    equation: BASELINE_COST,
    testInputs: SAMPLE_ROWS
  },
  {
    name: 'Forecast Annual Cost (Studio)',
    unit: '$',
    category: 'Cost',
    description:
      'Yearly cost after the switch: remaining single-use purchases + reusable restocking ' +
      '(purchase cost × yearly restock %) + dishwashing utilities (racks × days × cost per rack) + labor + other costs.',
    equation: FORECAST_COST,
    testInputs: SAMPLE_ROWS
  },
  {
    name: 'Annual Savings (Studio)',
    unit: '$',
    category: 'Cost',
    description: 'Single-use spending today minus the full yearly cost of running the reuse program.',
    equation: `${BASELINE_COST} - (${FORECAST_COST})`,
    baseline: BASELINE_COST,
    forecast: FORECAST_COST,
    testInputs: SAMPLE_ROWS
  },
  {
    name: 'One-Time Investment (Studio)',
    unit: '$',
    category: 'Cost',
    description:
      'The up-front spend to start the program: reusable fleet purchase + dishwasher purchase & installation + one-time expenses.',
    equation:
      'SUM(reusableProducts, casesPurchased * caseCost) + SUM(dishwashers, oneTimeCost) + SUM(additionalCosts, oneTimeAmount)',
    testInputs: SAMPLE_ROWS
  },
  {
    name: 'Annual Waste Reduction (Studio)',
    unit: 'lb/year',
    category: 'Waste',
    description:
      'Landfill weight avoided: items no longer bought × item weight, per line. Item weight auto-fills from the catalog.',
    equation: 'SUM(singleUseProducts, (casesPerYear - newCasesPerYear) * unitsPerCase * itemWeightLbs)',
    testInputs: SAMPLE_ROWS
  }
];

const b = (kind: string, extra: Record<string, unknown> = {}) => ({
  id: `b${Math.random().toString(36).slice(2, 10)}`,
  kind,
  ...extra
});

async function main() {
  // ── smart fields ────────────────────────────────────────────────────────────
  const fieldIds: Record<string, string> = {};
  for (const seed of FIELDS) {
    const existing = await prisma.smartField.findUnique({ where: { name: seed.name } });
    if (existing && !FORCE) {
      fieldIds[seed.name] = existing.id;
      console.log(`— "${seed.name}" already exists`);
      continue;
    }
    const parsed = parseEquation(seed.equation);
    if (!parsed.ok) throw new Error(`"${seed.name}": ${parsed.error}`);
    let comparison: object | null = null;
    if (seed.baseline && seed.forecast) {
      const base = parseEquation(seed.baseline);
      const fc = parseEquation(seed.forecast);
      if (!base.ok || !fc.ok) throw new Error(`"${seed.name}" comparison does not parse`);
      comparison = { baseline: base.tokens, forecast: fc.tokens };
    }
    const data = {
      name: seed.name,
      unit: seed.unit,
      category: seed.category,
      description: seed.description,
      equation: parsed.tokens as unknown as object,
      testInputs: (seed.testInputs ?? {}) as unknown as object,
      comparisonJson: comparison as unknown as object,
      isPublished: true,
      createdBy: DEREK_USER_ID
    };
    const field = existing
      ? await prisma.smartField.update({ where: { id: existing.id }, data })
      : await prisma.smartField.create({ data });
    fieldIds[seed.name] = field.id;
    console.log(`✓ ${existing ? 'updated' : 'created'} "${seed.name}"`);
  }

  // ── the product: screens mirroring the projections wizard ─────────────────
  const inputFields: InputFieldDef[] = [];

  const screens: ComposedScreen[] = [
    {
      id: 'welcome',
      title: 'Welcome',
      blocks: [
        b('heading', { text: 'Annual Projections' }),
        b('text', {
          text:
            'Project the yearly cost and waste impact of switching part of your single-use purchasing to ' +
            'reusables. List what you buy today, what you will buy instead, and your dishwashing setup — ' +
            'the dashboard at the end shows the yearly picture.'
        }),
        b('button', { label: 'Get started', action: 'next' })
      ] as ComposedScreen['blocks']
    },
    {
      id: 'single-use',
      title: 'Single-Use purchasing',
      blocks: [
        b('heading', { text: 'Your single-use purchasing' }),
        b('text', {
          text: 'Add each single-use product you buy. "Cases / year after switch" is what you expect to still buy once reusables are in place — zero if it goes away entirely.'
        }),
        b('singleUseItems'),
        b('button', { label: 'Next: reusables', action: 'next' })
      ] as ComposedScreen['blocks']
    },
    {
      id: 'reusables',
      title: 'Reusables purchasing',
      blocks: [
        b('heading', { text: 'Your reusable system' }),
        b('text', {
          text: 'Add the reusable products you will buy. "Restocked yearly" covers breakage and loss — 10% means a tenth of the fleet is repurchased each year.'
        }),
        b('reusableItems'),
        b('button', { label: 'Next: dishwashing', action: 'next' })
      ] as ComposedScreen['blocks']
    },
    {
      id: 'dishwashing',
      title: 'Dishwashing',
      blocks: [
        b('heading', { text: 'Dishwashing' }),
        b('dishwashers'),
        b('button', { label: 'Next: additional costs', action: 'next' })
      ] as ComposedScreen['blocks']
    },
    {
      id: 'costs',
      title: 'Additional costs',
      blocks: [
        b('heading', { text: 'Additional costs' }),
        b('additionalCosts'),
        b('button', { label: 'See your dashboard', action: 'next' })
      ] as ComposedScreen['blocks']
    },
    {
      id: 'dashboard',
      title: 'Dashboard',
      blocks: [
        b('heading', { text: 'Your annual projections' }),
        // The 2-column layout in action: paired half-row cards, then full-width charts.
        b('smartFieldCard', { smartFieldId: fieldIds['Annual Savings (Studio)'], width: 'half' }),
        b('smartFieldCard', { smartFieldId: fieldIds['Single-Use Items Avoided (Studio)'], width: 'half' }),
        b('smartFieldCard', { smartFieldId: fieldIds['Single-Use Purchasing Cost (Studio)'], width: 'half' }),
        b('smartFieldCard', { smartFieldId: fieldIds['Annual Waste Reduction (Studio)'], width: 'half' }),
        b('smartFieldCard', { smartFieldId: fieldIds['One-Time Investment (Studio)'], width: 'half' }),
        b('chart', { smartFieldId: fieldIds['Annual Savings (Studio)'], label: 'Annual cost: today vs after the switch' }),
        b('button', { label: 'Save my results', action: 'submit' })
      ] as ComposedScreen['blocks']
    }
  ];

  const existingProduct = await prisma.dataProductDefinition.findUnique({ where: { slug: SLUG } });
  if (existingProduct && !FORCE) {
    console.log(`— product "${SLUG}" already exists (${existingProduct.id})`);
    return;
  }
  const data = {
    name: 'Annual Projections (Studio)',
    slug: SLUG,
    description:
      'The Annual Projections calculator rebuilt entirely with the Product Studio: the wizard flow, ' +
      'line-by-line purchasing widgets, dishwashing and cost questions, and a smart-field dashboard.',
    productType: 'calculator',
    status: 'draft',
    screensJson: { screens } as unknown as object,
    inputSchemaJson: { fields: inputFields } as unknown as object,
    createdByUserId: DEREK_USER_ID
  };
  const product = existingProduct
    ? await prisma.dataProductDefinition.update({ where: { id: existingProduct.id }, data })
    : await prisma.dataProductDefinition.create({ data });
  console.log(`✓ product "${product.name}" — /admin/data-science/products/${product.id}/builder · /p/${SLUG}?draft=1`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
