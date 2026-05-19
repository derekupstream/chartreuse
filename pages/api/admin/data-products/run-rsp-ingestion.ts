import type { NextApiResponse } from 'next';

import { getRspIngestionResults, type RspIngestionInput } from 'lib/rsp/getRspIngestionResults';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';

export default handlerWithUser().post(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const isUpstream = await checkIsUpstream(req.user.orgId);
  if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

  const { input } = req.body as { input?: RspIngestionInput };
  if (!input || typeof input !== 'object') {
    return res.status(400).json({ error: 'input object required' });
  }

  try {
    const result = getRspIngestionResults(input);
    res.json({ outputs: result });
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? 'Engine error' });
  }
});
