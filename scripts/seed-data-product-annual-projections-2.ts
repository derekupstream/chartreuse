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
  console.log('seeded  Annual Projections (Methodology 2.0)');
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
