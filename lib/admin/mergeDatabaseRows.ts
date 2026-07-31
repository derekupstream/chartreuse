/**
 * Merges an uploaded file into an existing database table, instead of replacing it.
 *
 * A refresh usually touches part of a table: new emission factors for a few materials,
 * corrected weights for a handful of products. Replacing everything on each upload throws
 * away rows the file didn't mention and rewrites columns the file wasn't authoritative for.
 *
 * So a merge is scoped two ways:
 *   - by ROW: match on the key column. Update matches only, add new only, or both.
 *   - by COLUMN: only the columns you select are written; other columns keep their values.
 */

export type MergeMode = 'replace' | 'update' | 'add' | 'upsert';

export type MergeOptions = {
  mode: MergeMode;
  /** Column used to match an uploaded row to an existing one (ignored for 'replace') */
  keyColumn: string;
  /** Columns permitted to be written. Empty or undefined means all columns in the upload. */
  columns?: string[];
};

export type MergeResult = {
  rows: Record<string, unknown>[];
  updated: number;
  added: number;
  /** Uploaded rows that matched nothing and weren't added (mode 'update') */
  unmatched: number;
  /** Existing rows the upload didn't mention (kept, except in 'replace') */
  untouched: number;
  /** Which columns were actually written */
  columnsWritten: string[];
};

const matchKey = (v: unknown) =>
  String(v ?? '')
    .trim()
    .toLowerCase();

export function mergeDatabaseRows(
  existingRows: Record<string, unknown>[],
  uploadedRows: Record<string, unknown>[],
  options: MergeOptions
): MergeResult {
  if (options.mode === 'replace') {
    return {
      rows: uploadedRows,
      updated: 0,
      added: uploadedRows.length,
      unmatched: 0,
      untouched: 0,
      columnsWritten: Array.from(new Set(uploadedRows.flatMap(r => Object.keys(r))))
    };
  }

  const { keyColumn } = options;
  const allowed = options.columns?.length ? new Set(options.columns) : null;
  const columnsWritten = new Set<string>();

  // Index existing rows by key, keeping their original order.
  const indexByKey = new Map<string, number>();
  const rows = existingRows.map((row, i) => {
    const k = matchKey(row[keyColumn]);
    if (k && !indexByKey.has(k)) indexByKey.set(k, i);
    return { ...row };
  });

  const touched = new Set<number>();
  let updated = 0;
  let added = 0;
  let unmatched = 0;

  for (const uploaded of uploadedRows) {
    const k = matchKey(uploaded[keyColumn]);
    if (!k) continue;

    const existingIndex = indexByKey.get(k);

    if (existingIndex === undefined) {
      if (options.mode === 'update') {
        unmatched += 1;
        continue;
      }
      // 'add' and 'upsert' create the row, restricted to the selected columns
      const fresh: Record<string, unknown> = {};
      for (const [col, value] of Object.entries(uploaded)) {
        if (allowed && !allowed.has(col) && col !== keyColumn) continue;
        fresh[col] = value;
        if (col !== keyColumn) columnsWritten.add(col);
      }
      fresh[keyColumn] = uploaded[keyColumn];
      rows.push(fresh);
      indexByKey.set(k, rows.length - 1);
      touched.add(rows.length - 1);
      added += 1;
      continue;
    }

    if (options.mode === 'add') {
      // Existing row, and we were only told to add — leave it alone.
      continue;
    }

    let changedThisRow = false;
    for (const [col, value] of Object.entries(uploaded)) {
      if (col === keyColumn) continue;
      if (allowed && !allowed.has(col)) continue;
      // An empty cell in the upload is treated as "no opinion", not as "clear it".
      if (value === '' || value === null || value === undefined) continue;
      if (rows[existingIndex][col] !== value) changedThisRow = true;
      rows[existingIndex][col] = value;
      columnsWritten.add(col);
    }
    touched.add(existingIndex);
    if (changedThisRow) updated += 1;
  }

  return {
    rows,
    updated,
    added,
    unmatched,
    untouched: existingRows.length - Array.from(touched).filter(i => i < existingRows.length).length,
    columnsWritten: Array.from(columnsWritten)
  };
}
