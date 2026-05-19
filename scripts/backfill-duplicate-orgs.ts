/* eslint-disable no-console */
import prisma from '../lib/prisma';
import { detectDuplicates } from '../lib/admin/duplicateDetector';
import { deleteEmptyOrg, mergeOrg } from '../lib/admin/mergeOrgs';

async function main() {
  const apply = process.argv.includes('--apply');
  const report = await detectDuplicates(prisma);

  console.log('Duplicate organization report');
  console.log('  Auto-merge candidates: ', report.counts.autoMerge);
  console.log('  Empty-delete candidates:', report.counts.emptyDelete);
  console.log('  Needs review:          ', report.counts.needsReview);
  console.log('  Total duplicate rows:  ', report.counts.totalDuplicates);
  console.log('');

  for (const group of report.groups) {
    console.log(
      `[${group.displayName}]  canonical=${group.canonical.id}  ` +
        `users=${group.canonical.userCount} accounts=${group.canonical.accountCount} projects=${group.canonical.projectCount}`
    );
    for (const dup of group.duplicates) {
      console.log(`  - ${dup.bucket.padEnd(13)} ${dup.org.id}  ${dup.reason}`);
      for (const u of dup.org.users) {
        console.log(`        ${u.email}`);
      }
    }
  }

  if (!apply) {
    console.log('');
    console.log('Dry run — pass --apply to perform AUTO_MERGE and EMPTY_DELETE actions.');
    return;
  }

  console.log('');
  console.log('Applying auto-mergeable and empty-delete actions...');

  let merged = 0;
  let deleted = 0;
  let errors = 0;

  for (const group of report.groups) {
    for (const dup of group.duplicates) {
      try {
        if (dup.bucket === 'AUTO_MERGE') {
          const result = await mergeOrg(prisma, dup.org.id, group.canonical.id);
          console.log(
            `  merged ${dup.org.id} → ${group.canonical.id}  (${Object.entries(result.moved)
              .filter(([, n]) => n > 0)
              .map(([k, n]) => `${k}=${n}`)
              .join(', ') || 'no rows moved'})`
          );
          merged++;
        } else if (dup.bucket === 'EMPTY_DELETE') {
          await deleteEmptyOrg(prisma, dup.org.id);
          console.log(`  deleted empty ${dup.org.id}`);
          deleted++;
        }
      } catch (err: any) {
        errors++;
        console.error(`  ERROR on ${dup.org.id}: ${err?.message ?? err}`);
      }
    }
  }

  console.log('');
  console.log(`Done. merged=${merged} deleted=${deleted} errors=${errors}`);
  console.log(`${report.counts.needsReview} duplicate(s) remain in the NEEDS_REVIEW bucket — resolve in /admin/duplicates.`);
}

main()
  .catch(err => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
