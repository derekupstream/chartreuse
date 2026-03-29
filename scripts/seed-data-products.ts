/**
 * Seed script: creates two pre-built Data Products that model ChartReuse's
 * existing Projections and Actuals calculation flows.
 *
 * These serve as reference examples in the Data Product Designer so users
 * can see how real methodology maps to node-based flows.
 *
 * Run with: npx tsx scripts/seed-data-products.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Helper: create a positioned node ───────────────────────────────────────
type NodeType = 'input' | 'factor' | 'calculation' | 'aggregation' | 'comparison' | 'output';

function node(
  id: string,
  nodeType: NodeType,
  label: string,
  x: number,
  y: number,
  extra?: Record<string, unknown>
) {
  return {
    id,
    type: 'designer',
    position: { x, y },
    data: { nodeType, label, ...extra }
  };
}

function edge(source: string, target: string, color: string) {
  return {
    id: `e-${source}-${target}`,
    source,
    target,
    animated: true,
    markerEnd: { type: 'arrowclosed', color },
    style: { stroke: color, strokeWidth: 2 }
  };
}

// Colors matching NODE_TYPE_DEFS
const GREEN = '#52c41a';
const BLUE = '#1677ff';
const ORANGE = '#fa8c16';
const PINK = '#eb2f96';
const RED = '#ff4d4f';
const PURPLE = '#722ed1';

// ─── Projections Model ──────────────────────────────────────────────────────
function buildProjectionsFlow() {
  const nodes = [
    // ── Column 1: Inputs (x=0) ──
    node('inp-baseline', 'input', 'Baseline Purchasing', 0, 0, {
      subtype: 'baseline_purchasing',
      subtitle: 'Single-use items: cases, costs, materials'
    }),
    node('inp-forecast', 'input', 'Forecast Purchasing', 0, 120, {
      subtype: 'forecast_purchasing',
      subtitle: 'Reusable items: cases, costs, materials'
    }),
    node('inp-project', 'input', 'Project Settings', 0, 240, {
      subtype: 'project_data',
      subtitle: 'State, dishwasher config, labor, expenses'
    }),

    // ── Column 2: Factors (x=280) ──
    node('fac-warm', 'factor', 'EPA WARM Emission Factors', 280, 0, {
      subtype: 'emission_factor',
      subtitle: 'MTCO2e per lb by material (v16)'
    }),
    node('fac-water', 'factor', 'Water Usage Factors', 280, 100, {
      subtype: 'material_property',
      subtitle: 'Gallons per lb by material'
    }),
    node('fac-transport', 'factor', 'Transportation Factor', 280, 200, {
      subtype: 'emission_factor',
      subtitle: 'Shanghai→LA shipping MTCO2e'
    }),
    node('fac-utility', 'factor', 'State Utility Rates', 280, 300, {
      subtype: 'utility_rate',
      subtitle: 'DOE $/kWh, $/therm, $/gal by state'
    }),
    node('fac-electric-co2', 'factor', 'Electric CO2 Factor', 280, 400, {
      subtype: 'grid_intensity',
      subtitle: 'lbs CO2e per kWh'
    }),
    node('fac-reusable-mat', 'factor', 'Reusable Material Data', 280, 500, {
      subtype: 'material_property',
      subtitle: 'Weight, material %, lifespan by product'
    }),

    // ── Column 3: Core Calculations (x=580) ──
    node('calc-su', 'calculation', 'Single-Use Results', 580, 0, {
      calculationName: 'getSingleUseResults',
      subtitle: 'getSingleUseResults() → 5 metrics'
    }),
    node('calc-reuse', 'calculation', 'Reusable Results', 580, 100, {
      calculationName: 'getReusableResults',
      subtitle: 'getReusableResults() → 6 metrics'
    }),
    node('calc-dishwasher', 'calculation', 'Dishwasher Stats', 580, 210, {
      calculationName: 'getDishwasherStats',
      subtitle: 'getDishwasherStats() → 8 metrics'
    }),
    node('calc-ghg', 'calculation', 'GHG Emissions', 580, 320, {
      calculationName: 'getAnnualGasEmissionChanges',
      subtitle: 'getAnnualGasEmissionChanges() → 4 metrics'
    }),
    node('calc-water', 'calculation', 'Water Usage', 580, 430, {
      calculationName: 'getAnnualWaterUsageChanges',
      subtitle: 'getAnnualWaterUsageChanges() → 3 metrics'
    }),
    node('calc-waste', 'calculation', 'Waste Changes', 580, 540, {
      calculationName: 'getAnnualWasteChanges',
      subtitle: 'getAnnualWasteChanges() → 3 metrics'
    }),

    // ── Column 4: Financial + Aggregation (x=880) ──
    node('calc-financial', 'calculation', 'Financial Results', 880, 0, {
      calculationName: 'getFinancialResults',
      subtitle: 'getFinancialResults() → 6 metrics'
    }),
    node('calc-env', 'calculation', 'Environmental Results', 880, 150, {
      calculationName: 'getEnvironmentalResults',
      subtitle: 'getEnvironmentalResults() → 5 metrics'
    }),
    node('calc-breakeven', 'calculation', 'Break-Even Analysis', 880, 300, {
      calculationName: 'getEnvBreakEven',
      subtitle: 'getEnvBreakEven() → 7 metrics'
    }),

    // ── Column 5: Comparison (x=1160) ──
    node('cmp-delta', 'comparison', 'Baseline vs Forecast', 1160, 80, {
      subtype: 'baseline_vs_forecast',
      subtitle: 'Net change across all categories'
    }),

    // ── Column 6: Summary + Outputs (x=1440) ──
    node('calc-summary', 'calculation', 'Annual Summary', 1440, 0, {
      calculationName: 'getAnnualSummary',
      subtitle: 'getAnnualSummary() → 4 metrics'
    }),
    node('out-ghg', 'output', 'GHG Change (MTCO2e)', 1440, 110, {
      subtype: 'metric',
      metricKey: 'annualGHGChange',
      metricUnit: 'MTCO2e',
      subtitle: 'annualGHGChange (MTCO2e)'
    }),
    node('out-water', 'output', 'Water Change (gal)', 1440, 210, {
      subtype: 'metric',
      metricKey: 'annualWaterChange',
      metricUnit: 'gallons',
      subtitle: 'annualWaterChange (gallons)'
    }),
    node('out-waste', 'output', 'Waste Reduction (lbs)', 1440, 310, {
      subtype: 'metric',
      metricKey: 'annualWasteReduction',
      metricUnit: 'lbs',
      subtitle: 'annualWasteReduction (lbs)'
    }),
    node('out-cost', 'output', 'Annual Cost Savings ($)', 1440, 410, {
      subtype: 'metric',
      metricKey: 'annualCostSavings',
      metricUnit: 'USD',
      subtitle: 'annualCostSavings (USD)'
    }),
    node('out-roi', 'output', 'ROI %', 1440, 510, {
      subtype: 'metric',
      metricKey: 'annualROIPercent',
      metricUnit: '%',
      subtitle: 'annualROIPercent (%)'
    }),
    node('out-payback', 'output', 'Payback Period', 1440, 610, {
      subtype: 'metric',
      metricKey: 'paybackPeriodMonths',
      metricUnit: 'months',
      subtitle: 'paybackPeriodMonths (months)'
    }),
    node('out-breakeven', 'output', 'Env Break-Even', 1440, 710, {
      subtype: 'metric',
      metricKey: 'co2BreakEvenMonths',
      metricUnit: 'months',
      subtitle: 'co2BreakEvenMonths (months)'
    })
  ];

  const edges = [
    // Inputs → Calculations
    edge('inp-baseline', 'calc-su', GREEN),
    edge('inp-forecast', 'calc-reuse', GREEN),
    edge('inp-project', 'calc-dishwasher', GREEN),
    edge('inp-project', 'calc-financial', GREEN),

    // Factors → Calculations
    edge('fac-warm', 'calc-ghg', BLUE),
    edge('fac-warm', 'calc-su', BLUE),
    edge('fac-water', 'calc-water', BLUE),
    edge('fac-water', 'calc-su', BLUE),
    edge('fac-transport', 'calc-ghg', BLUE),
    edge('fac-utility', 'calc-dishwasher', BLUE),
    edge('fac-utility', 'calc-financial', BLUE),
    edge('fac-electric-co2', 'calc-ghg', BLUE),
    edge('fac-reusable-mat', 'calc-reuse', BLUE),
    edge('fac-reusable-mat', 'calc-breakeven', BLUE),

    // Core calcs → Environmental/Financial aggregates
    edge('calc-su', 'calc-ghg', ORANGE),
    edge('calc-su', 'calc-waste', ORANGE),
    edge('calc-su', 'calc-water', ORANGE),
    edge('calc-reuse', 'calc-ghg', ORANGE),
    edge('calc-reuse', 'calc-waste', ORANGE),
    edge('calc-reuse', 'calc-water', ORANGE),
    edge('calc-dishwasher', 'calc-ghg', ORANGE),
    edge('calc-dishwasher', 'calc-water', ORANGE),
    edge('calc-dishwasher', 'calc-financial', ORANGE),

    // Into environmental results
    edge('calc-ghg', 'calc-env', ORANGE),
    edge('calc-water', 'calc-env', ORANGE),
    edge('calc-waste', 'calc-env', ORANGE),
    edge('calc-ghg', 'calc-breakeven', ORANGE),

    // Into comparison
    edge('calc-financial', 'cmp-delta', RED),
    edge('calc-env', 'cmp-delta', RED),

    // Comparison → Summary
    edge('cmp-delta', 'calc-summary', RED),

    // Summary/calcs → Outputs
    edge('calc-summary', 'out-ghg', PURPLE),
    edge('calc-summary', 'out-water', PURPLE),
    edge('calc-summary', 'out-waste', PURPLE),
    edge('calc-summary', 'out-cost', PURPLE),
    edge('calc-financial', 'out-roi', PURPLE),
    edge('calc-financial', 'out-payback', PURPLE),
    edge('calc-breakeven', 'out-breakeven', PURPLE)
  ];

  return { nodes, edges };
}

// ─── Actuals (Event) Model ──────────────────────────────────────────────────
function buildActualsFlow() {
  const nodes = [
    // ── Inputs (x=0) ──
    node('inp-event', 'input', 'Event Foodware Data', 0, 0, {
      subtype: 'user_input',
      subtitle: 'Items used at event: type, count, material'
    }),
    node('inp-venue', 'input', 'Venue / Event Settings', 0, 120, {
      subtype: 'project_data',
      subtitle: 'State, event size, date'
    }),
    node('inp-bottles', 'input', 'Bottle Station Data', 0, 240, {
      subtype: 'user_input',
      subtitle: 'Number of stations, usage estimates'
    }),

    // ── Factors (x=280) ──
    node('fac-warm-ev', 'factor', 'EPA WARM Factors', 280, 0, {
      subtype: 'emission_factor',
      subtitle: 'MTCO2e per lb by material'
    }),
    node('fac-water-ev', 'factor', 'Water Factors', 280, 100, {
      subtype: 'material_property',
      subtitle: 'Gallons per lb by material'
    }),
    node('fac-transport-ev', 'factor', 'Transportation Factor', 280, 200, {
      subtype: 'emission_factor',
      subtitle: 'Shanghai→LA MTCO2e'
    }),

    // ── Calculations (x=560) ──
    node('calc-su-ev', 'calculation', 'Single-Use Results', 560, 0, {
      calculationName: 'getSingleUseResults',
      subtitle: 'getSingleUseResults() → 5 metrics'
    }),
    node('calc-event-waste', 'calculation', 'Event Waste', 560, 110, {
      calculationName: 'getEventProjectWaste',
      subtitle: 'getEventProjectWaste() → 3 metrics'
    }),
    node('calc-ghg-ev', 'calculation', 'GHG Emissions', 560, 220, {
      calculationName: 'getAnnualGasEmissionChanges',
      subtitle: 'getAnnualGasEmissionChanges() → 4 metrics'
    }),
    node('calc-water-ev', 'calculation', 'Water Usage', 560, 330, {
      calculationName: 'getAnnualWaterUsageChanges',
      subtitle: 'getAnnualWaterUsageChanges() → 3 metrics'
    }),
    node('calc-bottles', 'calculation', 'Bottle Station', 560, 440, {
      calculationName: 'getBottleStationResults',
      subtitle: 'getBottleStationResults() → bottles saved'
    }),

    // ── Aggregation (x=840) ──
    node('agg-env', 'aggregation', 'Environmental Totals', 840, 110, {
      subtype: 'sum',
      subtitle: 'Combine GHG + waste + water'
    }),
    node('agg-cost', 'aggregation', 'Cost Totals', 840, 280, {
      subtype: 'sum',
      subtitle: 'Sum procurement costs'
    }),

    // ── Comparison (x=1080) ──
    node('cmp-event', 'comparison', 'Single-Use vs Reuse', 1080, 170, {
      subtype: 'baseline_vs_forecast',
      subtitle: 'What-if the event used reusables?'
    }),

    // ── Outputs (x=1340) ──
    node('out-waste-ev', 'output', 'Waste Diverted (lbs)', 1340, 0, {
      subtype: 'metric',
      metricKey: 'eventWasteDiverted',
      metricUnit: 'lbs',
      subtitle: 'eventWasteDiverted (lbs)'
    }),
    node('out-ghg-ev', 'output', 'GHG Avoided (MTCO2e)', 1340, 100, {
      subtype: 'metric',
      metricKey: 'eventGHGAvoided',
      metricUnit: 'MTCO2e',
      subtitle: 'eventGHGAvoided (MTCO2e)'
    }),
    node('out-water-ev', 'output', 'Water Saved (gal)', 1340, 200, {
      subtype: 'metric',
      metricKey: 'eventWaterSaved',
      metricUnit: 'gallons',
      subtitle: 'eventWaterSaved (gallons)'
    }),
    node('out-bottles-ev', 'output', 'Bottles Saved', 1340, 300, {
      subtype: 'metric',
      metricKey: 'bottlesSaved',
      metricUnit: 'count',
      subtitle: 'bottlesSaved (count)'
    }),
    node('out-cost-ev', 'output', 'Event Cost Impact ($)', 1340, 400, {
      subtype: 'metric',
      metricKey: 'eventCostImpact',
      metricUnit: 'USD',
      subtitle: 'eventCostImpact (USD)'
    })
  ];

  const edges = [
    // Inputs → Calculations
    edge('inp-event', 'calc-su-ev', GREEN),
    edge('inp-event', 'calc-event-waste', GREEN),
    edge('inp-venue', 'calc-ghg-ev', GREEN),
    edge('inp-bottles', 'calc-bottles', GREEN),

    // Factors → Calculations
    edge('fac-warm-ev', 'calc-ghg-ev', BLUE),
    edge('fac-warm-ev', 'calc-su-ev', BLUE),
    edge('fac-water-ev', 'calc-water-ev', BLUE),
    edge('fac-transport-ev', 'calc-ghg-ev', BLUE),

    // Calcs → Aggregation
    edge('calc-su-ev', 'agg-cost', ORANGE),
    edge('calc-event-waste', 'agg-env', ORANGE),
    edge('calc-ghg-ev', 'agg-env', ORANGE),
    edge('calc-water-ev', 'agg-env', ORANGE),
    edge('calc-su-ev', 'agg-env', ORANGE),

    // Aggregation → Comparison
    edge('agg-env', 'cmp-event', PINK),
    edge('agg-cost', 'cmp-event', PINK),

    // Comparison / Calcs → Outputs
    edge('cmp-event', 'out-waste-ev', PURPLE),
    edge('cmp-event', 'out-ghg-ev', PURPLE),
    edge('cmp-event', 'out-water-ev', PURPLE),
    edge('calc-bottles', 'out-bottles-ev', PURPLE),
    edge('cmp-event', 'out-cost-ev', PURPLE)
  ];

  return { nodes, edges };
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  // Find an admin user to attribute creation to
  const adminUser = await prisma.user.findFirst({
    where: { org: { isUpstream: true } }
  });

  if (!adminUser) {
    console.log('No upstream user found. Run seed.ts first.');
    process.exit(1);
  }

  const userId = adminUser.id;

  // Clean up any previous seeds
  await prisma.dataProductDefinition.deleteMany({
    where: { slug: { in: ['projections-model', 'actuals-event-model'] } }
  });

  // ── Create Projections Model ──
  const projFlow = buildProjectionsFlow();
  const proj = await prisma.dataProductDefinition.create({
    data: {
      name: 'Projections Model',
      slug: 'projections-model',
      description:
        'The core ChartReuse projection calculator. Models the environmental and financial impact of switching from single-use to reusable foodware based on the Chart-Reuse Methodology v2.0. Combines EPA WARM emission factors, DOE utility rates, material databases, and dishwasher energy models to produce GHG, water, waste, and cost projections.',
      productType: 'calculator',
      audience: 'client',
      projectType: 'default',
      status: 'published',
      version: 2,
      publishedVersion: 2,
      flowDefinitionJson: {
        nodes: projFlow.nodes,
        edges: projFlow.edges,
        viewport: { x: 0, y: 0, zoom: 0.65 }
      },
      createdByUserId: userId
    }
  });
  console.log(`Created: ${proj.name} (${projFlow.nodes.length} nodes, ${projFlow.edges.length} edges)`);

  // ── Create Actuals (Event) Model ──
  const actualsFlow = buildActualsFlow();
  const actuals = await prisma.dataProductDefinition.create({
    data: {
      name: 'Actuals / Event Model',
      slug: 'actuals-event-model',
      description:
        'Models the impact of a single event where reusable foodware was used instead of single-use. Calculates waste diverted, GHG avoided, water saved, and bottles saved. Used for event-type projects and one-time actuals reporting.',
      productType: 'calculator',
      audience: 'client',
      projectType: 'event',
      status: 'published',
      version: 1,
      publishedVersion: 1,
      flowDefinitionJson: {
        nodes: actualsFlow.nodes,
        edges: actualsFlow.edges,
        viewport: { x: 0, y: 0, zoom: 0.75 }
      },
      createdByUserId: userId
    }
  });
  console.log(`Created: ${actuals.name} (${actualsFlow.nodes.length} nodes, ${actualsFlow.edges.length} edges)`);

  console.log('\nDone! Visit /admin/data-science/data-products to see them.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
