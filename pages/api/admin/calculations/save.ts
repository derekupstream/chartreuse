import type { NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';

export default handlerWithUser().put(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const isUpstream = await checkIsUpstream(req.user.orgId);
  if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

  const { filePath, source } = req.body as { filePath: string; source: string };
  if (!filePath || typeof source !== 'string') {
    return res.status(400).json({ error: 'filePath and source required' });
  }

  // Safety: only allow paths inside lib/calculator/
  if (!filePath.startsWith('lib/calculator/')) {
    return res.status(400).json({ error: 'Can only edit files in lib/calculator/' });
  }

  // Prevent path traversal
  const normalized = path.normalize(filePath);
  if (normalized.includes('..') || !normalized.startsWith('lib/calculator/')) {
    return res.status(400).json({ error: 'Invalid path' });
  }

  const fullPath = path.join(process.cwd(), normalized);
  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  try {
    fs.writeFileSync(fullPath, source, 'utf8');
    res.json({ ok: true, filePath: normalized });
  } catch (err: any) {
    res.status(500).json({ error: `Failed to save: ${err.message}` });
  }
});
