import type { NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import { extractFunctionSource } from 'lib/admin/calculatorScan';

export default handlerWithUser().get(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const isUpstream = await checkIsUpstream(req.user.orgId);
  if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

  const { filePath, name, full } = req.query as { filePath: string; name: string; full?: string };
  if (!filePath || !name) return res.status(400).json({ error: 'filePath and name required' });

  // Safety: only allow paths inside lib/calculator/
  if (!filePath.startsWith('lib/calculator/')) {
    return res.status(400).json({ error: 'Invalid path' });
  }

  if (full === 'true') {
    // Return the entire file source for editing
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) return res.status(404).json({ error: 'File not found' });
    const fileSource = fs.readFileSync(fullPath, 'utf8');
    return res.json({ source: fileSource, fullFile: true });
  }

  const source = extractFunctionSource(filePath, name);
  if (!source) return res.status(404).json({ error: 'Function not found' });

  res.json({ source });
});
