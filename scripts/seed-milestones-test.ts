/**
 * Seed script: generates 6 months of test ProjectMilestone data.
 *
 * Finds the first project in the local DB that has reusable line items,
 * runs getProjections() to get baseline KPIs, then inserts 6 milestone records
 * (one per month over the past 6 months) with KPIs ramping up from 60% → 100%
 * to simulate a program that grew in utilization over time.
 *
 * Run with: npx tsx scripts/seed-milestones-test.ts
 */

import { PrismaClient } from '@prisma/client';
import { getProjections } from 'lib/calculator/getProjections';

const prisma = new PrismaClient();

async function main() {
  // Find a project with reusable items
  const project = await prisma.project.findFirst({
    where: {
      isTemplate: false,
      reusableItems: { some: {} }
    },
    include: { reusableItems: true }
  });

  if (!project) {
    console.log('No project with reusable items found. Run seed.ts first or create a project manually.');
    process.exit(1);
  }

  console.log(`Using project: "${project.name}" (${project.id})`);

  // Clean up any existing test milestones for this project
  await prisma.projectMilestone.deleteMany({ where: { projectId: project.id, source: 'seed' } });

  // Get base projections
  const proj = await getProjections(project.id);
  const { annualSummary, environmentalResults, financialResults, reusableResults } = proj;

  const annualCostChange = financialResults.summary.annualCost;
  const baseCO2 = Math.abs(annualSummary.greenhouseGasEmissions.total.change);
  const baseWater = Math.abs(environmentalResults.annualWaterUsageChanges.total.change);
  const baseWaste = Math.abs(annualSummary.wasteWeight.change);
  const baseCostSavings = annualCostChange < 0 ? Math.abs(annualCostChange) : 0;
  const baseReturnRate = (reusableResults.summary.returnRate?.returnRate ?? 0) * 100;
  const baseEnvBreakEven = environmentalResults.envBreakEven.co2BreakEvenMonths;

  // Generate 6 milestones from 6 months ago → now
  const now = new Date();
  const rampFactors = [0.6, 0.7, 0.78, 0.86, 0.94, 1.0]; // ramp from 60% → 100%

  for (let i = 0; i < 6; i++) {
    const snapshotDate = new Date(now);
    snapshotDate.setMonth(snapshotDate.getMonth() - (5 - i));
    snapshotDate.setDate(1); // first of each month

    const factor = rampFactors[i];

    await prisma.projectMilestone.create({
      data: {
        projectId: project.id,
        snapshotDate,
        label: `Month ${i + 1} snapshot`,
        source: 'seed',
        co2AvoidedMtco2e: baseCO2 * factor,
        waterSavedGallons: baseWater * factor,
        wasteDivertedLbs: baseWaste * factor,
        annualCostSavings: baseCostSavings * factor,
        paybackMonths: financialResults.summary.paybackPeriodsMonths,
        annualROIPct: financialResults.summary.annualROIPercent,
        envBreakEvenMonths: baseEnvBreakEven,
        returnRatePct: baseReturnRate * Math.min(factor + 0.1, 1),
        rawMetrics: proj as any
      }
    });

    console.log(`  Created milestone ${i + 1}/6 for ${snapshotDate.toISOString().split('T')[0]} (factor: ${factor})`);
  }

  console.log(`\nDone! Created 6 milestones for project "${project.name}".`);
  console.log('Navigate to /org/analytics to see the Impact Timeline chart.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
