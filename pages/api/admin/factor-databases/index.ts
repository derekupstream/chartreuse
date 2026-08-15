import type { NextApiResponse } from 'next';

import type { NextApiRequestWithUser } from 'lib/middleware';
import { handlerWithUser, requireUpstream } from 'lib/middleware';
import prisma from 'lib/prisma';
import { mergeDatabaseRows } from 'lib/admin/mergeDatabaseRows';
import type { MergeMode } from 'lib/admin/mergeDatabaseRows';

const handler = handlerWithUser();
handler.use(requireUpstream);

/**
 * Data gets versions like software gets builds. "3" → "4"; "2026.08" → "2026.08.1".
 * An explicit version in the upload always wins — that's how a named release is cut.
 */
export function bumpVersion(current: string): string {
  if (/^\d+$/.test(current)) return String(parseInt(current, 10) + 1);
  const segments = current.split('.');
  const allNumeric = segments.every(segment => /^\d+$/.test(segment));
  // "2026.08" is a calendar release name — a change to it starts a patch series
  // ("2026.08.1"), it does not increment the month. Only a third-or-later segment
  // is ever incremented ("2026.08.1" → "2026.08.2").
  if (allNumeric && segments.length >= 3) {
    const last = segments[segments.length - 1];
    return [...segments.slice(0, -1), String(parseInt(last, 10) + 1)].join('.');
  }
  return `${current}.1`;
}

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
  /**
   * How to fold the upload into an existing table:
   *  replace = take the upload wholesale (the old behaviour)
   *  update  = only change rows that already exist
   *  add     = only create rows that don't exist yet
   *  upsert  = both
   */
  mergeMode?: MergeMode;
  /** Restrict writing to these columns; others keep their current values */
  mergeColumns?: string[];
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

  const mergeMode: MergeMode = body.mergeMode ?? 'replace';
  const existing = await prisma.factorDatabase.findUnique({
    where: { name: body.name.trim() },
    include: mergeMode === 'replace' ? undefined : { rows: { orderBy: { rowIndex: 'asc' } } }
  });
  if (existing && !body.replaceExisting && mergeMode === 'replace') {
    return res.status(409).json({ error: 'A database with that name already exists', databaseId: existing.id });
  }
  if (!existing && mergeMode === 'update') {
    return res.status(400).json({ error: 'Nothing to update — no database of that name exists yet' });
  }

  // Version policy: an explicit version in the upload wins (cutting a named release);
  // otherwise any change to an existing table auto-bumps. New tables start at '1'.
  const versionBefore = existing?.version ?? null;
  const versionAfter = existing
    ? body.version && body.version !== existing.version
      ? body.version
      : bumpVersion(existing.version)
    : body.version || '1';

  const data = {
    name: body.name.trim(),
    description: body.description || null,
    sourceName: body.sourceName || null,
    sourceUrl: body.sourceUrl || null,
    version: versionAfter,
    keyColumn: body.keyColumn || null,
    columns: body.columns as unknown as object,
    uploadedBy: req.user.id
  };
  // A partial upload must not shrink the table's column definitions.
  if (existing && mergeMode !== 'replace') {
    const existingColumns = (existing.columns as unknown as { key: string }[]) ?? [];
    const merged = [...existingColumns];
    for (const col of body.columns) if (!merged.some(c => c.key === col.key)) merged.push(col);
    data.columns = merged as unknown as object;
  }

  const database = existing
    ? await prisma.factorDatabase.update({ where: { id: existing.id }, data })
    : await prisma.factorDatabase.create({ data });

  // Work out the final row set. For anything but a wholesale replace this folds the
  // upload into what's already there, scoped by row match and by selected columns.
  const existingRows = ((existing as any)?.rows ?? []).map((r: any) => r.data as Record<string, unknown>);
  const merge = mergeDatabaseRows(existingRows, body.rows as Record<string, unknown>[], {
    mode: mergeMode,
    keyColumn: body.keyColumn || (body.columns[0]?.key ?? ''),
    columns: body.mergeColumns
  });

  if (existing) {
    await prisma.factorDatabaseRow.deleteMany({ where: { databaseId: database.id } });
  }

  // Chunk the insert — reference tables can be hundreds of rows wide and long.
  const CHUNK = 200;
  for (let i = 0; i < merge.rows.length; i += CHUNK) {
    await prisma.factorDatabaseRow.createMany({
      data: merge.rows.slice(i, i + CHUNK).map((row, j) => ({
        databaseId: database.id,
        rowIndex: i + j,
        data: row as unknown as object
      }))
    });
  }

  // The changelog row is what makes this version citable later: what changed, from what,
  // by whom. Append-only — corrections are new uploads, not edits to history.
  await prisma.factorDatabaseChange.create({
    data: {
      databaseId: database.id,
      changedBy: req.user.id,
      action: existing ? mergeMode : 'create',
      versionBefore,
      versionAfter,
      rowsAdded: merge.added,
      rowsUpdated: merge.updated,
      rowsRemoved: existing && mergeMode === 'replace' ? existingRows.length : 0,
      rowCountAfter: merge.rows.length,
      columnsTouched: merge.columnsWritten as unknown as object,
      sourceNote: body.sourceName || null
    }
  });

  res.json({
    id: database.id,
    name: database.name,
    version: versionAfter,
    versionBefore,
    rowCount: merge.rows.length,
    replaced: !!existing && mergeMode === 'replace',
    mergeMode,
    updated: merge.updated,
    added: merge.added,
    unmatched: merge.unmatched,
    untouched: merge.untouched,
    columnsWritten: merge.columnsWritten
  });
}

handler.get(list).post(create);

export default handler;
