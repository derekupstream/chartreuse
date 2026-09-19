/**
 * Live-data changes from the Derek + Madhavi workbook review (2026-09-18) — the parts that
 * are data, not code (docs/CR2-2026-09-18-REVIEW-PLAN.md items A1/A3/B1/B2):
 *
 *  1. Retire the "Open Questions" database (rows + changelog cascade with it).
 *  2. Purchase Frequency description: it now lives on the Data Dictionary page.
 *  3. Funding Opportunities: policy in the description (informational only, never wired
 *     into cost math) and sourceUrl → the public funding tracker.
 *
 * Idempotent — safe to re-run, and runs against production the same way when the branch
 * merges:  npx dotenv-cli -e .env -- npx tsx scripts/apply-2026-09-18-review.ts
 */
import prisma from 'lib/prisma';

const FUNDING_DESCRIPTION =
  'Municipal reuse/waste-reduction funding: funder, geography, amounts, cycle, deadline, eligibility, ' +
  'reuse-explicit flag (workbook tab: Funding_Opportunities; normalized from the Upstream funding tracker). ' +
  'Informational only — NEVER wired into cost calculations: grant amounts are too variable to price reliably ' +
  '(policy, 2026-09-18). A project can carry a user-entered funding amount instead.';

const FREQUENCY_DESCRIPTION =
  'Annualization factors for purchase/cost frequencies (workbook tab: Purchase_Frequency). Surfaced on the ' +
  'Data Dictionary page — it defines the frequency terms rather than standing as its own database (2026-09-18).';

const PUBLIC_TRACKER_URL = 'https://upstream-compass.replit.app/tools/funding-tracker/public';

async function main() {
  const openQuestions = await prisma.factorDatabase.findUnique({ where: { name: 'Open Questions' } });
  if (openQuestions) {
    await prisma.factorDatabase.delete({ where: { id: openQuestions.id } });
    console.log('Retired "Open Questions" (rows and changelog removed with it).');
  } else {
    console.log('"Open Questions" already gone — nothing to retire.');
  }

  const frequency = await prisma.factorDatabase.updateMany({
    where: { name: 'Purchase Frequency' },
    data: { description: FREQUENCY_DESCRIPTION }
  });
  console.log(frequency.count ? 'Purchase Frequency description updated.' : 'Purchase Frequency not found — skipped.');

  const funding = await prisma.factorDatabase.updateMany({
    where: { name: 'Funding Opportunities' },
    data: { description: FUNDING_DESCRIPTION, sourceUrl: PUBLIC_TRACKER_URL }
  });
  console.log(
    funding.count
      ? 'Funding Opportunities: policy description set, sourceUrl → public tracker.'
      : 'Funding Opportunities not found — skipped.'
  );
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
