/**
 * Deterministic diff between an uploaded workbook sheet and the database it maps to: which
 * rows are new, which existing rows change (field by field, before → after), which columns
 * the upload introduces, and which existing rows the upload doesn't mention.
 *
 * This is what lets a data scientist upload a whole workbook and *decide* what to apply —
 * the analysis shows exactly what would change, with no inference involved. Rows match on
 * the database's key column, case-insensitively, the same way the merge engine matches.
 */

export type FieldChange = { column: string; before: unknown; after: unknown };
export type RowChange = { key: string; fields: FieldChange[] };

export type SheetDiff = {
  /** Upload rows whose key doesn't exist in the database */
  addedRows: Record<string, unknown>[];
  /** Existing rows the upload changes, with per-field before/after */
  changedRows: RowChange[];
  /** Rows present in both with no differences */
  unchangedCount: number;
  /** Keys in the database that the upload doesn't mention (kept unless replacing) */
  missingKeys: string[];
  /** Columns in the upload that the database doesn't have yet */
  newColumns: string[];
  /** Columns that carry at least one changed value */
  changedColumns: string[];
  /** Upload rows with an empty key — they can't be matched or safely added */
  keylessRows: number;
};

const normPart = (v: unknown) =>
  String(v ?? '')
    .trim()
    .toLowerCase();

/** Composite keys ("scope,material") match on every part — see mergeDatabaseRows. */
const rowMatchKey = (row: Record<string, unknown>, keyColumn: string) => {
  const parts = keyColumn.split(',').map(c => normPart(row[c.trim()]));
  return parts.every(p => p === '') ? '' : parts.join('|');
};

/** Human-readable form of a (possibly composite) key for display. */
const rowKeyLabel = (row: Record<string, unknown>, keyColumn: string) =>
  keyColumn
    .split(',')
    .map(c => String(row[c.trim()] ?? ''))
    .filter(Boolean)
    .join(' · ');

/**
 * Repairs a sheet whose material/scope headers are swapped (the workbook's GHG_Factors tab:
 * headers say material|scope, the data is scope|material). Detected when most values under
 * "material" are scope words. Returns new row objects; the caller shows that the repair ran.
 */
export function repairSwappedScopeColumns(rows: Record<string, unknown>[]): {
  rows: Record<string, unknown>[];
  repaired: boolean;
} {
  if (!rows.length) return { rows, repaired: false };
  const scopeWords = new Set(['single-use', 'reusable']);
  const hasBoth = 'material' in rows[0] && 'scope' in rows[0];
  if (!hasBoth) return { rows, repaired: false };
  const swappedCount = rows.filter(
    r => scopeWords.has(normPart(r.material)) && !scopeWords.has(normPart(r.scope))
  ).length;
  if (swappedCount / rows.length < 0.6) return { rows, repaired: false };
  return {
    rows: rows.map(r => ({ ...r, material: r.scope, scope: r.material })),
    repaired: true
  };
}

/**
 * Blank-vs-blank is equal; numbers compare numerically; strings compare trimmed with line
 * endings normalized — different Excel parsers emit \r\n vs \n inside multiline cells, and
 * that must never read as a data change.
 */
function valuesEqual(a: unknown, b: unknown): boolean {
  const aBlank = a === null || a === undefined || String(a).trim() === '';
  const bBlank = b === null || b === undefined || String(b).trim() === '';
  if (aBlank || bBlank) return aBlank === bBlank;
  const aNum = Number(a);
  const bNum = Number(b);
  if (Number.isFinite(aNum) && Number.isFinite(bNum) && String(a).trim() !== '' && String(b).trim() !== '') {
    const scale = Math.max(1, Math.abs(aNum), Math.abs(bNum));
    return Math.abs(aNum - bNum) / scale < 1e-12;
  }
  const normalize = (v: unknown) => String(v).replace(/\r\n?/g, '\n').trim();
  return normalize(a) === normalize(b);
}

export function diffWorkbookSheet(
  existingRows: Record<string, unknown>[],
  existingColumns: string[],
  uploadedRows: Record<string, unknown>[],
  keyColumn: string
): SheetDiff {
  const existingByKey = new Map<string, Record<string, unknown>>();
  for (const row of existingRows) existingByKey.set(rowMatchKey(row, keyColumn), row);

  const addedRows: Record<string, unknown>[] = [];
  const changedRows: RowChange[] = [];
  const changedColumns = new Set<string>();
  const seenKeys = new Set<string>();
  let unchangedCount = 0;
  let keylessRows = 0;

  const existingColumnSet = new Set(existingColumns);
  const newColumns = new Set<string>();

  for (const uploaded of uploadedRows) {
    const key = rowMatchKey(uploaded, keyColumn);
    for (const column of Object.keys(uploaded)) {
      if (!existingColumnSet.has(column)) newColumns.add(column);
    }
    if (!key) {
      keylessRows += 1;
      continue;
    }
    seenKeys.add(key);
    const existing = existingByKey.get(key);
    if (!existing) {
      addedRows.push(uploaded);
      continue;
    }
    const fields: FieldChange[] = [];
    for (const [column, after] of Object.entries(uploaded)) {
      const before = existing[column];
      if (!valuesEqual(before, after)) {
        fields.push({ column, before: before ?? null, after });
        changedColumns.add(column);
      }
    }
    if (fields.length) changedRows.push({ key: rowKeyLabel(uploaded, keyColumn), fields });
    else unchangedCount += 1;
  }

  const missingKeys: string[] = [];
  existingByKey.forEach((row, key) => {
    if (!seenKeys.has(key)) missingKeys.push(rowKeyLabel(row, keyColumn) || key);
  });

  return {
    addedRows,
    changedRows,
    unchangedCount,
    missingKeys,
    newColumns: Array.from(newColumns),
    changedColumns: Array.from(changedColumns),
    keylessRows
  };
}
