import type { NextApiResponse } from 'next';
import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import prisma from 'lib/prisma';

/**
 * POST /api/admin/factor-versions/bootstrap
 *
 * For every Factor that has no FactorVersions yet, creates an initial approved
 * FactorVersion seeded from the factor's current value. This is a one-time
 * bootstrap so that Methodology Snapshots can be created.
 */
export default handlerWithUser().post(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const isUpstream = await checkIsUpstream(req.user.orgId);
  if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

  // Find all factors that have no versions yet
  const factors = await prisma.factor.findMany({
    where: { versions: { none: {} } },
    select: { id: true, currentValue: true, unit: true, createdBy: true }
  });

  if (factors.length === 0) {
    return res.json({ created: 0, message: 'All factors already have at least one version.' });
  }

  const now = new Date();
  await prisma.factorVersion.createMany({
    data: factors.map(f => ({
      factorId: f.id,
      value: f.currentValue,
      unit: f.unit,
      changedBy: f.createdBy,
      changeReason: 'Initial baseline version (bootstrapped)',
      status: 'approved',
      approvedBy: f.createdBy,
      approvedAt: now,
      approvalNotes: 'Auto-approved during bootstrap'
    }))
  });

  return res.json({
    created: factors.length,
    message: `Created ${factors.length} initial factor versions.`
  });
});
