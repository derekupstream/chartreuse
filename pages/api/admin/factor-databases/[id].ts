import type { NextApiResponse } from 'next';

import type { NextApiRequestWithUser } from 'lib/middleware';
import { handlerWithUser, requireUpstream } from 'lib/middleware';
import prisma from 'lib/prisma';
import type { DatabaseColumn } from './index';

const handler = handlerWithUser();
handler.use(requireUpstream);

export type DatabaseChange = {
  id: string;
  createdAt: string;
  action: string;
  versionBefore: string | null;
  versionAfter: string;
  rowsAdded: number;
  rowsUpdated: number;
  rowsRemoved: number;
  rowCountAfter: number;
  columnsTouched: string[];
  sourceNote: string | null;
};

export type FactorDatabaseDetail = {
  id: string;
  name: string;
  description: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  version: string;
  keyColumn: string | null;
  columns: DatabaseColumn[];
  rows: Record<string, string | number | null>[];
  updatedAt: string;
  /** Append-only version history, newest first */
  changes: DatabaseChange[];
};

async function get(req: NextApiRequestWithUser, res: NextApiResponse) {
  const database = await prisma.factorDatabase.findUnique({
    where: { id: req.query.id as string },
    include: {
      rows: { orderBy: { rowIndex: 'asc' } },
      changes: { orderBy: { createdAt: 'desc' }, take: 50 }
    }
  });
  if (!database) return res.status(404).json({ error: 'Not found' });

  const detail: FactorDatabaseDetail = {
    id: database.id,
    name: database.name,
    description: database.description,
    sourceName: database.sourceName,
    sourceUrl: database.sourceUrl,
    version: database.version,
    keyColumn: database.keyColumn,
    columns: (database.columns as unknown as DatabaseColumn[]) ?? [],
    rows: database.rows.map(r => r.data as Record<string, string | number | null>),
    updatedAt: database.updatedAt.toISOString(),
    changes: database.changes.map(change => ({
      id: change.id,
      createdAt: change.createdAt.toISOString(),
      action: change.action,
      versionBefore: change.versionBefore,
      versionAfter: change.versionAfter,
      rowsAdded: change.rowsAdded,
      rowsUpdated: change.rowsUpdated,
      rowsRemoved: change.rowsRemoved,
      rowCountAfter: change.rowCountAfter,
      columnsTouched: Array.isArray(change.columnsTouched) ? (change.columnsTouched as string[]) : [],
      sourceNote: change.sourceNote
    }))
  };
  res.json(detail);
}

async function remove(req: NextApiRequestWithUser, res: NextApiResponse) {
  await prisma.factorDatabase.delete({ where: { id: req.query.id as string } });
  res.json({ ok: true });
}

handler.get(get).delete(remove);

export default handler;
