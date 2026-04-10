/**
 * Seeds the "Projections Model" data product into DataProductDefinition.
 * Maps the full projections calculator pipeline: inputs → factors → calculations → aggregations → comparisons → outputs.
 *
 * Run: npx tsx scripts/seed-projections-data-product.ts
 */

import prisma from '../lib/prisma';

// ── Color constants (match designer node types) ──
const INPUT = '#52c41a';
const FACTOR = '#1677ff';
const CALC = '#fa8c16';
const AGG = '#eb2f96';
const CMP = '#ff4d4f';
const OUTPUT = '#722ed1';

function edge(source: string, target: string, color: string) {
  return {
    id: `e-${source}-${target}`,
    source,
    target,
    animated: true,
    style: { stroke: color, strokeWidth: 2 },
    markerEnd: { type: 'arrowclosed', color }
  };
}

// Factor nodes will be built dynamically with real DB IDs
async function buildNodes() {
  // Look up real factor IDs from the database
  const transportFactor = await prisma.factor.findFirst({
    where: { calculatorConstantKey: 'TRANSPORTATION_CO2_EMISSIONS_FACTOR' },
    select: { id: true, name: true, currentValue: true, unit: true }
  });
  const electricFactor = await prisma.factor.findFirst({
    where: { calculatorConstantKey: 'ELECTRIC_CO2_EMISSIONS_FACTOR' },
    select: { id: true, name: true, currentValue: true, unit: true }
  });
  const gasFactor = await prisma.factor.findFirst({
    where: { calculatorConstantKey: 'NATURAL_GAS_CO2_EMISSIONS_FACTOR' },
    select: { id: true, name: true, currentValue: true, unit: true }
  });

  // Get category IDs for group factors
  const categories = await prisma.factorCategory.findMany({ select: { id: true, name: true } });
  const catMap = Object.fromEntries(categories.map(c => [c.name, c.id]));

  // Get representative factors for each material group (first one in each group)
  const materialGhgSample = await prisma.factor.findFirst({
    where: { calculatorConstantKey: { contains: 'mtco2ePerLb' }, NOT: { calculatorConstantKey: { startsWith: 'REUSABLE' } } },
    select: { id: true, name: true, currentValue: true, unit: true }
  });
  const materialWaterSample = await prisma.factor.findFirst({
    where: { calculatorConstantKey: { contains: 'waterUsageGalPerLb' }, NOT: { calculatorConstantKey: { startsWith: 'REUSABLE' } } },
    select: { id: true, name: true, currentValue: true, unit: true }
  });
  const reusableMaterialSample = await prisma.factor.findFirst({
    where: { calculatorConstantKey: { startsWith: 'REUSABLE_MATERIALS' } },
    select: { id: true, name: true, currentValue: true, unit: true }
  });
  const utilityRateSample = await prisma.factor.findFirst({
    where: { calculatorConstantKey: { startsWith: 'STATES[' } },
    select: { id: true, name: true, currentValue: true, unit: true }
  });

  // Count factors in each group
  const materialGhgCount = await prisma.factor.count({
    where: { calculatorConstantKey: { contains: 'mtco2ePerLb' }, NOT: { calculatorConstantKey: { startsWith: 'REUSABLE' } } }
  });
  const materialWaterCount = await prisma.factor.count({
    where: { calculatorConstantKey: { contains: 'waterUsageGalPerLb' }, NOT: { calculatorConstantKey: { startsWith: 'REUSABLE' } } }
  });
  const reusableCount = await prisma.factor.count({
    where: { calculatorConstantKey: { startsWith: 'REUSABLE_MATERIALS' } }
  });
  const utilityCount = await prisma.factor.count({
    where: { calculatorConstantKey: { startsWith: 'STATES[' } }
  });

const nodes = [
  // ── INPUTS ──────────────────────────────────────────────
  {
    id: 'inp-su-items',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'input',
      subtype: 'user_input',
      label: 'Single-Use Line Items',
      subtitle: 'Product type, material, weight, unit cost, annual quantity'
    }
  },
  {
    id: 'inp-reuse-items',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'input',
      subtype: 'user_input',
      label: 'Reusable Line Items',
      subtitle: 'Product type, case cost, cases purchased, lifespan, repurchase %'
    }
  },
  {
    id: 'inp-dishwashers',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'input',
      subtype: 'user_input',
      label: 'Dishwasher Configuration',
      subtitle: 'Model, racks/day, operating days, fuel type'
    }
  },
  {
    id: 'inp-labor',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'input',
      subtype: 'user_input',
      label: 'Labor Costs',
      subtitle: 'Cost per period, frequency (one-time or recurring)'
    }
  },
  {
    id: 'inp-other-expenses',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'input',
      subtype: 'user_input',
      label: 'Other Expenses',
      subtitle: 'Additional one-time or recurring costs'
    }
  },
  {
    id: 'inp-waste-hauling',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'input',
      subtype: 'user_input',
      label: 'Waste Hauling Services',
      subtitle: 'Monthly cost baseline & forecast per hauler'
    }
  },
  {
    id: 'inp-project-settings',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'input',
      subtype: 'project_data',
      label: 'Project Settings',
      subtitle: 'State, utility rates, transportation distances'
    }
  },
  {
    id: 'inp-bottle-stations',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'input',
      subtype: 'user_input',
      label: 'Bottle Station Data',
      subtitle: 'Bottle refill stations, usage estimates'
    }
  },

  // ── FACTORS / ASSUMPTIONS (linked to real DB factors) ───
  {
    id: 'fac-material-ghg',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'factor',
      subtype: 'emission_factor',
      label: 'Material GHG Factors',
      subtitle: `${materialGhgCount} factors — e.g. ${materialGhgSample?.name ?? 'EPA WARM emission factors'}`,
      factorId: materialGhgSample?.id,
      factorName: materialGhgSample?.name,
      factorCategory: catMap['Emission Factors']
    }
  },
  {
    id: 'fac-material-water',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'factor',
      subtype: 'material_property',
      label: 'Material Water Factors',
      subtitle: `${materialWaterCount} factors — e.g. ${materialWaterSample?.name ?? 'water intensity per material'}`,
      factorId: materialWaterSample?.id,
      factorName: materialWaterSample?.name,
      factorCategory: catMap['Material Properties']
    }
  },
  {
    id: 'fac-reusable-material',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'factor',
      subtype: 'emission_factor',
      label: 'Reusable Material Factors',
      subtitle: `${reusableCount} factors — e.g. ${reusableMaterialSample?.name ?? 'embodied carbon of reusables'}`,
      factorId: reusableMaterialSample?.id,
      factorName: reusableMaterialSample?.name,
      factorCategory: catMap['Emission Factors']
    }
  },
  {
    id: 'fac-transport',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'factor',
      subtype: 'emission_factor',
      label: transportFactor?.name ?? 'Ocean Transport Emission Factor',
      subtitle: `${transportFactor?.currentValue} ${transportFactor?.unit ?? 'MTCO₂e/ton-mile'}`,
      factorId: transportFactor?.id,
      factorName: transportFactor?.name
    }
  },
  {
    id: 'fac-electric-co2',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'factor',
      subtype: 'grid_intensity',
      label: electricFactor?.name ?? 'Electric CO₂ Emissions Factor',
      subtitle: `${electricFactor?.currentValue} ${electricFactor?.unit ?? 'lbs CO₂/kWh'}`,
      factorId: electricFactor?.id,
      factorName: electricFactor?.name
    }
  },
  {
    id: 'fac-gas-co2',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'factor',
      subtype: 'emission_factor',
      label: gasFactor?.name ?? 'Natural Gas CO₂ Emissions Factor',
      subtitle: `${gasFactor?.currentValue} ${gasFactor?.unit ?? 'lbs CO₂/therm'}`,
      factorId: gasFactor?.id,
      factorName: gasFactor?.name
    }
  },
  {
    id: 'fac-utility-rates',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'factor',
      subtype: 'utility_rate',
      label: 'State Utility Rates',
      subtitle: `${utilityCount} rates — electric, gas, water by state`,
      factorId: utilityRateSample?.id,
      factorName: utilityRateSample?.name,
      factorCategory: catMap['Utility Rates']
    }
  },
  {
    id: 'fac-return-rate',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'factor',
      subtype: 'lifespan_assumption',
      label: 'Return Rate / Shrinkage',
      subtitle: 'Default 98% return rate — hardcoded in getReusableResults()'
    }
  },

  // ── CALCULATIONS ────────────────────────────────────────
  {
    id: 'calc-su-results',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'calculation',
      label: 'Single-Use Results',
      subtitle: 'Annual cost, units, weight — baseline vs forecast',
      calculationName: 'getSingleUseResults',
      calculationFile: 'lib/calculator/calculations/foodware/getSingleUseResults.ts'
    }
  },
  {
    id: 'calc-reuse-results',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'calculation',
      label: 'Reusable Results',
      subtitle: 'One-time cost, annual restocking, return rate',
      calculationName: 'getReusableResults',
      calculationFile: 'lib/calculator/calculations/foodware/getReusableResults.ts'
    }
  },
  {
    id: 'calc-bottle-station',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'calculation',
      label: 'Bottle Station Results',
      subtitle: 'Bottles saved from refill stations',
      calculationName: 'getBottleStationResults',
      calculationFile: 'lib/calculator/calculations/foodware/getBottleStationResults.ts'
    }
  },
  {
    id: 'calc-dishwasher',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'calculation',
      label: 'Dishwasher Utility Usage',
      subtitle: 'Electric (kWh), gas (therms), water (gal) from dishwasher operation',
      calculationName: 'dishwasherUtilityUsage',
      calculationFile: 'lib/calculator/calculations/dishwashing/getDishwasherUtilityUsage.ts'
    }
  },
  {
    id: 'calc-ghg',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'calculation',
      label: 'GHG Emission Changes',
      subtitle: 'Landfill + shipping box + dishwashing MTCO2e',
      calculationName: 'getAnnualGasEmissionChanges',
      calculationFile: 'lib/calculator/calculations/ghg/getAnnualGasEmissionChanges.ts'
    }
  },
  {
    id: 'calc-waste',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'calculation',
      label: 'Waste Changes',
      subtitle: 'Landfill product weight + shipping box weight',
      calculationName: 'getAnnualWasteChanges',
      calculationFile: 'lib/calculator/calculations/waste/getAnnualWasteChanges.ts'
    }
  },
  {
    id: 'calc-water',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'calculation',
      label: 'Water Usage Changes',
      subtitle: 'Material manufacturing water + dishwashing water',
      calculationName: 'getAnnualWaterUsageChanges',
      calculationFile: 'lib/calculator/calculations/water/getAnnualWaterUsageChanges.ts'
    }
  },
  {
    id: 'calc-env-breakeven',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'calculation',
      label: 'Environmental Break-Even',
      subtitle: 'Embodied CO2 of reusables / annual CO2 savings → months',
      calculationName: 'getEnvBreakEven',
      calculationFile: 'lib/calculator/calculations/getEnvBreakEven.ts'
    }
  },
  {
    id: 'calc-annual-costs',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'calculation',
      label: 'Annual Cost Changes',
      subtitle: 'SU savings − recurring: labor + restocking + utilities + waste hauling',
      calculationName: 'calculateAnnualCostChanges',
      calculationFile: 'lib/calculator/calculations/getFinancialResults.ts'
    }
  },
  {
    id: 'calc-onetime-costs',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'calculation',
      label: 'One-Time Costs',
      subtitle: 'Reusable purchasing + additional startup expenses',
      calculationName: 'calculateOneTimeCosts',
      calculationFile: 'lib/calculator/calculations/getFinancialResults.ts'
    }
  },

  // ── AGGREGATIONS ────────────────────────────────────────
  {
    id: 'agg-environmental',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'aggregation',
      subtype: 'merge',
      label: 'Environmental Results',
      subtitle: 'Merges waste + GHG + water + break-even'
    }
  },
  {
    id: 'agg-financial',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'aggregation',
      subtype: 'merge',
      label: 'Financial Results',
      subtitle: 'Merges annual costs + one-time costs → summary'
    }
  },

  // ── COMPARISONS ─────────────────────────────────────────
  {
    id: 'cmp-baseline-forecast',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'comparison',
      subtype: 'baseline_vs_forecast',
      label: 'Baseline vs Forecast',
      subtitle: 'Annual summary: change values + percent changes'
    }
  },

  // ── OUTPUTS ─────────────────────────────────────────────
  {
    id: 'out-annual-savings',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'output',
      subtype: 'metric',
      label: 'Estimated Annual Savings ($)',
      metricKey: 'annualSummary.dollarCost.change',
      metricUnit: 'USD'
    }
  },
  {
    id: 'out-su-reduction',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'output',
      subtype: 'metric',
      label: 'Single-Use Reduction (units)',
      metricKey: 'annualSummary.singleUseProductCount.change',
      metricUnit: 'units'
    }
  },
  {
    id: 'out-waste',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'output',
      subtype: 'metric',
      label: 'Waste Reduction (lbs)',
      metricKey: 'environmentalResults.annualWasteChanges.summary.change',
      metricUnit: 'lbs'
    }
  },
  {
    id: 'out-ghg',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'output',
      subtype: 'metric',
      label: 'GHG Reduction (MTCO2e)',
      metricKey: 'environmentalResults.annualGasEmissionChanges.total.change',
      metricUnit: 'MTCO2e'
    }
  },
  {
    id: 'out-water',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'output',
      subtype: 'metric',
      label: 'Water Savings (gal)',
      metricKey: 'environmentalResults.annualWaterUsageChanges.total.change',
      metricUnit: 'gal'
    }
  },
  {
    id: 'out-breakeven',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'output',
      subtype: 'metric',
      label: 'Env Break-Even (months)',
      metricKey: 'environmentalResults.envBreakEven.co2BreakEvenMonths',
      metricUnit: 'months'
    }
  },
  {
    id: 'out-roi',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'output',
      subtype: 'metric',
      label: 'Annual ROI (%)',
      metricKey: 'financialResults.summary.annualROIPercent',
      metricUnit: '%'
    }
  },
  {
    id: 'out-payback',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'output',
      subtype: 'metric',
      label: 'Payback Period (months)',
      metricKey: 'financialResults.summary.paybackPeriodsMonths',
      metricUnit: 'months'
    }
  },
  {
    id: 'out-onetime',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'output',
      subtype: 'metric',
      label: 'One-Time Startup Cost ($)',
      metricKey: 'financialResults.oneTimeCosts.total',
      metricUnit: 'USD'
    }
  },
  {
    id: 'out-bottles',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'output',
      subtype: 'metric',
      label: 'Bottles Saved',
      metricKey: 'bottleStationResults.bottlesSaved',
      metricUnit: 'bottles'
    }
  }
];

const edges = [
  // ── Inputs → Calculations ──
  edge('inp-su-items', 'calc-su-results', INPUT),
  edge('inp-su-items', 'calc-waste', INPUT),
  edge('inp-su-items', 'calc-ghg', INPUT),
  edge('inp-su-items', 'calc-water', INPUT),
  edge('inp-reuse-items', 'calc-reuse-results', INPUT),
  edge('inp-reuse-items', 'calc-env-breakeven', INPUT),
  edge('inp-reuse-items', 'calc-ghg', INPUT),
  edge('inp-reuse-items', 'calc-waste', INPUT),
  edge('inp-dishwashers', 'calc-dishwasher', INPUT),
  edge('inp-labor', 'calc-annual-costs', INPUT),
  edge('inp-other-expenses', 'calc-annual-costs', INPUT),
  edge('inp-other-expenses', 'calc-onetime-costs', INPUT),
  edge('inp-waste-hauling', 'calc-annual-costs', INPUT),
  edge('inp-project-settings', 'calc-dishwasher', INPUT),
  edge('inp-project-settings', 'calc-ghg', INPUT),
  edge('inp-bottle-stations', 'calc-bottle-station', INPUT),

  // ── Factors → Calculations ──
  edge('fac-material-ghg', 'calc-ghg', FACTOR),
  edge('fac-material-water', 'calc-water', FACTOR),
  edge('fac-reusable-material', 'calc-ghg', FACTOR),
  edge('fac-reusable-material', 'calc-env-breakeven', FACTOR),
  edge('fac-transport', 'calc-ghg', FACTOR),
  edge('fac-transport', 'calc-env-breakeven', FACTOR),
  edge('fac-electric-co2', 'calc-ghg', FACTOR),
  edge('fac-gas-co2', 'calc-ghg', FACTOR),
  edge('fac-utility-rates', 'calc-dishwasher', FACTOR),
  edge('fac-return-rate', 'calc-reuse-results', FACTOR),

  // ── Calculations → Calculations (chaining) ──
  edge('calc-dishwasher', 'calc-ghg', CALC),
  edge('calc-dishwasher', 'calc-water', CALC),
  edge('calc-dishwasher', 'calc-annual-costs', CALC),
  edge('calc-su-results', 'calc-annual-costs', CALC),
  edge('calc-reuse-results', 'calc-onetime-costs', CALC),
  edge('calc-reuse-results', 'calc-annual-costs', CALC),

  // ── Calculations → Aggregations ──
  edge('calc-ghg', 'agg-environmental', CALC),
  edge('calc-waste', 'agg-environmental', CALC),
  edge('calc-water', 'agg-environmental', CALC),
  edge('calc-env-breakeven', 'agg-environmental', CALC),
  edge('calc-annual-costs', 'agg-financial', CALC),
  edge('calc-onetime-costs', 'agg-financial', CALC),

  // ── Aggregations → Comparison ──
  edge('agg-environmental', 'cmp-baseline-forecast', AGG),
  edge('agg-financial', 'cmp-baseline-forecast', AGG),

  // ── Comparison → Outputs ──
  edge('cmp-baseline-forecast', 'out-annual-savings', CMP),
  edge('cmp-baseline-forecast', 'out-su-reduction', CMP),
  edge('cmp-baseline-forecast', 'out-waste', CMP),
  edge('cmp-baseline-forecast', 'out-ghg', CMP),
  edge('cmp-baseline-forecast', 'out-water', CMP),
  edge('cmp-baseline-forecast', 'out-breakeven', CMP),
  edge('cmp-baseline-forecast', 'out-roi', CMP),
  edge('cmp-baseline-forecast', 'out-payback', CMP),
  edge('cmp-baseline-forecast', 'out-onetime', CMP),

  // ── Direct calculation → Output ──
  edge('calc-bottle-station', 'out-bottles', CALC)
];

  return { nodes, edges };
}

async function main() {
  const { nodes, edges } = await buildNodes();
  const flowDefinitionJson = { nodes, edges, viewport: { x: 0, y: 0, zoom: 0.5 } };

  const existing = await prisma.dataProductDefinition.findFirst({
    where: { OR: [{ name: 'Projections Model' }, { slug: 'projections-model' }] }
  });

  if (existing) {
    const updated = await prisma.dataProductDefinition.update({
      where: { id: existing.id },
      data: { flowDefinitionJson, version: { increment: 1 } }
    });
    console.log(`Updated existing Projections Model (${updated.id}) → v${updated.version}`);
    console.log(`  Nodes: ${nodes.length}, Edges: ${edges.length}`);
    return;
  }

  const adminUser = await prisma.user.findFirst({ where: { role: 'ORG_ADMIN' }, select: { id: true } });
  if (!adminUser) throw new Error('No admin user found');

  const product = await prisma.dataProductDefinition.create({
    data: {
      name: 'Projections Model',
      slug: 'projections-model',
      createdByUserId: adminUser.id,
      description:
        'Full projection calculator pipeline: single-use & reusable line items → environmental/financial calculations → baseline vs forecast comparison → savings, waste, GHG, water, ROI, payback period outputs.',
      productType: 'calculator',
      audience: 'client',
      status: 'published',
      projectType: 'default',
      flowDefinitionJson,
      inputSchemaJson: {
        fields: [
          'SingleUseLineItems', 'ReusableLineItems', 'Dishwashers', 'LaborCosts',
          'OtherExpenses', 'WasteHaulingServices', 'BottleStations', 'ProjectSettings'
        ]
      },
      outputSchemaJson: {
        metrics: [
          'annualSummary.dollarCost.change',
          'annualSummary.singleUseProductCount.change',
          'annualSummary.wasteWeight.change',
          'annualSummary.greenhouseGasEmissions.total.change',
          'environmentalResults.annualWaterUsageChanges.total.change',
          'environmentalResults.envBreakEven.co2BreakEvenMonths',
          'financialResults.summary.annualROIPercent',
          'financialResults.summary.paybackPeriodsMonths',
          'financialResults.oneTimeCosts.total',
          'bottleStationResults.bottlesSaved'
        ]
      }
    }
  });

  console.log(`Created Projections Model: ${product.id}`);
  console.log(`  Nodes: ${nodes.length}, Edges: ${edges.length}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
