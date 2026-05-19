import type { NextApiResponse } from 'next';

import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import { createSimulatedApiKey } from 'lib/rsp/simulator';

type Body = {
  orgId: string;
  label?: string;
  misconfig?: 'none' | 'expired' | 'inactive';
};

export default handlerWithUser().post(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const isUpstream = await checkIsUpstream(req.user.orgId);
  if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

  const { orgId, label, misconfig } = req.body as Body;
  if (!orgId) return res.status(400).json({ error: 'orgId is required' });

  const result = await createSimulatedApiKey(orgId, { label, misconfig });
  res.json(result);
});
