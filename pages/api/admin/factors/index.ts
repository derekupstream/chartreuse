import type { NextApiResponse } from 'next';
import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import prisma from 'lib/prisma';

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001';

export default handlerWithUser()
  .get(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const isUpstream = await checkIsUpstream(req.user.orgId);
    if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

    const factors = await prisma.factor.findMany({
      include: {
        category: { select: { id: true, name: true } },
        source: { select: { id: true, name: true, version: true } },
        _count: { select: { versions: true, changeRequests: true } }
      },
      orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }]
    });
    res.json(factors);
  })
  .post(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const isUpstream = await checkIsUpstream(req.user.orgId);
    if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

    const { name, description, categoryId, sourceId, currentValue, unit, region, notes, calculatorConstantKey } =
      req.body;
    if (!name || !categoryId || !sourceId || currentValue == null || !unit)
      return res.status(400).json({ error: 'name, categoryId, sourceId, currentValue, and unit are required' });

    const factor = await prisma.factor.create({
      data: {
        name,
        description,
        categoryId,
        sourceId,
        currentValue: parseFloat(currentValue),
        unit,
        region,
        notes,
        calculatorConstantKey,
        createdBy: req.user.id,
        isActive: true
      }
    });
    res.status(201).json(factor);
  });
