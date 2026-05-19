import { EditOutlined, GlobalOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import { Button, Card, Col, Divider, Input, InputNumber, Modal, Row, Select, Space, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { useCurrency } from 'components/_app/CurrencyProvider';
import { useMetricSystem } from 'components/_app/MetricSystemProvider';
import { formatToDollar } from 'lib/calculator/utils';
import type { AllProjectsSummary, ProjectSummary, SummaryValues } from 'lib/calculator/getProjections';
import { valueInPounds } from 'lib/number';

// ─── Types ─────────────────────────────────────────────────────────────────

export type ScenarioMultipliers = Record<string, number>; // projectId → locations

type Scenario = {
  id: string;
  name: string;
  multipliers: ScenarioMultipliers;
};

// ─── LocalStorage hook ───────────────────────────────────────────────────────

function useScenarios(orgId: string) {
  const key = `cr_scenarios_${orgId}`;

  function load(): Scenario[] {
    try {
      return JSON.parse(localStorage.getItem(key) ?? '[]');
    } catch {
      return [];
    }
  }

  // Start empty so server-rendered HTML matches the client's first paint.
  // Saved scenarios are read in useEffect (after hydration), then sync on storage events.
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  useEffect(() => {
    setScenarios(load());
    function onUpdate() {
      setScenarios(load());
    }
    window.addEventListener('storage', onUpdate);
    window.addEventListener('cr-scenarios-updated', onUpdate);
    return () => {
      window.removeEventListener('storage', onUpdate);
      window.removeEventListener('cr-scenarios-updated', onUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  function save(list: Scenario[]) {
    localStorage.setItem(key, JSON.stringify(list));
    setScenarios(list);
    window.dispatchEvent(new Event('cr-scenarios-updated'));
  }

  function upsert(s: Scenario) {
    const existing = scenarios.find(x => x.id === s.id);
    save(existing ? scenarios.map(x => (x.id === s.id ? s : x)) : [...scenarios, s]);
  }

  function add(s: Scenario) {
    save([...scenarios, s]);
  }

  return { scenarios, upsert, add };
}

// ─── Multiplied summary helper ────────────────────────────────────────────────

export function getMultipliedSummary(
  projects: ProjectSummary[],
  multipliers: ScenarioMultipliers,
  timelineYear: number = 1
): AllProjectsSummary['summary'] {
  const result = {
    savings: { baseline: 0, forecast: 0, forecasts: [] as number[] },
    singleUse: { baseline: 0, forecast: 0, forecasts: [] as number[] },
    waste: { baseline: 0, forecast: 0, forecasts: [] as number[] },
    gas: { baseline: 0, forecast: 0, forecasts: [] as number[] },
    water: { baseline: 0, forecast: 0, forecasts: [] as number[] }
  };

  for (const p of projects) {
    const m = (multipliers[p.id] ?? 1) * timelineYear;
    const s = p.projections.annualSummary;
    const envWater = p.projections.environmentalResults.annualWaterUsageChanges.total;
    const suCost = p.projections.singleUseResults.summary.annualCost;

    result.savings.baseline += s.dollarCost.baseline * m;
    result.savings.forecast += s.dollarCost.forecast * m;
    result.savings.forecasts.push(s.dollarCost.forecast * m);

    result.singleUse.baseline += suCost.baseline * m;
    result.singleUse.forecast += suCost.forecast * m;
    result.singleUse.forecasts.push(suCost.forecast * m);

    result.waste.baseline += s.wasteWeight.baseline * m;
    result.waste.forecast += s.wasteWeight.forecast * m;
    result.waste.forecasts.push(s.wasteWeight.forecast * m);

    result.gas.baseline += s.greenhouseGasEmissions.total.baseline * m;
    result.gas.forecast += s.greenhouseGasEmissions.total.forecast * m;
    result.gas.forecasts.push(s.greenhouseGasEmissions.total.forecast * m);

    result.water.baseline += envWater.baseline * m;
    result.water.forecast += envWater.forecast * m;
    result.water.forecasts.push(envWater.forecast * m);
  }

  return result;
}

// ─── Styled helpers ───────────────────────────────────────────────────────────

const ProjectCard = styled(Card)`
  margin-bottom: 16px;

  .ant-card-body {
    padding: 16px 20px;
  }
`;

const MetricRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 90px 90px 80px 60px;
  gap: 8px;
  align-items: center;
  padding: 6px 0;
  font-size: 13px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr 70px 60px;
  }
`;

const MetricHeader = styled(MetricRow)`
  font-size: 11px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.45);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 8px;
  margin-bottom: 4px;
`;

const Delta = styled.span<{ $positive: boolean }>`
  color: ${({ $positive }) => ($positive ? '#52c41a' : '#ff4d4f')};
  font-weight: 500;
`;

// ─── Formatters ───────────────────────────────────────────────────────────────

function pct(delta: number, baseline: number): string {
  if (baseline === 0) return '—';
  return `${delta >= 0 ? '+' : ''}${Math.round((delta / Math.abs(baseline)) * 100)}%`;
}

function sign(n: number): string {
  return n >= 0 ? '+' : '';
}

// ─── Per-project metric rows ──────────────────────────────────────────────────

type ProjectMetrics = {
  savingsBase: number;
  savingsForecast: number;
  wasteBase: number;
  wasteForecast: number;
  suBase: number;
  suForecast: number;
  ghgBase: number;
  ghgForecast: number;
};

function extractMetrics(project: ProjectSummary): ProjectMetrics {
  const s = project.projections.annualSummary;
  return {
    savingsBase: s.dollarCost.baseline,
    savingsForecast: s.dollarCost.forecast,
    wasteBase: s.wasteWeight.baseline,
    wasteForecast: s.wasteWeight.forecast,
    suBase: s.singleUseProductCount.baseline,
    suForecast: s.singleUseProductCount.forecast,
    ghgBase: s.greenhouseGasEmissions.total.baseline,
    ghgForecast: s.greenhouseGasEmissions.total.forecast
  };
}

// ─── Single project card ──────────────────────────────────────────────────────

function ProjectScenarioCard({
  project,
  locations,
  onLocationsChange,
  currencyAbbreviation,
  displayAsMetric,
  isReadOnly
}: {
  project: ProjectSummary;
  locations: number;
  onLocationsChange: (n: number) => void;
  currencyAbbreviation: string;
  displayAsMetric: boolean;
  isReadOnly?: boolean;
}) {
  const m = extractMetrics(project);
  const showMultiplied = locations > 1;

  const rows: {
    label: string;
    base: string;
    reusable: string;
    delta: string;
    deltaPct: string;
    multiplied?: string;
  }[] = [
    {
      label: 'Estimated Savings',
      base: formatToDollar(m.savingsBase, currencyAbbreviation),
      reusable: formatToDollar(m.savingsForecast, currencyAbbreviation),
      delta: `${sign(m.savingsBase - m.savingsForecast)}${formatToDollar(m.savingsBase - m.savingsForecast, currencyAbbreviation)}`,
      deltaPct: pct(m.savingsBase - m.savingsForecast, m.savingsBase),
      multiplied: showMultiplied
        ? `${sign(m.savingsBase - m.savingsForecast)}${formatToDollar((m.savingsBase - m.savingsForecast) * locations, currencyAbbreviation)}`
        : undefined
    },
    {
      label: 'Waste Reduction',
      base: `${Math.round(valueInPounds(m.wasteBase, { displayAsMetric, displayAsTons: false })).toLocaleString()}`,
      reusable: `${Math.round(valueInPounds(m.wasteForecast, { displayAsMetric, displayAsTons: false })).toLocaleString()}`,
      delta: `${sign(m.wasteBase - m.wasteForecast)}${Math.round(valueInPounds(m.wasteBase - m.wasteForecast, { displayAsMetric, displayAsTons: false })).toLocaleString()}`,
      deltaPct: pct(m.wasteBase - m.wasteForecast, m.wasteBase),
      multiplied: showMultiplied
        ? `${sign(m.wasteBase - m.wasteForecast)}${Math.round(valueInPounds((m.wasteBase - m.wasteForecast) * locations, { displayAsMetric, displayAsTons: false })).toLocaleString()}`
        : undefined
    },
    {
      label: 'Single-Use Reduction',
      base: Math.round(m.suBase).toLocaleString(),
      reusable: Math.round(m.suForecast).toLocaleString(),
      delta: `${sign(m.suBase - m.suForecast)}${Math.round(m.suBase - m.suForecast).toLocaleString()}`,
      deltaPct: pct(m.suBase - m.suForecast, m.suBase),
      multiplied: showMultiplied
        ? `${sign(m.suBase - m.suForecast)}${Math.round((m.suBase - m.suForecast) * locations).toLocaleString()}`
        : undefined
    },
    {
      label: 'GHG Reduction',
      base: m.ghgBase.toFixed(2),
      reusable: m.ghgForecast.toFixed(2),
      delta: `${sign(m.ghgBase - m.ghgForecast)}${(m.ghgBase - m.ghgForecast).toFixed(2)}`,
      deltaPct: pct(m.ghgBase - m.ghgForecast, m.ghgBase),
      multiplied: showMultiplied
        ? `${sign(m.ghgBase - m.ghgForecast)}${((m.ghgBase - m.ghgForecast) * locations).toFixed(2)}`
        : undefined
    }
  ];

  const units = ['', displayAsMetric ? '(kg)' : '(lb)', '(units)', '(MTC02e)'];

  return (
    <ProjectCard>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Typography.Title level={5} style={{ margin: 0 }}>
          {project.name}
        </Typography.Title>

        <InputNumber
          min={1}
          max={100000}
          value={locations}
          onChange={v => onLocationsChange(v ?? 1)}
          size='small'
          style={{ width: 100 }}
          addonBefore='×'
          controls
          disabled={isReadOnly}
        />
      </div>

      <MetricHeader>
        <span>Metric</span>
        <span>Single-use</span>
        <span>Reusable</span>
        <span>Change</span>
        <span>%</span>
      </MetricHeader>

      {rows.map((row, i) => (
        <MetricRow key={row.label}>
          <span>
            {row.label}{' '}
            {units[i] && (
              <Typography.Text type='secondary' style={{ fontSize: 11 }}>
                {units[i]}
              </Typography.Text>
            )}
          </span>
          <span style={{ color: 'rgba(0,0,0,0.65)' }}>{row.base}</span>
          <span style={{ color: 'rgba(0,0,0,0.65)' }}>{row.reusable}</span>
          <Delta $positive={(row.delta || '').startsWith('+') || (row.delta || '').startsWith('0')}>{row.delta}</Delta>
          <Delta $positive={(row.deltaPct || '').startsWith('+') || (row.deltaPct || '').startsWith('0')}>
            {row.deltaPct}
          </Delta>
        </MetricRow>
      ))}

      {showMultiplied && (
        <>
          <Divider style={{ margin: '12px 0 8px' }} />
          <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>× {locations} locations</div>
          <Row gutter={16}>
            {rows.map(row => (
              <Col key={row.label} style={{ marginBottom: 4 }}>
                <Typography.Text style={{ fontSize: 13, color: '#3f8600' }} strong>
                  {row.multiplied}
                </Typography.Text>{' '}
                <Typography.Text type='secondary' style={{ fontSize: 11 }}>
                  {row.label.split(' ')[0].toLowerCase()}
                </Typography.Text>
              </Col>
            ))}
          </Row>
          <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)', marginTop: 4 }}>
            * this multiplier multiplies the metrics to emulate multiple locations
          </div>
        </>
      )}
    </ProjectCard>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

type Props = {
  data: AllProjectsSummary;
  orgId: string;
  onMultipliersChange: (multipliers: ScenarioMultipliers) => void;
  initialMultipliers?: ScenarioMultipliers;
  isReadOnly?: boolean;
};

export function ScenarioPlanner({ data, orgId, onMultipliersChange, initialMultipliers, isReadOnly }: Props) {
  const displayAsMetric = useMetricSystem();
  const { abbreviation: currencyAbbreviation } = useCurrency();
  const { scenarios, upsert, add } = useScenarios(orgId);

  const [multipliers, setMultipliers] = useState<ScenarioMultipliers>(initialMultipliers ?? {});
  const [scenarioName, setScenarioName] = useState('Scenario 1');
  const [editingName, setEditingName] = useState(false);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);

  // Notify parent of initial multipliers on mount
  useEffect(() => {
    if (initialMultipliers && Object.keys(initialMultipliers).length > 0) {
      onMultipliersChange(initialMultipliers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const projectCount = data.projects.length;
  if (projectCount === 0) return null;

  const hasAnyMultiplier = Object.values(multipliers).some(v => v > 1);

  function updateMultiplier(projectId: string, value: number) {
    const next = { ...multipliers, [projectId]: value };
    setMultipliers(next);
    onMultipliersChange(next);
  }

  function resetMultipliers() {
    setMultipliers({});
    onMultipliersChange({});
  }

  function saveScenario() {
    if (!activeScenarioId) {
      const id = Date.now().toString();
      setActiveScenarioId(id);
      upsert({ id, name: scenarioName, multipliers });
    } else {
      upsert({ id: activeScenarioId, name: scenarioName, multipliers });
    }
  }

  function saveAsNewScenario() {
    let newName = '';
    Modal.confirm({
      title: 'Save as new scenario',
      content: (
        <Input
          placeholder='Scenario name'
          autoFocus
          defaultValue={`${scenarioName} (copy)`}
          onChange={e => {
            newName = e.target.value;
          }}
        />
      ),
      onOk() {
        if (newName.trim()) {
          const id = Date.now().toString();
          setActiveScenarioId(id);
          setScenarioName(newName.trim());
          add({ id, name: newName.trim(), multipliers });
        }
      },
      okText: 'Save',
      cancelText: 'Cancel'
    });
  }

  function loadScenario(id: string) {
    const s = scenarios.find(x => x.id === id);
    if (!s) return;
    setActiveScenarioId(id);
    setScenarioName(s.name);
    setMultipliers(s.multipliers);
    onMultipliersChange(s.multipliers);
  }

  return (
    <div style={{ marginTop: 8 }}>
      {/* Scenario header row */}
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
          <GlobalOutlined style={{ color: '#52c41a', fontSize: 18 }} />
          {!isReadOnly && editingName ? (
            <Input
              value={scenarioName}
              autoFocus
              onChange={e => setScenarioName(e.target.value)}
              onBlur={() => setEditingName(false)}
              onPressEnter={() => setEditingName(false)}
              style={{ fontWeight: 600, fontSize: 16, maxWidth: 200 }}
              size='small'
            />
          ) : (
            <Typography.Text
              strong
              style={{ fontSize: 16, cursor: isReadOnly ? 'default' : 'pointer' }}
              onClick={() => !isReadOnly && setEditingName(true)}
            >
              {scenarioName}
              {!isReadOnly && <EditOutlined style={{ fontSize: 12, color: 'rgba(0,0,0,0.35)', marginLeft: 4 }} />}
            </Typography.Text>
          )}
          <Typography.Text type='secondary' style={{ fontSize: 12 }}>
            Impact multiplied by # of locations
          </Typography.Text>
        </div>

        {!isReadOnly && (
          <Space wrap>
            {scenarios.length > 0 && (
              <Select
                placeholder='Load scenario'
                style={{ width: 180 }}
                value={activeScenarioId ?? undefined}
                onSelect={(id: string) => loadScenario(id)}
                options={scenarios.map(s => ({ label: s.name, value: s.id }))}
                allowClear
                onClear={() => setActiveScenarioId(null)}
              />
            )}
            <Button
              type='primary'
              icon={<SaveOutlined />}
              onClick={saveScenario}
              style={{ background: '#52c41a', borderColor: '#52c41a' }}
            >
              Save Scenario
            </Button>
            <Button icon={<SaveOutlined />} onClick={saveAsNewScenario}>
              Save as New
            </Button>
            <Button icon={<ReloadOutlined />} onClick={resetMultipliers} disabled={!hasAnyMultiplier}>
              Reset
            </Button>
          </Space>
        )}
      </div>

      {/* Per-project cards */}
      {data.projects.map(project => (
        <ProjectScenarioCard
          key={project.id}
          project={project}
          locations={multipliers[project.id] ?? 1}
          onLocationsChange={v => updateMultiplier(project.id, v)}
          currencyAbbreviation={currencyAbbreviation}
          displayAsMetric={displayAsMetric}
          isReadOnly={isReadOnly}
        />
      ))}
    </div>
  );
}
