import type { NextApiResponse } from 'next';

import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import { createSimulatedClientAccount, createSimulatedRspOrg, type RspProfile } from 'lib/rsp/simulator';

type Body = {
  name: string;
  profile?: RspProfile;
  clients?: Array<{ name?: string; venueCategory?: string; state?: string }>;
};

export default handlerWithUser().post(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const isUpstream = await checkIsUpstream(req.user.orgId);
  if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

  const { name, profile, clients = [] } = req.body as Body;
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' });

  const { orgId } = await createSimulatedRspOrg(name.trim(), profile ?? {});

  const createdAccounts = [];
  for (const c of clients) {
    const created = await createSimulatedClientAccount({
      rspOrgId: orgId,
      name: c.name,
      venueCategory: c.venueCategory,
      state: c.state
    });
    createdAccounts.push(created);
  }

  res.json({ orgId, accounts: createdAccounts });
});
