import type { NextApiResponse } from 'next';

import type { NextApiRequestWithUser } from 'lib/middleware';
import { handlerWithUser, requireUpstream } from 'lib/middleware';
import prisma from 'lib/prisma';

const handler = handlerWithUser();
handler.use(requireUpstream);

export type SourcePreview = {
  databaseId: string;
  databaseName: string;
  columns: { key: string; label: string }[];
  /** A window of rows around the one supplying the value */
  rows: { rowIndex: number; data: Record<string, unknown> }[];
  highlightRowIndex: number;
  highlightColumnKey: string;
  totalRows: number;
};

/** Returns the rows around a variable's source cell, so it can be shown in context. */
handler.get(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const { databaseId, rowIndex, columnKey } = req.query as Record<string, string>;
  if (!databaseId) return res.status(400).json({ error: 'databaseId is required' });

  const database = await prisma.factorDatabase.findUnique({
    where: { id: databaseId },
    include: { rows: { orderBy: { rowIndex: 'asc' } } }
  });
  if (!database) return res.status(404).json({ error: 'Database not found' });

  const target = Number(rowIndex ?? 0);
  const WINDOW = 7;
  const start = Math.max(0, target - Math.floor(WINDOW / 2));
  const window = database.rows.slice(start, start + WINDOW);

  const preview: SourcePreview = {
    databaseId: database.id,
    databaseName: database.name,
    columns: ((database.columns as unknown as { key: string; label?: string }[]) ?? []).map(c => ({
      key: c.key,
      label: c.label ?? c.key
    })),
    rows: window.map(r => ({ rowIndex: r.rowIndex, data: r.data as Record<string, unknown> })),
    highlightRowIndex: target,
    highlightColumnKey: columnKey ?? '',
    totalRows: database.rows.length
  };

  res.json(preview);
});

export default handler;
