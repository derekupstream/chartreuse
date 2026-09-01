import { CalculatorOutlined, DatabaseOutlined } from '@ant-design/icons';
import { Alert, Drawer, Spin, Table, Tag, Typography } from 'antd';
import { createContext, useContext, useEffect, useState } from 'react';

import type { OutputExplanation } from 'lib/calculator/trace/explainOutputs';
import type { ExplainResponse } from 'pages/api/admin/calculator-explain';

const { Text, Paragraph } = Typography;

/**
 * Lets any number on a project dashboard be opened up to show the equation behind it.
 *
 * A provider sits at the top of the projections page; each metric card wraps itself in a
 * <CalculationCard /> naming which output it shows. Cards are only interactive for Upstream
 * staff — for everyone else the wrapper renders its children untouched.
 */
type InspectorContext = {
  projectId: string;
  enabled: boolean;
  open: (outputKey: string) => void;
};

const Context = createContext<InspectorContext | null>(null);

export function CalculationInspectorProvider({
  projectId,
  enabled,
  children
}: {
  projectId: string;
  enabled: boolean;
  children: React.ReactNode;
}) {
  const [outputKey, setOutputKey] = useState<string | null>(null);
  const [data, setData] = useState<ExplainResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!outputKey || data) return;
    setLoading(true);
    fetch('/api/admin/calculator-explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId })
    })
      .then(r => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [outputKey, data, projectId]);

  const explanation: OutputExplanation | undefined = data?.outputs.find(o => o.key === outputKey);

  return (
    <Context.Provider value={{ projectId, enabled, open: setOutputKey }}>
      {children}
      <Drawer
        open={!!outputKey}
        onClose={() => setOutputKey(null)}
        width={560}
        title={
          <>
            <CalculatorOutlined /> {explanation?.label ?? 'How this is calculated'}
          </>
        }
      >
        {loading && <Spin />}
        {!loading && !explanation && outputKey && (
          <Alert type='info' showIcon message='No breakdown is available for this number yet.' />
        )}
        {explanation && (
          <>
            <div style={{ fontSize: 28, fontWeight: 600, lineHeight: 1.2 }}>
              {explanation.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
            <Text type='secondary'>{explanation.unit}</Text>

            <Paragraph style={{ marginTop: 16, marginBottom: 16 }}>
              <Text strong>How it is formed</Text>
              <br />
              <Text code>{explanation.formula}</Text>
            </Paragraph>

            {explanation.contributors.length > 0 && (
              <>
                <Text strong>What contributes most</Text>
                <Text type='secondary' style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
                  Each line&apos;s size relative to the others listed here.
                </Text>
                <Table
                  size='small'
                  style={{ marginTop: 6, marginBottom: 16 }}
                  rowKey='label'
                  pagination={false}
                  dataSource={explanation.contributors}
                  columns={[
                    { title: 'Line', dataIndex: 'label', ellipsis: true },
                    {
                      title: explanation.unit,
                      dataIndex: 'value',
                      align: 'right' as const,
                      render: (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 2 })
                    },
                    {
                      title: '% of total',
                      dataIndex: 'share',
                      align: 'right' as const,
                      width: 70,
                      render: (v: number) => (v ? `${Math.round(v * 100)}%` : '—')
                    }
                  ]}
                />
              </>
            )}

            {explanation.factorsUsed.length > 0 && (
              <>
                <Text strong>Factors used, and where each comes from</Text>
                <Table
                  size='small'
                  style={{ marginTop: 6, marginBottom: 16 }}
                  rowKey={(r, i) => `${r.name}-${i}`}
                  pagination={{ pageSize: 6, hideOnSinglePage: true }}
                  dataSource={explanation.factorsUsed}
                  columns={[
                    { title: 'Factor', dataIndex: 'name', ellipsis: true },
                    {
                      title: 'Value',
                      dataIndex: 'value',
                      align: 'right' as const,
                      render: (v: number, row) => `${v} ${row.unit}`
                    },
                    {
                      title: 'Source',
                      dataIndex: 'origin',
                      width: 190,
                      render: (origin: string, row) =>
                        origin === 'database' ? (
                          <Tag color='green' icon={<DatabaseOutlined />}>
                            {row.database}
                          </Tag>
                        ) : (
                          <Tag>in the code</Tag>
                        )
                    }
                  ]}
                />
              </>
            )}

            {explanation.caveats.map(caveat => (
              <Alert key={caveat} type='warning' showIcon style={{ marginBottom: 8 }} message={caveat} />
            ))}
          </>
        )}
      </Drawer>
    </Context.Provider>
  );
}

/**
 * Wraps a dashboard card so staff can click it to see the equation behind its number.
 * For everyone else it renders its children untouched, with no wrapper and no styling.
 */
export function CalculationCard({
  outputKey,
  label,
  children
}: {
  outputKey: string;
  label?: string;
  children: React.ReactNode;
}) {
  const context = useContext(Context);
  const [hovered, setHovered] = useState(false);

  if (!context?.enabled) return <>{children}</>;

  // Hover shows the outline + "View calculation" pill; no floating text tooltip — those
  // are reserved for explicit (i) icons.
  return (
    <div
      onClick={() => context.open(outputKey)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        height: '100%',
        cursor: 'pointer',
        borderRadius: 10,
        outline: hovered ? '2px solid #1677ff' : '2px solid transparent',
        outlineOffset: 2,
        transition: 'outline-color 0.15s ease'
      }}
    >
      {children}
      {hovered && (
        <div
          className='dont-print-me'
          style={{
            position: 'absolute',
            top: 8,
            right: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: '#1677ff',
            color: '#fff',
            borderRadius: 12,
            padding: '2px 8px',
            fontSize: 11,
            pointerEvents: 'none'
          }}
        >
          <CalculatorOutlined /> View calculation
        </div>
      )}
    </div>
  );
}
