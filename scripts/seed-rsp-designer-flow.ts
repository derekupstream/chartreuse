/* eslint-disable no-console */
/**
 * Populates the RSP Ingestion Model's flowDefinitionJson with nodes + edges so
 * the Designer tab renders a proper flow graph that matches what the engine
 * actually does. Idempotent — overwrites the existing flow.
 */
import prisma from '../lib/prisma';

const INPUT = '#52c41a';
const FACTOR = '#1677ff';
const CALC = '#fa8c16';
const AGG = '#eb2f96';
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

const nodes = [
  // ── INPUTS ────────────────────────────────────────────────
  {
    id: 'inp-client',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'input',
      subtype: 'project_data',
      label: 'Client / Venue',
      subtitle: 'Account, name, venue category (school / cafe / stadium / etc.)'
    }
  },
  {
    id: 'inp-period',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'input',
      subtype: 'project_data',
      label: 'Period',
      subtitle: 'Start + end date for this reporting period'
    }
  },
  {
    id: 'inp-state',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'input',
      subtype: 'project_data',
      label: 'State',
      subtitle: 'Drives utility rate selection'
    }
  },
  {
    id: 'inp-wash-facility',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'input',
      subtype: 'project_data',
      label: 'Wash Facility Type',
      subtitle: 'Commercial / industrial / manual — drives water + energy per cycle'
    }
  },
  {
    id: 'inp-wash-energy',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'input',
      subtype: 'project_data',
      label: 'Wash Energy Source',
      subtitle: 'Grid electric / natural gas / solar — drives kg CO2e per kWh'
    }
  },
  {
    id: 'inp-transport-vehicle',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'input',
      subtype: 'project_data',
      label: 'Transport Vehicle',
      subtitle: 'Electric van / gas van / diesel truck / bike — per-mile CO2e'
    }
  },
  {
    id: 'inp-su-baseline',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'input',
      subtype: 'project_data',
      label: 'Default Single-Use Replaced',
      subtitle: 'PS foam / paper / PET / PP / PLA — what the reusable displaces'
    }
  },
  {
    id: 'inp-usage-rows',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'input',
      subtype: 'api_data',
      label: 'Usage Rows',
      subtitle: 'Per-reusable: type, material, weight, in/out counts, deliveries (from RSP API)'
    }
  },

  // ── FACTORS ───────────────────────────────────────────────
  {
    id: 'fac-material-ghg',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'factor',
      subtype: 'emission_factor',
      label: 'Material GHG / kg',
      subtitle: '8 materials — stainless, PP, aluminum, glass, melamine, polycarbonate, bamboo, ceramic',
      hasGap: true,
      gapReason: 'Hardcoded approximations; should pull from Factor table v2'
    }
  },
  {
    id: 'fac-material-water',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'factor',
      subtype: 'material_property',
      label: 'Material Water / kg',
      subtitle: 'Manufacturing water for each reusable material',
      hasGap: true,
      gapReason: 'Hardcoded approximations; should pull from Factor table v2'
    }
  },
  {
    id: 'fac-su-ghg',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'factor',
      subtype: 'emission_factor',
      label: 'Single-Use GHG / kg',
      subtitle: 'Baseline emissions for displaced disposable',
      hasGap: true,
      gapReason: 'Hardcoded; EPA WARM lookup pending'
    }
  },
  {
    id: 'fac-su-weight',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'factor',
      subtype: 'material_property',
      label: 'Single-Use Weight / item',
      subtitle: 'Avg disposable weight by material'
    }
  },
  {
    id: 'fac-wash-cycle',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'factor',
      subtype: 'utility_rate',
      label: 'Wash Cycle Factors',
      subtitle: 'Water gal/cycle, energy kWh/cycle, items/cycle by facility type'
    }
  },
  {
    id: 'fac-grid',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'factor',
      subtype: 'grid_intensity',
      label: 'Grid Intensity',
      subtitle: 'kg CO2e per kWh by energy source'
    }
  },
  {
    id: 'fac-transport',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'factor',
      subtype: 'emission_factor',
      label: 'Transport Vehicle Factor',
      subtitle: 'kg CO2e per mile by vehicle type'
    }
  },
  {
    id: 'fac-lifespan',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'factor',
      subtype: 'lifespan_assumption',
      label: 'Reusable Lifespan',
      subtitle: '100 uses default — amortizes embodied impact',
      hasGap: true,
      gapReason: 'Single value across materials; real lifespan varies'
    }
  },

  // ── CALCULATIONS ──────────────────────────────────────────
  {
    id: 'calc-su-avoided',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'calculation',
      label: 'Single-Use Avoided',
      subtitle: 'SU GHG × SU weight × items circulated',
      calculationName: 'getRspIngestionResults',
      calculationFile: 'lib/rsp/getRspIngestionResults.ts'
    }
  },
  {
    id: 'calc-reusable-embodied',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'calculation',
      label: 'Reusable Embodied (amortized)',
      subtitle: 'Material GHG × weight × items / lifespan',
      calculationName: 'getRspIngestionResults',
      calculationFile: 'lib/rsp/getRspIngestionResults.ts'
    }
  },
  {
    id: 'calc-wash',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'calculation',
      label: 'Wash Impact',
      subtitle: 'Cycles × (water + energy/kWh) × grid intensity',
      calculationName: 'getRspIngestionResults',
      calculationFile: 'lib/rsp/getRspIngestionResults.ts'
    }
  },
  {
    id: 'calc-transport',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'calculation',
      label: 'Transport Impact',
      subtitle: 'Deliveries × miles/delivery × vehicle factor',
      calculationName: 'getRspIngestionResults',
      calculationFile: 'lib/rsp/getRspIngestionResults.ts'
    }
  },
  {
    id: 'calc-net-ghg',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'calculation',
      label: 'Net GHG',
      subtitle: 'Avoided − embodied − wash − transport',
      calculationName: 'getRspIngestionResults',
      calculationFile: 'lib/rsp/getRspIngestionResults.ts'
    }
  },
  {
    id: 'calc-net-water',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'calculation',
      label: 'Net Water',
      subtitle: 'Avoided manufacturing water − reusable water − wash water',
      calculationName: 'getRspIngestionResults',
      calculationFile: 'lib/rsp/getRspIngestionResults.ts'
    }
  },
  {
    id: 'calc-net-waste',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'calculation',
      label: 'Waste Diverted',
      subtitle: 'Single-use weight × items avoided × 2.20462',
      calculationName: 'getRspIngestionResults',
      calculationFile: 'lib/rsp/getRspIngestionResults.ts'
    }
  },
  {
    id: 'calc-cost',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'calculation',
      label: 'Net Cost Change',
      subtitle: 'Avoided SU spend − labor cycles × $/cycle − transport miles × $/mile',
      calculationName: 'getRspIngestionResults',
      calculationFile: 'lib/rsp/getRspIngestionResults.ts',
      hasGap: true,
      gapReason: 'Single-use unit cost is hardcoded $0.15; should be per-row in v2'
    }
  },

  // ── AGGREGATION ──────────────────────────────────────────
  {
    id: 'agg-period-totals',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'aggregation',
      subtype: 'sum',
      label: 'Period Totals',
      subtitle: 'Sum across usage rows for this period'
    }
  },

  // ── OUTPUTS ──────────────────────────────────────────────
  {
    id: 'out-net-ghg',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'output',
      subtype: 'metric',
      label: 'Net GHG Avoided',
      metricKey: 'totals.netGhgMtco2e',
      metricUnit: 'MTCO2e'
    }
  },
  {
    id: 'out-net-water',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'output',
      subtype: 'metric',
      label: 'Net Water Saved',
      metricKey: 'totals.netWaterGallons',
      metricUnit: 'gal'
    }
  },
  {
    id: 'out-net-waste',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'output',
      subtype: 'metric',
      label: 'Waste Diverted',
      metricKey: 'totals.netWasteLbs',
      metricUnit: 'lbs'
    }
  },
  {
    id: 'out-reusables',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'output',
      subtype: 'metric',
      label: 'Reusables Circulated',
      metricKey: 'totals.totalReusablesCirculated',
      metricUnit: 'items'
    }
  },
  {
    id: 'out-su-avoided',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'output',
      subtype: 'metric',
      label: 'Single-Use Avoided',
      metricKey: 'totals.totalSingleUseAvoided',
      metricUnit: 'items'
    }
  },
  {
    id: 'out-net-cost',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'output',
      subtype: 'metric',
      label: 'Net Cost Change',
      metricKey: 'costs.netCostChange',
      metricUnit: 'USD'
    }
  },
  {
    id: 'out-labor-cost',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'output',
      subtype: 'metric',
      label: 'Labor Cost',
      metricKey: 'costs.totalLaborCost',
      metricUnit: 'USD'
    }
  },
  {
    id: 'out-transport-cost',
    type: 'designer',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'output',
      subtype: 'metric',
      label: 'Transport Cost',
      metricKey: 'costs.totalTransportCost',
      metricUnit: 'USD'
    }
  }
];

const edges = [
  // Inputs → Calculations
  edge('inp-usage-rows', 'calc-su-avoided', INPUT),
  edge('inp-usage-rows', 'calc-reusable-embodied', INPUT),
  edge('inp-usage-rows', 'calc-wash', INPUT),
  edge('inp-usage-rows', 'calc-transport', INPUT),
  edge('inp-usage-rows', 'calc-net-waste', INPUT),
  edge('inp-su-baseline', 'calc-su-avoided', INPUT),
  edge('inp-su-baseline', 'calc-net-waste', INPUT),
  edge('inp-wash-facility', 'calc-wash', INPUT),
  edge('inp-wash-energy', 'calc-wash', INPUT),
  edge('inp-transport-vehicle', 'calc-transport', INPUT),
  edge('inp-state', 'calc-wash', INPUT),

  // Factors → Calculations
  edge('fac-material-ghg', 'calc-reusable-embodied', FACTOR),
  edge('fac-material-water', 'calc-net-water', FACTOR),
  edge('fac-su-ghg', 'calc-su-avoided', FACTOR),
  edge('fac-su-weight', 'calc-su-avoided', FACTOR),
  edge('fac-su-weight', 'calc-net-waste', FACTOR),
  edge('fac-wash-cycle', 'calc-wash', FACTOR),
  edge('fac-grid', 'calc-wash', FACTOR),
  edge('fac-transport', 'calc-transport', FACTOR),
  edge('fac-lifespan', 'calc-reusable-embodied', FACTOR),

  // Calculations → Net calcs
  edge('calc-su-avoided', 'calc-net-ghg', CALC),
  edge('calc-reusable-embodied', 'calc-net-ghg', CALC),
  edge('calc-wash', 'calc-net-ghg', CALC),
  edge('calc-transport', 'calc-net-ghg', CALC),
  edge('calc-su-avoided', 'calc-net-water', CALC),
  edge('calc-wash', 'calc-net-water', CALC),
  edge('calc-su-avoided', 'calc-cost', CALC),
  edge('calc-wash', 'calc-cost', CALC),
  edge('calc-transport', 'calc-cost', CALC),

  // Net calcs → Aggregation
  edge('calc-net-ghg', 'agg-period-totals', CALC),
  edge('calc-net-water', 'agg-period-totals', CALC),
  edge('calc-net-waste', 'agg-period-totals', CALC),
  edge('calc-cost', 'agg-period-totals', CALC),
  edge('calc-cost', 'out-labor-cost', CALC),
  edge('calc-cost', 'out-transport-cost', CALC),

  // Aggregation → Outputs
  edge('agg-period-totals', 'out-net-ghg', AGG),
  edge('agg-period-totals', 'out-net-water', AGG),
  edge('agg-period-totals', 'out-net-waste', AGG),
  edge('agg-period-totals', 'out-reusables', AGG),
  edge('agg-period-totals', 'out-su-avoided', AGG),
  edge('agg-period-totals', 'out-net-cost', AGG),

  // Client / period context flow into the totals (informational edges)
  edge('inp-client', 'agg-period-totals', INPUT),
  edge('inp-period', 'agg-period-totals', INPUT)
];

async function main() {
  const product = await prisma.dataProductDefinition.findFirst({ where: { slug: 'rsp-ingestion-model' } });
  if (!product) {
    console.error('No RSP Ingestion Model — run seed-rsp-ingestion-model.ts first');
    process.exit(1);
  }

  const flowDefinitionJson = { nodes, edges, viewport: { x: 0, y: 0, zoom: 0.5 } };

  const updated = await prisma.dataProductDefinition.update({
    where: { id: product.id },
    data: { flowDefinitionJson: flowDefinitionJson as any, version: { increment: 1 } }
  });

  console.log(`Updated RSP Ingestion Model flow (v${updated.version})`);
  console.log(`  Nodes: ${nodes.length}, Edges: ${edges.length}`);
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
