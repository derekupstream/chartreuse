/**
 * Runs real projects through BOTH engines — the live v1 calculator and the 2.0 Combined
 * Model — and prints the differences. This is the "comparable but not the same" check:
 * every delta should be explainable by a documented 2.0 change (freight rule, water
 * factors, scoped GHG factors, waste including boxes and reusables, state gas rates).
 *
 *   npx tsx scripts/compare-v2-projects.ts [projectId ...]
 *
 * With no arguments, picks the largest projects that have both single-use and reusable
 * line items. Lines whose product_id doesn't resolve in the 2.0 directories are reported,
 * not silently dropped. Labor, other expenses and bottle stations are excluded from both
 * sides' comparison where possible — the 2.0 model doesn't define them yet (review item #3).
 */
import { readFileSync } from 'fs';
import path from 'path';

import { getProjectionsFromInventory } from 'lib/calculator/getProjections';
import { computeCombinedModel } from 'lib/calculator/v2/combinedModel';
import type { ModelInputs, ModelTables } from 'lib/calculator/v2/combinedModel';
import { getProjectInventory } from 'lib/inventory/getProjectInventory';
import prisma from 'lib/prisma';

function loadTables(): ModelTables {
  const payload = JSON.parse(readFileSync(path.join(process.cwd(), 'scripts/data/cr2-release-2.0.json'), 'utf8'));
  return {
    ghgFactors: payload.ghg_factors,
    waterFactors: payload.water_factors,
    transportFactors: payload.transport_factors,
    purchaseFrequency: payload.purchase_frequency,
    utilityRates: payload.utility_rates,
    dishwasherFactors: payload.dishwasher_factors,
    singleUseProducts: payload.single_use_products,
    reusableProducts: payload.reusable_products
  };
}

const FREQUENCIES = new Set(['Daily', 'Weekly', 'Monthly', 'Annually']);
const normalizeFrequency = (f: string) => {
  const match = ['Daily', 'Weekly', 'Monthly', 'Annually'].find(k => k.toLowerCase() === f.trim().toLowerCase());
  return match ?? 'Annually';
};

const fmt = (n: number, digits = 1) =>
  n.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: 0 });
const pct = (v1: number, v2: number) => {
  if (v1 === 0 && v2 === 0) return '—';
  if (v1 === 0) return 'new';
  return `${(((v2 - v1) / Math.abs(v1)) * 100).toFixed(1)}%`;
};

async function compareProject(projectId: string, tables: ModelTables) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { singleUseItems: true, reusableItems: true, dishwashers: true, org: { select: { name: true } } }
  });
  if (!project) {
    console.log(`\n${projectId}: not found`);
    return;
  }

  // ── v1: the running engine ────────────────────────────────────────────────────────────
  const inventory = await getProjectInventory(projectId);
  const v1 = getProjectionsFromInventory(inventory);

  // ── v2: map the same stored inputs into the Combined Model's shape ────────────────────
  const suIds = new Set(tables.singleUseProducts.map(p => Number(p.product_id)));
  const reuseIds = new Set(tables.reusableProducts.map(p => Number(p.product_id)));

  const unmatchedSu: string[] = [];
  const singleUse = project.singleUseItems.flatMap(item => {
    const pid = Number(item.productId);
    if (!suIds.has(pid)) {
      unmatchedSu.push(item.productId);
      return [];
    }
    const frequency = FREQUENCIES.has(item.frequency) ? item.frequency : normalizeFrequency(item.frequency);
    return [
      {
        productId: pid,
        baselineFrequency: frequency,
        baselineCasesPerFrequency: item.casesPurchased,
        baselineUnitsPerCase: item.unitsPerCase,
        baselineCostPerCase: item.caseCost,
        forecastFrequency: frequency,
        forecastCasesPerFrequency: item.newCasesPurchased,
        forecastUnitsPerCase: item.unitsPerCase,
        forecastCostPerCase: item.newCaseCost
      }
    ];
  });

  const unmatchedReuse: string[] = [];
  const reusables = project.reusableItems.flatMap(item => {
    const pid = Number(item.productId);
    if (!item.productId || !reuseIds.has(pid)) {
      unmatchedReuse.push(item.productName ?? item.productId ?? '?');
      return [];
    }
    return [
      {
        productId: pid,
        initialCases: item.casesPurchased,
        unitsPerCase: item.unitsPerCase,
        costPerCase: item.caseCost,
        annualRepurchaseRate: item.annualRepurchasePercentage
      }
    ];
  });

  const dish = project.dishwashers[0];
  const machineTypes = new Set(tables.dishwasherFactors.map(m => m.machine_type));
  const dishwashing =
    dish && machineTypes.has(dish.type)
      ? {
          state: project.USState ?? 'California',
          machineType: dish.type,
          temperature: (dish.temperature.toLowerCase().startsWith('h') ? 'High' : 'Low') as 'High' | 'Low',
          energyStar: dish.energyStarCertified,
          buildingHeaterFuel: (dish.buildingWaterHeaterFuelType.toLowerCase().startsWith('e') ? 'Electric' : 'Gas') as
            | 'Electric'
            | 'Gas',
          boosterHeaterFuel: ((dish.boosterWaterHeaterFuelType ?? 'Electric').toLowerCase().startsWith('e')
            ? 'Electric'
            : 'Gas') as 'Electric' | 'Gas',
          operatingDaysPerYear: dish.operatingDays,
          racksPerDay: dish.racksPerDay
        }
      : undefined;

  const inputs: ModelInputs = { singleUse, reusables, dishwashing };
  const v2 = computeCombinedModel(inputs, tables); // corrected box lookup — the behaviour she'll adopt

  // ── report ────────────────────────────────────────────────────────────────────────────
  const s = v1.annualSummary;
  console.log(`\n════ ${project.name}  (${project.org.name})`);
  console.log(
    `     ${singleUse.length}/${project.singleUseItems.length} SU lines mapped, ${reusables.length}/${project.reusableItems.length} reusable lines mapped, dishwasher: ${dishwashing ? 'yes' : 'no'}`
  );
  if (unmatchedSu.length) console.log(`     unmatched SU product ids: ${unmatchedSu.join(', ')}`);
  if (unmatchedReuse.length) console.log(`     unmatched reusables: ${unmatchedReuse.join(', ')}`);

  const rows: [string, number, number][] = [
    ['Annual savings ($)', s.dollarCost.change * -1, v2.financial.annualSavings],
    ['SU units avoided', s.singleUseProductCount.change * -1, v2.singleUseUnits.reduction],
    ['Waste avoided (lb)', s.wasteWeight.change * -1, v2.wasteLb.reduction],
    ['GHG avoided (MTCO2e)', s.greenhouseGasEmissions.total.change * -1, v2.ghgMtco2e.reduction],
    [
      'Water avoided (gal)',
      v1.environmentalResults.annualWaterUsageChanges.total.change * -1,
      v2.waterGal.reduction
    ]
  ];
  console.log(`     ${'metric'.padEnd(24)}${'v1 engine'.padStart(16)}${'2.0 model'.padStart(16)}${'Δ'.padStart(10)}`);
  for (const [label, a, b] of rows) {
    console.log(`     ${label.padEnd(24)}${fmt(a).padStart(16)}${fmt(b).padStart(16)}${pct(a, b).padStart(10)}`);
  }
}

async function main() {
  const tables = loadTables();
  let ids = process.argv.slice(2).filter(a => !a.startsWith('-'));

  if (!ids.length) {
    const candidates = await prisma.project.findMany({
      where: {
        category: 'default',
        singleUseItems: { some: {} },
        reusableItems: { some: {} }
      },
      select: { id: true, _count: { select: { singleUseItems: true, reusableItems: true } } },
      take: 200
    });
    ids = candidates
      .sort((a, b) => b._count.singleUseItems + b._count.reusableItems - (a._count.singleUseItems + a._count.reusableItems))
      .slice(0, 5)
      .map(c => c.id);
  }

  console.log('v1 = live engine · 2.0 model = Combined Model with corrected box lookup');
  console.log('Expected drivers of difference: freight once on full shipped mass (was ~2× on product+box),');
  console.log('CTGT water factors, scoped GHG factors, waste includes boxes + reusable mass, state gas rates.');

  for (const id of ids) {
    await compareProject(id, tables);
  }
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
