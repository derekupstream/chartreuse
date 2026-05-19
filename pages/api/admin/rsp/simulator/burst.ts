import type { NextApiResponse } from 'next';

import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import prisma from 'lib/prisma';
import { generateBurst } from 'lib/rsp/simulator';

type Body = {
  apiKeyId: string;
  /** Either pass a list of accountIds (must belong to the same RSP org) or omit to use all of the RSP's accounts */
  accountIds?: string[];
  submissionsPerAccount: number;
  granularity?: 'weekly' | 'monthly';
  errorRate?: number;
};

export default handlerWithUser().post(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const isUpstream = await checkIsUpstream(req.user.orgId);
  if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

  const { apiKeyId, accountIds, submissionsPerAccount, granularity = 'monthly', errorRate = 0 } = req.body as Body;
  if (!apiKeyId) return res.status(400).json({ error: 'apiKeyId is required' });
  if (!Number.isFinite(submissionsPerAccount) || submissionsPerAccount < 1) {
    return res.status(400).json({ error: 'submissionsPerAccount must be a positive number' });
  }

  const apiKey = await prisma.rspApiKey.findUnique({
    where: { id: apiKeyId },
    select: { id: true, orgId: true }
  });
  if (!apiKey) return res.status(404).json({ error: 'API key not found' });

  const accounts = await prisma.account.findMany({
    where: {
      rspOrgId: apiKey.orgId,
      ...(accountIds && accountIds.length ? { id: { in: accountIds } } : {})
    },
    select: { id: true, rspClientId: true }
  });

  const usable = accounts.filter(a => !!a.rspClientId).map(a => ({ accountId: a.id, rspClientId: a.rspClientId! }));
  if (usable.length === 0) {
    return res.status(400).json({ error: 'No accounts with rspClientId found for this RSP' });
  }

  const result = await generateBurst({
    apiKeyId,
    rspOrgId: apiKey.orgId,
    accounts: usable,
    submissionsPerAccount,
    granularity,
    errorRate
  });

  res.json(result);
});
