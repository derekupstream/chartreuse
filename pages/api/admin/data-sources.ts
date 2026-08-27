/**
 * Stores an uploaded source file (workbook/CSV) verbatim, so every database can point at
 * the actual file it came from. Returns the file id; the database create/merge call and
 * the workbook-upload flow attach it via `sourceFileId`.
 */
import type { NextApiResponse } from 'next';

import type { NextApiRequestWithUser } from 'lib/middleware';
import { handlerWithUser, requireUpstream } from 'lib/middleware';
import prisma from 'lib/prisma';

export const config = { api: { bodyParser: { sizeLimit: '15mb' } } };

const handler = handlerWithUser();
handler.use(requireUpstream);

async function create(req: NextApiRequestWithUser, res: NextApiResponse) {
  const { fileName, mimeType, base64 } = req.body ?? {};
  if (typeof fileName !== 'string' || !fileName || typeof base64 !== 'string' || !base64) {
    return res.status(400).json({ error: 'fileName and base64 are required' });
  }
  const bytes = Buffer.from(base64, 'base64');
  if (!bytes.length) return res.status(400).json({ error: 'Empty file' });

  const file = await prisma.dataSourceFile.create({
    data: {
      fileName,
      mimeType: typeof mimeType === 'string' && mimeType ? mimeType : 'application/octet-stream',
      sizeBytes: bytes.length,
      bytes,
      uploadedBy: req.user.id
    },
    select: { id: true, fileName: true, sizeBytes: true }
  });
  res.json(file);
}

handler.post(create);

export default handler;
