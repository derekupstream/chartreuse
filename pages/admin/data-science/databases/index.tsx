import { DatabaseOutlined, DeleteOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Input,
  Modal,
  Popconfirm,
  Radio,
  Select,
  Table,
  Tag,
  Typography,
  Upload,
  message
} from 'antd';
import type { GetServerSideProps } from 'next';
import Papa from 'papaparse';
import { useEffect, useMemo, useState } from 'react';

import { HowTo } from 'components/admin/HowTo';
import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { getUserFromContext } from 'lib/middleware';
import { ACCESS_DENIED_REDIRECT, checkIsUpstream } from 'lib/middleware/requireUpstream';
import { serializeJSON } from 'lib/objects';
import type { DatabaseColumn, FactorDatabaseSummary } from 'pages/api/admin/factor-databases/index';
import type { FactorDatabaseDetail } from 'pages/api/admin/factor-databases/[id]';
import { extractMaterialFactors, guessFactorColumns } from 'lib/admin/extractMaterialFactors';
import type { ExtractionResult } from 'lib/admin/extractMaterialFactors';

const { Text, Title } = Typography;

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return ACCESS_DENIED_REDIRECT;
  if (!(await checkIsUpstream(user.org.id))) return ACCESS_DENIED_REDIRECT;
  return { props: serializeJSON({ user }) };
};

const isNumericish = (v: unknown) =>
  typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v.replace(/[$,%]/g, '')));

export default function FactorDatabasesPage({ user }: { user: DashboardUser }) {
  const [databases, setDatabases] = useState<FactorDatabaseSummary[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<FactorDatabaseDetail | null>(null);
  const [search, setSearch] = useState('');

  // upload state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [parsed, setParsed] = useState<{ columns: DatabaseColumn[]; rows: Record<string, string>[] } | null>(null);
  const [form, setForm] = useState({ name: '', description: '', sourceName: '', keyColumn: '' });
  const [saving, setSaving] = useState(false);
  // factors carried on product rows
  const [factorCols, setFactorCols] = useState<{ materialColumn?: string; ghgColumn?: string; waterColumn?: string }>(
    {}
  );
  const [applyFactors, setApplyFactors] = useState(false);
  const [factorTarget, setFactorTarget] = useState('Single-Use Material Factors');
  // what to write from this upload
  const [mergeMode, setMergeMode] = useState<'replace' | 'update' | 'add' | 'upsert'>('upsert');
  const [mergeColumns, setMergeColumns] = useState<string[]>([]);

  async function load() {
    const res = await fetch('/api/admin/factor-databases');
    setDatabases(res.ok ? await res.json() : []);
  }
  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!openId) {
      setDetail(null);
      return;
    }
    setDetail(null);
    setSearch('');
    fetch(`/api/admin/factor-databases/${openId}`)
      .then(r => r.json())
      .then(setDetail)
      .catch(() => message.error('Could not load that database'));
  }, [openId]);

  function handleFile(file: File) {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: result => {
        const rows = result.data.filter(r => Object.values(r).some(v => (v ?? '').toString().trim() !== ''));
        if (!rows.length) {
          message.error('No rows found in that file');
          return;
        }
        const headers = Object.keys(rows[0]).filter(h => h.trim() !== '');
        const columns: DatabaseColumn[] = headers.map(h => ({
          key: h,
          label: h,
          type: rows.some(r => isNumericish(r[h])) ? 'number' : 'text'
        }));
        setParsed({ columns, rows });
        setForm(f => ({
          ...f,
          name: f.name || file.name.replace(/\.[^.]+$/, ''),
          sourceName: f.sourceName || file.name,
          keyColumn: f.keyColumn || headers[0]
        }));
        setMergeColumns([]);
        const guessed = guessFactorColumns(headers);
        setFactorCols(guessed);
        setApplyFactors(!!(guessed.materialColumn && (guessed.ghgColumn || guessed.waterColumn)));
      },
      error: () => message.error('Could not read that file')
    });
    return false;
  }

  async function save(replaceExisting = false) {
    if (!parsed || !form.name.trim()) {
      message.warning('A name and a file are required');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/factor-databases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          columns: parsed.columns,
          rows: parsed.rows,
          replaceExisting,
          mergeMode,
          mergeColumns
        })
      });
      if (res.status === 409 && mergeMode === 'replace') {
        setSaving(false);
        Modal.confirm({
          title: 'That database already exists',
          content: `Replace all rows in "${form.name}" with this file? Its previous rows will be removed.`,
          okText: 'Replace rows',
          onOk: () => save(true)
        });
        return;
      }
      if (!res.ok) throw new Error((await res.json()).error || 'Upload failed');
      const result = await res.json();
      if (result.mergeMode === 'replace') {
        message.success(`${result.replaced ? 'Replaced' : 'Created'} "${result.name}" — ${result.rowCount} rows`);
      } else {
        const parts = [
          result.updated ? `${result.updated} updated` : null,
          result.added ? `${result.added} added` : null,
          result.untouched ? `${result.untouched} left alone` : null,
          result.unmatched ? `${result.unmatched} matched nothing` : null
        ].filter(Boolean);
        message.success(`"${result.name}" — ${parts.join(', ') || 'no changes'}`);
      }

      // Optionally write the material factors carried on the product rows into
      // their own table. Only materials whose rows agreed are written.
      if (applyFactors && extraction) {
        const usable = extraction.materials.filter(m => !m.hasConflict && (m.ghg !== null || m.water !== null));
        if (usable.length) {
          const factorRes = await fetch('/api/admin/factor-databases', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: factorTarget,
              description: `Material factors extracted from "${form.name}".`,
              sourceName: form.sourceName || form.name,
              keyColumn: 'name',
              replaceExisting: true,
              columns: [
                { key: 'name', label: 'Material', type: 'text' },
                { key: 'mtco2ePerLb', label: 'GHG (MTCO2e/lb)', type: 'number' },
                { key: 'waterUsageGalPerLb', label: 'Water (gal/lb)', type: 'number' },
                { key: 'productRows', label: 'Product rows referencing it', type: 'number' }
              ],
              rows: usable.map(m => ({
                name: m.material,
                mtco2ePerLb: m.ghg,
                waterUsageGalPerLb: m.water,
                productRows: m.rowCount
              }))
            })
          });
          if (factorRes.ok) {
            message.success(`Updated "${factorTarget}" with ${usable.length} materials`);
          } else {
            message.warning('The product table saved, but the material factors could not be updated');
          }
        }
        if (extraction.conflictCount > 0) {
          message.warning(
            `${extraction.conflictCount} material${extraction.conflictCount === 1 ? '' : 's'} had conflicting factor values and were left out — resolve them in the source file`
          );
        }
      }
      setUploadOpen(false);
      setParsed(null);
      setForm({ name: '', description: '', sourceName: '', keyColumn: '' });
      load();
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string, name: string) {
    const res = await fetch(`/api/admin/factor-databases/${id}`, { method: 'DELETE' });
    if (res.ok) {
      message.success(`Deleted "${name}"`);
      if (openId === id) setOpenId(null);
      load();
    } else {
      message.error('Could not delete that database');
    }
  }

  function downloadCsv(d: FactorDatabaseDetail) {
    const csv = Papa.unparse({
      fields: d.columns.map(c => c.key),
      data: d.rows.map(r => d.columns.map(c => r[c.key]))
    });
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${d.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const extraction: ExtractionResult | null = useMemo(() => {
    if (!parsed || !factorCols.materialColumn) return null;
    if (!factorCols.ghgColumn && !factorCols.waterColumn) return null;
    return extractMaterialFactors(parsed.rows, {
      materialColumn: factorCols.materialColumn,
      ghgColumn: factorCols.ghgColumn,
      waterColumn: factorCols.waterColumn
    });
  }, [parsed, factorCols]);

  const filteredRows = useMemo(() => {
    if (!detail) return [];
    if (!search.trim()) return detail.rows;
    const q = search.toLowerCase();
    return detail.rows.filter(r =>
      Object.values(r).some(v =>
        String(v ?? '')
          .toLowerCase()
          .includes(q)
      )
    );
  }, [detail, search]);

  return (
    <AdminLayout title='Databases' selectedMenuItem='data-science/databases' user={user}>
      <HowTo tool='databases' />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            <DatabaseOutlined /> Databases
          </Title>
          <Text type='secondary'>
            Reference tables kept in their own column structure — product catalogs, material factors, utility rates.
          </Text>
        </div>
        <Button type='primary' icon={<UploadOutlined />} onClick={() => setUploadOpen(true)}>
          Upload a database
        </Button>
      </div>

      <Alert
        type='info'
        showIcon
        style={{ marginBottom: 16 }}
        message='Databases vs Factors'
        description={
          <>
            A <strong>Factor</strong> holds one number (a single emission factor). A <strong>Database</strong> holds a
            whole table with its own columns and rows — the way these datasets are organised outside the app. Upload a
            CSV and it keeps its structure instead of being flattened into hundreds of separate factors.
          </>
        }
      />

      <Table
        rowKey='id'
        loading={databases === null}
        dataSource={databases ?? []}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
        columns={[
          {
            title: 'Database',
            dataIndex: 'name',
            render: (name: string, row: FactorDatabaseSummary) => (
              <div>
                <a onClick={() => setOpenId(row.id)}>
                  <strong>{name}</strong>
                </a>
                {row.description && (
                  <div>
                    <Text type='secondary' style={{ fontSize: 12 }}>
                      {row.description}
                    </Text>
                  </div>
                )}
              </div>
            )
          },
          {
            title: 'Size',
            key: 'size',
            width: 150,
            render: (_: unknown, row: FactorDatabaseSummary) => (
              <Text type='secondary'>
                {row.columnCount} cols × {row.rowCount.toLocaleString()} rows
              </Text>
            )
          },
          {
            title: 'Source',
            dataIndex: 'sourceName',
            width: 260,
            render: (v: string | null, row: FactorDatabaseSummary) =>
              v ? (
                row.sourceUrl ? (
                  <a href={row.sourceUrl} target='_blank' rel='noreferrer'>
                    {v}
                  </a>
                ) : (
                  <Text type='secondary'>{v}</Text>
                )
              ) : (
                <Tag>not recorded</Tag>
              )
          },
          { title: 'Version', dataIndex: 'version', width: 90 },
          {
            title: '',
            key: 'actions',
            width: 110,
            render: (_: unknown, row: FactorDatabaseSummary) => (
              <>
                <Button size='small' onClick={() => setOpenId(row.id)}>
                  Open
                </Button>
                <Popconfirm title={`Delete "${row.name}"?`} onConfirm={() => remove(row.id, row.name)} okText='Delete'>
                  <Button size='small' type='text' danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </>
            )
          }
        ]}
      />

      {/* ── view one database as a table ─────────────────────────────── */}
      <Modal
        open={!!openId}
        onCancel={() => setOpenId(null)}
        width='95vw'
        style={{ top: 20 }}
        footer={null}
        title={detail ? `${detail.name} — ${detail.columns.length} columns × ${detail.rows.length} rows` : 'Loading…'}
      >
        {detail && (
          <>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
              <Input.Search
                placeholder='Search every column…'
                allowClear
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ maxWidth: 320 }}
              />
              <Text type='secondary'>
                {filteredRows.length.toLocaleString()} of {detail.rows.length.toLocaleString()} rows
              </Text>
              <Button icon={<DownloadOutlined />} onClick={() => downloadCsv(detail)} style={{ marginLeft: 'auto' }}>
                Download CSV
              </Button>
            </div>
            {detail.sourceName && (
              <Text type='secondary' style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
                Source: {detail.sourceName}
                {detail.keyColumn ? ` · key column: ${detail.keyColumn}` : ''}
              </Text>
            )}
            <Table
              size='small'
              bordered
              sticky
              rowKey={(_r, i) => String(i)}
              dataSource={filteredRows}
              pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '25', '50', '100'] }}
              scroll={{ x: 'max-content' }}
              columns={detail.columns.map(col => ({
                title: col.label,
                dataIndex: col.key,
                width: 150,
                align: col.type === 'number' ? ('right' as const) : ('left' as const),
                render: (v: unknown) => (v === null || v === '' ? <Text type='secondary'>—</Text> : String(v))
              }))}
            />
          </>
        )}
      </Modal>

      {/* ── upload ───────────────────────────────────────────────────── */}
      <Modal
        open={uploadOpen}
        title='Upload a database'
        onCancel={() => setUploadOpen(false)}
        onOk={() => save(false)}
        okText={parsed ? `Save ${parsed.rows.length} rows` : 'Save'}
        okButtonProps={{ disabled: !parsed || !form.name.trim(), loading: saving }}
        width={700}
      >
        <Upload.Dragger accept='.csv,.tsv,.txt' beforeUpload={handleFile as any} showUploadList={false} maxCount={1}>
          <p style={{ margin: 0 }}>
            <UploadOutlined /> Drop a CSV here, or click to choose one
          </p>
          <Text type='secondary' style={{ fontSize: 12 }}>
            The first row is used as column headers. Columns keep their names and order.
          </Text>
        </Upload.Dragger>

        {parsed && (
          <Card size='small' style={{ marginTop: 16 }}>
            <Text strong>
              Read {parsed.rows.length.toLocaleString()} rows and {parsed.columns.length} columns
            </Text>
            <div style={{ marginTop: 8, marginBottom: 12 }}>
              {parsed.columns.map(c => (
                <Tag key={c.key} color={c.type === 'number' ? 'blue' : undefined} style={{ marginBottom: 4 }}>
                  {c.label}
                </Tag>
              ))}
            </div>
            <Input
              placeholder='Database name (e.g. Single-Use Products)'
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              style={{ marginBottom: 8 }}
            />
            <Input
              placeholder='What is this table for?'
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              style={{ marginBottom: 8 }}
            />
            <Input
              placeholder='Source (e.g. EPA WARM 15, or the Drive filename)'
              value={form.sourceName}
              onChange={e => setForm({ ...form, sourceName: e.target.value })}
              style={{ marginBottom: 8 }}
            />
            <Select
              placeholder='Which column identifies a row?'
              value={form.keyColumn || undefined}
              onChange={v => setForm({ ...form, keyColumn: v })}
              style={{ width: '100%' }}
              options={parsed.columns.map(c => ({ value: c.key, label: c.label }))}
            />
          </Card>
        )}

        {parsed && (
          <Card size='small' style={{ marginTop: 16 }} title='What should this upload change?'>
            <Text type='secondary' style={{ display: 'block', marginBottom: 12 }}>
              A refresh usually touches part of a table. Rows are matched on{' '}
              <strong>{form.keyColumn || 'the key column'}</strong>; anything the file doesn&apos;t mention is left as
              it is.
            </Text>
            <Radio.Group
              value={mergeMode}
              onChange={e => setMergeMode(e.target.value)}
              style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}
            >
              <Radio value='upsert'>
                <strong>Update and add</strong> — change rows that exist, create ones that don&apos;t
              </Radio>
              <Radio value='update'>
                <strong>Update only</strong> — change existing rows, ignore anything new in the file
              </Radio>
              <Radio value='add'>
                <strong>Add only</strong> — create new rows, never touch existing ones
              </Radio>
              <Radio value='replace'>
                <strong>Replace everything</strong> — discard the current table and take this file wholesale
              </Radio>
            </Radio.Group>

            {mergeMode !== 'replace' && (
              <>
                <Text strong style={{ display: 'block', marginBottom: 4 }}>
                  Which columns should it write?
                </Text>
                <Select
                  mode='multiple'
                  allowClear
                  placeholder={`All ${parsed.columns.length} columns in the file`}
                  value={mergeColumns}
                  onChange={setMergeColumns}
                  style={{ width: '100%' }}
                  options={parsed.columns
                    .filter(c => c.key !== form.keyColumn)
                    .map(c => ({ value: c.key, label: c.label }))}
                />
                <Text type='secondary' style={{ fontSize: 12 }}>
                  {mergeColumns.length
                    ? `Only ${mergeColumns.length} column${mergeColumns.length === 1 ? '' : 's'} will be written; every other column keeps its current value.`
                    : 'Leave empty to write every column the file contains. Blank cells are treated as "no opinion" and never clear an existing value.'}
                </Text>
              </>
            )}
          </Card>
        )}

        {parsed && (
          <Card size='small' style={{ marginTop: 16 }} title='Material factors on these rows'>
            <Text type='secondary' style={{ display: 'block', marginBottom: 12 }}>
              Product tables often repeat each material&apos;s factors on every row. Point at those columns and the
              factors can be pulled out into their own table — grouped by material, with any disagreement flagged rather
              than guessed at.
            </Text>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              <Select
                allowClear
                placeholder='Material name column'
                value={factorCols.materialColumn}
                onChange={v => setFactorCols({ ...factorCols, materialColumn: v })}
                style={{ minWidth: 200, flex: 1 }}
                options={parsed.columns.map(c => ({ value: c.key, label: c.label }))}
              />
              <Select
                allowClear
                placeholder='GHG factor column'
                value={factorCols.ghgColumn}
                onChange={v => setFactorCols({ ...factorCols, ghgColumn: v })}
                style={{ minWidth: 180, flex: 1 }}
                options={parsed.columns.map(c => ({ value: c.key, label: c.label }))}
              />
              <Select
                allowClear
                placeholder='Water factor column'
                value={factorCols.waterColumn}
                onChange={v => setFactorCols({ ...factorCols, waterColumn: v })}
                style={{ minWidth: 180, flex: 1 }}
                options={parsed.columns.map(c => ({ value: c.key, label: c.label }))}
              />
            </div>

            {!extraction && (
              <Text type='secondary'>
                Pick a material column plus a GHG or water column to see what would be extracted.
              </Text>
            )}

            {extraction && (
              <>
                {extraction.conflictCount > 0 && (
                  <Alert
                    type='warning'
                    showIcon
                    style={{ marginBottom: 12 }}
                    message={`${extraction.conflictCount} material${extraction.conflictCount === 1 ? '' : 's'} disagree between rows`}
                    description='Rows for the same material carry different factor values, so one of them is wrong. Those materials are listed but will not be written — fix them in the source file and re-upload.'
                  />
                )}
                <Table
                  size='small'
                  bordered
                  rowKey='material'
                  dataSource={extraction.materials}
                  pagination={{ pageSize: 5, hideOnSinglePage: true }}
                  columns={[
                    { title: 'Material', dataIndex: 'material' },
                    {
                      title: 'GHG (MTCO2e/lb)',
                      dataIndex: 'ghg',
                      align: 'right' as const,
                      render: (v: number | null, row) =>
                        row.ghgConflicts.length ? (
                          <Text type='danger'>{row.ghgConflicts.join('  vs  ')}</Text>
                        ) : v === null ? (
                          <Text type='secondary'>—</Text>
                        ) : (
                          v
                        )
                    },
                    {
                      title: 'Water (gal/lb)',
                      dataIndex: 'water',
                      align: 'right' as const,
                      render: (v: number | null, row) =>
                        row.waterConflicts.length ? (
                          <Text type='danger'>{row.waterConflicts.join('  vs  ')}</Text>
                        ) : v === null ? (
                          <Text type='secondary'>—</Text>
                        ) : (
                          v
                        )
                    },
                    { title: 'Rows', dataIndex: 'rowCount', align: 'right' as const, width: 70 },
                    {
                      title: '',
                      key: 'status',
                      width: 90,
                      render: (_: unknown, row) =>
                        row.hasConflict ? <Tag color='red'>conflict</Tag> : <Tag color='green'>agrees</Tag>
                    }
                  ]}
                />
                <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Checkbox checked={applyFactors} onChange={e => setApplyFactors(e.target.checked)}>
                    Also update a material factors table
                  </Checkbox>
                  <Select
                    value={factorTarget}
                    onChange={setFactorTarget}
                    disabled={!applyFactors}
                    style={{ minWidth: 260 }}
                    options={[
                      { value: 'Single-Use Material Factors', label: 'Single-Use Material Factors' },
                      { value: 'Reusable Material Factors', label: 'Reusable Material Factors' }
                    ]}
                  />
                  <Text type='secondary' style={{ fontSize: 12 }}>
                    {extraction.materials.filter(m => !m.hasConflict).length} of {extraction.materials.length} materials
                    would be written
                  </Text>
                </div>
              </>
            )}
          </Card>
        )}
      </Modal>
    </AdminLayout>
  );
}
