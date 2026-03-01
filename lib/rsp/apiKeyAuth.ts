import crypto from 'crypto';

import prisma from 'lib/prisma';

export function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const bytes = crypto.randomBytes(32).toString('hex');
  const raw = `cr_rsp_${bytes}`;
  const hash = hashApiKey(raw);
  const prefix = raw.slice(0, 16); // "cr_rsp_" + 9 chars
  return { raw, hash, prefix };
}

export function hashApiKey(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export async function validateApiKey(authHeader: string | undefined) {
  if (!authHeader?.startsWith('Bearer ')) return null;

  const raw = authHeader.slice(7).trim();
  if (!raw.startsWith('cr_rsp_')) return null;

  const hash = hashApiKey(raw);

  const key = await prisma.rspApiKey.findUnique({
    where: { keyHash: hash },
    include: { org: true }
  });

  if (!key || !key.isActive) return null;
  if (key.expiresAt && key.expiresAt < new Date()) return null;
  if (key.org.orgType !== 'reuse-service-provider') return null;

  // Update lastUsedAt without blocking the response
  prisma.rspApiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } }).catch(() => {});

  return key;
}
