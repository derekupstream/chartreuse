/* eslint-disable no-console */
/**
 * Populates inputSchemaJson + outputSchemaJson on the Actuals / Event Model data
 * product so its Tests tab has metrics to render. Idempotent.
 */
import prisma from '../lib/prisma';

const OUTPUT_METRICS = [
  {
    key: 'eventCostResults.netCostChange',
    label: 'Net Cost Change',
    description: 'Avoided single-use spend minus replacement, labor, and other costs (positive = savings)',
    format: 'currency',
    unit: 'USD',
    decimals: 0
  },
  {
    key: 'eventCostResults.totalSingleUseAvoidedCost',
    label: 'Single-Use Cost Avoided',
    description: 'Spend on disposables that the reusable program prevented',
    format: 'currency',
    unit: 'USD',
    decimals: 0
  },
  {
    key: 'eventCostResults.totalReusableReplacementCost',
    label: 'Reusable Replacement Cost',
    description: 'Cost of reusables that were not returned and need replacing',
    format: 'currency',
    unit: 'USD',
    decimals: 0
  },
  {
    key: 'eventCostResults.totalLaborCost',
    label: 'Event Labor Cost',
    description: 'Labor for setup, monitoring, return collection, washing',
    format: 'currency',
    unit: 'USD',
    decimals: 0
  },
  {
    key: 'eventCostResults.totalOtherExpenseCost',
    label: 'Other Event Cost',
    description: 'Transport, deposits, signage, or other one-off event spend',
    format: 'currency',
    unit: 'USD',
    decimals: 0
  },
  {
    key: 'environmentalResults.annualGasEmissionChanges.total.change',
    label: 'GHG Avoided',
    description: 'Greenhouse gas emissions avoided by the event',
    format: 'number',
    unit: 'MTCO2e',
    decimals: 3
  },
  {
    key: 'environmentalResults.annualWasteChanges.summary.change',
    label: 'Waste Diverted',
    description: 'Pounds of foodware waste kept out of landfill',
    format: 'number',
    unit: 'lbs',
    decimals: 0
  },
  {
    key: 'environmentalResults.annualWaterUsageChanges.total.change',
    label: 'Water Saved',
    description: 'Net water saved (manufacturing minus dishwashing)',
    format: 'number',
    unit: 'gal',
    decimals: 0
  },
  {
    key: 'reusableResults.summary.returnRate.returnRate',
    label: 'Return Rate',
    description: 'Percentage of reusables that came back',
    format: 'number',
    unit: '%',
    decimals: 1
  }
];

async function main() {
  const product = await prisma.dataProductDefinition.findFirst({
    where: { slug: 'actuals-event-model' }
  });
  if (!product) {
    console.error('No data product with slug "actuals-event-model"');
    process.exit(1);
  }

  await prisma.dataProductDefinition.update({
    where: { id: product.id },
    data: {
      outputSchemaJson: { metrics: OUTPUT_METRICS } as any,
      inputSchemaJson: {
        fields: [
          'EventFoodwareLineItems',
          'ReusableReturnCount',
          'WaterUsageGallons',
          'ProjectSettings'
        ]
      } as any,
      description:
        product.description ||
        'Per-event reuse impact for events-driven programs (e.g. SES). Inputs: reusables sent out and returned, water usage. Outputs: GHG, waste, water, cost change. Real engine — same path as live event projects.'
    }
  });

  console.log(`Updated Actuals / Event Model (${product.id}) — ${OUTPUT_METRICS.length} output metrics declared`);
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
