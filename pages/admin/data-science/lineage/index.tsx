import {
  ArrowRightOutlined,
  DatabaseOutlined,
  FunctionOutlined,
  BarChartOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { Card, Col, Input, Row, Table, Tag, Tooltip, Typography, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { GetServerSideProps } from 'next';
import { useState } from 'react';
import styled from 'styled-components';

import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { getUserFromContext } from 'lib/middleware';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';

const { Title, Text, Paragraph } = Typography;

// Static map: calculatorConstantKey pattern → calculator path → output metrics
// Patterns are prefix-matched against the factor's calculatorConstantKey
const LINEAGE_MAP: Array<{
  pattern: RegExp;
  calculatorFile: string;
  calculatorFunction: string;
  outputMetrics: string[];
  metricCategory: 'environmental' | 'financial' | 'utility';
}> = [
  {
    pattern: /^ELECTRIC_CO2_EMISSIONS_FACTOR$/,
    calculatorFile: 'lib/calculator/calculations/ghg/getAnnualGasEmissionChanges.ts',
    calculatorFunction: 'getAnnualGasEmissionChanges()',
    outputMetrics: ['environmentalResults.annualGasEmissionChanges.dishwashing'],
    metricCategory: 'environmental'
  },
  {
    pattern: /^NATURAL_GAS_CO2_EMISSIONS_FACTOR$/,
    calculatorFile: 'lib/calculator/calculations/ghg/getAnnualGasEmissionChanges.ts',
    calculatorFunction: 'getAnnualGasEmissionChanges()',
    outputMetrics: ['environmentalResults.annualGasEmissionChanges.dishwashing'],
    metricCategory: 'environmental'
  },
  {
    pattern: /^TRANSPORTATION_CO2_EMISSIONS_FACTOR$/,
    calculatorFile: 'lib/calculator/calculations/ghg/getAnnualGasEmissionChanges.ts',
    calculatorFunction: 'getLineItemGasEmissions()',
    outputMetrics: [
      'environmentalResults.annualGasEmissionChanges.landfillWaste',
      'environmentalResults.annualGasEmissionChanges.shippingBox',
      'environmentalResults.annualGasEmissionChanges.total'
    ],
    metricCategory: 'environmental'
  },
  {
    pattern: /^MATERIALS\[.*\]\.mtco2ePerLb$/,
    calculatorFile: 'lib/calculator/calculations/ghg/getAnnualGasEmissionChanges.ts',
    calculatorFunction: 'calculateMaterialGas()',
    outputMetrics: [
      'environmentalResults.annualGasEmissionChanges.landfillWaste',
      'environmentalResults.annualGasEmissionChanges.total'
    ],
    metricCategory: 'environmental'
  },
  {
    pattern: /^MATERIALS\[.*\]\.waterUsageGalPerLb$/,
    calculatorFile: 'lib/calculator/calculations/water/getAnnualWaterUsageChanges.ts',
    calculatorFunction: 'calculateMaterialWater()',
    outputMetrics: [
      'environmentalResults.annualWaterUsageChanges.landfillWaste',
      'environmentalResults.annualWaterUsageChanges.total'
    ],
    metricCategory: 'environmental'
  },
  {
    pattern: /^REUSABLE_MATERIALS\[.*\]\.mtco2ePerLb$/,
    calculatorFile: 'lib/calculator/calculations/ghg/getAnnualGasEmissionChanges.ts',
    calculatorFunction: 'calculateMaterialGas()',
    outputMetrics: [
      'environmentalResults.annualGasEmissionChanges.landfillWaste',
      'environmentalResults.annualGasEmissionChanges.total'
    ],
    metricCategory: 'environmental'
  },
  {
    pattern: /^REUSABLE_MATERIALS\[.*\]\.waterUsageGalPerLb$/,
    calculatorFile: 'lib/calculator/calculations/water/getAnnualWaterUsageChanges.ts',
    calculatorFunction: 'calculateMaterialWater()',
    outputMetrics: [
      'environmentalResults.annualWaterUsageChanges.landfillWaste',
      'environmentalResults.annualWaterUsageChanges.total'
    ],
    metricCategory: 'environmental'
  },
  {
    pattern: /^STATES\[.*\]\.electric$/,
    calculatorFile: 'lib/calculator/calculations/getFinancialResults.ts',
    calculatorFunction: 'dishwasherAnnualCostBreakdown()',
    outputMetrics: [
      'financialResults.annualCostChanges.utilities',
      'financialResults.annualCostChanges.baseline',
      'financialResults.annualCostChanges.forecast',
      'financialResults.summary.annualCost'
    ],
    metricCategory: 'financial'
  },
  {
    pattern: /^STATES\[.*\]\.gas$/,
    calculatorFile: 'lib/calculator/calculations/getFinancialResults.ts',
    calculatorFunction: 'dishwasherAnnualCostBreakdown()',
    outputMetrics: [
      'financialResults.annualCostChanges.utilities',
      'financialResults.annualCostChanges.baseline',
      'financialResults.annualCostChanges.forecast',
      'financialResults.summary.annualCost'
    ],
    metricCategory: 'financial'
  }
];

function resolveLineage(key: string | null) {
  if (!key) return null;
  return LINEAGE_MAP.find(entry => entry.pattern.test(key)) ?? null;
}

type FactorRow = {
  id: string;
  name: string;
  currentValue: number;
  unit: string;
  calculatorConstantKey: string | null;
  category: { name: string };
  source: { name: string; version: string };
  isActive: boolean;
};

type Props = {
  user: DashboardUser;
  factors: FactorRow[];
};

const FlowStep = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const StepBox = styled.div<{ color: string }>`
  background: ${p => p.color};
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
`;

const metricCategoryColors: Record<string, string> = {
  environmental: '#d9f7be',
  financial: '#e6f4ff',
  utility: '#fff7e6'
};

const metricCategoryTagColors: Record<string, string> = {
  environmental: 'green',
  financial: 'blue',
  utility: 'orange'
};

export default function LineagePage({ user, factors }: Props) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const withLineage = factors.map(f => ({ ...f, lineage: resolveLineage(f.calculatorConstantKey) }));

  const filtered = withLineage.filter(f => {
    const matchSearch =
      !search ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      (f.calculatorConstantKey ?? '').toLowerCase().includes(search.toLowerCase());
    const matchCategory = !categoryFilter || f.category.name === categoryFilter;
    return matchSearch && matchCategory;
  });

  const categories = Array.from(new Set(factors.map(f => f.category.name))).sort();

  const withLineageCount = withLineage.filter(f => f.lineage).length;
  const withoutLineageCount = withLineage.filter(f => !f.calculatorConstantKey).length;

  const columns: ColumnsType<(typeof withLineage)[0]> = [
    {
      title: 'Factor',
      key: 'factor',
      width: 220,
      render: (_, r) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>
            {r.name}
          </Text>
          <div>
            <Text type='secondary' style={{ fontSize: 11 }}>
              {r.source.name} v{r.source.version}
            </Text>
          </div>
          <div>
            <Text strong style={{ fontSize: 13 }}>
              {r.currentValue.toLocaleString()}
            </Text>
            <Text type='secondary' style={{ fontSize: 11 }}>
              {' '}
              {r.unit}
            </Text>
          </div>
        </div>
      )
    },
    {
      title: (
        <Space size={4}>
          <DatabaseOutlined />
          Constant Key
        </Space>
      ),
      key: 'key',
      width: 240,
      render: (_, r) =>
        r.calculatorConstantKey ? (
          <code
            style={{
              fontSize: 11,
              background: '#f5f5f5',
              padding: '3px 7px',
              borderRadius: 4,
              display: 'inline-block',
              wordBreak: 'break-all'
            }}
          >
            {r.calculatorConstantKey}
          </code>
        ) : (
          <Text type='secondary' style={{ fontSize: 12 }}>
            —
          </Text>
        )
    },
    {
      title: (
        <Space size={4}>
          <FunctionOutlined />
          Calculator Function
        </Space>
      ),
      key: 'fn',
      width: 200,
      render: (_, r) =>
        r.lineage ? (
          <Tooltip title={r.lineage.calculatorFile}>
            <code style={{ fontSize: 11, background: '#f0f5ff', padding: '3px 7px', borderRadius: 4, cursor: 'help' }}>
              {r.lineage.calculatorFunction}
            </code>
          </Tooltip>
        ) : (
          <Text type='secondary' style={{ fontSize: 12 }}>
            —
          </Text>
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
        r.lineage ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {r.lineage.outputMetrics.map(m => (
              <code
                key={m}
                style={{
                  fontSize: 11,
                  background: metricCategoryColors[r.lineage!.metricCategory],
                  padding: '2px 6px',
                  borderRadius: 3
                }}
              >
                {m}
              </code>
            ))}
          </div>
        ) : (
          <Text type='secondary' style={{ fontSize: 12 }}>
            No lineage mapped
          </Text>
        )
    },
    {
      title: 'Category',
      key: 'cat',
      width: 130,
      render: (_, r) => (
        <Space direction='vertical' size={2}>
          <Tag color='blue' style={{ fontSize: 11 }}>
            {r.category.name}
          </Tag>
          {r.lineage && (
            <Tag color={metricCategoryTagColors[r.lineage.metricCategory]} style={{ fontSize: 11 }}>
              {r.lineage.metricCategory}
            </Tag>
          )}
        </Space>
      )
    }
  ];

  return (
    <AdminLayout title='Data Lineage' selectedMenuItem='data-science/lineage' user={user}>
      <div style={{ padding: '24px' }}>
        <Title level={2} style={{ marginBottom: 4 }}>
          Data Lineage
        </Title>
        <Paragraph type='secondary' style={{ marginBottom: 24 }}>
          End-to-end traceability from source factors (EPA WARM, DOE EIA) through the calculator engine to output
          metrics. Each row shows exactly which TypeScript function and output property a factor influences.
        </Paragraph>

        {/* Flow diagram legend */}
        <Card style={{ marginBottom: 24, background: '#fafafa' }} size='small'>
          <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
            Data flow
          </Text>
          <FlowStep>
            <StepBox color='#e6f7ff'>Source (EPA WARM / DOE EIA)</StepBox>
            <ArrowRightOutlined style={{ color: '#bbb', fontSize: 12 }} />
            <StepBox color='#f6ffed'>DB Factor (versioned + governed)</StepBox>
            <ArrowRightOutlined style={{ color: '#bbb', fontSize: 12 }} />
            <StepBox color='#f0f5ff'>Calculator Function (TypeScript)</StepBox>
            <ArrowRightOutlined style={{ color: '#bbb', fontSize: 12 }} />
            <StepBox color='#d9f7be'>Output Metric (getProjections)</StepBox>
          </FlowStep>
        </Card>

        {/* Stats */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={8}>
            <Card size='small' style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#3f8600' }}>{factors.length}</div>
              <Text type='secondary' style={{ fontSize: 12 }}>
                Total Factors
              </Text>
            </Card>
          </Col>
          <Col xs={8}>
            <Card size='small' style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#1890ff' }}>{withLineageCount}</div>
              <Text type='secondary' style={{ fontSize: 12 }}>
                Lineage Mapped
              </Text>
            </Card>
          </Col>
          <Col xs={8}>
            <Card size='small' style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#fa8c16' }}>{withoutLineageCount}</div>
              <Text type='secondary' style={{ fontSize: 12 }}>
                No Constant Key
              </Text>
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={10}>
              <Input
                placeholder='Search factors or constant key...'
                prefix={<SearchOutlined />}
                value={search}
                onChange={e => setSearch(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                style={{
                  width: '100%',
                  height: 32,
                  border: '1px solid #d9d9d9',
                  borderRadius: 6,
                  padding: '0 8px',
                  fontSize: 14
                }}
              >
                <option value=''>All categories</option>
                {categories.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Col>
          </Row>
        </Card>

        <Table
          dataSource={filtered}
          columns={columns}
          rowKey='id'
          size='small'
          scroll={{ x: 900 }}
          pagination={{
            showSizeChanger: true,
            defaultPageSize: 25,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} factors`
          }}
          rowClassName={r => (!r.lineage ? 'ant-table-row-dimmed' : '')}
        />

        <div style={{ marginTop: 16 }}>
          <Text type='secondary' style={{ fontSize: 12 }}>
            Lineage is mapped via the <code>calculatorConstantKey</code> field on each factor. Factors without a
            constant key are library entries not yet wired to a specific calculator function.
          </Text>
        </div>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return { notFound: true };
  const isUpstream = await checkIsUpstream(user.org.id);
  if (!isUpstream) return { notFound: true };

  const factors = await prisma.factor.findMany({
    select: {
      id: true,
      name: true,
      currentValue: true,
      unit: true,
      calculatorConstantKey: true,
      isActive: true,
      category: { select: { name: true } },
      source: { select: { name: true, version: true } }
    },
    orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }]
  });

  return { props: serializeJSON({ user, factors }) };
};
