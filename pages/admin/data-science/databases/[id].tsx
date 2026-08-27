/**
 * One database as a spreadsheet — the way a data scientist expects to meet a table.
 *
 * Full-page grid: compact cells, sticky headers, and the horizontal scrollbar always on
 * screen (the grid is height-capped, so the bar never hides below the fold). Columns are
 * color-coded by what they feed (GHG, water, cost, mass, transport, keys). Click any cell
 * and the inspector shows what the field means (from the Data Dictionary) and the exact
 * math it drives in the 2.0 model; edit in the formula bar, then save the batch — one
 * changelog entry, one version step, snapshot cut automatically for factors tables.
 */
import { ArrowLeftOutlined, DownloadOutlined, SaveOutlined, UploadOutlined } from '@ant-design/icons';
import { Alert, Button, Input, Spin, Tag, Typography, message } from 'antd';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Papa from 'papaparse';
import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { getUserFromContext } from 'lib/middleware';
import { ACCESS_DENIED_REDIRECT, checkIsUpstream } from 'lib/middleware/requireUpstream';
import { serializeJSON } from 'lib/objects';
import type { PageProps } from 'pages/_app';
import type { FactorDatabaseSummary } from 'pages/api/admin/factor-databases/index';
import type { FactorDatabaseDetail } from 'pages/api/admin/factor-databases/[id]';
import type { CellEditResponse } from 'pages/api/admin/factor-databases/[id]/cells';

const { Text, Title } = Typography;

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return ACCESS_DENIED_REDIRECT;
  if (!(await checkIsUpstream(user.org.id))) return ACCESS_DENIED_REDIRECT;
  return { props: serializeJSON({ user }) };
};

/* ── the grid ─────────────────────────────────────────────────────────────────────────── */

const GridScroll = styled.div`
  overflow: auto;
  max-height: calc(100vh - 320px);
  min-height: 240px;
  border: 1px solid #e3e3e0;
  border-radius: 6px;
  background: white;
`;

const Grid = styled.table`
  border-collapse: separate;
  border-spacing: 0;
  font-size: 12px;
  width: max-content;

  th {
    position: sticky;
    top: 0;
    z-index: 2;
    background: #fafaf8;
    border-bottom: 2px solid #d9d9d6;
    border-right: 1px solid #eeeeec;
    padding: 4px 8px;
    text-align: left;
    font-weight: 600;
    white-space: nowrap;
  }
  th.rownum,
  td.rownum {
    position: sticky;
    left: 0;
    z-index: 1;
    background: #fafaf8;
    color: rgba(0, 0, 0, 0.4);
    text-align: right;
    min-width: 40px;
    border-right: 2px solid #d9d9d6;
    font-weight: 400;
  }
  th.rownum {
    z-index: 3;
  }
  td {
    border-bottom: 1px solid #f0f0ee;
    border-right: 1px solid #f0f0ee;
    padding: 3px 8px;
    white-space: nowrap;
    max-width: 280px;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: cell;
  }
  td.num {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  td.selected {
    outline: 2px solid #1677ff;
    outline-offset: -2px;
  }
  td.edited {
    background: #fff7e6 !important;
    font-style: italic;
  }
`;

/** What each column family feeds — the tint is the legend. */
const COLUMN_FAMILIES: { test: RegExp; color: string; bg: string; label: string }[] = [
  { test: /ghg|mtco2e|emission/i, color: '#237804', bg: '#f6ffed', label: 'GHG math' },
  { test: /water/i, color: '#0958d9', bg: '#e6f4ff', label: 'Water math' },
  { test: /price|cost|rate_usd|amount/i, color: '#ad6800', bg: '#fffbe6', label: 'Cost math' },
  { test: /weight|_lbs|_tons|mass|case_count/i, color: '#ad4e00', bg: '#fff7e6', label: 'Mass chain' },
  { test: /distance|mode|transport/i, color: '#1d39c4', bg: '#f0f5ff', label: 'Transport' },
  { test: /^(product_id|funding_id|id)$|_id$/i, color: '#595959', bg: '#fafafa', label: 'Key' },
  { test: /material|scope/i, color: '#531dab', bg: '#f9f0ff', label: 'Factor lookup' }
];

function columnFamily(key: string) {
  return COLUMN_FAMILIES.find(f => f.test.test(key)) ?? null;
}

/**
 * The math behind a column — where the 2.0 engine (lib/calculator/v2/combinedModel.ts)
 * actually uses it. Shown in the inspector so a value is never just a number.
 */
const MODEL_USAGE: Record<string, string> = {
  ghg_factor_mtco2e_per_lb:
    'line GHG (MTCO₂e) = shipped lb × ghg_factor [SUMIFS by scope + material] + shipped lb × transport GHG/lb — Calc_SU & Calc_Reuse impact columns',
  water_factor_gal_per_lb:
    'line water (gal) = shipped lb × water_factor [SUMIFS by application_scope + material] — Calc_SU & Calc_Reuse impact columns',
  GHG_Factor: 'transport GHG per lb = GHG_Factor × Distance_Miles; added to every line: shipped lb × transport GHG/lb',
  Distance_Miles: 'transport GHG per lb = GHG_Factor × Distance_Miles (the assumed freight distance)',
  Annual_Factor:
    'annualization: cases per frequency × Annual_Factor = cases per year — every quantity column starts here',
  Frequency: 'lookup key for Annual_Factor (Daily/Weekly/Monthly/Annually)',
  electric_rate_usd_per_kwh: 'dishwashing utility cost += total kWh × electric rate (state row = the project’s state)',
  gas_rate_usd_per_therm: 'dishwashing utility cost += total therms × gas rate',
  water_rate_usd_per_1000_gal: 'dishwashing utility cost += (annual gal ÷ 1000) × water rate',
  water_gal_per_rack_conventional:
    'annual dishwashing water = racks/day × days/year × gal per rack (conventional machines)',
  water_gal_per_rack_energy_star:
    'annual dishwashing water = racks/day × days/year × gal per rack (Energy Star machines)',
  machine_type: 'lookup key (with temperature) selecting the dishwasher row a project uses',
  temperature: 'lookup key (with machine_type) selecting the dishwasher row a project uses',
  state: 'lookup key selecting the utility rates a project’s dishwashing costs use',
  item_weight_lbs: 'shipped lb = annual units × item_weight_lbs — the mass every GHG/water/waste figure scales from',
  gross_case_weight_lbs: 'case mass including the box; net = gross − box share',
  box_weight_pct_of_gross: 'box lb = gross case weight × box % — box impacts use the box_material factors',
  box_material: 'factor lookup material for the box mass (the known unscoped-lookup quirk lives here)',
  primary_material: 'factor lookup material for the item’s primary mass share',
  secondary_material: 'factor lookup material for the secondary mass share',
  secondary_material_pct: 'splits item mass: primary (1−pct) vs secondary (pct) before factor lookup',
  case_count: 'units per case — converts case purchases to annual units',
  case_price: 'baseline/forecast cost = cases per year × case price',
  unit_price: 'reusable startup cost = initial units × unit price; repurchase cost = units × price × repurchase rate',
  material: 'factor lookup key (matched case-insensitively with scope)',
  scope: 'factor lookup key: Single-Use vs Reusable — the scoping the workbook’s GHG tab mislabels',
  application_scope: 'factor lookup key: Single-Use vs Reusable for water factors',
  product_id: 'stable key joining scenario lines to this product row — never reuse an ID',
  funding_id: 'stable key for a funding opportunity (MUN-####)',
  min_amount: 'funding calculations: lower bound of the award range',
  max_amount: 'funding calculations: upper bound of the award range',
  reuse_explicit: 'frontend filter: opportunities that name reuse explicitly'
};

type DictEntry = { field: string; definition: string; type: string; unit: string; authority: string };

const normalizeKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Excel exports carry float noise (0.0005949999999…) — display clean, keep the raw value. */
const displayValue = (v: unknown): string => {
  if (typeof v === 'number' && Number.isFinite(v)) return String(parseFloat(v.toPrecision(12)));
  return String(v);
};

export default function DatabaseSpreadsheetPage(_: { user: DashboardUser }) {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : null;

  const [detail, setDetail] = useState<FactorDatabaseDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dictionary, setDictionary] = useState<DictEntry[]>([]);
  const [search, setSearch] = useState('');
  const [sel, setSel] = useState<{ row: number; col: string } | null>(null);
  const [draft, setDraft] = useState('');
  /** Uncommitted edits, keyed `${rowIndex}|${column}` */
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function load(databaseId: string) {
    fetch(`/api/admin/factor-databases/${databaseId}`)
      .then(async r => {
        const body = await r.json();
        if (!r.ok || !Array.isArray(body.columns)) throw new Error(body.error || `HTTP ${r.status}`);
        setDetail({ ...body, changes: Array.isArray(body.changes) ? body.changes : [] });
      })
      .catch(err => setError((err as Error).message));
  }

  useEffect(() => {
    if (id) load(id);
  }, [id]);

  // Definitions for the inspector — the Data Dictionary database, fetched once.
  useEffect(() => {
    fetch('/api/admin/factor-databases')
      .then(r => r.json())
      .then((list: FactorDatabaseSummary[]) => {
        const dict = Array.isArray(list) ? list.find(d => d.name === 'Data Dictionary') : null;
        if (!dict) return;
        fetch(`/api/admin/factor-databases/${dict.id}`)
          .then(r => r.json())
          .then((body: FactorDatabaseDetail) =>
            setDictionary(
              (body.rows ?? []).map(r => ({
                field: String(r.Field ?? ''),
                definition: String(r['Role / Definition'] ?? ''),
                type: String(r.Type ?? ''),
                unit: String(r.Unit ?? ''),
                authority: String(r.Authority ?? '')
              }))
            )
          )
          .catch(() => undefined);
      })
      .catch(() => undefined);
  }, []);

  // Deep link: ?row=&col= selects and scrolls to a cell (lineage "view source" links).
  useEffect(() => {
    if (!router.isReady || !detail) return;
    const { row, col } = router.query as Record<string, string>;
    if (row !== undefined) {
      const rowIndex = Number(row);
      const column = col || detail.columns[0]?.key;
      setSel({ row: rowIndex, col: column });
      setTimeout(() => {
        document.getElementById(`cell-${rowIndex}-${column}`)?.scrollIntoView({ block: 'center', inline: 'center' });
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, detail === null]);

  // Rows keep their absolute index through search filtering — edits address the real row.
  const visibleRows = useMemo(() => {
    if (!detail) return [];
    const indexed = detail.rows.map((data, index) => ({ data, index }));
    if (!search.trim()) return indexed;
    const q = search.toLowerCase();
    return indexed.filter(({ data }) =>
      Object.values(data).some(v =>
        String(v ?? '')
          .toLowerCase()
          .includes(q)
      )
    );
  }, [detail, search]);

  const cellValue = (rowIndex: number, column: string): string => {
    const pending = edits[`${rowIndex}|${column}`];
    if (pending !== undefined) return pending;
    const raw = detail?.rows[rowIndex]?.[column];
    return raw === null || raw === undefined ? '' : String(raw);
  };

  function select(rowIndex: number, column: string) {
    setSel({ row: rowIndex, col: column });
    setDraft(cellValue(rowIndex, column));
  }

  function commitDraft() {
    if (!sel) return;
    const current = cellValue(sel.row, sel.col);
    if (draft === current) return;
    setEdits(prev => ({ ...prev, [`${sel.row}|${sel.col}`]: draft }));
  }

  async function saveEdits() {
    if (!detail || !id) return;
    const numericColumns = new Set(detail.columns.filter(c => c.type === 'number').map(c => c.key));
    const payload = Object.entries(edits).map(([key, value]) => {
      const [rowIndex, column] = [Number(key.split('|')[0]), key.split('|').slice(1).join('|')];
      const trimmed = value.trim();
      const numeric = numericColumns.has(column) && trimmed !== '' && !isNaN(Number(trimmed));
      return { rowIndex, column, value: trimmed === '' ? null : numeric ? Number(trimmed) : value };
    });
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/factor-databases/${id}/cells`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ edits: payload })
      });
      const body: CellEditResponse & { error?: string } = await res.json();
      if (!res.ok) throw new Error(body.error || 'Save failed');
      message.success(
        body.versionAfter !== body.versionBefore
          ? `Saved ${payload.length} cell${payload.length === 1 ? '' : 's'} — version ${body.versionBefore} → ${body.versionAfter}, snapshot cut`
          : `Saved ${payload.length} cell${payload.length === 1 ? '' : 's'} (reference data — version unchanged)`
      );
      setEdits({});
      load(id);
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function downloadCsv() {
    if (!detail) return;
    const csv = Papa.unparse({
      fields: detail.columns.map(c => c.key),
      data: detail.rows.map(r => detail.columns.map(c => r[c.key]))
    });
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${detail.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (error) return <Alert type='error' showIcon message='Could not load that database' description={error} />;
  if (!detail) return <Spin style={{ display: 'block', margin: '80px auto' }} />;

  const editCount = Object.keys(edits).length;
  const selKeyValue =
    sel && detail.keyColumn
      ? detail.keyColumn
          .split(',')
          .map(k => String(detail.rows[sel.row]?.[k.trim()] ?? ''))
          .filter(Boolean)
          .join(' · ')
      : null;
  const dictEntry = sel
    ? dictionary.find(d => {
        const field = normalizeKey(d.field);
        const col = normalizeKey(sel.col);
        return field === col || col.startsWith(field) || field.startsWith(col);
      })
    : null;
  const usage = sel ? MODEL_USAGE[sel.col] : null;
  const usedFamilies = COLUMN_FAMILIES.filter(f => detail.columns.some(c => f.test.test(c.key)));

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <Link href='/admin/data-science/databases' style={{ fontSize: 12 }}>
            <ArrowLeftOutlined /> Databases
          </Link>
          <Title level={3} style={{ margin: '2px 0 0' }}>
            {detail.name}{' '}
            <Tag color={detail.version ? 'green' : undefined} style={{ verticalAlign: 'middle' }}>
              v{detail.version}
            </Tag>
          </Title>
          <Text type='secondary' style={{ fontSize: 12 }}>
            {detail.columns.length} columns × {detail.rows.length.toLocaleString()} rows
            {detail.keyColumn ? ` · key: ${detail.keyColumn}` : ''}
            {detail.sourceName ? ` · source: ${detail.sourceName}` : ''}
          </Text>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button icon={<DownloadOutlined />} onClick={downloadCsv}>
            CSV
          </Button>
          <Button icon={<UploadOutlined />} href='/admin/data-science/databases/workbook-upload'>
            Workbook upload
          </Button>
          <Button
            type='primary'
            icon={<SaveOutlined />}
            disabled={editCount === 0}
            loading={saving}
            onClick={saveEdits}
          >
            Save {editCount || ''} {editCount === 1 ? 'edit' : 'edits'}
          </Button>
        </div>
      </div>

      {/* formula bar + inspector */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          padding: '6px 8px',
          background: 'white',
          border: '1px solid #e3e3e0',
          borderRadius: 6,
          marginBottom: 8
        }}
      >
        <Text code style={{ whiteSpace: 'nowrap' }}>
          {sel ? `${sel.col} @ row ${sel.row + 1}${selKeyValue ? ` (${selKeyValue})` : ''}` : 'no cell selected'}
        </Text>
        <Input
          size='small'
          placeholder='Select a cell to view or edit its value'
          disabled={!sel}
          value={sel ? draft : ''}
          onChange={e => setDraft(e.target.value)}
          onBlur={commitDraft}
          onPressEnter={commitDraft}
          style={{ fontFamily: 'monospace' }}
        />
        <Input.Search
          size='small'
          placeholder='Search rows…'
          allowClear
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 220 }}
        />
      </div>

      {sel && (dictEntry || usage) && (
        <Alert
          type='info'
          style={{ marginBottom: 8, padding: '6px 12px' }}
          message={
            <div style={{ fontSize: 12 }}>
              {dictEntry && (
                <div>
                  <Text strong>{sel.col}</Text> — {dictEntry.definition}
                  {dictEntry.unit && dictEntry.unit !== 'none' ? ` (${dictEntry.unit})` : ''} ·{' '}
                  <Tag style={{ fontSize: 11 }}>{dictEntry.authority}</Tag>
                </div>
              )}
              {usage && (
                <div>
                  <Text type='secondary'>In the model:</Text>{' '}
                  <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>{usage}</Text>
                </div>
              )}
            </div>
          }
        />
      )}

      <GridScroll>
        <Grid>
          <thead>
            <tr>
              <th className='rownum'>#</th>
              {detail.columns.map(col => {
                const family = columnFamily(col.key);
                return (
                  <th key={col.key} style={family ? { color: family.color, background: family.bg } : undefined}>
                    {col.label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map(({ data, index }) => (
              <tr key={index}>
                <td className='rownum'>{index + 1}</td>
                {detail.columns.map(col => {
                  const family = columnFamily(col.key);
                  const pendingKey = `${index}|${col.key}`;
                  const isSel = sel?.row === index && sel?.col === col.key;
                  const value = edits[pendingKey] !== undefined ? edits[pendingKey] : data[col.key];
                  const classes = [
                    col.type === 'number' ? 'num' : '',
                    isSel ? 'selected' : '',
                    edits[pendingKey] !== undefined ? 'edited' : ''
                  ]
                    .filter(Boolean)
                    .join(' ');
                  return (
                    <td
                      key={col.key}
                      id={`cell-${index}-${col.key}`}
                      className={classes || undefined}
                      style={family ? { background: family.bg } : undefined}
                      title={value === null || value === undefined ? '' : String(value)} // raw value on hover
                      onClick={() => select(index, col.key)}
                    >
                      {value === null || value === undefined || value === '' ? (
                        <Text type='secondary'>—</Text>
                      ) : (
                        displayValue(value)
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </Grid>
      </GridScroll>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
        <Text type='secondary' style={{ fontSize: 12 }}>
          {visibleRows.length.toLocaleString()} of {detail.rows.length.toLocaleString()} rows
        </Text>
        {usedFamilies.map(f => (
          <Tag key={f.label} style={{ background: f.bg, color: f.color, borderColor: f.bg, fontSize: 11 }}>
            {f.label}
          </Tag>
        ))}
        {editCount > 0 && (
          <Text type='warning' style={{ fontSize: 12 }}>
            {editCount} unsaved {editCount === 1 ? 'edit' : 'edits'} (amber cells) — Save writes them as one change
          </Text>
        )}
      </div>

      {detail.changes.length > 0 && (
        <details style={{ marginTop: 12 }}>
          <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            Version history ({detail.changes.length})
          </summary>
          <ul style={{ fontSize: 12, color: 'rgba(0,0,0,0.55)', marginTop: 8 }}>
            {detail.changes.map(c => (
              <li key={c.id}>
                {new Date(c.createdAt).toLocaleString()} — {c.action}
                {c.versionBefore && c.versionBefore !== c.versionAfter
                  ? ` (${c.versionBefore} → ${c.versionAfter})`
                  : ` (v${c.versionAfter})`}
                {c.rowsAdded ? ` +${c.rowsAdded}` : ''}
                {c.rowsUpdated ? ` ~${c.rowsUpdated}` : ''}
                {c.rowsRemoved ? ` −${c.rowsRemoved}` : ''}
                {c.sourceNote ? ` · ${c.sourceNote}` : ''}
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}

DatabaseSpreadsheetPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => (
  <AdminLayout {...(pageProps as any)} selectedMenuItem='data-science/databases' title='Database'>
    {page}
  </AdminLayout>
);
