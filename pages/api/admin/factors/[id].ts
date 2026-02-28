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
    const factor = await prisma.factor.findUnique({
      where: { id },
      include: {
        category: true,
        source: true,
        versions: { orderBy: { createdAt: 'desc' } },
        _count: { select: { versions: true, dependencies: true, changeRequests: true } }
      }
    });
    if (!factor) return res.status(404).json({ error: 'Factor not found' });
    res.json(factor);
  })
  .patch(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const isUpstream = await checkIsUpstream(req.user.orgId);
    if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

    const { id } = req.query as { id: string };
    const {
      name,
      description,
      categoryId,
      sourceId,
      currentValue,
      unit,
      region,
      notes,
      calculatorConstantKey,
      changeReason,
      isActive
    } = req.body;
    if (!changeReason) return res.status(400).json({ error: 'changeReason is required' });

    const existing = await prisma.factor.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Factor not found' });

    // Create a version record capturing the old value before updating
    if (currentValue != null && parseFloat(currentValue) !== existing.currentValue) {
      await prisma.factorVersion.create({
        data: {
          factorId: id,
          value: existing.currentValue,
          unit: existing.unit,
          notes: `Previous value before update on ${new Date().toISOString().split('T')[0]}`,
          changedBy: req.user.id,
          changeReason,
          status: 'approved'
        }
      });
    }

    const updated = await prisma.factor.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(categoryId !== undefined && { categoryId }),
        ...(sourceId !== undefined && { sourceId }),
        ...(currentValue != null && { currentValue: parseFloat(currentValue) }),
        ...(unit !== undefined && { unit }),
        ...(region !== undefined && { region }),
        ...(notes !== undefined && { notes }),
        ...(calculatorConstantKey !== undefined && { calculatorConstantKey }),
        ...(isActive !== undefined && { isActive })
      },
      include: {
        category: true,
        source: true,
        _count: { select: { versions: true, changeRequests: true } }
      }
    });
    res.json(updated);
  });
