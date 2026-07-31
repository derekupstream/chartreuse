import { DatabaseOutlined, DeleteOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Input, Modal, Popconfirm, Select, Table, Tag, Typography, Upload, message } from 'antd';
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
        body: JSON.stringify({ ...form, columns: parsed.columns, rows: parsed.rows, replaceExisting })
      });
      if (res.status === 409) {
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
      message.success(`${result.replaced ? 'Replaced' : 'Created'} "${result.name}" — ${result.rowCount} rows`);
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
      </Modal>
    </AdminLayout>
  );
}
