import type { NextApiResponse } from 'next';
import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import { extractFunctionSource } from 'lib/admin/calculatorScan';

export default handlerWithUser().get(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const isUpstream = await checkIsUpstream(req.user.orgId);
  if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

  const { filePath, name } = req.query as { filePath: string; name: string };
  if (!filePath || !name) return res.status(400).json({ error: 'filePath and name required' });

  // Safety: only allow paths inside lib/calculator/calculations/
  if (!filePath.startsWith('lib/calculator/calculations/')) {
    return res.status(400).json({ error: 'Invalid path' });
  }

  const source = extractFunctionSource(filePath, name);
  if (!source) return res.status(404).json({ error: 'Function not found' });

  res.json({ source });
});
