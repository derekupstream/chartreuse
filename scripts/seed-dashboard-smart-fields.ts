/**
 * Fills the Smart Field library with the projections dashboard's stat cards
 * (Derek, 2026-09-19: "scan all the stat cards in our projections dashboard — there are
 * plenty of smart fields that aren't represented in the smart field library").
 *
 * Each field is written in the console grammar and VALIDATED with the same parser the
 * builder uses; most carry a baseline/forecast comparison so the two-bar chart draws.
 * Test values are sample numbers from the Scenario Dashboard workbook reconciliation,
 * so every card previews something real-looking.
 *
 * Run:  npx dotenv-cli -e .env -- npx tsx scripts/seed-dashboard-smart-fields.ts
 * Safe to re-run: a field whose name already exists is left untouched.
 */
import { parseEquation } from '../lib/smartFields/console';
import prisma from '../lib/prisma';

const DEREK_USER_ID = '6cf4d79c-254d-42c6-90eb-ad0a084be01b';

type Seed = {
  name: string;
  unit: string;
  category: string;
  description: string;
  equation: string;
  baseline?: string;
  forecast?: string;
  testInputs: Record<string, number>;
};

const SEEDS: Seed[] = [
  {
    name: 'GHG Reductions',
    unit: 'MTCO2e',
    category: 'GHG',
    description:
      'The projections dashboard "Annual GHG changes" card: emissions avoided per year by switching ' +
      '(materials plus shipping boxes, baseline minus forecast). Lineage: environmentalResults.annualGasEmissionChanges.total.',
    equation: 'baselineMaterialGas + baselineShippingGas - (forecastMaterialGas + forecastShippingGas)',
    baseline: 'baselineMaterialGas + baselineShippingGas',
    forecast: 'forecastMaterialGas + forecastShippingGas',
    testInputs: { baselineMaterialGas: 78.86, baselineShippingGas: 6.4, forecastMaterialGas: 2.06, forecastShippingGas: 1.04 }
  },
  {
    name: 'Annual Water Savings',
    unit: 'gal/year',
    category: 'Water',
    description:
      'The dashboard "Annual water usage changes" card: water for manufacturing single-use items today, ' +
      'minus water used after the switch (mostly dishwashing). Lineage: environmentalResults.annualWaterUsageChanges.total.change.',
    equation: 'baselineWaterUse - forecastWaterUse',
    baseline: 'baselineWaterUse',
    forecast: 'forecastWaterUse',
    testInputs: { baselineWaterUse: 21000, forecastWaterUse: 3371 }
  },
  {
    name: 'Annual Waste Reduction',
    unit: 'lb/year',
    category: 'Waste',
    description:
      'The dashboard "Annual waste changes" card: single-use items and boxes kept out of landfill each year. ' +
      'Lineage: environmentalResults.annualWasteChanges.summary.change.',
    equation: 'baselineWasteWeight - forecastWasteWeight',
    baseline: 'baselineWasteWeight',
    forecast: 'forecastWasteWeight',
    testInputs: { baselineWasteWeight: 26100, forecastWasteWeight: 1147 }
  },
  {
    name: 'Annual Cost Savings',
    unit: '$',
    category: 'Cost',
    description:
      'The dashboard "Annual cost savings" card: what staying single-use costs per year, minus what the ' +
      'reuse program costs once running. Lineage: financialResults / annualSummary.annualSavings.',
    equation: 'baselineAnnualCost - forecastAnnualCost',
    baseline: 'baselineAnnualCost',
    forecast: 'forecastAnnualCost',
    testInputs: { baselineAnnualCost: 85800, forecastAnnualCost: 19633.11 }
  },
  {
    name: 'One-Time Costs Total',
    unit: '$',
    category: 'Cost',
    description:
      'The dashboard "One-time costs total" card: reusable products plus equipment plus installation — the ' +
      'up-front investment the payback period divides by. Lineage: financialResults.oneTime.',
    equation: 'reusablePurchaseCost + equipmentCost + installationCost',
    testInputs: { reusablePurchaseCost: 150022.8, equipmentCost: 40000, installationCost: 10000 }
  },
  {
    name: 'Waste Hauling Savings',
    unit: '$',
    category: 'Cost',
    description:
      'The dashboard "Waste hauling savings" card: hauling paid today minus hauling remaining after the ' +
      'switch. Lineage: financialResults (waste hauling).',
    equation: 'baselineHaulingCost - forecastHaulingCost',
    baseline: 'baselineHaulingCost',
    forecast: 'forecastHaulingCost',
    testInputs: { baselineHaulingCost: 12000, forecastHaulingCost: 9000 }
  },
  {
    name: 'Recurring Expenses Total',
    unit: '$',
    category: 'Cost',
    description:
      'The dashboard "Recurring expenses total" card: labor plus dishwashing utilities plus hauling plus ' +
      'other yearly program costs. Lineage: financialResults (recurring expenses).',
    equation: 'laborCostAnnual + otherRecurringCosts + forecastHaulingCost + racksPerDay * operatingDays * utilityCostPerRack',
    testInputs: {
      laborCostAnnual: 12000,
      otherRecurringCosts: 1500,
      forecastHaulingCost: 9000,
      racksPerDay: 40,
      operatingDays: 300,
      utilityCostPerRack: 0.21
    }
  },
  {
    name: 'Dishwashing Utility Cost',
    unit: '$',
    category: 'Cost',
    description:
      'The dashboard "Dishwashing utility cost" card: racks per day × operating days × the water-plus-energy ' +
      'cost of one rack. Lineage: financialResults.utilities (dishwashing).',
    equation: 'racksPerDay * operatingDays * utilityCostPerRack',
    testInputs: { racksPerDay: 40, operatingDays: 300, utilityCostPerRack: 0.21 }
  }
];

async function main() {
  let created = 0;
  for (const seed of SEEDS) {
    const existing = await prisma.smartField.findUnique({ where: { name: seed.name } });
    if (existing) {
      console.log(`— "${seed.name}" already exists, leaving it as it is`);
      continue;
    }
    const parsed = parseEquation(seed.equation);
    if (!parsed.ok) throw new Error(`"${seed.name}" equation does not parse: ${parsed.error}`);
    let comparison: object | null = null;
    if (seed.baseline && seed.forecast) {
      const base = parseEquation(seed.baseline);
      const fc = parseEquation(seed.forecast);
      if (!base.ok || !fc.ok) throw new Error(`"${seed.name}" comparison does not parse`);
      comparison = { baseline: base.tokens, forecast: fc.tokens };
    }
    await prisma.smartField.create({
      data: {
        name: seed.name,
        unit: seed.unit,
        category: seed.category,
        description: seed.description,
        equation: parsed.tokens as unknown as object,
        testInputs: seed.testInputs as unknown as object,
        comparisonJson: comparison as unknown as object,
        isPublished: true,
        createdBy: DEREK_USER_ID
      }
    });
    created += 1;
    console.log(`✓ created "${seed.name}" (${seed.unit}, ${seed.category}${comparison ? ', with comparison chart' : ''})`);
  }
  console.log(`Done — ${created} smart field(s) created.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
