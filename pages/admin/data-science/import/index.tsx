import {
  CheckCircleOutlined,
  CloudUploadOutlined,
  ImportOutlined,
  PlusOutlined,
  RobotOutlined,
  WarningOutlined
} from '@ant-design/icons';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Drawer,
  Modal,
  Progress,
  Row,
  Select,
  Space,
  Statistic,
  Steps,
  Table,
  Tag,
  Typography,
  Upload,
  message
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { GetServerSideProps } from 'next';
import { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { getUserFromContext } from 'lib/middleware';
import { ACCESS_DENIED_REDIRECT, checkIsUpstream } from 'lib/middleware/requireUpstream';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';
import type { ClassifyResult, ColumnMapping } from 'pages/api/admin/import/classify';
import type { PageProps } from 'pages/_app';

const { Title, Text, Paragraph } = Typography;

type SessionRow = {
  id: string;
  createdAt: string;
  fileName: string;
  dataType: string;
  confidence: number;
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  status: string;
};

type Project = { id: string; name: string; account: { name: string } };

type Props = {
  user: DashboardUser;
  sessions: SessionRow[];
  projects: Project[];
  stats: {
    totalSessions: number;
    avgConfidence: number;
    totalImported: number;
    commonDataType: string | null;
  };
};

const DATA_TYPE_COLORS: Record<string, string> = {
  'single-use-products': 'red',
  'reusable-products': 'green',
  'golden-dataset': 'blue',
  'project-data': 'purple',
  unknown: 'default'
};

const DATA_TYPE_LABELS: Record<string, string> = {
  'single-use-products': 'Single-Use Products',
  'reusable-products': 'Reusable Products',
  'golden-dataset': 'Golden Dataset',
  'project-data': 'Project Data',
  unknown: 'Unknown'
};

const TARGET_FIELD_OPTIONS: Record<string, { value: string; label: string }[]> = {
  'single-use-products': [
    { value: '', label: 'Ignore' },
    { value: 'productId', label: 'productId' },
    { value: 'caseCost', label: 'caseCost' },
    { value: 'casesPurchased', label: 'casesPurchased' },
    { value: 'newCaseCost', label: 'newCaseCost' },
    { value: 'newCasesPurchased', label: 'newCasesPurchased' },
    { value: 'unitsPerCase', label: 'unitsPerCase' },
    { value: 'frequency', label: 'frequency' }
  ],
  'reusable-products': [
    { value: '', label: 'Ignore' },
    { value: 'productId', label: 'productId' },
    { value: 'productName', label: 'productName' },
    { value: 'caseCost', label: 'caseCost' },
    { value: 'casesPurchased', label: 'casesPurchased' },
    { value: 'unitsPerCase', label: 'unitsPerCase' },
    { value: 'annualRepurchasePercentage', label: 'annualRepurchasePercentage' }
  ],
  'golden-dataset': [
    { value: '', label: 'Ignore' },
    { value: 'name', label: 'name' },
    { value: 'category', label: 'category' },
    { value: 'tolerance', label: 'tolerance' }
  ],
  'project-data': [
    { value: '', label: 'Ignore' },
    { value: 'name', label: 'name' },
    { value: 'state', label: 'state' },
    { value: 'eventGuestCount', label: 'eventGuestCount' }
  ],
  unknown: [{ value: '', label: 'Ignore' }]
};

function StatusTag({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    classifying: { color: 'processing', label: 'Classifying' },
    mapped: { color: 'warning', label: 'Mapped' },
    imported: { color: 'success', label: 'Imported' },
    failed: { color: 'error', label: 'Failed' },
    cancelled: { color: 'default', label: 'Cancelled' }
  };
  const { color, label } = map[status] ?? { color: 'default', label: status };
  return <Badge status={color as any} text={label} />;
}

export default function ImportPage({ sessions: initialSessions, projects, stats }: Props) {
  const [sessions, setSessions] = useState(initialSessions);
  const [wizardOpen, setWizardOpen] = useState(false);

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [fileName, setFileName] = useState('');
  const [classifying, setClassifying] = useState(false);
  const [classification, setClassification] = useState<ClassifyResult | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [targetProjectId, setTargetProjectId] = useState<string | undefined>(undefined);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; skipped: number; errors: string[] } | null>(null);

  function resetWizard() {
    setCurrentStep(0);
    setHeaders([]);
    setRows([]);
    setFileName('');
    setClassification(null);
    setMappings([]);
    setTargetProjectId(undefined);
    setImportResult(null);
  }

  function openWizard() {
    resetWizard();
    setWizardOpen(true);
  }

  function parseFile(file: File) {
    const name = file.name.toLowerCase();
    if (name.endsWith('.csv')) {
      Papa.parse(file, {
        complete: result => {
          const allRows = result.data as string[][];
          if (allRows.length < 2) {
            message.error('File appears empty');
            return;
          }
          const hdrs = allRows[0];
          const dataRows = allRows.slice(1).filter(r => r.some(c => c.trim() !== ''));
          setHeaders(hdrs);
          setRows(dataRows);
          setFileName(file.name);
          setCurrentStep(1);
          runClassify(hdrs, dataRows.slice(0, 10), file.name, dataRows.length);
        },
        error: () => message.error('Failed to parse CSV')
      });
    } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const workbook = XLSX.read(e.target?.result, { type: 'binary' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 }) as string[][];
          if (data.length < 2) {
            message.error('File appears empty');
            return;
          }
          const hdrs = data[0].map(String);
          const dataRows = data
            .slice(1)
            .filter(r => r.some(c => String(c ?? '').trim() !== ''))
            .map(r => r.map(String));
          setHeaders(hdrs);
          setRows(dataRows);
          setFileName(file.name);
          setCurrentStep(1);
          runClassify(hdrs, dataRows.slice(0, 10), file.name, dataRows.length);
        } catch {
          message.error('Failed to parse Excel file');
        }
      };
      reader.readAsBinaryString(file);
    } else {
      message.error('Unsupported file type. Use .csv, .xlsx, or .xls');
    }
  }

  async function runClassify(hdrs: string[], sampleRows: string[][], fname: string, total: number) {
    setClassifying(true);
    setClassification(null);
    try {
      const res = await fetch('/api/admin/import/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headers: hdrs, sampleRows, fileName: fname, totalRows: total })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Classification failed');
      setClassification(data);
      setMappings(data.mappings);
      setCurrentStep(2);
      // Refresh sessions list
      fetch('/api/admin/import/sessions')
        .then(r => r.json())
        .then(d => setSessions(d.sessions ?? []));
    } catch (err: any) {
      message.error(err.message, 8);
      setCurrentStep(0);
    } finally {
      setClassifying(false);
    }
  }

  async function handleImport() {
    if (!classification) return;
    setImporting(true);
    setImportResult(null);
    try {
      const res = await fetch('/api/admin/import/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataType: classification.dataType,
          mappings,
          rows,
          headers,
          targetProjectId,
          sessionId: classification.sessionId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setImportResult(data);
      setCurrentStep(3);
      // Refresh sessions
      fetch('/api/admin/import/sessions')
        .then(r => r.json())
        .then(d => setSessions(d.sessions ?? []));
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setImporting(false);
    }
  }

  const needsProject =
    classification?.dataType === 'single-use-products' || classification?.dataType === 'reusable-products';

  const mappingColumns: ColumnsType<ColumnMapping> = [
    {
      title: 'Uploaded Column',
      dataIndex: 'sourceColumn',
      width: 200,
      render: (col: string) => {
        const colIdx = headers.indexOf(col);
        const samples = rows
          .slice(0, 3)
          .map(r => r[colIdx])
          .filter(Boolean);
        return (
          <div>
            <code style={{ fontWeight: 600 }}>{col}</code>
            {samples.map((s, i) => (
              <Text key={i} type='secondary' style={{ fontSize: 11, display: 'block' }}>
                {String(s).slice(0, 40)}
              </Text>
            ))}
          </div>
        );
      }
    },
    {
      title: 'Map To',
      dataIndex: 'targetField',
      render: (targetField: string, record: ColumnMapping) => {
        const options = classification
          ? (TARGET_FIELD_OPTIONS[classification.dataType] ?? TARGET_FIELD_OPTIONS.unknown)
          : [];
        return (
          <Select
            value={targetField}
            options={options}
            style={{ width: 220 }}
            size='small'
            onChange={val =>
              setMappings(prev =>
                prev.map(m => (m.sourceColumn === record.sourceColumn ? { ...m, targetField: val } : m))
              )
            }
          />
        );
      }
    },
    {
      title: 'Confidence',
      dataIndex: 'confidence',
      width: 100,
      render: (conf: number) => (
        <Progress
          percent={Math.round(conf * 100)}
          size='small'
          strokeColor={conf >= 0.8 ? '#52c41a' : conf >= 0.5 ? '#faad14' : '#ff4d4f'}
          showInfo={false}
          style={{ width: 80 }}
        />
      )
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      render: (notes: string) => (
        <Text type='secondary' style={{ fontSize: 12 }}>
          {notes}
        </Text>
      )
    }
  ];

  const sessionColumns: ColumnsType<SessionRow> = [
    {
      title: 'File',
      dataIndex: 'fileName',
      render: v => <code style={{ fontSize: 12 }}>{v}</code>
    },
    {
      title: 'Detected Type',
      dataIndex: 'dataType',
      render: v => (
        <Tag color={DATA_TYPE_COLORS[v] ?? 'default'} style={{ fontSize: 11 }}>
          {DATA_TYPE_LABELS[v] ?? v}
        </Tag>
      )
    },
    {
      title: 'Confidence',
      dataIndex: 'confidence',
      width: 100,
      render: v => `${Math.round(v * 100)}%`
    },
    {
      title: 'Rows',
      width: 120,
      render: (_, r) => (
        <Text style={{ fontSize: 12 }}>
          {r.importedRows > 0 ? (
            <>
              <Text style={{ color: '#3f8600' }}>{r.importedRows} imported</Text>
              {r.skippedRows > 0 && (
                <>
                  , <Text style={{ color: '#cf1322' }}>{r.skippedRows} skipped</Text>
                </>
              )}
            </>
          ) : r.totalRows > 0 ? (
            `${r.totalRows} rows`
          ) : (
            '—'
          )}
        </Text>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 110,
      render: v => <StatusTag status={v} />
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      width: 160,
      render: v => new Date(v).toLocaleString()
    }
  ];

  // Common remappings: count how often each sourceColumn maps to targetField across all sessions
  const remappingFrequency: Record<string, number> = {};
  sessions.forEach(s => {
    const mps = (s as any).mappings as ColumnMapping[] | null;
    if (!mps) return;
    mps.forEach(m => {
      if (m.targetField) {
        const key = `${m.sourceColumn} → ${m.targetField}`;
        remappingFrequency[key] = (remappingFrequency[key] ?? 0) + 1;
      }
    });
  });
  const topMappings = Object.entries(remappingFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            AI Data Uploader
          </Title>
          <Paragraph type='secondary' style={{ marginBottom: 0, marginTop: 4 }}>
            AI-powered spreadsheet importer for bulk data onboarding. Track upload history, classification accuracy, and
            column mapping patterns.
          </Paragraph>
        </div>
        <Button type='primary' icon={<PlusOutlined />} size='large' onClick={openWizard}>
          New Import
        </Button>
      </div>

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card size='small'>
            <Statistic title='Total Imports' value={stats.totalSessions} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size='small'>
            <Statistic title='Avg AI Confidence' value={`${Math.round(stats.avgConfidence * 100)}%`} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size='small'>
            <Statistic title='Rows Imported' value={stats.totalImported} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size='small'>
            <Statistic
              title='Most Common Type'
              value={stats.commonDataType ? (DATA_TYPE_LABELS[stats.commonDataType] ?? stats.commonDataType) : '—'}
              valueStyle={{ fontSize: 16 }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Session history */}
        <Col xs={24} lg={16}>
          <Card title='Import History' size='small'>
            <Table
              dataSource={sessions}
              columns={sessionColumns}
              rowKey='id'
              size='small'
              pagination={{ pageSize: 20 }}
              locale={{ emptyText: 'No imports yet. Click "New Import" to get started.' }}
            />
          </Card>
        </Col>

        {/* Common mappings insight */}
        <Col xs={24} lg={8}>
          <Card title='Common Column Mappings' size='small' style={{ marginBottom: 16 }}>
            {topMappings.length === 0 ? (
              <Text type='secondary' style={{ fontSize: 12 }}>
                No mapping data yet. Run some imports to see patterns.
              </Text>
            ) : (
              topMappings.map(([pair, count]) => (
                <div
                  key={pair}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '4px 0',
                    borderBottom: '1px solid #f0f0f0'
                  }}
                >
                  <Text style={{ fontSize: 12 }}>
                    <code>{pair}</code>
                  </Text>
                  <Tag style={{ fontSize: 11 }}>{count}×</Tag>
                </div>
              ))
            )}
          </Card>
          <Card title='Tips' size='small'>
            <Text type='secondary' style={{ fontSize: 12 }}>
              <ul style={{ paddingLeft: 16, margin: 0 }}>
                <li style={{ marginBottom: 4 }}>
                  Claude reads your column headers and sample data to suggest field mappings automatically.
                </li>
                <li style={{ marginBottom: 4 }}>
                  You can upload any .csv, .xlsx, or .xls file — no specific column names required.
                </li>
                <li style={{ marginBottom: 4 }}>
                  Review and adjust mappings before importing. Low-confidence suggestions are shown in orange/red.
                </li>
                <li>For bulk product uploads, use the Import button directly on project pages.</li>
              </ul>
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Import wizard drawer */}
      <Drawer
        title='Import Spreadsheet'
        open={wizardOpen}
        onClose={() => {
          setWizardOpen(false);
          resetWizard();
        }}
        width={740}
        styles={{ body: { padding: '24px' } }}
      >
        <Steps
          current={currentStep}
          size='small'
          style={{ marginBottom: 24 }}
          items={[
            { title: 'Upload', icon: <CloudUploadOutlined /> },
            { title: 'AI Analysis', icon: <RobotOutlined /> },
            { title: 'Review', icon: <ImportOutlined /> },
            { title: 'Done', icon: <CheckCircleOutlined /> }
          ]}
        />

        {/* Step 0: Upload */}
        {currentStep === 0 && (
          <Upload.Dragger
            accept='.csv,.xlsx,.xls'
            showUploadList={false}
            beforeUpload={file => {
              parseFile(file);
              return false;
            }}
          >
            <p className='ant-upload-drag-icon'>
              <CloudUploadOutlined style={{ fontSize: 40, color: '#1890ff' }} />
            </p>
            <p className='ant-upload-text'>Click or drag a file here</p>
            <p className='ant-upload-hint'>Supports .csv, .xlsx, .xls — any column layout</p>
          </Upload.Dragger>
        )}

        {/* Step 1: Classifying */}
        {currentStep === 1 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <RobotOutlined style={{ fontSize: 40, color: '#1890ff', marginBottom: 12 }} />
            <Title level={4} style={{ margin: '0 0 8px' }}>
              Analyzing {fileName}…
            </Title>
            <Paragraph type='secondary'>
              Claude is reading your headers and sample data to suggest field mappings.
            </Paragraph>
            <Progress
              percent={classifying ? undefined : 100}
              status={classifying ? 'active' : 'success'}
              style={{ maxWidth: 300, margin: '0 auto' }}
            />
          </div>
        )}

        {/* Step 2: Review */}
        {currentStep === 2 && classification && (
          <>
            <Space style={{ marginBottom: 16 }} wrap>
              <Tag color={DATA_TYPE_COLORS[classification.dataType]}>{DATA_TYPE_LABELS[classification.dataType]}</Tag>
              <Text type='secondary' style={{ fontSize: 12 }}>
                Confidence: <strong>{Math.round(classification.confidence * 100)}%</strong>
              </Text>
              <Text type='secondary' style={{ fontSize: 12 }}>
                {rows.length} rows · {fileName}
              </Text>
              <Button
                size='small'
                onClick={() => {
                  setCurrentStep(0);
                  setClassification(null);
                }}
              >
                Change file
              </Button>
            </Space>

            {classification.dataType === 'unknown' && (
              <Alert
                type='warning'
                message="Couldn't detect data type"
                description='Adjust the target field dropdowns manually.'
                showIcon
                style={{ marginBottom: 12 }}
              />
            )}

            {needsProject && (
              <div style={{ marginBottom: 12 }}>
                <Text strong style={{ fontSize: 13 }}>
                  Target Project:{' '}
                </Text>
                <Select
                  showSearch
                  placeholder='Select project…'
                  style={{ width: 300, marginLeft: 8 }}
                  size='small'
                  filterOption={(input, option) =>
                    String(option?.label ?? '')
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={projects.map(p => ({ value: p.id, label: `${p.account.name} — ${p.name}` }))}
                  value={targetProjectId}
                  onChange={setTargetProjectId}
                />
              </div>
            )}

            <Table
              dataSource={mappings}
              columns={mappingColumns}
              rowKey='sourceColumn'
              pagination={false}
              size='small'
              style={{ marginBottom: 16 }}
            />

            <div style={{ textAlign: 'right' }}>
              <Space>
                <Button
                  onClick={() => {
                    setWizardOpen(false);
                    resetWizard();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type='primary'
                  icon={<ImportOutlined />}
                  onClick={handleImport}
                  loading={importing}
                  disabled={needsProject && !targetProjectId}
                >
                  Import {rows.length} rows
                </Button>
              </Space>
            </div>
          </>
        )}

        {/* Step 3: Done */}
        {currentStep === 3 && importResult && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
            <Title level={3}>Import Complete</Title>
            <Row gutter={32} justify='center' style={{ marginTop: 16, marginBottom: 16 }}>
              <Col>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#3f8600' }}>{importResult.created}</div>
                <Text type='secondary'>created</Text>
              </Col>
              {importResult.skipped > 0 && (
                <Col>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#cf1322' }}>{importResult.skipped}</div>
                  <Text type='secondary'>skipped</Text>
                </Col>
              )}
            </Row>
            {importResult.errors.length > 0 && (
              <Alert
                type='warning'
                message={`${importResult.errors.length} errors`}
                description={
                  <ul style={{ textAlign: 'left', margin: 0, paddingLeft: 16 }}>
                    {importResult.errors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                }
                style={{ maxWidth: 400, margin: '0 auto 16px', textAlign: 'left' }}
              />
            )}
            <Button
              type='primary'
              onClick={() => {
                resetWizard();
              }}
            >
              Import another file
            </Button>
          </div>
        )}
      </Drawer>
    </>
  );
}

ImportPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => (
  <AdminLayout {...(pageProps as any)} selectedMenuItem='data-science/import' title='AI Data Uploader'>
    {page}
  </AdminLayout>
);

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return ACCESS_DENIED_REDIRECT;
  const isUpstream = await checkIsUpstream(user.org.id);
  if (!isUpstream) return ACCESS_DENIED_REDIRECT;

  const [rawSessions, projects] = await Promise.all([
    prisma.importSession.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
    prisma.project.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, account: { select: { name: true } } }
    })
  ]);

  const sessions = rawSessions.map(s => ({ ...s, mappings: undefined })); // don't send mappings to page (too large)

  const totalSessions = rawSessions.length;
  const avgConfidence = totalSessions > 0 ? rawSessions.reduce((sum, s) => sum + s.confidence, 0) / totalSessions : 0;
  const totalImported = rawSessions.reduce((sum, s) => sum + s.importedRows, 0);
  const typeCounts: Record<string, number> = {};
  rawSessions.forEach(s => {
    typeCounts[s.dataType] = (typeCounts[s.dataType] ?? 0) + 1;
  });
  const commonDataType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    props: serializeJSON({
      user,
      sessions,
      projects,
      stats: { totalSessions, avgConfidence, totalImported, commonDataType }
    })
  };
};
