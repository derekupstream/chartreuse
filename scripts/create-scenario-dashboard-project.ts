/**
 * Builds the "Scenario Dashboard" project — the workbook's own example scenario
 * (Scenario_SU, Scenario_Reuse, Dishwashing, Additional_Costs) as a real project in the
 * app — then verifies it through the REAL project pipeline: line items → buildModelInputs
 * → v2 engine, compared metric-by-metric against the workbook's Dashboard tab. The v1
 * (production) engine runs on the same project for comparison, since the two
 * methodologies are expected to be comparable but not the same.
 *
 * Idempotent: re-running replaces the project. Run:
 *   npx dotenv-cli -e .env -- npx tsx scripts/create-scenario-dashboard-project.ts
 */
import { getProjections } from '../lib/calculator/getProjections';
import { computeCombinedModel } from '../lib/calculator/v2/combinedModel';
import { buildModelInputs, loadModelTables } from '../lib/calculator/v2/projectToModelInputs';
import prisma from '../lib/prisma';

const PROJECT_NAME = 'Scenario Dashboard';

/** The workbook Dashboard tab, verbatim — plus the one-time family recomputed from the
 * CURRENT Additional_Costs tab ($200,000), since the workbook's cached one-time values
 * (150,022.80 / ROI 0.441 / payback 27.2) are stale against its own input tab. */
const DASHBOARD_EXPECTED = [
  { key: 'baselineCost', label: 'Baseline single-use annual cost ($)', value: 85800 },
  { key: 'forecastCost', label: 'Forecast annual operating cost ($)', value: 19633.10745 },
  { key: 'savings', label: 'Annual savings ($)', value: 66166.89255 },
  { key: 'oneTime', label: 'One-time startup cost ($)', value: 200022.8 },
  { key: 'roi', label: 'Annual savings ROI', value: 66166.89255 / 200022.8 },
  { key: 'payback', label: 'Payback period (months)', value: (200022.8 / 66166.89255) * 12 },
  { key: 'unitsBase', label: 'Single-use units — baseline', value: 1924000 },
  { key: 'unitsFcst', label: 'Single-use units — forecast', value: 780000 },
  { key: 'wasteBase', label: 'Waste (lb) — baseline', value: 33644 },
  { key: 'wasteFcst', label: 'Waste (lb) — forecast annual', value: 8690.75 },
  { key: 'wasteFy', label: 'Waste (lb) — first year', value: 8758.25 },
  { key: 'ghgBase', label: 'GHG (MTCO₂e) — baseline', value: 104.9831739 },
  { key: 'ghgFcst', label: 'GHG (MTCO₂e) — forecast annual', value: 22.77655856 },
  { key: 'ghgFy', label: 'GHG (MTCO₂e) — first year', value: 22.84475347 },
  { key: 'waterBase', label: 'Water (gal) — baseline', value: 213305.5011 },
  { key: 'waterFcst', label: 'Water (gal) — forecast annual', value: 95161.94939 },
  { key: 'waterFy', label: 'Water (gal) — first year', value: 95377.24762 }
];

async function main() {
  const org = await prisma.org.findFirst({ where: { isUpstream: true }, include: { accounts: true } });
  if (!org?.accounts.length) throw new Error('No Upstream org/account in this database');

  // Rebuilds keep the same project id so bookmarks and open tabs survive.
  const existing = await prisma.project.findFirst({ where: { name: PROJECT_NAME, orgId: org.id } });
  if (existing) {
    await prisma.project.delete({ where: { id: existing.id } });
    console.log('replaced the existing Scenario Dashboard project (same id)');
  }

  // Product names for display come from the 2.0 directory itself.
  const directory = await prisma.factorDatabase.findUnique({
    where: { name: 'Reusable Products' },
    include: { rows: true }
  });
  const reuse100 = directory?.rows.map(r => r.data as Record<string, unknown>).find(r => Number(r.product_id) === 100);

  const project = await prisma.project.create({
    data: {
      ...(existing ? { id: existing.id } : {}),
      name: PROJECT_NAME,
      orgId: org.id,
      accountId: org.accounts[0].id,
      USState: 'California',
      category: 'default',
      dataType: 'projection',
      methodologyVersion: '2.0',
      projectionsTitle: 'Scenario Dashboard',
      projectionsDescription:
        "The Combined Model workbook's example scenario (Scenario_SU / Scenario_Reuse / Dishwashing / Additional_Costs) as a live project — the golden dataset, running on real project machinery.",
      singleUseItems: {
        create: [
          // Scenario_SU rows 1–3, verbatim
          { productId: '17', frequency: 'Weekly', casesPurchased: 10, unitsPerCase: 200, caseCost: 80, newCasesPurchased: 0, newCaseCost: 80 },
          { productId: '7', frequency: 'Weekly', casesPurchased: 15, unitsPerCase: 1000, caseCost: 30, newCasesPurchased: 5, newCaseCost: 30 },
          { productId: '3', frequency: 'Weekly', casesPurchased: 20, unitsPerCase: 1000, caseCost: 20, newCasesPurchased: 10, newCaseCost: 20 }
        ]
      },
      reusableItems: {
        create: [
          // Scenario_Reuse row 1
          {
            productId: '100',
            productName: String(reuse100?.product ?? reuse100?.cr_product ?? 'Reusable product 100'),
            casesPurchased: 10,
            unitsPerCase: 12,
            caseCost: 2.28,
            annualRepurchasePercentage: 0.1
          }
        ]
      },
      dishwashers: {
        create: [
          // Dishwashing tab inputs
          // Dishwashing is NEW with the reuse program: baseline (single-use world) runs no
          // dishwasher; the forecast runs her tab's 80 racks × 365 days. v1 charges the
          // delta; the 2.0 mapping reads the forecast fields.
          {
            type: 'Stationary Single Tank Door',
            temperature: 'High',
            energyStarCertified: true,
            buildingWaterHeaterFuelType: 'Electric',
            boosterWaterHeaterFuelType: 'Electric',
            operatingDays: 0,
            racksPerDay: 0,
            newOperatingDays: 365,
            newRacksPerDay: 80
          }
        ]
      },
      otherExpenses: {
        create: [
          // Additional_Costs line 1 (current tab value; the Dashboard's cached 150k is stale)
          { categoryId: '5', frequency: 'One Time', cost: 200000, description: 'One-time startup investment (workbook Additional_Costs, line 1)' }
        ]
      }
    }
  });
  console.log(`created "${PROJECT_NAME}" (${project.id})\n`);

  // ── Verification: the REAL project pipeline vs the workbook Dashboard ────────────────
  const tables = await loadModelTables();
  if (!tables) throw new Error('Data Release tables not loaded');
  const mapping = await buildModelInputs(project.id, tables);
  if (!mapping) throw new Error('buildModelInputs returned nothing');
  console.log(
    `pipeline mapping: ${mapping.inputs.singleUse.length} single-use, ${mapping.inputs.reusables.length} reusable, ` +
      `dishwashing ${mapping.inputs.dishwashing ? 'yes' : 'NO'}, ${mapping.inputs.additionalCosts?.length ?? 0} additional costs, ` +
      `unmatched ${mapping.unmatchedSingleUse + mapping.unmatchedReusables}, excluded: ${mapping.excluded.join(', ') || 'nothing'}\n`
  );

  const out = computeCombinedModel(mapping.inputs, tables, { replicateWorkbookBoxLookup: true });
  const computed: Record<string, number> = {
    baselineCost: out.financial.baselineSingleUseAnnualCost,
    forecastCost: out.financial.forecastAnnualOperatingCost,
    savings: out.financial.annualSavings,
    oneTime: out.financial.oneTimeStartupCost,
    roi: out.financial.annualSavingsROI,
    payback: out.financial.paybackMonths ?? NaN,
    unitsBase: out.singleUseUnits.baseline,
    unitsFcst: out.singleUseUnits.forecastAnnual,
    wasteBase: out.wasteLb.baseline,
    wasteFcst: out.wasteLb.forecastAnnual,
    wasteFy: out.wasteLb.forecastFirstYear,
    ghgBase: out.ghgMtco2e.baseline,
    ghgFcst: out.ghgMtco2e.forecastAnnual,
    ghgFy: out.ghgMtco2e.forecastFirstYear,
    waterBase: out.waterGal.baseline,
    waterFcst: out.waterGal.forecastAnnual,
    waterFy: out.waterGal.forecastFirstYear
  };

  let failures = 0;
  console.log('metric'.padEnd(42) + 'project (2.0 pipeline)'.padStart(24) + 'workbook Dashboard'.padStart(22) + '  match');
  for (const row of DASHBOARD_EXPECTED) {
    const value = computed[row.key];
    const pass = Math.abs(value - row.value) / Math.max(1, Math.abs(row.value)) < 1e-6;
    if (!pass) failures += 1;
    console.log(
      row.label.padEnd(42) +
        value.toLocaleString(undefined, { maximumFractionDigits: 4 }).padStart(24) +
        row.value.toLocaleString(undefined, { maximumFractionDigits: 4 }).padStart(22) +
        (pass ? '   ✓' : '   ✗ MISMATCH')
    );
  }

  // ── The same project through v1 (how projections run in production today) ────────────
  console.log('\nv1 (Methodology 1.0 — production) on the same project, for comparison:');
  try {
    const v1 = await getProjections(project.id);
    const summary = v1.annualSummary as Record<string, unknown>;
    console.log(JSON.stringify(summary, null, 1).slice(0, 1200));
  } catch (e) {
    console.log(`v1 engine could not run this project: ${(e as Error).message}`);
  }

  console.log(failures === 0 ? '\nALL DASHBOARD METRICS RECONCILE through the real project pipeline' : `\n${failures} MISMATCHES`);
  await prisma.$disconnect();
  if (failures > 0) process.exit(1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
