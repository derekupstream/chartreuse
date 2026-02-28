import type { NextApiResponse } from 'next';
import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import prisma from 'lib/prisma';

export default handlerWithUser()
  .get(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const isUpstream = await checkIsUpstream(req.user.orgId);
    if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

    const { status } = req.query as { status?: string };
    const requests = await prisma.changeRequest.findMany({
      where: status ? { status } : undefined,
      include: { factor: { select: { id: true, name: true, currentValue: true, unit: true } } },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }]
    });
    res.json(requests);
  })
  .post(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const isUpstream = await checkIsUpstream(req.user.orgId);
    if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

    const {
      type,
      factorId,
      factorName,
      proposedValue,
      proposedUnit,
      proposedSource,
      proposedNotes,
      proposedCategory,
      reason,
      priority
    } = req.body;
    if (!type || !factorName || !reason)
      return res.status(400).json({ error: 'type, factorName, and reason are required' });

    const cr = await prisma.changeRequest.create({
      data: {
        type,
        factorId: factorId || null,
        factorName,
        proposedValue: proposedValue != null ? parseFloat(proposedValue) : null,
        proposedUnit,
        proposedSource,
        proposedNotes,
        proposedCategory,
        requestedBy: req.user.id,
        reason,
        priority: priority || 'medium',
        status: 'pending'
      }
    });
    res.status(201).json(cr);
  });
