import { ArrowRightOutlined, DatabaseOutlined, FunctionOutlined, BarChartOutlined } from '@ant-design/icons';
import { Card, Col, Empty, Input, Row, Select, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { GetServerSideProps } from 'next';
import { useState } from 'react';

import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { LINEAGE_MAP } from 'lib/admin/lineageMap';
import { getUserFromContext } from 'lib/middleware';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';
import type { PageProps } from 'pages/_app';

const { Title, Text, Paragraph } = Typography;

type PipelineRow = {
  id: string;
  factorName: string;
  calculatorConstantKey: string | null;
  categoryName: string | null;
  // resolved via LINEAGE_MAP
  calculatorFile: string | null;
  calculatorFunction: string | null;
  outputMetrics: string[];
  metricCategory: string | null;
};

type Props = {
  user: DashboardUser;
  rows: PipelineRow[];
  unmappedCount: number;
};

const categoryColors: Record<string, string> = {
  environmental: 'green',
  financial: 'blue',
  utility: 'orange'
};

const metricColors = ['#531dab', '#0050b3', '#003a8c', '#006d75', '#135200', '#7c0000'];

export default function PipelinePage({ rows, unmappedCount }: Props) {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterOutput, setFilterOutput] = useState<string | null>(null);

  // Unique output metrics for filter dropdown
  const allOutputs = Array.from(new Set(rows.flatMap(r => r.outputMetrics))).sort();
  const allCategories = Array.from(new Set(rows.map(r => r.metricCategory).filter(Boolean))) as string[];

  const filtered = rows.filter(r => {
    if (
      search &&
      !r.factorName.toLowerCase().includes(search.toLowerCase()) &&
      !r.calculatorConstantKey?.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    if (filterCategory && r.metricCategory !== filterCategory) return false;
    if (filterOutput && !r.outputMetrics.includes(filterOutput)) return false;
    return true;
  });

  const columns: ColumnsType<PipelineRow> = [
    {
      title: (
        <Space size={4}>
          <DatabaseOutlined style={{ color: '#1890ff' }} />
          Factor (Input)
        </Space>
      ),
      key: 'factor',
      width: 220,
      render: (_, r) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>
            {r.factorName}
          </Text>
          {r.categoryName && (
            <div>
              <Tag style={{ fontSize: 10 }}>{r.categoryName}</Tag>
            </div>
          )}
          {r.calculatorConstantKey && (
            <code style={{ fontSize: 10, color: '#888', display: 'block', marginTop: 2 }}>
              {r.calculatorConstantKey}
            </code>
          )}
        </div>
      )
    },
    {
      title: '',
      key: 'arrow1',
      width: 28,
      render: () => <ArrowRightOutlined style={{ color: '#ccc' }} />
    },
    {
      title: (
        <Space size={4}>
          <FunctionOutlined style={{ color: '#722ed1' }} />
          Calculation
        </Space>
      ),
      key: 'calc',
      width: 240,
      render: (_, r) =>
        r.calculatorFunction ? (
          <div>
            <code style={{ fontSize: 12, fontWeight: 600, color: '#531dab' }}>{r.calculatorFunction}</code>
            {r.calculatorFile && (
              <Text type='secondary' style={{ fontSize: 10, display: 'block', marginTop: 2 }}>
                {r.calculatorFile.split('/').pop()}
              </Text>
            )}
            {r.metricCategory && (
              <Tag color={categoryColors[r.metricCategory] ?? 'default'} style={{ fontSize: 10, marginTop: 2 }}>
                {r.metricCategory}
              </Tag>
            )}
          </div>
        ) : (
          <Text type='secondary' style={{ fontSize: 12 }}>
            Not mapped
          </Text>
        )
    },
    {
      title: '',
      key: 'arrow2',
      width: 28,
      render: (_, r) => (r.calculatorFunction ? <ArrowRightOutlined style={{ color: '#ccc' }} /> : null)
    },
    {
      title: (
        <Space size={4}>
          <BarChartOutlined style={{ color: '#52c41a' }} />
          Output Metrics
        </Space>
      ),
      key: 'outputs',
      render: (_, r) =>
        r.outputMetrics.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {r.outputMetrics.map((m, i) => (
              <code
                key={m}
                style={{
                  fontSize: 10,
                  background: '#f0f5ff',
                  padding: '1px 6px',
                  borderRadius: 3,
                  display: 'inline-block',
                  color: metricColors[i % metricColors.length]
                }}
              >
                {m}
              </code>
            ))}
          </div>
        ) : (
          <Text type='secondary' style={{ fontSize: 12 }}>
            —
          </Text>
        )
    }
  ];

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>
          Pipeline Traceability
        </Title>
        <Paragraph type='secondary' style={{ marginBottom: 0, marginTop: 4 }}>
          Trace every Factor (constant/input) through the calculation chain to its output metrics. Identifies which DB
          factor drives which output.
        </Paragraph>
      </div>

      {/* Summary cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size='small' style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#1890ff' }}>{rows.length}</div>
            <Text type='secondary' style={{ fontSize: 12 }}>
              Factors with keys
            </Text>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size='small' style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#52c41a' }}>
              {rows.filter(r => r.calculatorFunction).length}
            </div>
            <Text type='secondary' style={{ fontSize: 12 }}>
              Fully traced
            </Text>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size='small' style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#faad14' }}>
              {rows.filter(r => !r.calculatorFunction).length}
            </div>
            <Text type='secondary' style={{ fontSize: 12 }}>
              Partially mapped
            </Text>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size='small' style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#cf1322' }}>{unmappedCount}</div>
            <Text type='secondary' style={{ fontSize: 12 }}>
              No key set
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card size='small' style={{ marginBottom: 12 }}>
        <Space wrap>
          <Input.Search
            placeholder='Search factor name or key…'
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 260 }}
            allowClear
          />
          <Select
            placeholder='Filter by category'
            allowClear
            style={{ width: 180 }}
            options={allCategories.map(c => ({ value: c, label: c }))}
            value={filterCategory}
            onChange={setFilterCategory}
          />
          <Select
            placeholder='Filter by output metric'
            allowClear
            showSearch
            style={{ width: 300 }}
            options={allOutputs.map(o => ({ value: o, label: o }))}
            value={filterOutput}
            onChange={setFilterOutput}
          />
          <Text type='secondary' style={{ fontSize: 12 }}>
            {filtered.length} rows
          </Text>
        </Space>
      </Card>

      <Table
        dataSource={filtered}
        columns={columns}
        rowKey='id'
        size='small'
        pagination={{ defaultPageSize: 50, showTotal: (t, range) => `${range[0]}-${range[1]} of ${t}` }}
        locale={{ emptyText: <Empty description='No factors match the filters' /> }}
      />
    </>
  );
}

PipelinePage.getLayout = (page: React.ReactNode, pageProps: PageProps) => (
  <AdminLayout {...(pageProps as any)} selectedMenuItem='data-science/pipeline' title='Pipeline Traceability'>
    {page}
  </AdminLayout>
);

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return { notFound: true };
  const isUpstream = await checkIsUpstream(user.org.id);
  if (!isUpstream) return { notFound: true };

  const [factors, unmappedCount] = await Promise.all([
    prisma.factor.findMany({
      where: { calculatorConstantKey: { not: null } },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        calculatorConstantKey: true,
        category: { select: { name: true } }
      }
    }),
    prisma.factor.count({ where: { calculatorConstantKey: null } })
  ]);

  const rows: PipelineRow[] = factors.map(f => {
    const lineage = LINEAGE_MAP.find(entry => entry.pattern.test(f.calculatorConstantKey!));
    return {
      id: f.id,
      factorName: f.name,
      calculatorConstantKey: f.calculatorConstantKey,
      categoryName: f.category?.name ?? null,
      calculatorFile: lineage?.calculatorFile ?? null,
      calculatorFunction: lineage?.calculatorFunction ?? null,
      outputMetrics: lineage?.outputMetrics ?? [],
      metricCategory: lineage?.metricCategory ?? null
    };
  });

  return { props: serializeJSON({ user, rows, unmappedCount }) };
};
