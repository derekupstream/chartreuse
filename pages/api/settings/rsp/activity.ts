/**
 * An RSP's own view of their API request history — every call their systems made, what came
 * of it, and what went wrong when something did.
 *
 * The same information has always been logged, but only Upstream staff could read it (admin
 * activity feed). A partner debugging their integration shouldn't need to email us to learn
 * that yesterday's submissions were all 401s from a revoked key.
 */
import type { NextApiResponse } from 'next';

import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import { handlerWithUser } from 'lib/middleware/handler';
import prisma from 'lib/prisma';

export type RspActivityRow = {
  id: string;
  createdAt: string;
  endpoint: string;
  httpStatus: number;
  outcome: string;
  errorMessage: string | null;
  errorCode: string | null;
  latencyMs: number | null;
  keyLabel: string | null;
  keyPrefix: string | null;
  clientId: string | null;
  eventCount: number | null;
  warnings: string[];
};

export default handlerWithUser().get(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const org = await prisma.org.findUnique({ where: { id: req.user.orgId }, select: { orgType: true } });
  if (org?.orgType !== 'reuse-service-provider') {
    return res.status(403).json({ error: 'Only available for Reuse Service Provider organizations' });
  }

  const limit = Math.min(Number(req.query.limit) || 50, 200);

  const logs = await prisma.rspApiActivityLog.findMany({
    where: { orgId: req.user.orgId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      createdAt: true,
      endpoint: true,
      httpStatus: true,
      outcome: true,
      errorMessage: true,
      errorCode: true,
      latencyMs: true,
      requestSummary: true,
      responseSummary: true,
      apiKey: { select: { label: true, keyPrefix: true } }
    }
  });

  const rows: RspActivityRow[] = logs.map(log => {
    const request = (log.requestSummary ?? {}) as Record<string, unknown>;
    const response = (log.responseSummary ?? {}) as Record<string, unknown>;
    return {
      id: log.id,
      createdAt: log.createdAt.toISOString(),
      endpoint: log.endpoint,
      httpStatus: log.httpStatus,
      outcome: log.outcome,
      errorMessage: log.errorMessage,
      errorCode: log.errorCode,
      latencyMs: log.latencyMs,
      keyLabel: log.apiKey?.label ?? null,
      keyPrefix: log.apiKey?.keyPrefix ?? null,
      clientId: typeof request.client_id === 'string' ? request.client_id : null,
      eventCount: typeof request.eventCount === 'number' ? request.eventCount : null,
      warnings: Array.isArray(response.warnings) ? (response.warnings as string[]) : []
    };
  });

  res.json(rows);
});
