import { ArrowRightOutlined, ExperimentOutlined, InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Form,
  InputNumber,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { GetServerSideProps } from 'next';
import { useState } from 'react';

import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { getUserFromContext } from 'lib/middleware';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';
import type { PageProps } from 'pages/_app';

const { Title, Text, Paragraph } = Typography;

type FactorOption = {
  id: string;
  name: string;
  currentValue: number;
  unit: string;
  calculatorConstantKey: string;
  categoryName: string | null;
};

type EstimatedChange = {
  metric: string;
  percentChange: number;
  direction: 'increase' | 'decrease' | 'no change';
  isLinear: boolean;
};

type ImpactResult = {
  factor: {
    id: string;
    name: string;
    currentValue: number;
    unit: string;
    calculatorConstantKey: string;
    categoryName: string | null;
  };
  lineage: {
    calculatorFunction: string;
    calculatorFile: string;
    metricCategory: string;
  };
  hypotheticalValue: number;
  percentChange: number;
  estimatedChanges: EstimatedChange[];
  disclaimer: string;
};

type Props = {
  user: DashboardUser;
  factors: FactorOption[];
};

const metricCategoryColor: Record<string, string> = {
  environmental: 'green',
  financial: 'blue',
  utility: 'orange'
};

function shortMetricLabel(metric: string) {
  // Shorten long metric paths for display
  return metric
    .replace('environmentalResults.', '')
    .replace('financialResults.', '')
    .replace('annualGasEmissionChanges.', 'ghg.')
    .replace('annualWaterUsageChanges.', 'water.')
    .replace('annualCostChanges.', 'cost.')
    .replace('envBreakEven.', 'breakEven.');
}

export default function ImpactSimulatorPage({ factors }: Props) {
  const [selectedFactorId, setSelectedFactorId] = useState<string | null>(null);
  const [hypotheticalValue, setHypotheticalValue] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImpactResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedFactor = factors.find(f => f.id === selectedFactorId) ?? null;

  function handleFactorChange(id: string) {
    setSelectedFactorId(id);
    const factor = factors.find(f => f.id === id);
    if (factor) setHypotheticalValue(factor.currentValue);
    setResult(null);
    setError(null);
  }

  async function handleSimulate() {
    if (!selectedFactorId || hypotheticalValue === null) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/impact-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factorId: selectedFactorId, hypotheticalValue })
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || body.message || 'Analysis failed');
      setResult(body);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const resultColumns: ColumnsType<EstimatedChange> = [
    {
      title: 'Output Metric',
      dataIndex: 'metric',
      render: (v: string) => (
        <Tooltip title={v}>
          <code style={{ fontSize: 12 }}>{shortMetricLabel(v)}</code>
        </Tooltip>
      )
    },
    {
      title: 'Estimated Change',
      key: 'change',
      width: 160,
      render: (_, r) => {
        const color = r.direction === 'increase' ? '#cf1322' : r.direction === 'decrease' ? '#3f8600' : undefined;
        const prefix = r.direction === 'increase' ? '+' : '';
        const pct = r.percentChange ?? 0;
        return (
          <Text strong style={{ color, fontSize: 15 }}>
            {prefix}
            {pct.toFixed(2)}%
          </Text>
        );
      }
    },
    {
      title: '',
      key: 'linear',
      width: 100,
      render: () => (
        <Tooltip title='Linear approximation: assumes proportional relationship'>
          <Tag color='gold' style={{ fontSize: 10 }}>
            <InfoCircleOutlined style={{ marginRight: 3 }} />
            ~linear
          </Tag>
        </Tooltip>
      )
    }
  ];

  const groupedOptions = Object.entries(
    factors.reduce<Record<string, FactorOption[]>>((acc, f) => {
      const cat = f.categoryName ?? 'Other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(f);
      return acc;
    }, {})
  ).map(([label, opts]) => ({
    label,
    options: opts.map(f => ({
      value: f.id,
      label: `${f.name} (${f.currentValue} ${f.unit})`
    }))
  }));

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <ExperimentOutlined style={{ marginRight: 8 }} />
          Factor Impact Simulator
        </Title>
        <Paragraph type='secondary' style={{ margin: 0 }}>
          Choose a factor, enter a hypothetical value, and see how output metrics would be affected. Uses linear
          approximation — suitable for sensitivity analysis and change planning.
        </Paragraph>
      </div>

      <Row gutter={[24, 24]}>
        {/* Controls */}
        <Col xs={24} lg={8}>
          <Card title='Simulation Setup'>
            <Form layout='vertical'>
              <Form.Item label='Factor'>
                <Select
                  placeholder='Select a factor...'
                  showSearch
                  style={{ width: '100%' }}
                  options={groupedOptions}
                  value={selectedFactorId}
                  onChange={handleFactorChange}
                  filterOption={(input, option) =>
                    String(option?.label ?? '')
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                />
              </Form.Item>

              {selectedFactor && (
                <>
                  <div style={{ background: '#f5f5f5', borderRadius: 6, padding: '8px 12px', marginBottom: 16 }}>
                    <Text type='secondary' style={{ fontSize: 11, display: 'block' }}>
                      Current value
                    </Text>
                    <Text strong style={{ fontSize: 18 }}>
                      {selectedFactor.currentValue.toLocaleString()}
                    </Text>
                    <Text type='secondary' style={{ fontSize: 12 }}>
                      {' '}
                      {selectedFactor.unit}
                    </Text>
                    {selectedFactor.categoryName && (
                      <div style={{ marginTop: 4 }}>
                        <Tag style={{ fontSize: 10 }}>{selectedFactor.categoryName}</Tag>
                      </div>
                    )}
                    <div style={{ marginTop: 4 }}>
                      <code style={{ fontSize: 10, color: '#888' }}>{selectedFactor.calculatorConstantKey}</code>
                    </div>
                  </div>

                  <Form.Item
                    label={
                      <span>
                        Hypothetical value{' '}
                        <Text type='secondary' style={{ fontSize: 11 }}>
                          ({selectedFactor.unit})
                        </Text>
                      </span>
                    }
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      value={hypotheticalValue}
                      onChange={v => setHypotheticalValue(v)}
                      step={selectedFactor.currentValue * 0.01}
                      min={0}
                    />
                  </Form.Item>

                  {hypotheticalValue !== null && hypotheticalValue !== selectedFactor.currentValue && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: '#e6f4ff',
                        borderRadius: 6,
                        padding: '6px 10px',
                        marginBottom: 16
                      }}
                    >
                      <Text style={{ fontSize: 12 }}>{selectedFactor.currentValue}</Text>
                      <ArrowRightOutlined style={{ fontSize: 10, color: '#888' }} />
                      <Text strong style={{ fontSize: 12 }}>
                        {hypotheticalValue}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: hypotheticalValue > selectedFactor.currentValue ? '#cf1322' : '#3f8600'
                        }}
                      >
                        ({hypotheticalValue > selectedFactor.currentValue ? '+' : ''}
                        {(
                          ((hypotheticalValue - selectedFactor.currentValue) / selectedFactor.currentValue) *
                          100
                        ).toFixed(1)}
                        %)
                      </Text>
                    </div>
                  )}
                </>
              )}

              <Button
                type='primary'
                block
                loading={loading}
                disabled={!selectedFactorId || hypotheticalValue === null}
                onClick={handleSimulate}
                icon={<ExperimentOutlined />}
              >
                Simulate Impact
              </Button>
            </Form>
          </Card>
        </Col>

        {/* Results */}
        <Col xs={24} lg={16}>
          {error && (
            <Alert type='error' message={error} showIcon icon={<WarningOutlined />} style={{ marginBottom: 16 }} />
          )}

          {!result && !error && (
            <Card style={{ minHeight: 200 }}>
              <Empty description='Select a factor and run the simulation to see estimated impact on output metrics.' />
            </Card>
          )}

          {result && (
            <>
              {/* Summary */}
              <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={12} sm={6}>
                  <Card size='small' style={{ textAlign: 'center' }}>
                    <Statistic
                      title='Factor Change'
                      value={`${(result.percentChange ?? 0) >= 0 ? '+' : ''}${(result.percentChange ?? 0).toFixed(1)}%`}
                      valueStyle={{ color: (result.percentChange ?? 0) > 0 ? '#cf1322' : '#3f8600', fontSize: 20 }}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card size='small' style={{ textAlign: 'center' }}>
                    <Statistic
                      title='Metrics Affected'
                      value={result.estimatedChanges.length}
                      valueStyle={{ color: '#1890ff', fontSize: 20 }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12}>
                  <Card size='small'>
                    <Text type='secondary' style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>
                      Calculator function
                    </Text>
                    <code style={{ fontSize: 12, fontWeight: 600 }}>{result.lineage.calculatorFunction}</code>
                    <div>
                      <Tag
                        color={metricCategoryColor[result.lineage.metricCategory] ?? 'default'}
                        style={{ fontSize: 10, marginTop: 4 }}
                      >
                        {result.lineage.metricCategory}
                      </Tag>
                    </div>
                  </Card>
                </Col>
              </Row>

              {/* Estimated changes table */}
              <Card title='Estimated Impact on Output Metrics'>
                <Table
                  dataSource={result.estimatedChanges}
                  columns={resultColumns}
                  rowKey='metric'
                  size='small'
                  pagination={false}
                />
              </Card>

              <Alert
                style={{ marginTop: 12 }}
                type='info'
                showIcon
                icon={<InfoCircleOutlined />}
                message='Linear Approximation'
                description={result.disclaimer}
              />
            </>
          )}
        </Col>
      </Row>
    </>
  );
}

ImpactSimulatorPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => (
  <AdminLayout {...(pageProps as any)} selectedMenuItem='data-science/impact' title='Impact Simulator'>
    {page}
  </AdminLayout>
);

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return { notFound: true };
  const isUpstream = await checkIsUpstream(user.org.id);
  if (!isUpstream) return { notFound: true };

  const factors = await prisma.factor.findMany({
    where: { calculatorConstantKey: { not: null }, isActive: true },
    orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      currentValue: true,
      unit: true,
      calculatorConstantKey: true,
      category: { select: { name: true } }
    }
  });

  const factorOptions: FactorOption[] = factors
    .filter(f => f.calculatorConstantKey)
    .map(f => ({
      id: f.id,
      name: f.name,
      currentValue: f.currentValue,
      unit: f.unit,
      calculatorConstantKey: f.calculatorConstantKey!,
      categoryName: f.category?.name ?? null
    }));

  return { props: serializeJSON({ user, factors: factorOptions }) };
};
