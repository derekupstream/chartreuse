/**
 * Registers the "Annual Projections (Methodology 2.0)" data product — Madhavi's Dashboard
 * tab as a calculator with a golden-dataset test bench. Idempotent.
 */
import prisma from 'lib/prisma';

async function main() {
  const upstreamUsers = await prisma.user.findMany({ where: { org: { isUpstream: true } }, select: { id: true } });
  const author = upstreamUsers.find(u => /^[0-9a-f-]{36}$/i.test(u.id));
  if (!author) throw new Error('No upstream user found');

  await prisma.dataProductDefinition.upsert({
    where: { slug: 'annual-projections-2-0' },
    update: {
      description:
        'The Combined Model Dashboard as a live calculator. Opens a test bench seeded with the workbook golden scenario: edit any input, outputs recompute under Methodology 2.0, and "Reset to golden dataset" re-verifies every output against the workbook (also enforced in CI).',
      status: 'published'
    },
    create: {
      name: 'Annual Projections (Methodology 2.0)',
      slug: 'annual-projections-2-0',
      description:
        'The Combined Model Dashboard as a live calculator. Opens a test bench seeded with the workbook golden scenario: edit any input, outputs recompute under Methodology 2.0, and "Reset to golden dataset" re-verifies every output against the workbook (also enforced in CI).',
      productType: 'calculator',
      audience: 'internal',
      status: 'published',
      projectType: 'default',
      createdByUserId: author.id,
      updatedAt: new Date()
    }
  });
  // The golden dataset IS a first-class record: the workbook's example scenario with its
  // expected Dashboard outputs. The product links it (docs/CR2-PRODUCT-STUDIO-SPEC.md).
  const goldenName = 'Combined Model Dashboard — workbook example (2026-08)';
  const inputs = {
    singleUse: [
      { productId: 17, frequency: 'Weekly', baselineCases: 10, unitsPerCase: 200, costPerCase: 80, forecastCases: 0 },
      { productId: 7, frequency: 'Weekly', baselineCases: 15, unitsPerCase: 1000, costPerCase: 30, forecastCases: 5 },
      { productId: 3, frequency: 'Weekly', baselineCases: 20, unitsPerCase: 1000, costPerCase: 20, forecastCases: 10 }
    ],
    reusables: [{ productId: 100, initialCases: 10, unitsPerCase: 12, costPerCase: 2.28, annualRepurchaseRate: 0.1 }],
    dishwashing: {
      state: 'California',
      machineType: 'Stationary Single Tank Door',
      temperature: 'High',
      energyStar: true,
      buildingHeaterFuel: 'Electric',
      boosterHeaterFuel: 'Electric',
      operatingDaysPerYear: 365,
      racksPerDay: 80
    }
  };
  const expectedOutputs = {
    baselineSingleUseAnnualCost: 85800,
    forecastAnnualOperatingCost: 19633.10745,
    annualSavings: 66166.89255,
    oneTimeStartupCost: 22.8,
    singleUseUnitsBaseline: 1924000,
    singleUseUnitsForecast: 780000,
    wasteLbBaseline: 33644,
    wasteLbForecastAnnual: 8690.75,
    wasteLbFirstYear: 8758.25,
    ghgMtco2eBaseline: 104.9831739,
    ghgMtco2eForecastAnnual: 22.77655856,
    ghgMtco2eFirstYear: 22.84475347,
    waterGalBaseline: 213305.5011,
    waterGalForecastAnnual: 95161.94939,
    waterGalFirstYear: 95377.24762
  };
  const existingGolden = await prisma.goldenDataset.findFirst({ where: { name: goldenName } });
  const golden = existingGolden
    ? await prisma.goldenDataset.update({
        where: { id: existingGolden.id },
        data: { inputs: inputs as object, expectedOutputs: expectedOutputs as object }
      })
    : await prisma.goldenDataset.create({
        data: {
          name: goldenName,
          description:
            'The Combined Model workbook example scenario (Scenario_SU / Scenario_Reuse / Dishwashing) with its Dashboard tab outputs, workbook-faithful. Enforced in CI by combinedModel.golden.spec.ts.',
          category: 'methodology-2.0',
          inputs: inputs as object,
          expectedOutputs: expectedOutputs as object,
          tolerance: 0.000001,
          tags: ['methodology-2.0', 'workbook', 'dashboard']
        }
      });

  await prisma.dataProductDefinition.update({
    where: { slug: 'annual-projections-2-0' },
    data: { goldenDatasetId: golden.id }
  });
  console.log(`linked  golden dataset "${goldenName}"`);

  console.log('seeded  Annual Projections (Methodology 2.0)');
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
