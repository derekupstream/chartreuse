/**
 * Collection versioning: cut a named version of ALL databases (contents included), and
 * restore one later. Cutting "v3" stamps every database version to 3 and stores the whole
 * collection; restoring "v2.0" puts every table back exactly as it was — rows, columns,
 * sources, versions — with changelog entries so history shows the rollback happened.
 */
import { recomputeAllFormulas } from 'lib/admin/formulaServer';
import prisma from 'lib/prisma';

export type ReleaseTable = {
  name: string;
  description: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  kind: string;
  keyColumn: string | null;
  version: string;
  columns: unknown;
  sourceFileId: string | null;
  rows: unknown[];
};

/** "v2.1" and "2.1" both mean version "2.1", displayed as "v2.1". */
export const normalizeVersionName = (name: string) => name.trim().replace(/^v/i, '');

export async function cutRelease(name: string, note: string | null, createdBy: string | null) {
  const version = normalizeVersionName(name);
  if (!version) throw new Error('A version name is required (e.g. v2.1 or v3)');
  const releaseName = `v${version}`;

  const existing = await prisma.dataRelease.findUnique({ where: { name: releaseName } });
  if (existing) throw new Error(`${releaseName} already exists — pick a new name`);

  const databases = await prisma.factorDatabase.findMany({
    where: { isActive: true },
    include: { rows: { orderBy: { rowIndex: 'asc' } } },
    orderBy: { name: 'asc' }
  });

  // Stamp the collection first, so the stored dump carries the new version.
  for (const database of databases) {
    if (database.version === version) continue;
    await prisma.factorDatabase.update({ where: { id: database.id }, data: { version } });
    await prisma.factorDatabaseChange.create({
      data: {
        databaseId: database.id,
        changedBy: createdBy ?? database.uploadedBy ?? database.id, // changelog requires an actor
        action: 'release',
        versionBefore: database.version,
        versionAfter: version,
        rowsAdded: 0,
        rowsUpdated: 0,
        rowsRemoved: 0,
        rowCountAfter: database.rows.length,
        columnsTouched: [] as unknown as object,
        sourceNote: `Collection versioned to ${releaseName}`
      }
    });
  }

  const tables: ReleaseTable[] = databases.map(d => ({
    name: d.name,
    description: d.description,
    sourceName: d.sourceName,
    sourceUrl: d.sourceUrl,
    kind: d.kind,
    keyColumn: d.keyColumn,
    version,
    columns: d.columns,
    sourceFileId: d.sourceFileId,
    rows: d.rows.map(r => r.data)
  }));

  const release = await prisma.dataRelease.create({
    data: { name: releaseName, note, createdBy, tablesJson: tables as unknown as object }
  });

  await prisma.methodologySnapshot.create({
    data: {
      createdBy: createdBy ?? '00000000-0000-0000-0000-000000000000',
      name: `Data Release ${releaseName}`,
      notes: note ?? `Collection versioned to ${releaseName} (${tables.length} databases, restorable)`,
      status: 'published',
      publishedAt: new Date(),
      databaseVersionsJson: tables.map(t => ({ name: t.name, version: t.version, kind: t.kind })) as unknown as object
    }
  });

  return { id: release.id, name: release.name, databases: tables.length };
}

export async function restoreRelease(releaseId: string, restoredBy: string) {
  const release = await prisma.dataRelease.findUnique({ where: { id: releaseId } });
  if (!release) throw new Error('Release not found');
  const tables = release.tablesJson as unknown as ReleaseTable[];

  let restored = 0;
  for (const table of tables) {
    // A stored source file may have been deleted since the release was cut.
    const sourceFileId =
      table.sourceFileId &&
      (await prisma.dataSourceFile.findUnique({ where: { id: table.sourceFileId }, select: { id: true } }))
        ? table.sourceFileId
        : null;

    const data = {
      description: table.description,
      sourceName: table.sourceName,
      sourceUrl: table.sourceUrl,
      kind: table.kind,
      keyColumn: table.keyColumn,
      version: table.version,
      columns: table.columns as object,
      sourceFileId,
      isActive: true
    };
    const before = await prisma.factorDatabase.findUnique({
      where: { name: table.name },
      include: { _count: { select: { rows: true } } }
    });
    const database = before
      ? await prisma.factorDatabase.update({ where: { id: before.id }, data })
      : await prisma.factorDatabase.create({ data: { name: table.name, ...data } });

    await prisma.factorDatabaseRow.deleteMany({ where: { databaseId: database.id } });
    const CHUNK = 200;
    for (let i = 0; i < table.rows.length; i += CHUNK) {
      await prisma.factorDatabaseRow.createMany({
        data: table.rows.slice(i, i + CHUNK).map((row, j) => ({
          databaseId: database.id,
          rowIndex: i + j,
          data: row as object
        }))
      });
    }
    await prisma.factorDatabaseChange.create({
      data: {
        databaseId: database.id,
        changedBy: restoredBy,
        action: 'restore',
        versionBefore: before?.version ?? null,
        versionAfter: table.version,
        rowsAdded: 0,
        rowsUpdated: table.rows.length,
        rowsRemoved: before?._count.rows ?? 0,
        rowCountAfter: table.rows.length,
        columnsTouched: [] as unknown as object,
        sourceNote: `Restored from ${release.name}`
      }
    });
    restored += 1;
  }

  await recomputeAllFormulas();
  return { name: release.name, databases: restored };
}
