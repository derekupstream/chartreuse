import type { NextApiResponse } from 'next';

import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import prisma from 'lib/prisma';

export default handlerWithUser()
  .get(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const isUpstream = await checkIsUpstream(req.user.orgId);
    if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

    const { id } = req.query as { id: string };

    const snapshot = await prisma.methodologySnapshot.findUnique({
      where: { id },
      include: {
        factorVersions: {
          include: {
            factorVersion: {
              include: { factor: { select: { id: true, name: true, unit: true, calculatorConstantKey: true } } }
            }
          }
        },
        _count: { select: { computeRuns: true, testRuns: true } }
      }
    });

    if (!snapshot) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json({ snapshot });
  })
  .patch(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const isUpstream = await checkIsUpstream(req.user.orgId);
    if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

    const { id } = req.query as { id: string };
    const { action, notes } = req.body as { action?: string; notes?: string };

    const existing = await prisma.methodologySnapshot.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    if (action === 'publish') {
      if (existing.status !== 'draft') {
        return res.status(400).json({ error: 'Only draft snapshots can be published' });
      }
      const updated = await prisma.methodologySnapshot.update({
        where: { id },
        data: { status: 'published', publishedAt: new Date() }
      });
      return res.status(200).json({ snapshot: updated });
    }

    if (action === 'deprecate') {
      if (existing.status !== 'published') {
        return res.status(400).json({ error: 'Only published snapshots can be deprecated' });
      }
      const updated = await prisma.methodologySnapshot.update({
        where: { id },
        data: { status: 'deprecated' }
      });
      return res.status(200).json({ snapshot: updated });
    }

    // Generic update (notes only for now)
    const updated = await prisma.methodologySnapshot.update({
      where: { id },
      data: { ...(notes !== undefined ? { notes } : {}) }
    });
    return res.status(200).json({ snapshot: updated });
  });
