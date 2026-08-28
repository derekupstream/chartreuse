import {
  DatabaseOutlined,
  DeleteOutlined,
  DownOutlined,
  MoreOutlined,
  PaperClipOutlined,
  UploadOutlined
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Dropdown,
  Input,
  Modal,
  Popconfirm,
  Radio,
  Select,
  Spin,
  Table,
  Tag,
  Typography,
  Upload,
  message
} from 'antd';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import Papa from 'papaparse';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';

import { HowTo } from 'components/admin/HowTo';
import { LocalDate } from 'components/common/LocalDate';
import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { getUserFromContext } from 'lib/middleware';
import { ACCESS_DENIED_REDIRECT, checkIsUpstream } from 'lib/middleware/requireUpstream';
import { serializeJSON } from 'lib/objects';
import type { DataReleaseSummary } from 'pages/api/admin/data-releases/index';
import type { DatabaseColumn, FactorDatabaseSummary } from 'pages/api/admin/factor-databases/index';
import { extractMaterialFactors, guessFactorColumns } from 'lib/admin/extractMaterialFactors';
import { storeSourceFile } from 'lib/admin/storeSourceFile';
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
  const router = useRouter();
  const [databases, setDatabases] = useState<FactorDatabaseSummary[] | null>(null);

  // upload state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [parsed, setParsed] = useState<{ columns: DatabaseColumn[]; rows: Record<string, string>[] } | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    sourceName: '',
    keyColumn: '',
    version: '',
    kind: 'reference' as 'reference' | 'factors'
  });
  const [saving, setSaving] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  // collection versioning
  const [versionOpen, setVersionOpen] = useState(false);
  const [versionForm, setVersionForm] = useState({ name: '', note: '' });
  const [versionSaving, setVersionSaving] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [releases, setReleases] = useState<DataReleaseSummary[] | null>(null);
  const [restoreId, setRestoreId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  async function cutVersion() {
    if (!versionForm.name.trim()) {
      message.warning('Name the version — e.g. v2.1 or v3');
      return;
    }
    setVersionSaving(true);
    try {
      const res = await fetch('/api/admin/data-releases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: versionForm.name, note: versionForm.note || null })
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Could not cut the version');
      message.success(`${body.name} cut — ${body.databases} databases stored and stamped. Restorable any time.`);
      setVersionOpen(false);
      setVersionForm({ name: '', note: '' });
      load();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setVersionSaving(false);
    }
  }

  async function openRestore() {
    setRestoreOpen(true);
    setReleases(null);
    setRestoreId(null);
    const res = await fetch('/api/admin/data-releases');
    setReleases(res.ok ? await res.json() : []);
  }

  async function restoreVersion() {
    if (!restoreId) return;
    setRestoring(true);
    try {
      const res = await fetch(`/api/admin/data-releases/${restoreId}/restore`, { method: 'POST' });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Restore failed');
      message.success(`Restored ${body.name} — ${body.databases} databases returned to that state.`);
      setRestoreOpen(false);
      load();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setRestoring(false);
    }
  }
  // factors carried on product rows
  const [factorCols, setFactorCols] = useState<{ materialColumn?: string; ghgColumn?: string; waterColumn?: string }>(
    {}
  );
  const [applyFactors, setApplyFactors] = useState(false);
  const [factorTarget, setFactorTarget] = useState('Single-Use Material Factors');
  // what to write from this upload
  const [mergeMode, setMergeMode] = useState<'replace' | 'update' | 'add' | 'upsert'>('upsert');
  const [mergeColumns, setMergeColumns] = useState<string[]>([]);

  // The release the methodology currently stands at: the version shared by the factor tables.
  const dataRelease = (() => {
    const factorVersions = (databases ?? []).filter(d => d.kind === 'factors').map(d => d.version);
    if (!factorVersions.length) return null;
    const first = factorVersions[0];
    return factorVersions.every(v => v === first) ? first : `${first} (mixed)`;
  })();

  async function load() {
    const res = await fetch('/api/admin/factor-databases');
    setDatabases(res.ok ? await res.json() : []);
  }
  useEffect(() => {
    load();
  }, []);

  // Deep links land on the spreadsheet page now: ?open=<id> (with row/col highlight) and
  // ?openName=<database name> both redirect there, so old lineage links keep working.
  useEffect(() => {
    if (!router.isReady) return;
    const { open, row, col, openName } = router.query as Record<string, string>;
    if (open) {
      const suffix = row !== undefined ? `?row=${row}&col=${col ?? ''}` : '';
      router.replace(`/admin/data-science/databases/${open}${suffix}`);
    } else if (openName && databases) {
      const match = databases.find(d => d.name.toLowerCase() === openName.toLowerCase());
      if (match) router.replace(`/admin/data-science/databases/${match.id}`);
    }
  }, [router, router.isReady, router.query, databases]);

  // The curated view groups by what the data is; ?all=true is the Advanced everything-view.
  // Page-backed databases (they have their own menu pages) stay out of the curated list.
  const showAll = router.query.all === 'true';
  const PAGE_BACKED = ['Data Dictionary', 'Open Questions', 'Validation'];
  const groups = (() => {
    if (!databases) return [];
    if (showAll)
      return [{ title: `All databases (${databases.length})`, note: null as string | null, items: databases }];
    const curated = databases.filter(d => !PAGE_BACKED.includes(d.name));
    const products = curated.filter(d => d.kind === 'reference' && /product/i.test(d.name));
    const factors = curated.filter(d => d.kind === 'factors');
    const other = curated.filter(d => !products.includes(d) && !factors.includes(d));
    return [
      { title: 'Products', note: 'The directories — what can be purchased and switched', items: products },
      {
        title: 'Factors',
        note: 'The numbers that turn quantities into impacts — value changes bump the data version',
        items: factors
      },
      { title: 'Other', note: 'Reference data alongside the model', items: other }
    ].filter(g => g.items.length > 0);
  })();

  function handleFile(file: File) {
    setCsvFile(file);
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
      const sourceFileId = csvFile ? await storeSourceFile(csvFile) : null;
      const res = await fetch('/api/admin/factor-databases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          columns: parsed.columns,
          rows: parsed.rows,
          replaceExisting,
          mergeMode,
          mergeColumns,
          ...(sourceFileId ? { sourceFileId } : {})
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
      setForm({ name: '', description: '', sourceName: '', keyColumn: '', version: '', kind: 'reference' });
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
      load();
    } else {
      message.error('Could not delete that database');
    }
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

  return (
    <AdminLayout title='Databases' selectedMenuItem='data-science/databases' user={user}>
      <HowTo tool='databases' />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            <DatabaseOutlined /> Databases
          </Title>
          <Text type='secondary'>
            Every table the model stands on, grouped by what the data is. Open one to work in it like a spreadsheet —
            color-coded columns, the math behind every field, and edits that version themselves.
            {dataRelease && (
              <>
                {' '}
                <Tag color='green' style={{ marginLeft: 4 }}>
                  v{dataRelease}
                </Tag>
              </>
            )}
          </Text>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Dropdown.Button
            type='primary'
            icon={<DownOutlined />}
            onClick={() => setUploadOpen(true)}
            menu={{
              items: [
                { key: 'workbook', label: 'Upload workbook (multi-sheet)' },
                { key: 'ai', label: 'AI Data Uploader' }
              ],
              onClick: ({ key }) =>
                router.push(
                  key === 'workbook' ? '/admin/data-science/databases/workbook-upload' : '/admin/data-science/import'
                )
            }}
          >
            <UploadOutlined /> Upload a database
          </Dropdown.Button>
          <Dropdown
            menu={{
              items: [
                { key: 'cut', label: 'Update version to …' },
                { key: 'restore', label: 'Restore a version …' }
              ],
              onClick: ({ key }) => (key === 'cut' ? setVersionOpen(true) : openRestore())
            }}
          >
            <Button icon={<MoreOutlined />} />
          </Dropdown>
        </div>
      </div>

      {databases === null && <Spin style={{ display: 'block', margin: '60px auto' }} />}
      {groups.map(group => (
        <div key={group.title} style={{ marginBottom: 22 }}>
          <Text type='secondary' style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
            {group.title}
          </Text>
          {group.note && (
            <Text type='secondary' style={{ fontSize: 11 }}>
              {' '}
              · {group.note}
            </Text>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {group.items.map(row => (
              <Card key={row.id} size='small'>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <Link href={`/admin/data-science/databases/${row.id}`} style={{ fontSize: 14, fontWeight: 600 }}>
                      {row.name}
                    </Link>
                    {row.description && (
                      <div>
                        <Text type='secondary' style={{ fontSize: 12 }}>
                          {row.description}
                        </Text>
                      </div>
                    )}
                  </div>
                  <Text type='secondary' style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                    {row.rowCount.toLocaleString()} {row.rowCount === 1 ? 'item' : 'items'} · updated{' '}
                    <LocalDate iso={row.updatedAt} mode='date' /> ·{' '}
                    {row.kind === 'factors' ? (
                      <Text strong style={{ fontSize: 12 }}>
                        v{row.version}
                      </Text>
                    ) : (
                      `v${row.version}`
                    )}
                  </Text>
                  <Text type='secondary' style={{ fontSize: 12, maxWidth: 260 }} ellipsis={{ tooltip: row.sourceName }}>
                    {row.sourceFileId ? (
                      <a href={`/api/admin/factor-databases/${row.id}/source`} title='Download the source file'>
                        <PaperClipOutlined /> {row.sourceName ?? 'source file'}
                      </a>
                    ) : row.sourceUrl ? (
                      <a href={row.sourceUrl} target='_blank' rel='noreferrer'>
                        {row.sourceName}
                      </a>
                    ) : (
                      (row.sourceName ?? '')
                    )}
                  </Text>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <Button size='small' href={`/admin/data-science/databases/${row.id}`}>
                      Open
                    </Button>
                    <Popconfirm
                      title={`Delete "${row.name}"?`}
                      onConfirm={() => remove(row.id, row.name)}
                      okText='Delete'
                    >
                      <Button size='small' type='text' danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}

      <Text type='secondary' style={{ fontSize: 12, display: 'block', marginBottom: 16 }}>
        {showAll ? (
          <Link href='/admin/data-science/databases'>← Back to the curated view</Link>
        ) : (
          <>
            Data Dictionary, Validation, and Open Questions live in their own pages;{' '}
            <Link href='/admin/data-science/databases?all=true'>show every stored table</Link>.
          </>
        )}
      </Text>

      {/* ── collection versioning ────────────────────────────────────── */}
      <Modal
        open={versionOpen}
        title='Update version'
        onCancel={() => setVersionOpen(false)}
        onOk={cutVersion}
        okText='Cut this version'
        okButtonProps={{ loading: versionSaving }}
      >
        <Text type='secondary' style={{ display: 'block', marginBottom: 12, fontSize: 13 }}>
          Stamps every database with the new version and stores the entire collection — rows included — so you can
          restore it later. Current collection: <Tag color='green'>v{dataRelease ?? '—'}</Tag>
        </Text>
        <Input
          placeholder='New version name — e.g. v2.1 or v3'
          value={versionForm.name}
          onChange={e => setVersionForm({ ...versionForm, name: e.target.value })}
          style={{ marginBottom: 8 }}
        />
        <Input
          placeholder='What changed? (optional, shows in Methodology)'
          value={versionForm.note}
          onChange={e => setVersionForm({ ...versionForm, note: e.target.value })}
        />
      </Modal>

      <Modal
        open={restoreOpen}
        title='Restore a version'
        onCancel={() => setRestoreOpen(false)}
        onOk={restoreVersion}
        okText='Restore'
        okButtonProps={{ danger: true, disabled: !restoreId, loading: restoring }}
      >
        <Text type='secondary' style={{ display: 'block', marginBottom: 12, fontSize: 13 }}>
          Every database returns to exactly the stored state — rows, columns, sources, versions. The change log records
          the rollback. If you might want today&apos;s data back, cut a version of it first. (v1.0 is the legacy engine,
          not stored databases — legacy projects already stay pinned to it automatically.)
        </Text>
        {releases === null ? (
          <Spin />
        ) : releases.length === 0 ? (
          <Text type='secondary'>No versions cut yet — use “Update version to …” first.</Text>
        ) : (
          <Radio.Group
            value={restoreId}
            onChange={e => setRestoreId(e.target.value)}
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            {releases.map(r => (
              <Radio key={r.id} value={r.id}>
                <Text strong>{r.name}</Text>{' '}
                <Text type='secondary' style={{ fontSize: 12 }}>
                  {r.databaseCount} databases · cut <LocalDate iso={r.createdAt} mode='date' />
                  {r.note ? ` · ${r.note}` : ''}
                </Text>
              </Radio>
            ))}
          </Radio.Group>
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
            <Input
              placeholder='Version label (optional — e.g. 2.0). Blank keeps the current version.'
              value={form.version}
              onChange={e => setForm({ ...form, version: e.target.value })}
              style={{ marginBottom: 8 }}
            />
            <Checkbox
              checked={form.kind === 'factors'}
              onChange={e => setForm({ ...form, kind: e.target.checked ? 'factors' : 'reference' })}
              style={{ marginBottom: 8 }}
            >
              Core factors table — value changes here alter calculations and bump the data version
            </Checkbox>
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
