/**
 * Records the known model/workbook findings as data-health notifications — visible on the
 * Command Center's Data health band, each with a "File change request" path so a finding
 * can flow into the change log the moment someone acts on it.
 *
 * Idempotent (upserts on [issueType, entityId]). Run after a Data Release load:
 *   npx dotenv-cli -e .env -- npx tsx scripts/seed-data-health-notices.ts
 */
import prisma from '../lib/prisma';

async function main() {
  const databases = await prisma.factorDatabase.findMany({ select: { id: true, name: true } });
  const byName = new Map(databases.map(d => [d.name, d.id]));
  const sourceFile = await prisma.dataSourceFile.findFirst({ orderBy: { createdAt: 'desc' } });

  const notices: { issueType: string; entityId: string | undefined; entity: string; severity: string; note: string }[] = [
    {
      issueType: 'workbook-quirk',
      entity: 'FactorDatabase',
      entityId: byName.get('Water Factors'),
      severity: 'warning',
      note: 'Box-water double count (workbook feedback #1): Calc_Reuse box lookups are unscoped and cardboard appears under both scopes, so reusable box water counts twice — worth 3.12 gal/yr on the golden scenario. The product runs the workbook-faithful number until Madhavi ships the fix; correcting it is a one-flag change plus a data release.'
    },
    {
      issueType: 'workbook-quirk',
      entity: 'FactorDatabase',
      entityId: byName.get('GHG Factors'),
      severity: 'info',
      note: 'GHG_Factors header swap (workbook feedback #6): the tab labels its columns material|scope but the data is scope|material. Auto-repaired on export and upload — remains open until fixed at the source.'
    },
    {
      issueType: 'workbook-quirk',
      entity: 'FactorDatabase',
      entityId: byName.get('Dishwasher Factors'),
      severity: 'info',
      note: 'Dishwasher_Factors holds two tables in one tab (workbook feedback #9): machines plus water-heater constants. Every workbook upload shows the 5 constant rows as declinable adds until the tab is split.'
    },
    {
      issueType: 'workbook-quirk',
      entity: 'DataSourceFile',
      entityId: sourceFile?.id,
      severity: 'warning',
      note: 'Workbook Dashboard cache is stale (feedback #10): its one-time cost family (150,022.80 / ROI 0.441 / payback 27.2) contradicts its own Additional_Costs tab ($200,000). The file needs an Excel recalc-and-save before values are read programmatically.'
    }
  ];

  let written = 0;
  for (const notice of notices) {
    if (!notice.entityId) {
      console.log(`skipped (no entity found): ${notice.note.slice(0, 60)}…`);
      continue;
    }
    await prisma.dataHealthIssue.upsert({
      where: { issueType_entityId: { issueType: notice.issueType, entityId: notice.entityId } },
      create: {
        issueType: notice.issueType,
        entity: notice.entity,
        entityId: notice.entityId,
        severity: notice.severity,
        status: 'open',
        note: notice.note
      },
      update: { note: notice.note, severity: notice.severity }
    });
    written += 1;
  }
  console.log(`${written} data-health notifications in place`);
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
