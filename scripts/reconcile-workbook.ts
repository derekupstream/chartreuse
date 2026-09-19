/**
 * Reconciliation diff: compare a workbook export of Madhavi's Combined Model against the
 * live databases, tab by tab, using the exact machinery the workbook-upload page uses
 * (same tab→database mapping, header detection, GHG header repair, key matching).
 *
 * Read-only — prints the diff and changes nothing. Written for C1 of
 * docs/CR2-2026-09-18-REVIEW-PLAN.md: the final reconciliation of the Sept 18 workbook,
 * after which the admin databases are the source of truth.
 *
 *   npx dotenv-cli -e .env -- npx tsx scripts/reconcile-workbook.ts "<path to .xlsx>"
 */
import { readFileSync } from 'fs';

import * as XLSX from 'xlsx';

import { diffWorkbookSheet, repairSwappedScopeColumns } from 'lib/admin/diffWorkbookSheet';
import prisma from 'lib/prisma';

// Same mapping as pages/admin/data-science/databases/workbook-upload.tsx.
const TAB_TO_DATABASE: Record<string, string> = {
  single_use_products: 'Single-Use Products',
  reusable_products: 'Reusable Products',
  ghg_factors: 'GHG Factors',
  water_factors: 'Water Factors',
  transport_factors: 'Transport Factors',
  purchase_frequency: 'Purchase Frequency',
  utility_rates: 'Utility Rates',
  dishwasher_factors: 'Dishwasher Factors'
};
const NON_DATA_TABS = new Set(['readme', 'openquestions']);
// Scenario/calc tabs describe a scenario, not a database — listed so the report is complete.
const SCENARIO_TABS = new Set([
  'dashboard',
  'scenariosu',
  'scenarioreuse',
  'dishwashing',
  'additionalcosts',
  'calcsu',
  'calcreuse'
]);

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

function detectHeaderRow(rows: unknown[][]): number {
  let best = 0;
  let bestCount = 0;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const count = (rows[i] ?? []).filter(c => c !== null && c !== undefined && String(c).trim() !== '').length;
    if (count > bestCount) {
      bestCount = count;
      best = i;
    }
  }
  return best;
}

function parseSheet(sheet: XLSX.WorkSheet): { columns: string[]; rows: Record<string, unknown>[] } {
  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });
  if (!grid.length) return { columns: [], rows: [] };
  const headerIndex = detectHeaderRow(grid);
  const headers = (grid[headerIndex] ?? []).map(h => String(h ?? '').trim());
  const rows: Record<string, unknown>[] = [];
  for (const raw of grid.slice(headerIndex + 1)) {
    const row: Record<string, unknown> = {};
    let hasValue = false;
    headers.forEach((header, i) => {
      if (!header) return;
      const value = raw?.[i] ?? null;
      row[header] = value;
      if (value !== null && String(value).trim() !== '') hasValue = true;
    });
    if (hasValue) rows.push(row);
  }
  return { columns: headers.filter(Boolean), rows };
}

const fmt = (v: unknown) => (v === null || v === undefined || v === '' ? '∅' : String(v).slice(0, 40));

async function main() {
  const path = process.argv[2];
  if (!path) {
    console.error('Usage: npx tsx scripts/reconcile-workbook.ts "<path to .xlsx>"');
    process.exit(1);
  }
  const workbook = XLSX.read(readFileSync(path), { type: 'buffer' });
  const databases = await prisma.factorDatabase.findMany({
    include: { rows: { orderBy: { rowIndex: 'asc' } } }
  });

  let tabsWithChanges = 0;
  for (const tabName of workbook.SheetNames) {
    const norm = normalize(tabName);
    if (NON_DATA_TABS.has(norm)) {
      console.log(`\n▸ ${tabName} — non-data tab, skipped`);
      continue;
    }
    if (SCENARIO_TABS.has(norm)) {
      console.log(`\n▸ ${tabName} — scenario/spec tab (covered by the golden dataset), skipped`);
      continue;
    }
    const dbName = TAB_TO_DATABASE[norm] ?? databases.find(d => normalize(d.name) === norm)?.name ?? null;
    const db = dbName ? databases.find(d => d.name === dbName) : null;
    if (!db) {
      console.log(`\n▸ ${tabName} — NO MATCHING DATABASE (would be a new table on upload)`);
      continue;
    }

    const parsed = parseSheet(workbook.Sheets[tabName]);
    const repair = repairSwappedScopeColumns(parsed.rows);
    if (repair.repaired) parsed.rows = repair.rows;

    const keyColumn = db.keyColumn || parsed.columns[0];
    const columnKeys = ((db.columns as { key: string }[]) ?? []).map(c => c.key);
    const dbRows = db.rows.map(r => r.data as Record<string, unknown>);
    const diff = diffWorkbookSheet(dbRows, columnKeys, parsed.rows, keyColumn);

    const quiet =
      !diff.addedRows.length && !diff.changedRows.length && !diff.newColumns.length && !diff.missingKeys.length;
    console.log(
      `\n▸ ${tabName} → "${db.name}"${repair.repaired ? ' (header swap auto-repaired)' : ''}${quiet ? ' — identical' : ''}`
    );
    if (quiet) continue;
    tabsWithChanges += 1;

    if (diff.newColumns.length) console.log(`  new columns (${diff.newColumns.length}): ${diff.newColumns.join(', ')}`);
    if (diff.addedRows.length)
      console.log(
        `  new rows (${diff.addedRows.length}): ${diff.addedRows
          .slice(0, 5)
          .map(r => fmt(r[keyColumn.split(',')[0]]))
          .join(', ')}${diff.addedRows.length > 5 ? ', …' : ''}`
      );
    if (diff.missingKeys.length)
      console.log(
        `  rows only in the database (${diff.missingKeys.length}): ${diff.missingKeys.slice(0, 5).join(', ')}${diff.missingKeys.length > 5 ? ', …' : ''}`
      );
    for (const row of diff.changedRows.slice(0, 10)) {
      for (const f of row.fields.slice(0, 4)) {
        console.log(`  ~ [${row.key}] ${f.column}: ${fmt(f.before)} → ${fmt(f.after)}`);
      }
    }
    if (diff.changedRows.length > 10) console.log(`  … and ${diff.changedRows.length - 10} more changed rows`);
    if (diff.keylessRows) console.log(`  ⚠ ${diff.keylessRows} rows with an empty key (unmatchable)`);
  }

  console.log(`\n${tabsWithChanges === 0 ? 'Workbook and databases are identical.' : `${tabsWithChanges} tab(s) differ — apply the ones you accept via Databases → Workbook upload.`}`);
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
