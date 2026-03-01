import type { NextApiResponse } from 'next';

import { handlerWithUser } from 'lib/middleware/handler';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import { generateApiKey } from 'lib/rsp/apiKeyAuth';
import prisma from 'lib/prisma';

function requireRsp(orgType: string | null | undefined, res: NextApiResponse): boolean {
  if (orgType !== 'reuse-service-provider') {
    res.status(403).json({ error: 'API Integration is only available for Reuse Service Provider organizations' });
    return false;
  }
  return true;
}

export default handlerWithUser()
  .get(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const org = await prisma.org.findUnique({ where: { id: req.user.orgId }, select: { orgType: true } });
    if (!requireRsp(org?.orgType, res)) return;

    const keys = await prisma.rspApiKey.findMany({
      where: { orgId: req.user.orgId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        label: true,
        keyPrefix: true,
        isActive: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true
      }
    });

    res.json(keys);
  })
  .post(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const org = await prisma.org.findUnique({ where: { id: req.user.orgId }, select: { orgType: true } });
    if (!requireRsp(org?.orgType, res)) return;

    const { label } = req.body as { label?: string };
    if (!label?.trim()) return res.status(400).json({ error: 'label is required' });

    const { raw, hash, prefix } = generateApiKey();

    const key = await prisma.rspApiKey.create({
      data: {
        orgId: req.user.orgId,
        label: label.trim(),
        keyHash: hash,
        keyPrefix: prefix
      },
      select: {
        id: true,
        label: true,
        keyPrefix: true,
        isActive: true,
        createdAt: true
      }
    });

    // Return raw key ONLY on creation
    res.status(201).json({ ...key, rawKey: raw });
  })
  .patch(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const org = await prisma.org.findUnique({ where: { id: req.user.orgId }, select: { orgType: true } });
    if (!requireRsp(org?.orgType, res)) return;

    const { id, isActive, label } = req.body as { id?: string; isActive?: boolean; label?: string };
    if (!id) return res.status(400).json({ error: 'id is required' });

    // Ensure key belongs to this org
    const existing = await prisma.rspApiKey.findFirst({ where: { id, orgId: req.user.orgId } });
    if (!existing) return res.status(404).json({ error: 'Key not found' });

    const updated = await prisma.rspApiKey.update({
      where: { id },
      data: {
        ...(isActive !== undefined ? { isActive } : {}),
        ...(label?.trim() ? { label: label.trim() } : {})
      },
      select: { id: true, label: true, keyPrefix: true, isActive: true, createdAt: true, lastUsedAt: true }
    });

    res.json(updated);
  });
