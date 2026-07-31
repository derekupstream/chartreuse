import { DatabaseOutlined, ExperimentOutlined, FunctionOutlined, ReloadOutlined } from '@ant-design/icons';
import { Alert, Card, Col, Empty, InputNumber, Row, Select, Spin, Table, Tag, Tooltip, Typography } from 'antd';
import type { GetServerSideProps } from 'next';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { HowTo } from 'components/admin/HowTo';
import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { getUserFromContext } from 'lib/middleware';
import { ACCESS_DENIED_REDIRECT, checkIsUpstream } from 'lib/middleware/requireUpstream';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';
import type { CalculatorInputOverride, ExplainResponse } from 'pages/api/admin/calculator-explain';
import type { OutputExplanation } from 'lib/calculator/trace/explainOutputs';

const { Text, Title, Paragraph } = Typography;

type ProjectOption = { id: string; name: string };

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return ACCESS_DENIED_REDIRECT;
  if (!(await checkIsUpstream(user.org.id))) return ACCESS_DENIED_REDIRECT;

  const projects = await prisma.project.findMany({
    where: { singleUseItems: { some: {} } },
    select: { id: true, name: true },
    orderBy: { updatedAt: 'desc' },
    take: 60
  });

  return { props: serializeJSON({ user, projects }) };
};

const fmt = (v: number, unit: string) => {
  if (unit.startsWith('$'))
    return `${v < 0 ? '−' : ''}$${Math.abs(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (unit.startsWith('MTCO2e')) return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return v.toLocaleString(undefined, { maximumFractionDigits: 0 });
};

const groupColor: Record<OutputExplanation['group'], string> = {
  Financial: '#f6ffed',
  Environmental: '#e6fffb',
  Operational: '#f9f0ff'
};

export default function DataProductDesignerV2Page({
  user,
  projects
}: {
  user: DashboardUser;
  projects: ProjectOption[];
}) {
  const [projectId, setProjectId] = useState<string | undefined>(projects[0]?.id);
  const [data, setData] = useState<ExplainResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedOutput, setSelectedOutput] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, CalculatorInputOverride>>({});
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback(async (id: string, currentOverrides: Record<string, CalculatorInputOverride>) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/calculator-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: id, singleUse: Object.values(currentOverrides) })
      });
      if (!res.ok) throw new Error('run failed');
      setData(await res.json());
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (projectId) {
      setOverrides({});
      setSelectedOutput(null);
      run(projectId, {});
    }
  }, [projectId, run]);

  /** Editing an input re-runs the real engine, so outputs move as you type. */
  function editInput(id: string, field: keyof CalculatorInputOverride, value: number | null) {
    if (value === null) return;
    const next = { ...overrides, [id]: { ...(overrides[id] ?? { id }), [field]: value } };
    setOverrides(next);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => projectId && run(projectId, next), 400);
  }

  const selected = useMemo(() => data?.outputs.find(o => o.key === selectedOutput) ?? null, [data, selectedOutput]);

  return (
    <AdminLayout title='Data Product Designer' selectedMenuItem='data-science/designer-v2' user={user}>
      <HowTo tool='designer-v2' />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            <ExperimentOutlined /> Data Product Designer
          </Title>
          <Text type='secondary'>
            A calculator is inputs and factors producing outputs. Change an input, watch the outputs move, then open any
            output to see exactly what produced it.
          </Text>
        </div>
        <Select
          showSearch
          optionFilterProp='label'
          style={{ minWidth: 320 }}
          value={projectId}
          onChange={setProjectId}
          placeholder='Choose a calculator to inspect'
          options={projects.map(p => ({ value: p.id, label: p.name }))}
        />
      </div>

      {data && data.activeDatabases.length > 0 && (
        <Alert
          type='success'
          showIcon
          icon={<DatabaseOutlined />}
          style={{ marginBottom: 12 }}
          message={`Factors supplied by ${data.activeDatabases.join(', ')}`}
          description='These numbers are coming from an uploaded database rather than from values written into the code. Change the database and these outputs change.'
        />
      )}

      <Row gutter={16}>
        {/* ── the calculator: what a user fills in ─────────────────── */}
        <Col xs={24} lg={9}>
          <Card
            size='small'
            title={
              <>
                Inputs <Text type='secondary'>· what the user enters</Text>
              </>
            }
            extra={
              loading ? (
                <Spin size='small' />
              ) : Object.keys(overrides).length ? (
                <a onClick={() => projectId && (setOverrides({}), run(projectId, {}))}>
                  <ReloadOutlined /> reset
                </a>
              ) : null
            }
            styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
          >
            {!data && <Spin />}
            {data?.lineItems
              .filter(i => i.kind === 'single-use')
              .map(item => (
                <div key={item.id} style={{ marginBottom: 14 }}>
                  <Text strong style={{ fontSize: 13 }}>
                    {item.label}
                  </Text>
                  <Row gutter={6} style={{ marginTop: 4 }}>
                    <Col span={8}>
                      <Text type='secondary' style={{ fontSize: 11 }}>
                        cases
                      </Text>
                      <InputNumber
                        size='small'
                        style={{ width: '100%' }}
                        value={overrides[item.id]?.casesPurchased ?? item.casesPurchased}
                        onChange={v => editInput(item.id, 'casesPurchased', v)}
                      />
                    </Col>
                    <Col span={8}>
                      <Text type='secondary' style={{ fontSize: 11 }}>
                        units/case
                      </Text>
                      <InputNumber
                        size='small'
                        style={{ width: '100%' }}
                        value={overrides[item.id]?.unitsPerCase ?? item.unitsPerCase}
                        onChange={v => editInput(item.id, 'unitsPerCase', v)}
                      />
                    </Col>
                    <Col span={8}>
                      <Text type='secondary' style={{ fontSize: 11 }}>
                        $/case
                      </Text>
                      <InputNumber
                        size='small'
                        style={{ width: '100%' }}
                        value={overrides[item.id]?.caseCost ?? item.caseCost}
                        onChange={v => editInput(item.id, 'caseCost', v)}
                      />
                    </Col>
                  </Row>
                </div>
              ))}
          </Card>
        </Col>

        {/* ── the dashboard: what the calculator produces ───────────── */}
        <Col xs={24} lg={15}>
          <Card
            size='small'
            title={
              <>
                Outputs <Text type='secondary'>· click any number to see what made it</Text>
              </>
            }
          >
            {!data && <Empty description='Choose a calculator' />}
            <Row gutter={[12, 12]}>
              {data?.outputs.map(output => {
                const isSelected = selectedOutput === output.key;
                return (
                  <Col xs={24} sm={12} key={output.key}>
                    <Card
                      size='small'
                      hoverable
                      onClick={() => setSelectedOutput(isSelected ? null : output.key)}
                      style={{
                        background: groupColor[output.group],
                        border: isSelected ? '2px solid #1677ff' : undefined,
                        cursor: 'pointer'
                      }}
                    >
                      <Text type='secondary' style={{ fontSize: 12 }}>
                        {output.label}
                      </Text>
                      <div style={{ fontSize: 24, fontWeight: 600, lineHeight: 1.2 }}>
                        {fmt(output.value, output.unit)}
                      </div>
                      <Text type='secondary' style={{ fontSize: 11 }}>
                        {output.unit}
                        {output.factorsUsed.some(f => f.origin === 'database') && (
                          <Tooltip title='Some factors behind this number come from an uploaded database'>
                            <DatabaseOutlined style={{ marginLeft: 6, color: '#52c41a' }} />
                          </Tooltip>
                        )}
                      </Text>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </Card>

          {/* ── the advanced view: why the number is what it is ─────── */}
          {selected && (
            <Card
              size='small'
              style={{ marginTop: 12 }}
              title={
                <>
                  <FunctionOutlined /> {selected.label} — {fmt(selected.value, selected.unit)} {selected.unit}
                </>
              }
              extra={<a onClick={() => setSelectedOutput(null)}>close</a>}
            >
              <Paragraph style={{ marginBottom: 12 }}>
                <Text strong>How it is formed: </Text>
                <Text code>{selected.formula}</Text>
              </Paragraph>

              {selected.contributors.length > 0 && (
                <>
                  <Text strong>What contributes most</Text>
                  <Table
                    size='small'
                    style={{ marginTop: 6, marginBottom: 14 }}
                    rowKey='label'
                    pagination={false}
                    dataSource={selected.contributors}
                    columns={[
                      { title: 'Line', dataIndex: 'label' },
                      {
                        title: '',
                        dataIndex: 'detail',
                        render: (v: string) => (
                          <Text type='secondary' style={{ fontSize: 12 }}>
                            {v}
                          </Text>
                        )
                      },
                      {
                        title: selected.unit,
                        dataIndex: 'value',
                        align: 'right' as const,
                        render: (v: number) => fmt(v, selected.unit)
                      },
                      {
                        title: 'share',
                        dataIndex: 'share',
                        align: 'right' as const,
                        width: 80,
                        render: (v: number) => (v ? `${Math.round(v * 100)}%` : '—')
                      }
                    ]}
                  />
                </>
              )}

              {selected.factorsUsed.length > 0 && (
                <>
                  <Text strong>Factors it uses — and where each comes from</Text>
                  <Table
                    size='small'
                    style={{ marginTop: 6, marginBottom: 14 }}
                    rowKey={(r, i) => `${r.name}-${i}`}
                    pagination={false}
                    dataSource={selected.factorsUsed}
                    columns={[
                      { title: 'Factor', dataIndex: 'name' },
                      {
                        title: 'Value',
                        dataIndex: 'value',
                        align: 'right' as const,
                        render: (v: number, row) => `${v} ${row.unit}`
                      },
                      {
                        title: 'Source',
                        dataIndex: 'origin',
                        width: 260,
                        render: (origin: string, row) =>
                          origin === 'database' ? (
                            <Tag color='green' icon={<DatabaseOutlined />}>
                              {row.database}
                            </Tag>
                          ) : (
                            <Tag>written into the code</Tag>
                          )
                      }
                    ]}
                  />
                </>
              )}

              {selected.inputsUsed.length > 0 && (
                <>
                  <Text strong>Inputs it depends on</Text>
                  <ul style={{ marginTop: 6, marginBottom: 14, paddingLeft: 18 }}>
                    {selected.inputsUsed.map(input => (
                      <li key={input.label} style={{ fontSize: 13 }}>
                        {input.label} — <Text type='secondary'>{input.value}</Text>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {selected.caveats.map(caveat => (
                <Alert key={caveat} type='warning' showIcon style={{ marginBottom: 6 }} message={caveat} />
              ))}
            </Card>
          )}
        </Col>
      </Row>
    </AdminLayout>
  );
}
