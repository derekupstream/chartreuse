import type { NextApiResponse } from 'next';

import { mergeOrg } from 'lib/admin/mergeOrgs';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import prisma from 'lib/prisma';

export default handlerWithUser().post(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const isUpstream = await checkIsUpstream(req.user.orgId);
  if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

  const { sourceOrgId, targetOrgId } = req.body as { sourceOrgId?: string; targetOrgId?: string };
  if (!sourceOrgId || !targetOrgId) {
    return res.status(400).json({ error: 'sourceOrgId and targetOrgId are required' });
  }
  if (sourceOrgId === targetOrgId) {
    return res.status(400).json({ error: 'sourceOrgId and targetOrgId must differ' });
  }

  try {
    const result = await mergeOrg(prisma, sourceOrgId, targetOrgId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? 'Merge failed' });
  }
});
