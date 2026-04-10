import {
  CheckOutlined,
  EditOutlined,
  EyeOutlined,
  ReloadOutlined,
  FunctionOutlined,
  FileOutlined,
  BarChartOutlined,
  LinkOutlined
} from '@ant-design/icons';
import { Badge, Button, Card, Drawer, Space, Spin, Table, Tag, Tooltip, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { CALCULATOR_REGISTRY } from 'lib/admin/calculatorRegistry';
import { scanCalculatorFunctions } from 'lib/admin/calculatorScan';
import { LINEAGE_MAP } from 'lib/admin/lineageMap';
import { getUserFromContext } from 'lib/middleware';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import { serializeJSON } from 'lib/objects';
import type { PageProps } from 'pages/_app';

const { Title, Text, Paragraph } = Typography;

type CalcFunction = {
  name: string;
  filePath: string;
  outputMetrics: string[];
  metricCategory: string | null;
  lineageFile: string | null;
};

type Props = {
  user: DashboardUser;
  functions: CalcFunction[];
  scannedAt: string;
};

const categoryColors: Record<string, string> = {
  environmental: 'green',
  financial: 'blue',
  utility: 'orange'
};

export default function CalculationsPage({ functions: initial, scannedAt: initialScannedAt }: Props) {
  const router = useRouter();
  const [functions, setFunctions] = useState(initial);
  const [scannedAt, setScannedAt] = useState(initialScannedAt);
  const [rescanning, setRescanning] = useState(false);

  // Code viewer drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerFn, setDrawerFn] = useState<CalcFunction | null>(null);
  const [sourceCode, setSourceCode] = useState<string | null>(null);
  const [sourceLoading, setSourceLoading] = useState(false);

  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [fullFileSource, setFullFileSource] = useState<string | null>(null);
  const [editedSource, setEditedSource] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Auto-open drawer when arriving with ?fn=functionName (from Data Product Designer)
  useEffect(() => {
    const fnName = router.query.fn;
    if (typeof fnName === 'string' && fnName && functions.length > 0) {
      const match = functions.find(f => f.name === fnName);
      if (match) openCodeViewer(match);
    }
  }, [router.query.fn]); // eslint-disable-line react-hooks/exhaustive-deps

  async function enterEditMode() {
    if (!drawerFn) return;
    setSourceLoading(true);
    try {
      const res = await fetch(
        `/api/admin/calculations/source?filePath=${encodeURIComponent(drawerFn.filePath)}&name=${encodeURIComponent(drawerFn.name)}&full=true`
      );
      const data = await res.json();
      if (data.source) {
        setFullFileSource(data.source);
        setEditedSource(data.source);
        setEditMode(true);
      } else {
        message.error('Could not load full file source');
      }
    } catch {
      message.error('Failed to load file');
    } finally {
      setSourceLoading(false);
    }
  }

  async function handleSave() {
    if (!drawerFn) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/calculations/save', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: drawerFn.filePath, source: editedSource })
      });
      const data = await res.json();
      if (res.ok) {
        message.success(`Saved ${drawerFn.filePath}`);
        setFullFileSource(editedSource);
        // Refresh the function source view
        setEditMode(false);
        openCodeViewer(drawerFn);
      } else {
        message.error(data.error || 'Failed to save');
      }
    } catch {
      message.error('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  function exitEditMode() {
    setEditMode(false);
    setEditedSource('');
    setFullFileSource(null);
  }

  async function handleRescan() {
    setRescanning(true);
    try {
      const res = await fetch('/api/admin/calculations');
      const data = await res.json();
      if (res.ok) {
        setFunctions(data.functions);
        setScannedAt(data.scannedAt);
      }
    } finally {
      setRescanning(false);
    }
  }

  async function openCodeViewer(fn: CalcFunction) {
    setDrawerFn(fn);
    setDrawerOpen(true);
    setSourceCode(null);
    setSourceLoading(true);
    try {
      const res = await fetch(
        `/api/admin/calculations/source?filePath=${encodeURIComponent(fn.filePath)}&name=${encodeURIComponent(fn.name)}`
      );
      const data = await res.json();
      setSourceCode(data.source ?? null);
    } catch {
      setSourceCode(null);
    } finally {
      setSourceLoading(false);
    }
  }

  const columns: ColumnsType<CalcFunction> = [
    {
      title: (
        <Space size={4}>
          <FunctionOutlined />
          Function
        </Space>
      ),
      key: 'name',
      width: 260,
      render: (_, r) => (
        <div>
          <Button
            type='link'
            style={{ padding: 0, height: 'auto', fontFamily: 'monospace', fontWeight: 600, fontSize: 13 }}
            onClick={() => openCodeViewer(r)}
          >
            {r.name}()
          </Button>
          {r.metricCategory && (
            <div style={{ marginTop: 2 }}>
              <Tag color={categoryColors[r.metricCategory] ?? 'default'} style={{ fontSize: 10 }}>
                {r.metricCategory}
              </Tag>
            </div>
          )}
        </div>
      )
    },
    {
      title: (
        <Space size={4}>
          <FileOutlined />
          File
        </Space>
      ),
      key: 'file',
      render: (_, r) => (
        <Tooltip title={r.filePath}>
          <code
            style={{
              fontSize: 11,
              background: '#f5f5f5',
              padding: '2px 6px',
              borderRadius: 3,
              cursor: 'help',
              wordBreak: 'break-all'
            }}
          >
            {r.filePath.split('/').pop()}
          </code>
        </Tooltip>
      )
    },
    {
      title: (
        <Space size={4}>
          <BarChartOutlined />
          Output Metrics
        </Space>
      ),
      key: 'metrics',
      render: (_, r) =>
        r.outputMetrics.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {r.outputMetrics.map(m => (
              <code
                key={m}
                style={{
                  fontSize: 10,
                  background: '#f0f5ff',
                  padding: '1px 5px',
                  borderRadius: 3,
                  display: 'inline-block'
                }}
              >
                {m}
              </code>
            ))}
          </div>
        ) : (
          <Text type='secondary' style={{ fontSize: 12 }}>
            Not in lineage map
          </Text>
        )
    },
    {
      title: 'Traceability',
      key: 'coverage',
      width: 120,
      render: (_, r) =>
        r.outputMetrics.length > 0 ? (
          <Badge status='success' text={<Text style={{ fontSize: 12 }}>Mapped</Text>} />
        ) : (
          <Badge
            status='warning'
            text={
              <Text type='secondary' style={{ fontSize: 12 }}>
                Unmapped
              </Text>
            }
          />
        )
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_, r) => (
        <Button size='small' icon={<LinkOutlined />} onClick={() => openCodeViewer(r)}>
          Code
        </Button>
      )
    }
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Calculations Registry
          </Title>
          <Paragraph type='secondary' style={{ marginBottom: 0, marginTop: 4 }}>
            Auto-discovered exported functions from <code style={{ fontSize: 12 }}>lib/calculator/calculations/</code>.
            Last scanned: {new Date(scannedAt).toLocaleTimeString()}.
          </Paragraph>
        </div>
        <Button icon={<ReloadOutlined />} loading={rescanning} onClick={handleRescan}>
          Rescan
        </Button>
      </div>

      <Card style={{ marginBottom: 16, background: '#fafafa' }} size='small'>
        <Text style={{ fontSize: 12 }}>
          <strong>{functions.length}</strong> functions discovered.{' '}
          <strong>{functions.filter(f => f.outputMetrics.length > 0).length}</strong> have lineage mapped. Click any
          function name or <strong>Code</strong> to inspect its source and trace the input → calculation → output chain.
        </Text>
      </Card>

      <Table
        dataSource={functions}
        columns={columns}
        rowKey={r => `${r.filePath}-${r.name}`}
        size='small'
        pagination={{ defaultPageSize: 50, showTotal: (t, range) => `${range[0]}-${range[1]} of ${t}` }}
        expandable={{
          expandedRowRender: r => (
            <div style={{ padding: '8px 16px', background: '#fafafa', borderRadius: 4 }}>
              {/* Traceability chain */}
              <div style={{ marginBottom: 12 }}>
                <Text strong style={{ fontSize: 12 }}>
                  Traceability chain:
                </Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                  <Tag color='blue' style={{ margin: 0 }}>
                    Inputs
                  </Tag>
                  <Text type='secondary'>→</Text>
                  <Tag color='orange' style={{ margin: 0 }}>
                    Constants / Factors DB
                  </Tag>
                  <Text type='secondary'>→</Text>
                  <Tag color='purple' style={{ margin: 0, fontFamily: 'monospace' }}>
                    {r.name}()
                  </Tag>
                  <Text type='secondary'>→</Text>
                  {r.outputMetrics.length > 0 ? (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {r.outputMetrics.map(m => (
                        <Tag key={m} color='green' style={{ margin: 0 }}>
                          {m}
                        </Tag>
                      ))}
                    </div>
                  ) : (
                    <Tag color='default' style={{ margin: 0 }}>
                      Output (unmapped)
                    </Tag>
                  )}
                </div>
              </div>
              <div style={{ marginBottom: 4 }}>
                <Text type='secondary' style={{ fontSize: 12 }}>
                  Full path:
                </Text>{' '}
                <code style={{ fontSize: 12 }}>{r.filePath}</code>
              </div>
              {r.lineageFile && (
                <div>
                  <Text type='secondary' style={{ fontSize: 12 }}>
                    Lineage file:
                  </Text>{' '}
                  <code style={{ fontSize: 12 }}>{r.lineageFile}</code>
                </div>
              )}
              <div style={{ marginTop: 8 }}>
                <Button size='small' icon={<LinkOutlined />} onClick={() => openCodeViewer(r)}>
                  View source code
                </Button>
              </div>
            </div>
          )
        }}
      />

      {/* Code viewer drawer */}
      <Drawer
        title={
          drawerFn ? (
            <Space direction='vertical' size={2}>
              <code style={{ fontSize: 15, fontWeight: 700 }}>{drawerFn.name}()</code>
              <Text type='secondary' style={{ fontSize: 12, fontWeight: 400 }}>
                {drawerFn.filePath}
              </Text>
            </Space>
          ) : null
        }
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          exitEditMode();
        }}
        width={720}
        styles={{ body: { padding: 0 } }}
        extra={
          drawerFn && (
            <Space>
              {editMode ? (
                <>
                  <Button size='small' onClick={exitEditMode} icon={<EyeOutlined />}>
                    Cancel
                  </Button>
                  <Button
                    size='small'
                    type='primary'
                    onClick={handleSave}
                    loading={saving}
                    icon={<CheckOutlined />}
                    disabled={editedSource === fullFileSource}
                  >
                    Save File
                  </Button>
                </>
              ) : (
                <Button size='small' type='primary' onClick={enterEditMode} icon={<EditOutlined />}>
                  Edit
                </Button>
              )}
            </Space>
          )
        }
      >
        {drawerFn && (
          <>
            {/* Traceability header */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
              <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                Traceability chain
              </Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Tag color='blue'>Project Inputs</Tag>
                <Text type='secondary'>→</Text>
                <Tag color='orange'>Constants / Factors</Tag>
                <Text type='secondary'>→</Text>
                <Tag color='purple' style={{ fontFamily: 'monospace' }}>
                  {drawerFn.name}()
                </Tag>
                <Text type='secondary'>→</Text>
                {drawerFn.outputMetrics.length > 0 ? (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {drawerFn.outputMetrics.map(m => (
                      <Tag key={m} color='green'>
                        {m}
                      </Tag>
                    ))}
                  </div>
                ) : (
                  <Tag color='default'>Output (not in lineage map)</Tag>
                )}
              </div>
              {drawerFn.metricCategory && (
                <div style={{ marginTop: 8 }}>
                  <Tag color={categoryColors[drawerFn.metricCategory] ?? 'default'}>
                    {drawerFn.metricCategory} category
                  </Tag>
                </div>
              )}
            </div>

            {/* Source code */}
            <div style={{ padding: '16px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text strong style={{ fontSize: 12 }}>
                  {editMode ? 'Editing full file' : 'Function source'}
                </Text>
                {editMode && (
                  <Text type='secondary' style={{ fontSize: 11 }}>
                    {drawerFn?.filePath}
                  </Text>
                )}
              </div>
              {sourceLoading ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <Spin />
                </div>
              ) : editMode ? (
                <textarea
                  value={editedSource}
                  onChange={e => setEditedSource(e.target.value)}
                  spellCheck={false}
                  style={{
                    width: '100%',
                    background: '#1e1e2e',
                    color: '#cdd6f4',
                    padding: '16px',
                    borderRadius: 6,
                    fontSize: 12,
                    lineHeight: 1.6,
                    height: 'calc(100vh - 320px)',
                    resize: 'vertical',
                    border: '2px solid #2bbe50',
                    outline: 'none',
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                    tabSize: 2
                  }}
                  onKeyDown={e => {
                    // Tab key inserts 2 spaces instead of changing focus
                    if (e.key === 'Tab') {
                      e.preventDefault();
                      const target = e.target as HTMLTextAreaElement;
                      const start = target.selectionStart;
                      const end = target.selectionEnd;
                      const value = target.value;
                      setEditedSource(value.substring(0, start) + '  ' + value.substring(end));
                      // Restore cursor position after React re-render
                      requestAnimationFrame(() => {
                        target.selectionStart = target.selectionEnd = start + 2;
                      });
                    }
                    // Cmd/Ctrl+S to save
                    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                      e.preventDefault();
                      if (editedSource !== fullFileSource) handleSave();
                    }
                  }}
                />
              ) : sourceCode ? (
                <pre
                  style={{
                    background: '#1e1e2e',
                    color: '#cdd6f4',
                    padding: '16px',
                    borderRadius: 6,
                    fontSize: 12,
                    lineHeight: 1.6,
                    overflow: 'auto',
                    maxHeight: 'calc(100vh - 280px)',
                    margin: 0,
                    whiteSpace: 'pre',
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace"
                  }}
                >
                  {sourceCode}
                </pre>
              ) : (
                <Text type='secondary'>Could not load source code.</Text>
              )}
            </div>
          </>
        )}
      </Drawer>
    </>
  );
}

CalculationsPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => (
  <AdminLayout {...(pageProps as any)} selectedMenuItem='data-science/calculations' title='Calculations Registry'>
    {page}
  </AdminLayout>
);

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return { notFound: true };
  const isUpstream = await checkIsUpstream(user.org.id);
  if (!isUpstream) return { notFound: true };

  let rawFunctions: ReturnType<typeof scanCalculatorFunctions> = [];
  try {
    rawFunctions = scanCalculatorFunctions();
  } catch {
    // source files may not be accessible in serverless environments (e.g. Vercel)
  }

  let functions: CalcFunction[];
  if (rawFunctions.length > 0) {
    functions = rawFunctions.map(fn => {
      const lineageEntry = LINEAGE_MAP.find(entry => entry.calculatorFunction.startsWith(fn.name));
      return {
        ...fn,
        outputMetrics: lineageEntry?.outputMetrics ?? [],
        metricCategory: lineageEntry?.metricCategory ?? null,
        lineageFile: lineageEntry?.calculatorFile ?? null
      };
    });
  } else {
    // Fallback: use static registry when source files aren't on disk (e.g. Vercel)
    functions = CALCULATOR_REGISTRY.map(fn => ({
      name: fn.name,
      filePath: fn.filePath,
      outputMetrics: fn.outputMetrics,
      metricCategory: fn.metricCategory,
      lineageFile: fn.filePath
    }));
  }

  return {
    props: serializeJSON({ user, functions, scannedAt: new Date().toISOString() })
  };
};
