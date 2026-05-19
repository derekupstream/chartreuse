import type { NextApiResponse } from 'next';

import { getProjectionsFromInventory } from 'lib/calculator/getProjections';
import type { ProjectInventory } from 'lib/inventory/types/projects';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';

export default handlerWithUser().post(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const isUpstream = await checkIsUpstream(req.user.orgId);
  if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

  const { inventory } = req.body as { inventory?: ProjectInventory };
  if (!inventory || typeof inventory !== 'object') {
    return res.status(400).json({ error: 'inventory object required' });
  }

  try {
    const result = getProjectionsFromInventory(inventory);
    res.json({ outputs: result });
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? 'Engine error', stack: err?.stack });
  }
});
