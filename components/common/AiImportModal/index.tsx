/**
 * AiImportModal — reusable AI-powered column-mapping import modal.
 * Used by project-level single-use and reusable ImportButton components.
 */
import { CheckCircleOutlined, CloudUploadOutlined, ImportOutlined, RobotOutlined } from '@ant-design/icons';
import { Alert, Button, Modal, Progress, Select, Space, Steps, Table, Tag, Typography, Upload, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

import type { ClassifyResult, ColumnMapping } from 'pages/api/admin/import/classify';

const { Text, Paragraph } = Typography;

type DataTypeHint = 'single-use-products' | 'reusable-products';

interface Props {
  open: boolean;
  onClose: () => void;
  projectId: string;
  dataTypeHint: DataTypeHint;
  title: string;
  onImport: () => void;
}

const FIELD_OPTIONS: Record<DataTypeHint, { value: string; label: string }[]> = {
  'single-use-products': [
    { value: '', label: 'Ignore' },
    { value: 'productId', label: 'productId' },
    { value: 'caseCost', label: 'caseCost ($/case)' },
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
    { value: 'caseCost', label: 'caseCost ($/case)' },
    { value: 'casesPurchased', label: 'casesPurchased' },
    { value: 'unitsPerCase', label: 'unitsPerCase' },
    { value: 'annualRepurchasePercentage', label: 'annualRepurchasePercentage' }
  ]
};

export function AiImportModal({ open, onClose, projectId, dataTypeHint, title, onImport }: Props) {
  const [step, setStep] = useState(0);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [fileName, setFileName] = useState('');
  const [classifying, setClassifying] = useState(false);
  const [classification, setClassification] = useState<ClassifyResult | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number; errors: string[] } | null>(null);

  function reset() {
    setStep(0);
    setHeaders([]);
    setRows([]);
    setFileName('');
    setClassification(null);
    setMappings([]);
    setResult(null);
  }

  function handleClose() {
    reset();
    onClose();
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
          setStep(1);
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
          setStep(1);
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
    try {
      const res = await fetch('/api/admin/import/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headers: hdrs, sampleRows, fileName: fname, totalRows: total })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Classification failed');
      setClassification(data);
      // Override dataType with the hint since we know the context
      setMappings(data.mappings);
      setStep(2);
    } catch (err: any) {
      message.error(err.message, 8);
      setStep(0);
    } finally {
      setClassifying(false);
    }
  }

  async function handleImport() {
    if (!classification) return;
    setImporting(true);
    try {
      const res = await fetch('/api/admin/import/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataType: dataTypeHint,
          mappings,
          rows,
          headers,
          targetProjectId: projectId,
          sessionId: classification.sessionId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setResult(data);
      setStep(3);
      onImport();
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setImporting(false);
    }
  }

  const mappingColumns: ColumnsType<ColumnMapping> = [
    {
      title: 'Column',
      dataIndex: 'sourceColumn',
      width: 180,
      render: (col: string) => {
        const idx = headers.indexOf(col);
        const samples = rows
          .slice(0, 2)
          .map(r => r[idx])
          .filter(Boolean);
        return (
          <div>
            <code style={{ fontWeight: 600, fontSize: 12 }}>{col}</code>
            {samples.map((s, i) => (
              <Text key={i} type='secondary' style={{ fontSize: 11, display: 'block' }}>
                {String(s).slice(0, 30)}
              </Text>
            ))}
          </div>
        );
      }
    },
    {
      title: 'Maps To',
      dataIndex: 'targetField',
      render: (targetField: string, record: ColumnMapping) => (
        <Select
          value={targetField}
          options={FIELD_OPTIONS[dataTypeHint]}
          style={{ width: 200 }}
          size='small'
          onChange={val =>
            setMappings(prev =>
              prev.map(m => (m.sourceColumn === record.sourceColumn ? { ...m, targetField: val } : m))
            )
          }
        />
      )
    },
    {
      title: '%',
      dataIndex: 'confidence',
      width: 70,
      render: (conf: number) => (
        <Text style={{ fontSize: 12, color: conf >= 0.8 ? '#3f8600' : conf >= 0.5 ? '#d46b08' : '#cf1322' }}>
          {Math.round(conf * 100)}%
        </Text>
      )
    }
  ];

  return (
    <Modal open={open} onCancel={handleClose} title={title} width={620} footer={null} destroyOnClose>
      <Steps
        current={step}
        size='small'
        style={{ marginBottom: 20 }}
        items={[
          { title: 'Upload', icon: <CloudUploadOutlined /> },
          { title: 'AI Analysis', icon: <RobotOutlined /> },
          { title: 'Review', icon: <ImportOutlined /> },
          { title: 'Done', icon: <CheckCircleOutlined /> }
        ]}
      />

      {step === 0 && (
        <>
          <Paragraph type='secondary' style={{ fontSize: 13, marginBottom: 12 }}>
            Upload any .csv, .xlsx, or .xls file. Claude will read your column headers and suggest the right field
            mappings — no specific format required.
          </Paragraph>
          <Upload.Dragger
            accept='.csv,.xlsx,.xls'
            showUploadList={false}
            beforeUpload={file => {
              parseFile(file);
              return false;
            }}
          >
            <p className='ant-upload-drag-icon'>
              <CloudUploadOutlined style={{ fontSize: 36, color: '#1890ff' }} />
            </p>
            <p className='ant-upload-text'>Click or drag a spreadsheet here</p>
            <p className='ant-upload-hint'>.csv, .xlsx, .xls</p>
          </Upload.Dragger>
        </>
      )}

      {step === 1 && (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <RobotOutlined style={{ fontSize: 36, color: '#1890ff', marginBottom: 12 }} />
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Analyzing {fileName}…</div>
          <Text type='secondary' style={{ display: 'block', marginBottom: 16 }}>
            Claude is mapping your columns.
          </Text>
          <Progress
            percent={classifying ? undefined : 100}
            status={classifying ? 'active' : 'success'}
            style={{ maxWidth: 260, margin: '0 auto' }}
          />
        </div>
      )}

      {step === 2 && classification && (
        <>
          <Space style={{ marginBottom: 12 }} wrap>
            <Tag color={classification.confidence >= 0.7 ? 'green' : 'orange'}>
              AI confidence: {Math.round(classification.confidence * 100)}%
            </Tag>
            <Text type='secondary' style={{ fontSize: 12 }}>
              {rows.length} rows · {fileName}
            </Text>
            <Button
              size='small'
              onClick={() => {
                setStep(0);
                setClassification(null);
              }}
            >
              Change file
            </Button>
          </Space>

          {classification.confidence < 0.5 && (
            <Alert
              type='warning'
              message='Low confidence — review mappings carefully'
              showIcon
              style={{ marginBottom: 12 }}
            />
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
              <Button onClick={handleClose}>Cancel</Button>
              <Button type='primary' icon={<ImportOutlined />} onClick={handleImport} loading={importing}>
                Import {rows.length} items
              </Button>
            </Space>
          </div>
        </>
      )}

      {step === 3 && result && (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 12 }} />
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
            {result.created} item{result.created !== 1 ? 's' : ''} imported
          </div>
          {result.skipped > 0 && <Text type='secondary'>{result.skipped} rows skipped</Text>}
          {result.errors.length > 0 && (
            <Alert
              type='warning'
              message={`${result.errors.length} errors`}
              description={
                <ul style={{ textAlign: 'left', margin: 0, paddingLeft: 16 }}>
                  {result.errors.slice(0, 5).map((e, i) => (
                    <li key={i} style={{ fontSize: 12 }}>
                      {e}
                    </li>
                  ))}
                </ul>
              }
              style={{ marginTop: 12, textAlign: 'left' }}
            />
          )}
          <Button type='primary' style={{ marginTop: 16 }} onClick={handleClose}>
            Done
          </Button>
        </div>
      )}
    </Modal>
  );
}
