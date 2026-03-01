import type { NextApiResponse } from 'next';

import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import { generateApiKey } from 'lib/rsp/apiKeyAuth';
import prisma from 'lib/prisma';

export default handlerWithUser()
  .get(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const isUpstream = await checkIsUpstream(req.user.orgId);
    if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

    const { orgId } = req.query;

    const keys = await prisma.rspApiKey.findMany({
      where: orgId ? { orgId: orgId as string } : {},
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        label: true,
        keyPrefix: true,
        isActive: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
        org: { select: { id: true, name: true } }
      }
    });

    res.json(keys);
  })
  .post(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const isUpstream = await checkIsUpstream(req.user.orgId);
    if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

    const { orgId, label } = req.body as { orgId?: string; label?: string };
    if (!orgId || !label?.trim()) return res.status(400).json({ error: 'orgId and label are required' });

    const org = await prisma.org.findUnique({ where: { id: orgId }, select: { orgType: true } });
    if (org?.orgType !== 'reuse-service-provider') {
      return res.status(400).json({ error: 'Organization must be a Reuse Service Provider' });
    }

    const { raw, hash, prefix } = generateApiKey();

    const key = await prisma.rspApiKey.create({
      data: { orgId, label: label.trim(), keyHash: hash, keyPrefix: prefix },
      select: {
        id: true,
        label: true,
        keyPrefix: true,
        isActive: true,
        createdAt: true,
        org: { select: { name: true } }
      }
    });

    res.status(201).json({ ...key, rawKey: raw });
  })
  .patch(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const isUpstream = await checkIsUpstream(req.user.orgId);
    if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

    const { id, isActive, label, expiresAt } = req.body as {
      id?: string;
      isActive?: boolean;
      label?: string;
      expiresAt?: string;
    };
    if (!id) return res.status(400).json({ error: 'id required' });

    const updated = await prisma.rspApiKey.update({
      where: { id },
      data: {
        ...(isActive !== undefined ? { isActive } : {}),
        ...(label?.trim() ? { label: label.trim() } : {}),
        ...(expiresAt !== undefined ? { expiresAt: expiresAt ? new Date(expiresAt) : null } : {})
      },
      select: { id: true, label: true, keyPrefix: true, isActive: true, createdAt: true, lastUsedAt: true }
    });

    res.json(updated);
  })
  .delete(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const isUpstream = await checkIsUpstream(req.user.orgId);
    if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id required' });

    await prisma.rspApiKey.delete({ where: { id: id as string } });
    res.status(204).end();
  });
