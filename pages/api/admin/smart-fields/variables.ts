import type { NextApiResponse } from 'next';

import { buildVariableCatalog } from 'lib/smartFields/catalogServer';
import type { NextApiRequestWithUser } from 'lib/middleware';
import { handlerWithUser, requireUpstream } from 'lib/middleware';

const handler = handlerWithUser();
handler.use(requireUpstream);

/** The smart-field variable catalog — built in lib/smartFields/catalogServer.ts. */
handler.get(async (_req: NextApiRequestWithUser, res: NextApiResponse) => {
  res.json({ variables: await buildVariableCatalog() });
});

export default handler;
