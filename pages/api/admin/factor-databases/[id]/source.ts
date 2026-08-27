/**
 * Downloads the stored source file a database was built from — clicking "source" in the UI
 * serves the actual uploaded workbook/CSV, not just its name.
 */
import type { NextApiResponse } from 'next';

import type { NextApiRequestWithUser } from 'lib/middleware';
import { handlerWithUser, requireUpstream } from 'lib/middleware';
import prisma from 'lib/prisma';

const handler = handlerWithUser();
handler.use(requireUpstream);

async function get(req: NextApiRequestWithUser, res: NextApiResponse) {
  const database = await prisma.factorDatabase.findUnique({
    where: { id: req.query.id as string },
    select: { sourceFile: true }
  });
  if (!database) return res.status(404).json({ error: 'Not found' });
  if (!database.sourceFile) {
    return res.status(404).json({ error: 'No source file is stored for this database' });
  }
  const file = database.sourceFile;
  res.setHeader('Content-Type', file.mimeType);
  res.setHeader('Content-Length', String(file.sizeBytes));
  res.setHeader('Content-Disposition', `attachment; filename="${file.fileName.replace(/"/g, '')}"`);
  res.send(Buffer.from(file.bytes));
}

handler.get(get);

export default handler;
