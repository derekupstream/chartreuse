import { CalculatorOutlined, DatabaseOutlined } from '@ant-design/icons';
import { Alert, Drawer, Spin, Table, Tag, Tooltip, Typography } from 'antd';
import { createContext, useContext, useEffect, useState } from 'react';

import type { OutputExplanation } from 'lib/calculator/trace/explainOutputs';
import type { ExplainResponse } from 'pages/api/admin/calculator-explain';

const { Text, Paragraph } = Typography;

/**
 * Lets any number on a project dashboard be opened up to show the equation behind it.
 *
 * A provider sits at the top of the projections page; individual metric components drop a
 * <CalculationIcon /> beside their number naming which output it is. The icon only renders
 * for Upstream staff, so customers see the dashboard unchanged.
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
                      title: 'share',
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

/** A small calculator button that opens the breakdown for one dashboard number. */
export function CalculationIcon({ outputKey, label }: { outputKey: string; label?: string }) {
  const context = useContext(Context);
  if (!context?.enabled) return null;

  return (
    <Tooltip title={`See the equation behind ${label ?? 'this number'}`}>
      <CalculatorOutlined
        className='dont-print-me'
        onClick={e => {
          e.stopPropagation();
          context.open(outputKey);
        }}
        style={{ marginLeft: 8, color: '#1677ff', cursor: 'pointer', fontSize: 14 }}
      />
    </Tooltip>
  );
}
