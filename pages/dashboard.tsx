import {
  AppstoreOutlined,
  ArrowRightOutlined,
  BankOutlined,
  BookOutlined,
  DashboardOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  PlusOutlined,
  RocketOutlined,
  SettingOutlined,
  ShopOutlined,
  StarFilled
} from '@ant-design/icons';
import { Button, Card, Checkbox, Col, Drawer, Empty, Progress, Row, Select, Space, Tag, Typography } from 'antd';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { ImpactCard } from 'components/common/ImpactCard';
import type { DashboardUser } from 'interfaces';
import { DashboardLayout as Template } from 'layouts/DashboardLayout/DashboardLayout';
import { getAllProjections } from 'lib/calculator/getProjections';
import type { AllProjectsSummary, ProjectSummary } from 'lib/calculator/getProjections';
import { formatToDollar } from 'lib/calculator/utils';
import { getUserFromContext } from 'lib/middleware';
import { valueInPounds } from 'lib/number';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';

const { Title, Text, Paragraph } = Typography;

const STORAGE_KEY = 'chart-reuse-2-dashboard-widgets';

const ALL_WIDGETS = [
  {
    id: 'impact',
    label: 'Impact KPIs',
    description: 'Headline numbers across your projects (cost, single-use, waste, GHG)'
  },
  {
    id: 'personas',
    label: 'Get Started',
    description: 'Persona-targeted invitations to Calculators, Reports, and Scenarios'
  },
  { id: 'calculators', label: 'Recent Calculators', description: 'Recently updated projects with quick open' },
  { id: 'scenarios', label: 'Saved Scenarios', description: 'Recently saved scenarios you can revisit or compare' },
  { id: 'preview', label: 'Featured Dashboard', description: 'Preview of a publicly shared project' },
  { id: 'new', label: 'New & Coming Soon', description: 'New tools, reports, white papers, features' }
] as const;

type WidgetId = (typeof ALL_WIDGETS)[number]['id'];
const DEFAULT_WIDGETS: WidgetId[] = ['impact', 'personas', 'calculators', 'scenarios', 'preview', 'new'];

type Props = {
  user: DashboardUser;
  data: AllProjectsSummary;
  recentProjects: Array<{
    id: string;
    name: string;
    category: string;
    updatedAt: string;
    accountName: string | null;
    publicSlug: string | null;
  }>;
  totalProjects: number;
  totalAccounts: number;
  totalUsagePeriods: number;
  hasProjections: boolean;
};

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user) return { notFound: true };

  const [projects, totalAccounts, totalUsagePeriods] = await Promise.all([
    prisma.project.findMany({
      where: {
        accountId: user.accountId || undefined,
        orgId: user.org.id,
        isTemplate: false
      },
      include: { account: true, org: true, tags: true },
      orderBy: { updatedAt: 'desc' }
    }),
    prisma.account.count({ where: { orgId: user.org.id } }),
    prisma.usageTimePeriod.count({ where: { orgId: user.org.id } })
  ]);

  const data = await getAllProjections(projects);
  const hasProjections = projects.some(p => p.category !== 'event');

  const recentProjects = projects.slice(0, 5).map(p => ({
    id: p.id,
    name: p.name || 'Untitled',
    category: p.category,
    updatedAt: p.updatedAt.toISOString(),
    accountName: p.account?.name ?? null,
    publicSlug: p.publicSlug ?? null
  }));

  return {
    props: serializeJSON({
      user,
      data,
      recentProjects,
      totalProjects: projects.length,
      totalAccounts,
      totalUsagePeriods,
      hasProjections
    })
  };
};

function DashboardPage({
  user,
  data,
  recentProjects,
  totalProjects,
  totalAccounts,
  totalUsagePeriods,
  hasProjections
}: Props) {
  const [enabledWidgets, setEnabledWidgets] = useState<WidgetId[]>(DEFAULT_WIDGETS);
  const [hydrated, setHydrated] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setEnabledWidgets(parsed.filter((id: string) => ALL_WIDGETS.some(w => w.id === id)) as WidgetId[]);
        }
      }
    } catch {}
    setHydrated(true);
  }, []);

  function toggleWidget(id: WidgetId) {
    const next = enabledWidgets.includes(id) ? enabledWidgets.filter(w => w !== id) : [...enabledWidgets, id];
    setEnabledWidgets(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }

  const isOn = (id: WidgetId) => enabledWidgets.includes(id);

  return (
    <div style={{ padding: 24, maxWidth: 1400 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <DashboardOutlined style={{ fontSize: 28, color: '#722ed1', marginTop: 4 }} />
        <div style={{ flex: 1, minWidth: 240 }}>
          <Title level={2} style={{ margin: 0 }}>
            Welcome back, {user.name?.split(' ')[0] ?? 'there'}
          </Title>
          <Text type='secondary'>
            {user.org.name} · {totalProjects} calculator{totalProjects === 1 ? '' : 's'} · {totalAccounts} account
            {totalAccounts === 1 ? '' : 's'}
            {totalUsagePeriods > 0 && ` · ${totalUsagePeriods} RSP period${totalUsagePeriods === 1 ? '' : 's'}`}
          </Text>
        </div>
        <Tag color='purple' style={{ marginTop: 8 }}>
          Chart-Reuse 2.0
        </Tag>
        <Button icon={<SettingOutlined />} onClick={() => setCustomizeOpen(true)} style={{ marginTop: 4 }}>
          Customize
        </Button>
      </div>

      <Space direction='vertical' size={32} style={{ width: '100%' }}>
        {hydrated && isOn('impact') && (
          <ImpactKPIs
            data={data}
            hasProjections={hasProjections}
            totalProjects={totalProjects}
            currency={user.org.currency || 'USD'}
            orgId={user.org.id}
          />
        )}
        {hydrated && isOn('personas') && <PersonaInvitations />}
        {hydrated && isOn('calculators') && <CalculatorsWidget recentProjects={recentProjects} />}
        {hydrated && isOn('scenarios') && <ScenariosWidget orgId={user.org.id} />}
        {hydrated && isOn('preview') && <DashboardPreviewWidget recentProjects={recentProjects} />}
        {hydrated && isOn('new') && <NewAndComingWidget />}
        {hydrated && enabledWidgets.length === 0 && (
          <Empty description='No widgets enabled — click "Customize" to add some.' style={{ padding: 48 }} />
        )}
      </Space>

      <Drawer title='Customize your dashboard' open={customizeOpen} onClose={() => setCustomizeOpen(false)} width={400}>
        <Paragraph type='secondary' style={{ fontSize: 12 }}>
          Pick which sections appear. Saved per device. Drag-to-reorder is coming soon.
        </Paragraph>
        <Space direction='vertical' size={12} style={{ width: '100%' }}>
          {ALL_WIDGETS.map(w => (
            <Card key={w.id} size='small'>
              <Checkbox checked={enabledWidgets.includes(w.id)} onChange={() => toggleWidget(w.id)}>
                <strong>{w.label}</strong>
                <br />
                <Text type='secondary' style={{ fontSize: 11 }}>
                  {w.description}
                </Text>
              </Checkbox>
            </Card>
          ))}
        </Space>
      </Drawer>
    </div>
  );
}

DashboardPage.getLayout = (page: React.ReactNode, pageProps: any) => (
  <Template {...pageProps} selectedMenuItem='dashboard' title='Analytics'>
    {page}
  </Template>
);

// ─── KPI row — stats-only with click-to-drill-down ──────────────────────────

type MetricKey = 'savings' | 'singleUse' | 'waste' | 'gas';

type MetricSpec = {
  key: MetricKey;
  label: string;
  units?: string;
  formatter: (val: number) => string;
  getProjectBaseline: (p: ProjectSummary) => number;
  getProjectForecast: (p: ProjectSummary) => number;
  visibleFor: (isEventOnly: boolean) => boolean;
};

function buildMetricSpecs(currency: string): MetricSpec[] {
  const lbs = (val: number) => Math.round(valueInPounds(val, { displayAsMetric: false, displayAsTons: false }));
  return [
    {
      key: 'savings',
      label: 'Your estimated annual savings',
      formatter: val => formatToDollar(val, currency),
      getProjectBaseline: p => p.projections.annualSummary.dollarCost.baseline,
      getProjectForecast: p => p.projections.annualSummary.dollarCost.forecast,
      visibleFor: isEventOnly => !isEventOnly
    },
    {
      key: 'singleUse',
      label: 'Single-use reduction',
      units: 'units',
      formatter: val => Math.round(val).toLocaleString(),
      getProjectBaseline: p => p.projections.singleUseResults.summary.annualUnits.baseline,
      getProjectForecast: p => p.projections.singleUseResults.summary.annualUnits.forecast,
      visibleFor: isEventOnly => !isEventOnly
    },
    {
      key: 'waste',
      label: 'Waste reduction',
      units: 'lbs',
      formatter: val => `${lbs(val).toLocaleString()}`,
      getProjectBaseline: p => p.projections.annualSummary.wasteWeight.baseline,
      getProjectForecast: p => p.projections.annualSummary.wasteWeight.forecast,
      visibleFor: () => true
    },
    {
      key: 'gas',
      label: 'GHG avoided',
      units: 'MTCO₂e',
      formatter: val => val.toFixed(2),
      getProjectBaseline: p => p.projections.annualSummary.greenhouseGasEmissions.total.baseline,
      getProjectForecast: p => p.projections.annualSummary.greenhouseGasEmissions.total.forecast,
      visibleFor: () => true
    }
  ];
}

// Per-project location multipliers + filters (mirrors PolicyScenario shape so
// we can read scenarios saved on /scenarios out of localStorage)
type SavedScenario = {
  id: string;
  name: string;
  multipliers?: Record<string, number>;
  excludedProjectIds?: string[];
  segmentFilter?: string[];
};

function applyScenario(
  projects: ProjectSummary[],
  scenario: SavedScenario | null,
  spec: MetricSpec
): { baseline: number; forecast: number } {
  let baseline = 0;
  let forecast = 0;
  const multipliers = scenario?.multipliers ?? {};
  const excludedIds = new Set(scenario?.excludedProjectIds ?? []);
  const segmentFilter = scenario?.segmentFilter ?? [];

  for (const p of projects) {
    if (excludedIds.has(p.id)) continue;
    if (segmentFilter.length > 0) {
      const type = ((p as any).metadata?.type as string | undefined) ?? null;
      if (!type || !segmentFilter.includes(type)) continue;
    }
    const m = multipliers[p.id] ?? 1;
    baseline += spec.getProjectBaseline(p) * m;
    forecast += spec.getProjectForecast(p) * m;
  }
  return { baseline, forecast };
}

function ImpactKPIs({
  data,
  hasProjections,
  totalProjects,
  currency,
  orgId
}: {
  data: AllProjectsSummary;
  hasProjections: boolean;
  totalProjects: number;
  currency: string;
  orgId: string;
}) {
  const projectHasData = totalProjects > 0;
  const isEventOnly = !hasProjections;
  const specs = useMemo(
    () => buildMetricSpecs(currency).filter(s => s.visibleFor(isEventOnly)),
    [currency, isEventOnly]
  );
  const [activeMetric, setActiveMetric] = useState<MetricSpec | null>(null);

  // Saved scenarios (read live from localStorage so the picker reflects what
  // the user saved on /scenarios — no SSR roundtrip needed).
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  useEffect(() => {
    function load() {
      try {
        setSavedScenarios(JSON.parse(localStorage.getItem(`cr_scenarios_${orgId}`) ?? '[]'));
      } catch {
        setSavedScenarios([]);
      }
    }
    load();
    window.addEventListener('storage', load);
    window.addEventListener('cr-scenarios-updated', load);
    return () => {
      window.removeEventListener('storage', load);
      window.removeEventListener('cr-scenarios-updated', load);
    };
  }, [orgId]);

  const [scenarioAId, setScenarioAId] = useState<string | null>(null);
  const [scenarioBId, setScenarioBId] = useState<string | null>(null);
  const scenarioA = useMemo(
    () => savedScenarios.find(s => s.id === scenarioAId) ?? null,
    [savedScenarios, scenarioAId]
  );
  const scenarioB = useMemo(
    () => savedScenarios.find(s => s.id === scenarioBId) ?? null,
    [savedScenarios, scenarioBId]
  );
  const compareMode = !!scenarioA && !!scenarioB;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 12,
          flexWrap: 'wrap',
          gap: 12
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          Your Impact
        </Title>
        <Link href='/org/analytics'>
          <Button type='link' size='small'>
            Open full Reporting <ArrowRightOutlined />
          </Button>
        </Link>
      </div>

      {savedScenarios.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
            marginBottom: 16,
            padding: '10px 14px',
            background: '#fafafa',
            borderRadius: 8
          }}
        >
          <Text type='secondary' style={{ fontSize: 12 }}>
            Compare scenarios:
          </Text>
          <Select
            placeholder='Scenario A'
            style={{ minWidth: 180 }}
            value={scenarioAId ?? undefined}
            onChange={v => setScenarioAId(v ?? null)}
            options={savedScenarios.map(s => ({ label: s.name, value: s.id }))}
            allowClear
            size='small'
          />
          <Text type='secondary'>vs</Text>
          <Select
            placeholder='Scenario B'
            style={{ minWidth: 180 }}
            value={scenarioBId ?? undefined}
            onChange={v => setScenarioBId(v ?? null)}
            options={savedScenarios.map(s => ({ label: s.name, value: s.id }))}
            allowClear
            size='small'
          />
          {(scenarioAId || scenarioBId) && (
            <Button
              size='small'
              type='text'
              onClick={() => {
                setScenarioAId(null);
                setScenarioBId(null);
              }}
            >
              Clear
            </Button>
          )}
          <Text type='secondary' style={{ fontSize: 11 }}>
            {compareMode
              ? 'Showing Scenario A vs Scenario B'
              : scenarioA || scenarioB
                ? 'Showing scenario’s baseline vs reusable'
                : 'No scenarios picked — showing org baseline vs reusable'}
          </Text>
        </div>
      )}

      <Row gutter={[16, 16]}>
        {specs.map(spec => {
          const lg = specs.length <= 2 ? 12 : specs.length === 3 ? 8 : 6;

          let bars: [{ label: string; value: number; formatted: string; color?: string }, any];
          let headlineValue = 0;
          let deltaPercent: number | undefined;

          if (compareMode && scenarioA && scenarioB) {
            const a = applyScenario(data.projects, scenarioA, spec);
            const b = applyScenario(data.projects, scenarioB, spec);
            const aSavings = a.baseline - a.forecast;
            const bSavings = b.baseline - b.forecast;
            headlineValue = bSavings - aSavings;
            deltaPercent = aSavings !== 0 ? ((bSavings - aSavings) / Math.abs(aSavings)) * 100 : undefined;
            bars = [
              { label: scenarioA.name, value: aSavings, formatted: spec.formatter(aSavings) },
              { label: scenarioB.name, value: bSavings, formatted: spec.formatter(bSavings), color: '#73d13d' }
            ];
          } else {
            const active = scenarioA ?? scenarioB ?? null;
            const totals = applyScenario(data.projects, active, spec);
            const savings = totals.baseline - totals.forecast;
            headlineValue = savings;
            deltaPercent = totals.baseline !== 0 ? (savings / totals.baseline) * 100 : undefined;
            bars = [
              { label: 'Baseline', value: totals.baseline, formatted: spec.formatter(totals.baseline) },
              {
                label: 'Forecast',
                value: totals.forecast,
                formatted: spec.formatter(totals.forecast),
                color: '#73d13d'
              }
            ];
          }

          return (
            <Col key={spec.key} xs={24} md={12} lg={lg}>
              <ImpactCard
                label={spec.label}
                headline={
                  projectHasData ? (
                    <>
                      {spec.formatter(headlineValue)}
                      {spec.units && (
                        <span style={{ fontSize: '.55em', fontWeight: 400, marginLeft: 6 }}>{spec.units}</span>
                      )}
                    </>
                  ) : (
                    'N/A'
                  )
                }
                deltaPercent={projectHasData ? deltaPercent : undefined}
                bars={bars}
                onClick={projectHasData ? () => setActiveMetric(spec) : undefined}
                clickHint='Click for project breakdown'
              />
            </Col>
          );
        })}
      </Row>
      <ImpactDrilldown metric={activeMetric} projects={data.projects} onClose={() => setActiveMetric(null)} />
    </div>
  );
}

function ImpactDrilldown({
  metric,
  projects,
  onClose
}: {
  metric: MetricSpec | null;
  projects: ProjectSummary[];
  onClose: () => void;
}) {
  const contributions = useMemo(() => {
    if (!metric) return [];
    return projects
      .map(p => ({
        id: p.id,
        name: p.name || 'Untitled',
        accountName: p.account?.name ?? '',
        type: ((p as any).metadata?.type as string | undefined) ?? 'Untyped',
        delta: metric.getProjectBaseline(p) - metric.getProjectForecast(p)
      }))
      .filter(c => c.delta !== 0)
      .sort((a, b) => b.delta - a.delta);
  }, [metric, projects]);

  const total = contributions.reduce((acc, c) => acc + c.delta, 0);
  const maxAbs = contributions.reduce((acc, c) => Math.max(acc, Math.abs(c.delta)), 0);
  const top3Sum = contributions.slice(0, 3).reduce((acc, c) => acc + c.delta, 0);
  const top3Share = total !== 0 ? Math.round((top3Sum / total) * 100) : 0;

  const segments = useMemo(() => {
    const grouped = new Map<string, number>();
    contributions.forEach(c => grouped.set(c.type, (grouped.get(c.type) ?? 0) + c.delta));
    return Array.from(grouped.entries())
      .map(([type, delta]) => ({ type, delta, share: total !== 0 ? (delta / total) * 100 : 0 }))
      .sort((a, b) => b.delta - a.delta);
  }, [contributions, total]);

  return (
    <Drawer open={!!metric} onClose={onClose} title={metric?.label ?? ''} width={560} destroyOnClose>
      {metric && contributions.length > 0 ? (
        <>
          <Card size='small' style={{ marginBottom: 16, background: '#fafafa' }}>
            <Space direction='vertical' size={4} style={{ width: '100%' }}>
              <Text type='secondary' style={{ fontSize: 12 }}>
                Total across {contributions.length} project{contributions.length === 1 ? '' : 's'}
              </Text>
              <Title level={3} style={{ margin: 0 }}>
                {metric.formatter(total)}{' '}
                {metric.units && <span style={{ fontSize: '.6em', fontWeight: 400 }}>{metric.units}</span>}
              </Title>
              <Text>
                Top 3 project{contributions.length < 3 ? 's' : 's'} account for <strong>{top3Share}%</strong> of the
                total
                {top3Share >= 80
                  ? ' — savings are concentrated.'
                  : top3Share >= 50
                    ? ' — savings are moderately concentrated.'
                    : ' — savings are spread across many projects.'}
              </Text>
            </Space>
          </Card>

          <Title level={5}>By project</Title>
          <Space direction='vertical' size={8} style={{ width: '100%' }}>
            {contributions.map(c => (
              <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <Link
                    href={`/projects/${c.id}`}
                    style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {c.name}
                  </Link>
                  <Text style={{ whiteSpace: 'nowrap' }}>{metric.formatter(c.delta)}</Text>
                </div>
                <Progress
                  percent={maxAbs > 0 ? Math.max(2, Math.round((Math.abs(c.delta) / maxAbs) * 100)) : 0}
                  showInfo={false}
                  strokeColor='#52c41a'
                  size='small'
                />
                <Text type='secondary' style={{ fontSize: 11 }}>
                  {c.accountName} · {c.type}
                </Text>
              </div>
            ))}
          </Space>

          {segments.length > 1 && (
            <>
              <Title level={5} style={{ marginTop: 24 }}>
                By segment
              </Title>
              <Space direction='vertical' size={8} style={{ width: '100%' }}>
                {segments.map(s => (
                  <div key={s.type} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <Text strong>{s.type}</Text>
                      <Text>
                        {metric.formatter(s.delta)} ({Math.round(s.share)}%)
                      </Text>
                    </div>
                    <Progress
                      percent={Math.max(2, Math.round(s.share))}
                      showInfo={false}
                      strokeColor='#1677ff'
                      size='small'
                    />
                  </div>
                ))}
              </Space>
            </>
          )}
        </>
      ) : (
        <Empty description='No project contributions to show yet.' />
      )}
    </Drawer>
  );
}

// ─── Persona invitations ────────────────────────────────────────────────────

function PersonaInvitations() {
  const personas = [
    {
      key: 'venue',
      icon: <ShopOutlined style={{ fontSize: 28, color: '#fff' }} />,
      title: 'Food venue operator',
      pitch: 'Make the case for switching from single-use to reuse — model cost, waste, GHG, and payback.',
      cta: 'Learn how to create a calculator',
      href: '/tutorials/calculator',
      gradient: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
      accent: '#52c41a'
    },
    {
      key: 'rsp',
      icon: <BankOutlined style={{ fontSize: 28, color: '#fff' }} />,
      title: 'Reuse Service Provider',
      pitch: 'Show your clients’ impact with reports built on real ingestion data — GHG, water, waste, cost.',
      cta: 'Learn how to generate a report',
      href: '/tutorials/report',
      gradient: 'linear-gradient(135deg, #1677ff 0%, #0958d9 100%)',
      accent: '#1677ff'
    },
    {
      key: 'gov',
      icon: <ExperimentOutlined style={{ fontSize: 28, color: '#fff' }} />,
      title: 'Government analyst',
      pitch: 'Model policy outcomes by building scenarios across locations and timelines, then compare them.',
      cta: 'Learn how to build a scenario',
      href: '/tutorials/scenario',
      gradient: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
      accent: '#722ed1'
    }
  ];

  return (
    <div>
      <Title level={4} style={{ margin: '0 0 12px 0' }}>
        Get started
      </Title>
      <Row gutter={[16, 16]}>
        {personas.map(p => (
          <Col xs={24} md={8} key={p.key}>
            <Link href={p.href} style={{ display: 'block', height: '100%' }}>
              <Card
                hoverable
                style={{
                  height: '100%',
                  border: `1px solid ${p.accent}40`,
                  borderRadius: 12,
                  overflow: 'hidden',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
                bodyStyle={{ padding: 0 }}
              >
                <div style={{ background: p.gradient, padding: '20px 24px' }}>
                  <Space direction='vertical' size={4}>
                    {p.icon}
                    <Text
                      style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600, letterSpacing: 0.5 }}
                    >
                      ARE YOU A
                    </Text>
                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>{p.title}?</Text>
                  </Space>
                </div>
                <div style={{ padding: '16px 24px 20px' }}>
                  <Paragraph style={{ fontSize: 13, color: '#595959', minHeight: 60, marginBottom: 16 }}>
                    {p.pitch}
                  </Paragraph>
                  <Button type='primary' style={{ background: p.accent, borderColor: p.accent }}>
                    {p.cta} <ArrowRightOutlined />
                  </Button>
                </div>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
    </div>
  );
}

// ─── Secondary widgets ──────────────────────────────────────────────────────

function CalculatorsWidget({ recentProjects }: { recentProjects: Props['recentProjects'] }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <Title level={4} style={{ margin: 0 }}>
          <AppstoreOutlined style={{ marginRight: 8 }} />
          Recent Calculators
        </Title>
        <Link href='/projects'>
          <Button type='link' size='small'>
            View all <ArrowRightOutlined />
          </Button>
        </Link>
      </div>
      {recentProjects.length === 0 ? (
        <Card>
          <Empty
            description={
              <Space direction='vertical'>
                <Text type='secondary'>No calculators yet</Text>
                <Link href='/projects/new'>
                  <Button type='primary' icon={<PlusOutlined />}>
                    Create your first calculator
                  </Button>
                </Link>
              </Space>
            }
          />
        </Card>
      ) : (
        <Row gutter={[12, 12]}>
          {recentProjects.map(p => (
            <Col xs={24} sm={12} lg={8} key={p.id}>
              <Link href={`/projects/${p.id}/projections`}>
                <Card hoverable size='small'>
                  <Space direction='vertical' size={2} style={{ width: '100%' }}>
                    <Space wrap size={4}>
                      <Tag color={p.category === 'event' ? 'blue' : 'green'} style={{ marginRight: 0 }}>
                        {p.category}
                      </Tag>
                      {p.publicSlug && <Tag color='gold'>shared</Tag>}
                    </Space>
                    <Text strong style={{ fontSize: 14 }}>
                      {p.name}
                    </Text>
                    {p.accountName && (
                      <Text type='secondary' style={{ fontSize: 11 }}>
                        {p.accountName}
                      </Text>
                    )}
                    <Text type='secondary' style={{ fontSize: 11 }}>
                      Updated {new Date(p.updatedAt).toLocaleDateString()}
                    </Text>
                  </Space>
                </Card>
              </Link>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}

function ScenariosWidget({ orgId }: { orgId: string }) {
  const [scenarioCount, setScenarioCount] = useState<number | null>(null);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(`cr_scenarios_${orgId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        setScenarioCount(Array.isArray(parsed) ? parsed.length : 0);
      } else {
        setScenarioCount(0);
      }
    } catch {
      setScenarioCount(0);
    }
  }, [orgId]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <Title level={4} style={{ margin: 0 }}>
          <RocketOutlined style={{ marginRight: 8 }} />
          Saved Scenarios
        </Title>
        <Link href='/scenarios'>
          <Button type='link' size='small'>
            Plan or compare <ArrowRightOutlined />
          </Button>
        </Link>
      </div>
      <Card>
        <Row align='middle' gutter={24}>
          <Col xs={24} md={8}>
            <Title level={1} style={{ margin: 0, color: '#722ed1' }}>
              {scenarioCount ?? '—'}
            </Title>
            <Text type='secondary'>scenarios saved on this device</Text>
          </Col>
          <Col xs={24} md={16}>
            <Paragraph style={{ fontSize: 13, marginBottom: 0 }}>
              Scenarios scale your existing projects across locations and timeframes — useful for making the case for
              policy changes or measuring the impact of expanding a successful pilot. Open the Scenarios tab to compare
              multiple scenarios side-by-side.
            </Paragraph>
          </Col>
        </Row>
      </Card>
    </div>
  );
}

function DashboardPreviewWidget({ recentProjects }: { recentProjects: Props['recentProjects'] }) {
  const shareable = recentProjects.find(p => p.publicSlug);
  return (
    <div>
      <Title level={4} style={{ margin: '0 0 12px 0' }}>
        <StarFilled style={{ marginRight: 8, color: '#faad14' }} />
        Featured Dashboard
      </Title>
      <Card>
        {shareable ? (
          <Row align='middle' gutter={16}>
            <Col xs={24} md={16}>
              <Text strong style={{ fontSize: 16 }}>
                {shareable.name}
              </Text>
              {shareable.accountName && (
                <Paragraph type='secondary' style={{ fontSize: 12, marginTop: 4, marginBottom: 8 }}>
                  {shareable.accountName}
                </Paragraph>
              )}
              <Text type='secondary' style={{ fontSize: 12 }}>
                Public link: <code style={{ fontSize: 11 }}>/share/p/{shareable.publicSlug}</code>
              </Text>
            </Col>
            <Col xs={24} md={8} style={{ textAlign: 'right' }}>
              <Space>
                <Link href={`/share/p/${shareable.publicSlug}`} target='_blank'>
                  <Button>Open shared view</Button>
                </Link>
                <Link href={`/projects/${shareable.id}/projections`}>
                  <Button type='primary'>Edit project</Button>
                </Link>
              </Space>
            </Col>
          </Row>
        ) : (
          <Empty
            description={
              <Space direction='vertical' size={4}>
                <Text type='secondary'>No shared dashboards yet</Text>
                <Text type='secondary' style={{ fontSize: 12 }}>
                  Open a calculator and toggle public sharing to feature it here.
                </Text>
              </Space>
            }
          />
        )}
      </Card>
    </div>
  );
}

function NewAndComingWidget() {
  const items = [
    {
      icon: <RocketOutlined style={{ color: '#722ed1' }} />,
      title: 'RSP Ingestion Model',
      description: 'Per-period impact for service providers with material-aware factors, wash + transport modeling',
      href: '/admin/data-science/data-products',
      badge: 'New'
    },
    {
      icon: <BookOutlined style={{ color: '#1677ff' }} />,
      title: 'Data Product Designer',
      description: 'Build new calculators and reports with AI-assisted flow generation',
      href: '/admin/data-science/data-products',
      badge: 'Beta'
    },
    {
      icon: <FileTextOutlined style={{ color: '#52c41a' }} />,
      title: 'Venue Benchmarking',
      description: 'Compare your impact against similar venues by category',
      href: null,
      badge: 'Coming soon'
    }
  ];

  return (
    <div>
      <Title level={4} style={{ margin: '0 0 12px 0' }}>
        New & Coming Soon
      </Title>
      <Row gutter={[16, 16]}>
        {items.map((item, idx) => {
          const card = (
            <Card hoverable={!!item.href} size='small' style={{ height: '100%', opacity: item.href ? 1 : 0.75 }}>
              <Space direction='vertical' size={6} style={{ width: '100%' }}>
                <Space>
                  {item.icon}
                  <Text strong>{item.title}</Text>
                  {item.badge && (
                    <Tag color={item.badge === 'Coming soon' ? 'default' : item.badge === 'New' ? 'purple' : 'cyan'}>
                      {item.badge}
                    </Tag>
                  )}
                </Space>
                <Text type='secondary' style={{ fontSize: 12 }}>
                  {item.description}
                </Text>
              </Space>
            </Card>
          );
          return (
            <Col xs={24} md={8} key={idx}>
              {item.href ? <Link href={item.href}>{card}</Link> : card}
            </Col>
          );
        })}
      </Row>
    </div>
  );
}

export default DashboardPage;
