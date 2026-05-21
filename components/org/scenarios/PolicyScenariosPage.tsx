import {
  AimOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined
} from '@ant-design/icons';
import {
  Button,
  Card,
  Checkbox,
  Col,
  Empty,
  Input,
  InputNumber,
  Modal,
  Popover,
  Radio,
  Row,
  Select,
  Slider,
  Space,
  Tag,
  Typography
} from 'antd';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';

import { ImpactCard } from 'components/common/ImpactCard';
import { useCurrency } from 'components/_app/CurrencyProvider';
import { useMetricSystem } from 'components/_app/MetricSystemProvider';
import { formatToDollar } from 'lib/calculator/utils';
import type { AllProjectsSummary, ProjectSummary } from 'lib/calculator/getProjections';
import { valueInPounds } from 'lib/number';

import { getMultipliedSummary, type ScenarioMultipliers } from '../analytics/components/ScenarioPlanner';

const Line = dynamic(() => import('@ant-design/plots').then(r => r.Line), { ssr: false });

// ─── Scenario shape (extends v1 cr_scenarios entries with policy fields) ──────

type Annotation = { id: string; year: number; label: string };

type PolicyScenario = {
  id: string;
  name: string;
  multipliers: ScenarioMultipliers;
  excludedProjectIds?: string[];
  segmentFilter?: string[];
  annotations?: Annotation[];
};

function loadScenarios(orgId: string): PolicyScenario[] {
  try {
    return JSON.parse(localStorage.getItem(`cr_scenarios_${orgId}`) ?? '[]');
  } catch {
    return [];
  }
}

function writeScenarios(orgId: string, list: PolicyScenario[]) {
  localStorage.setItem(`cr_scenarios_${orgId}`, JSON.stringify(list));
  window.dispatchEvent(new Event('cr-scenarios-updated'));
}

// ─── Metric specs (shared between stat cards and timeline) ─────────────────────

type MetricKey = 'savings' | 'waste' | 'ghg' | 'singleUse';

const ALL_METRICS: { key: MetricKey; label: string }[] = [
  { key: 'savings', label: 'Savings' },
  { key: 'waste', label: 'Waste' },
  { key: 'ghg', label: 'GHG' },
  { key: 'singleUse', label: 'Single-Use' }
];

function metricValue(summary: AllProjectsSummary['summary'], key: MetricKey): { baseline: number; forecast: number } {
  if (key === 'savings') return summary.savings;
  if (key === 'waste') return summary.waste;
  if (key === 'ghg') return summary.gas;
  return summary.singleUse;
}

function formatMetric(key: MetricKey, value: number, ctx: { currency: string; displayAsMetric: boolean }): string {
  if (key === 'savings') return formatToDollar(value, ctx.currency);
  if (key === 'waste') {
    const lb = valueInPounds(value, { displayAsMetric: ctx.displayAsMetric, displayAsTons: false });
    return `${Math.round(lb).toLocaleString()} ${ctx.displayAsMetric ? 'kg' : 'lb'}`;
  }
  if (key === 'ghg') return `${value.toFixed(2)} MTCO₂e`;
  return `${Math.round(value).toLocaleString()} units`;
}

// ─── Main component ────────────────────────────────────────────────────────────

type Props = {
  data: AllProjectsSummary;
  orgId: string;
  isReadOnly?: boolean;
};

export function PolicyScenariosPage({ data, orgId, isReadOnly }: Props) {
  const displayAsMetric = useMetricSystem();
  const { abbreviation: currency } = useCurrency();

  // Scenario state
  const [savedScenarios, setSavedScenarios] = useState<PolicyScenario[]>([]);
  const [scenarioName, setScenarioName] = useState('Scenario 1');
  const [editingName, setEditingName] = useState(false);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [multipliers, setMultipliers] = useState<ScenarioMultipliers>({});
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [segmentFilter, setSegmentFilter] = useState<string[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);

  // Timeline state
  const [metric, setMetric] = useState<MetricKey>('savings');
  const [timelineYears, setTimelineYears] = useState<number>(10);
  const [markerYear, setMarkerYear] = useState<number>(3);
  const [pendingAnnotation, setPendingAnnotation] = useState<{ year: number; label: string } | null>(null);

  useEffect(() => {
    setSavedScenarios(loadScenarios(orgId));
    function refresh() {
      setSavedScenarios(loadScenarios(orgId));
    }
    window.addEventListener('storage', refresh);
    window.addEventListener('cr-scenarios-updated', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('cr-scenarios-updated', refresh);
    };
  }, [orgId]);

  // Segment options derived from project metadata.type
  const allSegments = useMemo(() => {
    const set = new Set<string>();
    data.projects.forEach(p => {
      const t = ((p as any).metadata?.type as string | undefined) ?? null;
      if (t) set.add(t);
    });
    return Array.from(set).sort();
  }, [data.projects]);

  // Projects that are visible in the scenario (segment-filtered, hidden excluded)
  const includedProjects = useMemo(() => {
    return data.projects.filter(p => {
      if (excludedIds.has(p.id)) return false;
      if (segmentFilter.length > 0) {
        const t = ((p as any).metadata?.type as string | undefined) ?? null;
        if (!t || !segmentFilter.includes(t)) return false;
      }
      return true;
    });
  }, [data.projects, excludedIds, segmentFilter]);

  const summary = useMemo(
    () => getMultipliedSummary(includedProjects, multipliers, 1),
    [includedProjects, multipliers]
  );

  // Optional comparison against another saved scenario. When set, stat cards
  // render the current scenario's net vs the picked scenario's net.
  const [compareScenarioId, setCompareScenarioId] = useState<string | null>(null);
  const compareScenario = useMemo(
    () => savedScenarios.find(s => s.id === compareScenarioId) ?? null,
    [savedScenarios, compareScenarioId]
  );
  const compareSummary = useMemo(() => {
    if (!compareScenario) return null;
    const filtered = data.projects.filter(p => {
      if ((compareScenario.excludedProjectIds ?? []).includes(p.id)) return false;
      const seg = compareScenario.segmentFilter ?? [];
      if (seg.length > 0) {
        const t = ((p as any).metadata?.type as string | undefined) ?? null;
        if (!t || !seg.includes(t)) return false;
      }
      return true;
    });
    return getMultipliedSummary(filtered, compareScenario.multipliers ?? {}, 1);
  }, [data.projects, compareScenario]);

  const hasChanges = excludedIds.size > 0 || segmentFilter.length > 0 || Object.values(multipliers).some(v => v !== 1);

  // ─── Mutations ───────────────────────────────────────────────────────────────

  function updateMultiplier(projectId: string, value: number) {
    setMultipliers(m => ({ ...m, [projectId]: value }));
  }

  function toggleExcluded(projectId: string) {
    setExcludedIds(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  }

  function reset() {
    setMultipliers({});
    setExcludedIds(new Set());
    setSegmentFilter([]);
    setAnnotations([]);
  }

  function persist(scenario: PolicyScenario) {
    const next = savedScenarios.some(s => s.id === scenario.id)
      ? savedScenarios.map(s => (s.id === scenario.id ? scenario : s))
      : [...savedScenarios, scenario];
    setSavedScenarios(next);
    writeScenarios(orgId, next);
  }

  function saveCurrent() {
    const id = activeScenarioId ?? Date.now().toString();
    setActiveScenarioId(id);
    persist({
      id,
      name: scenarioName,
      multipliers,
      excludedProjectIds: Array.from(excludedIds),
      segmentFilter,
      annotations
    });
  }

  function saveAsNew() {
    let copyName = `${scenarioName} (copy)`;
    Modal.confirm({
      title: 'Save as new scenario',
      content: (
        <Input
          placeholder='Scenario name'
          autoFocus
          defaultValue={copyName}
          onChange={e => {
            copyName = e.target.value;
          }}
        />
      ),
      onOk() {
        if (!copyName.trim()) return;
        const id = Date.now().toString();
        setActiveScenarioId(id);
        setScenarioName(copyName.trim());
        persist({
          id,
          name: copyName.trim(),
          multipliers,
          excludedProjectIds: Array.from(excludedIds),
          segmentFilter,
          annotations
        });
      },
      okText: 'Save',
      cancelText: 'Cancel'
    });
  }

  function loadScenario(id: string) {
    const s = savedScenarios.find(x => x.id === id);
    if (!s) return;
    setActiveScenarioId(id);
    setScenarioName(s.name);
    setMultipliers(s.multipliers ?? {});
    setExcludedIds(new Set(s.excludedProjectIds ?? []));
    setSegmentFilter(s.segmentFilter ?? []);
    setAnnotations(s.annotations ?? []);
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (data.projects.length === 0) {
    return (
      <Card style={{ marginTop: 24 }}>
        <Empty description='No projects yet — create a calculator first to model scenarios.' />
      </Card>
    );
  }

  return (
    <div style={{ paddingTop: 16 }}>
      <ScenarioHeader
        scenarioName={scenarioName}
        editingName={editingName}
        savedScenarios={savedScenarios}
        activeScenarioId={activeScenarioId}
        hasChanges={hasChanges}
        isReadOnly={isReadOnly}
        onEditName={setEditingName}
        onChangeName={setScenarioName}
        onLoad={loadScenario}
        onSave={saveCurrent}
        onSaveAs={saveAsNew}
        onReset={reset}
      />

      <ScenarioComparePicker
        savedScenarios={savedScenarios}
        compareScenarioId={compareScenarioId}
        onChange={setCompareScenarioId}
      />

      <ScenarioStatCards
        summary={summary}
        compareSummary={compareSummary}
        currentName={scenarioName}
        compareName={compareScenario?.name ?? null}
        currency={currency}
        displayAsMetric={displayAsMetric}
      />

      <ScenarioControls
        allSegments={allSegments}
        segmentFilter={segmentFilter}
        onSegmentFilterChange={setSegmentFilter}
        hiddenCount={excludedIds.size}
        totalCount={data.projects.length}
      />

      <ScenarioProjectList
        projects={data.projects}
        multipliers={multipliers}
        excludedIds={excludedIds}
        segmentFilter={segmentFilter}
        onMultiplierChange={updateMultiplier}
        onToggleExcluded={toggleExcluded}
        isReadOnly={isReadOnly}
      />

      <ScenarioTimelineChart
        projects={includedProjects}
        multipliers={multipliers}
        metric={metric}
        onMetricChange={setMetric}
        years={timelineYears}
        onYearsChange={setTimelineYears}
        markerYear={markerYear}
        onMarkerYearChange={setMarkerYear}
        annotations={annotations}
        onAddAnnotation={(year, label) => setAnnotations(a => [...a, { id: Date.now().toString(), year, label }])}
        onDeleteAnnotation={id => setAnnotations(a => a.filter(x => x.id !== id))}
        currency={currency}
        displayAsMetric={displayAsMetric}
        pendingAnnotation={pendingAnnotation}
        onSetPendingAnnotation={setPendingAnnotation}
      />
    </div>
  );
}

// ─── Sub: header (scenario name, save/load) ────────────────────────────────────

function ScenarioHeader({
  scenarioName,
  editingName,
  savedScenarios,
  activeScenarioId,
  hasChanges,
  isReadOnly,
  onEditName,
  onChangeName,
  onLoad,
  onSave,
  onSaveAs,
  onReset
}: {
  scenarioName: string;
  editingName: boolean;
  savedScenarios: PolicyScenario[];
  activeScenarioId: string | null;
  hasChanges: boolean;
  isReadOnly?: boolean;
  onEditName: (e: boolean) => void;
  onChangeName: (n: string) => void;
  onLoad: (id: string) => void;
  onSave: () => void;
  onSaveAs: () => void;
  onReset: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200 }}>
        {editingName ? (
          <Input
            value={scenarioName}
            autoFocus
            onChange={e => onChangeName(e.target.value)}
            onBlur={() => onEditName(false)}
            onPressEnter={() => onEditName(false)}
            style={{ fontWeight: 600, fontSize: 20, maxWidth: 320 }}
          />
        ) : (
          <Typography.Title
            level={3}
            style={{ margin: 0, cursor: isReadOnly ? 'default' : 'pointer' }}
            onClick={() => !isReadOnly && onEditName(true)}
          >
            {scenarioName}
            {!isReadOnly && <EditOutlined style={{ fontSize: 14, color: 'rgba(0,0,0,0.35)', marginLeft: 8 }} />}
          </Typography.Title>
        )}
      </div>

      {!isReadOnly && (
        <Space wrap>
          {savedScenarios.length > 0 && (
            <Select
              placeholder='Load saved scenario'
              style={{ width: 200 }}
              value={activeScenarioId ?? undefined}
              onSelect={(id: string) => onLoad(id)}
              options={savedScenarios.map(s => ({ label: s.name, value: s.id }))}
              allowClear
            />
          )}
          <Button type='primary' icon={<SaveOutlined />} onClick={onSave}>
            Save
          </Button>
          <Button icon={<SaveOutlined />} onClick={onSaveAs}>
            Save as new
          </Button>
          <Button icon={<ReloadOutlined />} onClick={onReset} disabled={!hasChanges}>
            Reset
          </Button>
        </Space>
      )}
    </div>
  );
}

// ─── Sub: compare picker ───────────────────────────────────────────────────────

function ScenarioComparePicker({
  savedScenarios,
  compareScenarioId,
  onChange
}: {
  savedScenarios: PolicyScenario[];
  compareScenarioId: string | null;
  onChange: (id: string | null) => void;
}) {
  if (savedScenarios.length === 0) return null;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
        marginBottom: 12,
        padding: '10px 14px',
        background: '#fafafa',
        borderRadius: 8
      }}
    >
      <Typography.Text type='secondary' style={{ fontSize: 12 }}>
        Compare against another scenario:
      </Typography.Text>
      <Select
        placeholder='Pick a scenario to compare'
        style={{ minWidth: 220 }}
        value={compareScenarioId ?? undefined}
        onChange={v => onChange(v ?? null)}
        options={savedScenarios.map(s => ({ label: s.name, value: s.id }))}
        allowClear
        size='small'
      />
      <Typography.Text type='secondary' style={{ fontSize: 11 }}>
        {compareScenarioId
          ? 'Stat cards below show current scenario vs the picked scenario.'
          : 'Pick a saved scenario to compare side-by-side.'}
      </Typography.Text>
    </div>
  );
}

// ─── Sub: stat cards ────────────────────────────────────────────────────────────

function ScenarioStatCards({
  summary,
  compareSummary,
  currentName,
  compareName,
  currency,
  displayAsMetric
}: {
  summary: AllProjectsSummary['summary'];
  compareSummary: AllProjectsSummary['summary'] | null;
  currentName: string;
  compareName: string | null;
  currency: string;
  displayAsMetric: boolean;
}) {
  const ctx = { currency, displayAsMetric };
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
      {ALL_METRICS.map(({ key, label }) => {
        const a = metricValue(summary, key);
        const aSavings = a.baseline - a.forecast;

        if (compareSummary && compareName) {
          const b = metricValue(compareSummary, key);
          const bSavings = b.baseline - b.forecast;
          const headline = bSavings - aSavings;
          const deltaPercent = aSavings !== 0 ? ((bSavings - aSavings) / Math.abs(aSavings)) * 100 : undefined;
          return (
            <Col key={key} xs={24} md={24} lg={12}>
              <ImpactCard
                label={label}
                headline={formatMetric(key, headline, ctx)}
                deltaPercent={deltaPercent}
                bars={[
                  { label: currentName, value: aSavings, formatted: formatMetric(key, aSavings, ctx) },
                  {
                    label: compareName,
                    value: bSavings,
                    formatted: formatMetric(key, bSavings, ctx),
                    color: '#73d13d'
                  }
                ]}
              />
            </Col>
          );
        }

        const deltaPercent = a.baseline !== 0 ? (aSavings / a.baseline) * 100 : undefined;
        return (
          <Col key={key} xs={24} md={24} lg={12}>
            <ImpactCard
              label={label}
              headline={formatMetric(key, aSavings, ctx)}
              deltaPercent={deltaPercent}
              bars={[
                { label: 'Baseline', value: a.baseline, formatted: formatMetric(key, a.baseline, ctx) },
                {
                  label: 'Forecast',
                  value: a.forecast,
                  formatted: formatMetric(key, a.forecast, ctx),
                  color: '#73d13d'
                }
              ]}
            />
          </Col>
        );
      })}
    </Row>
  );
}

// ─── Sub: controls (segment filter, hidden count) ──────────────────────────────

function ScenarioControls({
  allSegments,
  segmentFilter,
  onSegmentFilterChange,
  hiddenCount,
  totalCount
}: {
  allSegments: string[];
  segmentFilter: string[];
  onSegmentFilterChange: (s: string[]) => void;
  hiddenCount: number;
  totalCount: number;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
      <Select
        mode='multiple'
        placeholder='Filter by segment'
        style={{ minWidth: 240 }}
        value={segmentFilter}
        onChange={onSegmentFilterChange}
        options={allSegments.map(s => ({ label: s, value: s }))}
        allowClear
      />
      <Typography.Text type='secondary' style={{ fontSize: 12 }}>
        {hiddenCount > 0
          ? `${hiddenCount} of ${totalCount} projects hidden from this scenario`
          : `${totalCount} project${totalCount === 1 ? '' : 's'} in scenario`}
      </Typography.Text>
    </div>
  );
}

// ─── Sub: project list (checkbox + multiplier per project) ─────────────────────

function ScenarioProjectList({
  projects,
  multipliers,
  excludedIds,
  segmentFilter,
  onMultiplierChange,
  onToggleExcluded,
  isReadOnly
}: {
  projects: ProjectSummary[];
  multipliers: ScenarioMultipliers;
  excludedIds: Set<string>;
  segmentFilter: string[];
  onMultiplierChange: (id: string, n: number) => void;
  onToggleExcluded: (id: string) => void;
  isReadOnly?: boolean;
}) {
  // Show all projects (so user can re-include hidden ones), but dim the hidden
  // and segment-filtered-out ones.
  const rows = projects.map(p => {
    const type = ((p as any).metadata?.type as string | undefined) ?? 'Untyped';
    const hidden = excludedIds.has(p.id);
    const filteredOut = segmentFilter.length > 0 && !segmentFilter.includes(type);
    return { project: p, type, hidden, filteredOut };
  });

  return (
    <Card style={{ marginBottom: 16 }} bodyStyle={{ padding: 0 }}>
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f0',
          background: '#fafafa',
          display: 'grid',
          gridTemplateColumns: '32px 1fr 160px 110px',
          gap: 12,
          alignItems: 'center',
          fontSize: 11,
          color: 'rgba(0,0,0,0.45)',
          textTransform: 'uppercase',
          letterSpacing: '0.03em'
        }}
      >
        <span />
        <span>Project</span>
        <span>Segment</span>
        <span>Multiplier</span>
      </div>
      {rows.map(({ project, type, hidden, filteredOut }) => {
        const isInScenario = !hidden && !filteredOut;
        return (
          <div
            key={project.id}
            style={{
              padding: '10px 16px',
              borderBottom: '1px solid #f5f5f5',
              display: 'grid',
              gridTemplateColumns: '32px 1fr 160px 110px',
              gap: 12,
              alignItems: 'center',
              opacity: isInScenario ? 1 : 0.45
            }}
          >
            <Checkbox
              checked={isInScenario}
              disabled={isReadOnly || filteredOut}
              onChange={() => onToggleExcluded(project.id)}
            />
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <Typography.Text strong ellipsis style={{ maxWidth: '100%' }}>
                {project.name}
              </Typography.Text>
              <Typography.Text type='secondary' style={{ fontSize: 11 }}>
                {project.account?.name ?? ''}
              </Typography.Text>
            </div>
            <Tag style={{ width: 'fit-content' }}>{type}</Tag>
            <InputNumber
              min={1}
              max={100000}
              value={multipliers[project.id] ?? 1}
              onChange={v => onMultiplierChange(project.id, v ?? 1)}
              size='small'
              addonBefore='×'
              disabled={isReadOnly || !isInScenario}
              style={{ width: '100%' }}
            />
          </div>
        );
      })}
    </Card>
  );
}

// ─── Sub: timeline chart with marker + annotations ─────────────────────────────

function ScenarioTimelineChart({
  projects,
  multipliers,
  metric,
  onMetricChange,
  years,
  onYearsChange,
  markerYear,
  onMarkerYearChange,
  annotations,
  onAddAnnotation,
  onDeleteAnnotation,
  currency,
  displayAsMetric,
  pendingAnnotation,
  onSetPendingAnnotation
}: {
  projects: ProjectSummary[];
  multipliers: ScenarioMultipliers;
  metric: MetricKey;
  onMetricChange: (m: MetricKey) => void;
  years: number;
  onYearsChange: (y: number) => void;
  markerYear: number;
  onMarkerYearChange: (y: number) => void;
  annotations: Annotation[];
  onAddAnnotation: (year: number, label: string) => void;
  onDeleteAnnotation: (id: string) => void;
  currency: string;
  displayAsMetric: boolean;
  pendingAnnotation: { year: number; label: string } | null;
  onSetPendingAnnotation: (a: { year: number; label: string } | null) => void;
}) {
  // Annual delta per project for the chosen metric, scaled by multiplier.
  const annualPerProject = useMemo(() => {
    return projects.map(p => {
      const s = p.projections.annualSummary;
      const m = multipliers[p.id] ?? 1;
      if (metric === 'savings') return (s.dollarCost.baseline - s.dollarCost.forecast) * m;
      if (metric === 'waste') {
        const raw = s.wasteWeight.baseline - s.wasteWeight.forecast;
        return valueInPounds(raw, { displayAsMetric, displayAsTons: false }) * m;
      }
      if (metric === 'ghg')
        return (s.greenhouseGasEmissions.total.baseline - s.greenhouseGasEmissions.total.forecast) * m;
      return (s.singleUseProductCount.baseline - s.singleUseProductCount.forecast) * m;
    });
  }, [projects, multipliers, metric, displayAsMetric]);

  const annualTotalDelta = annualPerProject.reduce((a, b) => a + b, 0);

  // Cumulative net savings per year
  const chartData = useMemo(() => {
    const rows: Array<{ year: number; value: number; series: string }> = [];
    for (let y = 0; y <= years; y++) {
      rows.push({ year: y, value: parseFloat((annualTotalDelta * y).toFixed(2)), series: 'Net savings' });
    }
    return rows;
  }, [annualTotalDelta, years]);

  // SU vs reuse cumulative cost at markerYear (savings only)
  const markerReadout = useMemo(() => {
    if (metric !== 'savings') return null;
    let suCumulative = 0;
    let reuseCumulative = 0;
    for (const p of projects) {
      const m = multipliers[p.id] ?? 1;
      const s = p.projections.annualSummary;
      suCumulative += s.dollarCost.baseline * m * markerYear;
      reuseCumulative += s.dollarCost.forecast * m * markerYear;
    }
    return { su: suCumulative, reuse: reuseCumulative, savings: suCumulative - reuseCumulative };
  }, [projects, multipliers, markerYear, metric]);

  const ctx = { currency, displayAsMetric };
  const valueAtMarker = annualTotalDelta * markerYear;

  // Break-even: first year where cumulative net savings ≥ 0 (for savings metric)
  const breakEvenYear = useMemo(() => {
    if (metric !== 'savings') return null;
    // With purely annual deltas (no embodied cost), if annual is positive,
    // break-even is year 0; if negative, never within window.
    if (annualTotalDelta > 0) return 0;
    return null;
  }, [annualTotalDelta, metric]);

  const lineAnnotations = useMemo(() => {
    const list: any[] = [
      {
        type: 'lineX',
        xField: markerYear,
        style: { stroke: '#1677ff', lineWidth: 2 },
        label: { text: `Year ${markerYear}`, position: 'top', fill: '#1677ff' }
      }
    ];
    annotations.forEach(a => {
      list.push({
        type: 'lineX',
        xField: a.year,
        style: { stroke: '#722ed1', lineWidth: 1.5, lineDash: [4, 4] },
        label: { text: a.label, position: 'top-right', fill: '#722ed1' }
      });
    });
    if (breakEvenYear !== null) {
      list.push({
        type: 'lineY',
        yField: 0,
        style: { stroke: '#52c41a', lineWidth: 1, lineDash: [2, 4] },
        label: { text: 'Break-even', position: 'right', fill: '#52c41a' }
      });
    }
    return list;
  }, [markerYear, annotations, breakEvenYear]);

  return (
    <Card>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 12
        }}
      >
        <Typography.Title level={4} style={{ margin: 0 }}>
          Timeline
        </Typography.Title>
        <Space wrap>
          <Radio.Group
            value={metric}
            onChange={e => onMetricChange(e.target.value)}
            optionType='button'
            buttonStyle='outline'
            size='small'
            options={ALL_METRICS.map(m => ({ label: m.label, value: m.key }))}
          />
          <Select
            value={years}
            onChange={onYearsChange}
            size='small'
            style={{ width: 100 }}
            options={[1, 2, 3, 5, 10, 20].map(y => ({ label: `${y} yr`, value: y }))}
          />
          <Popover
            trigger='click'
            placement='bottomRight'
            title={`Add annotation at year ${markerYear}`}
            content={
              <div style={{ width: 240 }}>
                <Input
                  placeholder='Label (e.g. "Policy decision Q3")'
                  value={pendingAnnotation?.label ?? ''}
                  onChange={e => onSetPendingAnnotation({ year: markerYear, label: e.target.value })}
                />
                <Button
                  type='primary'
                  size='small'
                  style={{ marginTop: 8 }}
                  disabled={!pendingAnnotation?.label?.trim()}
                  onClick={() => {
                    if (pendingAnnotation?.label?.trim()) {
                      onAddAnnotation(markerYear, pendingAnnotation.label.trim());
                      onSetPendingAnnotation(null);
                    }
                  }}
                >
                  Add annotation
                </Button>
              </div>
            }
          >
            <Button size='small' icon={<PlusOutlined />}>
              Annotate
            </Button>
          </Popover>
        </Space>
      </div>

      <div style={{ height: 320 }}>
        <Line
          key={`${metric}-${years}-${annotations.length}-${projects.length}`}
          data={chartData}
          xField='year'
          yField='value'
          colorField='series'
          smooth={false}
          animate={false}
          point={{ shapeField: 'circle', sizeField: 4 }}
          annotations={lineAnnotations}
          axis={{
            y: { title: `Cumulative ${metric === 'savings' ? 'savings' : metric}` },
            x: { title: 'Year' }
          }}
          tooltip={{
            title: (d: any) => `Year ${d.year}`,
            items: [
              {
                field: 'value',
                name: ALL_METRICS.find(m => m.key === metric)?.label ?? '',
                valueFormatter: (v: number) => formatMetric(metric, v, ctx)
              }
            ]
          }}
        />
      </div>

      <div style={{ marginTop: 16, padding: '12px 16px', background: '#fafafa', borderRadius: 6 }}>
        <Typography.Text type='secondary' style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
          <AimOutlined /> Drag to compare at any year
        </Typography.Text>
        <Slider
          min={0}
          max={years}
          value={markerYear}
          onChange={onMarkerYearChange}
          marks={Object.fromEntries(
            Array.from({ length: years + 1 }, (_, i) => [
              i,
              i % Math.max(1, Math.floor(years / 5)) === 0 ? String(i) : ''
            ])
          )}
        />
        <div style={{ marginTop: 8 }}>
          <Typography.Text strong>
            At year {markerYear}: {formatMetric(metric, valueAtMarker, ctx)}
          </Typography.Text>
          {markerReadout && (
            <Typography.Paragraph type='secondary' style={{ fontSize: 12, marginBottom: 0, marginTop: 4 }}>
              Single-use cumulative: {formatToDollar(markerReadout.su, currency)} · Reusable cumulative:{' '}
              {formatToDollar(markerReadout.reuse, currency)} · You saved{' '}
              {formatToDollar(markerReadout.savings, currency)}
            </Typography.Paragraph>
          )}
        </div>
      </div>

      {annotations.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <Typography.Text type='secondary' style={{ fontSize: 12 }}>
            Saved annotations:
          </Typography.Text>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
            {annotations.map(a => (
              <Tag
                key={a.id}
                closable
                onClose={() => onDeleteAnnotation(a.id)}
                color='purple'
                style={{ cursor: 'pointer' }}
                onClick={() => onMarkerYearChange(a.year)}
              >
                Year {a.year}: {a.label}
              </Tag>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
