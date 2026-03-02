import type { NextApiResponse } from 'next';

import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import prisma from 'lib/prisma';

export default handlerWithUser()
  .get(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const isUpstream = await checkIsUpstream(req.user.orgId);
    if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

    const snapshots = await prisma.methodologySnapshot.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { factorVersions: true } }
      }
    });

    return res.status(200).json({ snapshots });
  })
  .post(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const isUpstream = await checkIsUpstream(req.user.orgId);
    if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

    const { name, notes, factorVersionIds } = req.body as {
      name: string;
      notes?: string;
      factorVersionIds: string[];
    };

    if (!name?.trim()) return res.status(400).json({ error: 'name is required' });
    if (!Array.isArray(factorVersionIds) || factorVersionIds.length === 0) {
      return res.status(400).json({ error: 'factorVersionIds must be a non-empty array' });
    }

    const snapshot = await prisma.methodologySnapshot.create({
      data: {
        name: name.trim(),
        notes: notes?.trim() || null,
        createdBy: req.user.id,
        factorVersions: {
          create: factorVersionIds.map(fvId => ({ factorVersionId: fvId }))
        }
      },
      include: {
        _count: { select: { factorVersions: true } }
      }
    });

    return res.status(201).json({ snapshot });
  });
