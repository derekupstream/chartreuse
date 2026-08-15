/**
 * Workbook upload — the flow Madhavi actually works in: upload the whole spreadsheet, see
 * exactly what each sheet would change in its database, and choose which sheets and which
 * columns to apply.
 *
 * The analysis is deterministic (lib/admin/diffWorkbookSheet): rows match on the database's
 * key column; every changed value is shown before → after. Nothing applies until chosen.
 * Applying runs the existing merge machinery, so the changelog, kind-aware version policy,
 * and automatic methodology snapshots all hold — an applied factors change cuts a snapshot
 * by itself.
 */
import { CheckCircleFilled, InboxOutlined, UploadOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Collapse,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  Upload,
  message
} from 'antd';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useState } from 'react';
import * as XLSX from 'xlsx';

import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { diffWorkbookSheet, repairSwappedScopeColumns } from 'lib/admin/diffWorkbookSheet';
import type { SheetDiff } from 'lib/admin/diffWorkbookSheet';
import { getUserFromContext } from 'lib/middleware';
import { ACCESS_DENIED_REDIRECT, checkIsUpstream } from 'lib/middleware/requireUpstream';
import { serializeJSON } from 'lib/objects';
import type { PageProps } from 'pages/_app';
import type { FactorDatabaseSummary } from 'pages/api/admin/factor-databases/index';

const { Title, Text, Paragraph } = Typography;

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return ACCESS_DENIED_REDIRECT;
  if (!(await checkIsUpstream(user.org.id))) return ACCESS_DENIED_REDIRECT;
  return { props: serializeJSON({ user }) };
};

/** Workbook tab names → database names (the loader's mapping, kept in one place here). */
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

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

type ParsedSheet = {
  tabName: string;
  columns: string[];
  rows: Record<string, unknown>[];
};

type SheetPlan = {
  headerRepaired?: boolean;
  sheet: ParsedSheet;
  databaseName: string | null; // null = skip
  diff: SheetDiff | null;
  apply: boolean;
  /** Changed columns the admin chose to write (added rows always write all columns) */
  applyColumns: string[];
  keyColumn: string | null;
  applied?: { version: string; versionBefore: string | null; added: number; updated: number };
};

/** Header row = the row in the first ten with the most non-empty text cells. */
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

function parseWorkbook(buffer: ArrayBuffer): ParsedSheet[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  return workbook.SheetNames.map(tabName => {
    const grid = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[tabName], { header: 1, defval: null });
    if (!grid.length) return { tabName, columns: [], rows: [] };
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
    return { tabName, columns: headers.filter(Boolean), rows };
  });
}

export default function WorkbookUploadPage(_: { user: DashboardUser }) {
  const [databases, setDatabases] = useState<FactorDatabaseSummary[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [plans, setPlans] = useState<SheetPlan[] | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [applying, setApplying] = useState(false);

  async function loadDatabases(): Promise<FactorDatabaseSummary[]> {
    if (databases) return databases;
    const res = await fetch('/api/admin/factor-databases');
    const list = res.ok ? await res.json() : [];
    setDatabases(list);
    return list;
  }

  async function analyzeSheet(
    sheet: ParsedSheet,
    databaseName: string | null,
    list: FactorDatabaseSummary[]
  ): Promise<Pick<SheetPlan, 'diff' | 'keyColumn' | 'applyColumns' | 'apply' | 'headerRepaired'>> {
    if (!databaseName) return { diff: null, keyColumn: null, applyColumns: [], apply: false, headerRepaired: false };
    const summary = list.find(d => d.name === databaseName);
    if (!summary) return { diff: null, keyColumn: null, applyColumns: [], apply: false, headerRepaired: false };
    const detail = await fetch(`/api/admin/factor-databases/${summary.id}`).then(r => r.json());
    const keyColumn: string = detail.keyColumn || detail.columns?.[0]?.key || sheet.columns[0];
    // Known workbook quirk: GHG_Factors' material/scope headers are swapped (feedback #6).
    const repair = repairSwappedScopeColumns(sheet.rows);
    if (repair.repaired) sheet.rows = repair.rows;
    const diff = diffWorkbookSheet(
      detail.rows ?? [],
      (detail.columns ?? []).map((c: { key: string }) => c.key),
      sheet.rows,
      keyColumn
    );
    const changed = [...diff.changedColumns, ...diff.newColumns];
    return {
      diff,
      keyColumn,
      applyColumns: changed,
      apply: diff.addedRows.length > 0 || diff.changedRows.length > 0,
      headerRepaired: repair.repaired
    };
  }

  async function handleFile(file: File) {
    setAnalyzing(true);
    setPlans(null);
    setFileName(file.name);
    try {
      const buffer = await file.arrayBuffer();
      const sheets = parseWorkbook(buffer).filter(s => s.rows.length > 0);
      const list = await loadDatabases();

      const nextPlans: SheetPlan[] = [];
      for (const sheet of sheets) {
        const mapped =
          TAB_TO_DATABASE[normalize(sheet.tabName)] ??
          list.find(d => normalize(d.name) === normalize(sheet.tabName))?.name ??
          null;
        const analysis = await analyzeSheet(sheet, mapped, list);
        nextPlans.push({ sheet, databaseName: mapped, ...analysis });
      }
      setPlans(nextPlans);
    } catch (err) {
      message.error(`Could not read that workbook: ${(err as Error).message}`);
    } finally {
      setAnalyzing(false);
    }
    return false;
  }

  async function remap(index: number, databaseName: string | null) {
    const list = await loadDatabases();
    setPlans(prev => prev && prev.map((p, i) => (i === index ? { ...p, databaseName, applied: undefined } : p)));
    const plan = plans?.[index];
    if (!plan) return;
    const analysis = await analyzeSheet(plan.sheet, databaseName, list);
    setPlans(prev => prev && prev.map((p, i) => (i === index ? { ...p, databaseName, ...analysis } : p)));
  }

  async function applySelected() {
    if (!plans) return;
    setApplying(true);
    try {
      const next = [...plans];
      for (let i = 0; i < next.length; i++) {
        const plan = next[i];
        if (!plan.apply || !plan.databaseName || !plan.diff || plan.applied) continue;
        const allChanged = [...plan.diff.changedColumns, ...plan.diff.newColumns];
        const restrict = plan.applyColumns.length < allChanged.length;
        const res = await fetch('/api/admin/factor-databases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: plan.databaseName,
            sourceName: `${fileName} — ${plan.sheet.tabName}`,
            keyColumn: plan.keyColumn,
            columns: plan.sheet.columns.map(key => ({ key, label: key, type: 'text' })),
            rows: plan.sheet.rows,
            mergeMode: 'upsert',
            // Restrict writes only when the admin deselected columns; otherwise write all
            // uploaded columns so added rows arrive complete.
            ...(restrict ? { mergeColumns: [...plan.applyColumns, plan.keyColumn!] } : {})
          })
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || `Applying ${plan.sheet.tabName} failed`);
        next[i] = {
          ...plan,
          applied: {
            version: result.version,
            versionBefore: result.versionBefore,
            added: result.added,
            updated: result.updated
          }
        };
        setPlans([...next]);
      }
      message.success('Selected sheets applied — every change is in the version history.');
    } catch (err) {
      message.error((err as Error).message);
    } finally {
      setApplying(false);
    }
  }

  const selectable = plans?.filter(p => p.databaseName && p.diff && !p.applied) ?? [];
  const selectedCount = selectable.filter(p => p.apply).length;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div>
          <Title level={2} style={{ marginBottom: 0 }}>
            Workbook upload
          </Title>
          <Paragraph type='secondary' style={{ maxWidth: 720 }}>
            Upload a whole spreadsheet. Each sheet is compared against its database — new rows, changed values (before →
            after), new columns — and nothing is written until you choose what to apply. Applied changes land in the
            version history; factor changes cut a methodology snapshot automatically.
          </Paragraph>
        </div>
        <Link href='/admin/data-science/databases'>
          <Button>Back to Databases</Button>
        </Link>
      </div>

      <Upload.Dragger accept='.xlsx,.xls' beforeUpload={handleFile as never} showUploadList={false} maxCount={1}>
        <p style={{ margin: 8 }}>
          <InboxOutlined style={{ fontSize: 28, color: '#1f7a4d' }} />
        </p>
        <p style={{ margin: 0 }}>Drop the workbook here, or click to choose it</p>
        <Text type='secondary' style={{ fontSize: 12 }}>
          Sheets are matched to databases by tab name; you can remap or skip any sheet before applying.
        </Text>
      </Upload.Dragger>

      {analyzing && <Spin style={{ display: 'block', margin: '40px auto' }} tip='Analyzing sheets…' />}

      {plans && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0' }}>
            <Text strong>
              {fileName}: {plans.length} sheet(s) with data · {selectedCount} selected to apply
            </Text>
            <Button
              type='primary'
              icon={<UploadOutlined />}
              onClick={applySelected}
              loading={applying}
              disabled={selectedCount === 0}
            >
              Apply {selectedCount} selected sheet(s)
            </Button>
          </div>

          <Space direction='vertical' size={12} style={{ width: '100%' }}>
            {plans.map((plan, index) => {
              const diff = plan.diff;
              const changeCount = diff ? diff.addedRows.length + diff.changedRows.length : 0;
              return (
                <Card
                  key={plan.sheet.tabName}
                  size='small'
                  title={
                    <Space>
                      {plan.databaseName && diff && !plan.applied && (
                        <Checkbox
                          checked={plan.apply}
                          disabled={changeCount === 0}
                          onChange={e =>
                            setPlans(
                              prev => prev && prev.map((p, i) => (i === index ? { ...p, apply: e.target.checked } : p))
                            )
                          }
                        />
                      )}
                      <Text strong>{plan.sheet.tabName}</Text>
                      <Text type='secondary' style={{ fontWeight: 400 }}>
                        {plan.sheet.rows.length} rows
                      </Text>
                    </Space>
                  }
                  extra={
                    <Space>
                      <Text type='secondary' style={{ fontSize: 12 }}>
                        applies to
                      </Text>
                      <Select
                        size='small'
                        style={{ width: 220 }}
                        placeholder='Skip this sheet'
                        allowClear
                        value={plan.databaseName ?? undefined}
                        options={(databases ?? []).map(d => ({ value: d.name, label: `${d.name} (v${d.version})` }))}
                        onChange={v => remap(index, v ?? null)}
                      />
                    </Space>
                  }
                >
                  {plan.applied ? (
                    <Alert
                      type='success'
                      showIcon
                      icon={<CheckCircleFilled />}
                      message={`Applied — ${plan.applied.added} added, ${plan.applied.updated} updated · version ${
                        plan.applied.versionBefore ? `${plan.applied.versionBefore} → ` : ''
                      }${plan.applied.version}`}
                    />
                  ) : !plan.databaseName ? (
                    <Text type='secondary'>
                      No matching database — pick one above to include this sheet, or leave it skipped.
                    </Text>
                  ) : !diff ? (
                    <Spin size='small' />
                  ) : (
                    <>
                      <Space size={[6, 6]} wrap style={{ marginBottom: changeCount ? 10 : 0 }}>
                        <Tag color={diff.addedRows.length ? 'green' : 'default'}>{diff.addedRows.length} new rows</Tag>
                        <Tag color={diff.changedRows.length ? 'orange' : 'default'}>
                          {diff.changedRows.length} changed rows
                        </Tag>
                        <Tag>{diff.unchangedCount} unchanged</Tag>
                        {diff.newColumns.length > 0 && <Tag color='purple'>{diff.newColumns.length} new columns</Tag>}
                        {diff.missingKeys.length > 0 && (
                          <Tag color='default'>{diff.missingKeys.length} rows not in upload (kept)</Tag>
                        )}
                        {diff.keylessRows > 0 && <Tag color='red'>{diff.keylessRows} rows missing a key (ignored)</Tag>}
                        {plan.headerRepaired && (
                          <Tag color='blue'>header repair: material ↔ scope (mislabeled in sheet)</Tag>
                        )}
                      </Space>

                      {changeCount === 0 && <Text type='secondary'>Identical to the database — nothing to apply.</Text>}

                      {(diff.changedColumns.length > 0 || diff.newColumns.length > 0) && (
                        <div style={{ marginBottom: 8 }}>
                          <Text type='secondary' style={{ fontSize: 12, marginRight: 8 }}>
                            Columns to update:
                          </Text>
                          <Checkbox.Group
                            options={[...diff.changedColumns, ...diff.newColumns]}
                            value={plan.applyColumns}
                            onChange={values =>
                              setPlans(
                                prev =>
                                  prev &&
                                  prev.map((p, i) => (i === index ? { ...p, applyColumns: values as string[] } : p))
                              )
                            }
                          />
                        </div>
                      )}

                      {diff.changedRows.length > 0 && (
                        <Collapse
                          ghost
                          items={[
                            {
                              key: 'changes',
                              label: `Review ${diff.changedRows.length} changed row(s)`,
                              children: (
                                <Table
                                  size='small'
                                  rowKey={(r: { key: string; column: string }) => `${r.key}-${r.column}`}
                                  pagination={{ pageSize: 10, hideOnSinglePage: true }}
                                  dataSource={diff.changedRows.flatMap(row =>
                                    row.fields.map(field => ({
                                      key: row.key,
                                      column: field.column,
                                      before: field.before,
                                      after: field.after
                                    }))
                                  )}
                                  columns={[
                                    { title: plan.keyColumn ?? 'Row', dataIndex: 'key', width: 170, ellipsis: true },
                                    {
                                      title: 'Column',
                                      dataIndex: 'column',
                                      width: 180,
                                      render: (v: string) => <code>{v}</code>
                                    },
                                    {
                                      title: 'Before',
                                      dataIndex: 'before',
                                      render: (v: unknown) => (
                                        <Text delete type='secondary'>
                                          {String(v ?? '—')}
                                        </Text>
                                      )
                                    },
                                    {
                                      title: 'After',
                                      dataIndex: 'after',
                                      render: (v: unknown) => <Text strong>{String(v ?? '—')}</Text>
                                    }
                                  ]}
                                />
                              )
                            }
                          ]}
                        />
                      )}
                    </>
                  )}
                </Card>
              );
            })}
          </Space>
        </>
      )}
    </>
  );
}

WorkbookUploadPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => (
  <AdminLayout {...(pageProps as any)} selectedMenuItem='data-science/databases' title='Workbook upload'>
    {page}
  </AdminLayout>
);
