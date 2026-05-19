/* eslint-disable no-console */
import prisma from '../lib/prisma';
import { buildSampleRspInput } from '../lib/admin/rspFixture';
import { getRspIngestionResults } from '../lib/rsp/getRspIngestionResults';

const OUTPUT_METRICS = [
  {
    key: 'totals.netGhgMtco2e',
    label: 'Net GHG Avoided',
    description: 'Single-use baseline minus reusable embodied + wash + transport',
    format: 'number',
    unit: 'MTCO2e',
    decimals: 3
  },
  {
    key: 'totals.netWaterGallons',
    label: 'Net Water Saved',
    description: 'Avoided manufacturing water minus wash water',
    format: 'number',
    unit: 'gal',
    decimals: 0
  },
  {
    key: 'totals.netWasteLbs',
    label: 'Waste Diverted',
    description: 'Single-use weight kept out of landfill',
    format: 'number',
    unit: 'lbs',
    decimals: 0
  },
  {
    key: 'totals.totalReusablesCirculated',
    label: 'Reusables Circulated',
    description: 'Total reusable items sent out in this period',
    format: 'number',
    unit: 'items',
    decimals: 0
  },
  {
    key: 'totals.totalSingleUseAvoided',
    label: 'Single-Use Avoided',
    description: 'Disposable items the program displaced',
    format: 'number',
    unit: 'items',
    decimals: 0
  },
  {
    key: 'costs.netCostChange',
    label: 'Net Cost Change',
    description: 'Avoided single-use spend minus labor + transport (positive = savings)',
    format: 'currency',
    unit: 'USD',
    decimals: 0
  },
  {
    key: 'costs.totalLaborCost',
    label: 'Labor Cost',
    description: 'Wash labor for the period',
    format: 'currency',
    unit: 'USD',
    decimals: 0
  },
  {
    key: 'costs.totalTransportCost',
    label: 'Transport Cost',
    description: 'Delivery fleet cost for the period',
    format: 'currency',
    unit: 'USD',
    decimals: 0
  }
];

async function main() {
  // 1. Upsert the data product definition
  let product = await prisma.dataProductDefinition.findFirst({ where: { slug: 'rsp-ingestion-model' } });

  if (!product) {
    const adminUser = await prisma.user.findFirst({ where: { role: 'ORG_ADMIN' }, select: { id: true } });
    if (!adminUser) throw new Error('No admin user found');
    product = await prisma.dataProductDefinition.create({
      data: {
        name: 'RSP Ingestion Model',
        slug: 'rsp-ingestion-model',
        createdByUserId: adminUser.id,
        description:
          'Per-period impact model for Reuse Service Providers (e.g. Sharewares). Inputs: containers in/out by reusable type plus org wash + transport profile. Outputs: GHG, water, waste avoided + cost change. Real engine — addresses the gaps in docs/ACTUALS.md.',
        productType: 'calculator',
        audience: 'internal',
        status: 'published',
        projectType: 'rsp', // RSP is its own shape — datasets use category='rsp' to match
        outputSchemaJson: { metrics: OUTPUT_METRICS } as any,
        inputSchemaJson: {
          fields: ['Period', 'State', 'OrgProfile', 'UsageRows']
        } as any
      }
    });
    console.log(`Created RSP Ingestion Model: ${product.id}`);
  } else {
    await prisma.dataProductDefinition.update({
      where: { id: product.id },
      data: {
        outputSchemaJson: { metrics: OUTPUT_METRICS } as any
      }
    });
    console.log(`Updated existing RSP Ingestion Model: ${product.id}`);
  }

  // 2. Seed a golden dataset using the sample input + real engine output
  const sample = buildSampleRspInput();
  const expectedOutputs = getRspIngestionResults(sample);

  const dataset = await prisma.goldenDataset.create({
    data: {
      name: 'RSP April 2026 — Mid-size electric-van operator',
      description: 'Sample period for a Sharewares-style operator washing in commercial dishwashers, delivering by electric van. Replaces polystyrene foam.',
      category: 'rsp',
      inputs: sample as any,
      expectedOutputs: expectedOutputs as any,
      tolerance: 0.02,
      tags: ['rsp-ingestion-model', 'seeded'],
      sourceProjectId: null
    }
  });

  console.log(`Created RSP golden dataset: ${dataset.id}`);
  console.log(`  Net GHG: ${expectedOutputs.totals.netGhgMtco2e.toFixed(3)} MTCO2e`);
  console.log(`  Net Cost: $${expectedOutputs.costs.netCostChange.toFixed(2)}`);
  console.log(`  Reusables: ${expectedOutputs.totals.totalReusablesCirculated}`);
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
