/**
 * Collection versions: GET lists them; POST cuts a new one ("Update version to …") —
 * stamps every database and stores the full, restorable contents.
 */
import type { NextApiResponse } from 'next';

import { cutRelease } from 'lib/admin/dataReleases';
import type { NextApiRequestWithUser } from 'lib/middleware';
import { handlerWithUser, requireUpstream } from 'lib/middleware';
import prisma from 'lib/prisma';

const handler = handlerWithUser();
handler.use(requireUpstream);

export type DataReleaseSummary = {
  id: string;
  name: string;
  note: string | null;
  createdAt: string;
  databaseCount: number;
};

handler.get(async (_req: NextApiRequestWithUser, res: NextApiResponse) => {
  const releases = await prisma.dataRelease.findMany({ orderBy: { createdAt: 'desc' } });
  const summaries: DataReleaseSummary[] = releases.map(r => ({
    id: r.id,
    name: r.name,
    note: r.note,
    createdAt: r.createdAt.toISOString(),
    databaseCount: Array.isArray(r.tablesJson) ? (r.tablesJson as unknown[]).length : 0
  }));
  res.json(summaries);
});

handler.post(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  try {
    const result = await cutRelease(String(req.body?.name ?? ''), req.body?.note || null, req.user.id);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

export default handler;
