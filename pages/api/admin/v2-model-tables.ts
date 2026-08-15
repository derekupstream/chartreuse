import type { NextApiResponse } from 'next';

import type { ModelTables } from 'lib/calculator/v2/combinedModel';
import { loadModelTables } from 'lib/calculator/v2/projectToModelInputs';
import type { NextApiRequestWithUser } from 'lib/middleware';
import { handlerWithUser, requireUpstream } from 'lib/middleware';

/** The Data Release tables, for tools that compute the 2.0 model client-side (test bench). */
export type V2ModelTablesResponse = { available: boolean; tables: ModelTables | null };

const handler = handlerWithUser();
handler.use(requireUpstream);

handler.get(async (_req: NextApiRequestWithUser, res: NextApiResponse<V2ModelTablesResponse>) => {
  const tables = await loadModelTables();
  res.json({ available: !!tables, tables });
});

export default handler;
