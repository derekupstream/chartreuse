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
    const dataset = await prisma.goldenDataset.findUnique({
      where: { id },
      include: {
        testResults: {
          orderBy: { testRun: { createdAt: 'desc' } },
          take: 10,
          include: {
            testRun: { select: { id: true, createdAt: true, ranByUserId: true } }
          }
        }
      }
    });
    if (!dataset) return res.status(404).json({ error: 'Not found' });
    res.json(dataset);
  })
  .patch(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const isUpstream = await checkIsUpstream(req.user.orgId);
    if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

    const { id } = req.query as { id: string };
    const { name, description, tolerance, isActive, tags } = req.body;
    const dataset = await prisma.goldenDataset.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(tolerance !== undefined && { tolerance }),
        ...(isActive !== undefined && { isActive }),
        ...(tags !== undefined && { tags })
      }
    });
    res.json(dataset);
  })
  .delete(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const isUpstream = await checkIsUpstream(req.user.orgId);
    if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

    const { id } = req.query as { id: string };
    await prisma.goldenDataset.delete({ where: { id } });
    res.status(204).end();
  });
