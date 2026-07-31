import type { NextApiResponse } from 'next';

import type { NextApiRequestWithUser } from 'lib/middleware';
import { handlerWithUser, requireUpstream } from 'lib/middleware';
import prisma from 'lib/prisma';

const handler = handlerWithUser();
handler.use(requireUpstream);

export type DatabaseColumn = { key: string; label: string; type: 'text' | 'number' };

export type FactorDatabaseSummary = {
  id: string;
  name: string;
  description: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  version: string;
  keyColumn: string | null;
  columnCount: number;
  rowCount: number;
  updatedAt: string;
};

export type CreateDatabaseRequest = {
  name: string;
  description?: string;
  sourceName?: string;
  sourceUrl?: string;
  version?: string;
  keyColumn?: string;
  columns: DatabaseColumn[];
  /** Row objects keyed by column key */
  rows: Record<string, string | number | null>[];
  /** Replace the rows of an existing database of the same name instead of failing */
  replaceExisting?: boolean;
};

async function list(req: NextApiRequestWithUser, res: NextApiResponse) {
  const databases = await prisma.factorDatabase.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { rows: true } } }
  });
  const summaries: FactorDatabaseSummary[] = databases.map(d => ({
    id: d.id,
    name: d.name,
    description: d.description,
    sourceName: d.sourceName,
    sourceUrl: d.sourceUrl,
    version: d.version,
    keyColumn: d.keyColumn,
    columnCount: Array.isArray(d.columns) ? (d.columns as unknown[]).length : 0,
    rowCount: d._count.rows,
    updatedAt: d.updatedAt.toISOString()
  }));
  res.json(summaries);
}

async function create(req: NextApiRequestWithUser, res: NextApiResponse) {
  const body = req.body as CreateDatabaseRequest;
  if (!body?.name?.trim()) return res.status(400).json({ error: 'name is required' });
  if (!Array.isArray(body.columns) || body.columns.length === 0)
    return res.status(400).json({ error: 'columns are required' });
  if (!Array.isArray(body.rows)) return res.status(400).json({ error: 'rows are required' });

  const existing = await prisma.factorDatabase.findUnique({ where: { name: body.name.trim() } });
  if (existing && !body.replaceExisting) {
    return res.status(409).json({ error: 'A database with that name already exists', databaseId: existing.id });
  }

  const data = {
    name: body.name.trim(),
    description: body.description || null,
    sourceName: body.sourceName || null,
    sourceUrl: body.sourceUrl || null,
    version: body.version || '1',
    keyColumn: body.keyColumn || null,
    columns: body.columns as unknown as object,
    uploadedBy: req.user.id
  };

  const database = existing
    ? await prisma.factorDatabase.update({ where: { id: existing.id }, data })
    : await prisma.factorDatabase.create({ data });

  if (existing) {
    await prisma.factorDatabaseRow.deleteMany({ where: { databaseId: database.id } });
  }

  // Chunk the insert — reference tables can be hundreds of rows wide and long.
  const CHUNK = 200;
  for (let i = 0; i < body.rows.length; i += CHUNK) {
    await prisma.factorDatabaseRow.createMany({
      data: body.rows.slice(i, i + CHUNK).map((row, j) => ({
        databaseId: database.id,
        rowIndex: i + j,
        data: row as unknown as object
      }))
    });
  }

  res.json({ id: database.id, name: database.name, rowCount: body.rows.length, replaced: !!existing });
}

handler.get(list).post(create);

export default handler;
