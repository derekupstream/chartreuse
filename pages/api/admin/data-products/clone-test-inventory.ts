import type { NextApiResponse } from 'next';

import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import prisma from 'lib/prisma';

/**
 * Returns a starting-point inventory the Tests tab can load in memory.
 * Picks the most recent active golden dataset matching `category` and clones its `inputs`.
 * No DB writes — caller decides whether to persist via POST /api/admin/datasets.
 *
 * Future: replace with an AI variation endpoint that mutates this template
 * based on a venue description (state, scale, product mix).
 */
export default handlerWithUser().post(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const isUpstream = await checkIsUpstream(req.user.orgId);
  if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

  const { category = 'default' } = req.body as { category?: string };

  const reference = await prisma.goldenDataset.findFirst({
    where: { category, isActive: true },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, inputs: true }
  });

  if (!reference) {
    return res
      .status(404)
      .json({ error: `No active golden dataset found for category "${category}". Seed one first.` });
  }

  res.json({
    inventory: reference.inputs,
    source: { id: reference.id, name: reference.name }
  });
});
