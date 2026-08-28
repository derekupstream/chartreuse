/**
 * Restores a collection version: every database goes back to exactly the stored state —
 * rows, columns, sources, versions — with 'restore' changelog entries. Cut a version of
 * the current state first if you might want to return to it.
 */
import type { NextApiResponse } from 'next';

import { restoreRelease } from 'lib/admin/dataReleases';
import type { NextApiRequestWithUser } from 'lib/middleware';
import { handlerWithUser, requireUpstream } from 'lib/middleware';

const handler = handlerWithUser();
handler.use(requireUpstream);

handler.post(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  try {
    const result = await restoreRelease(req.query.id as string, req.user.id);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

export default handler;
