import { AimOutlined, DownOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  DatePicker,
  Dropdown,
  Empty,
  InputNumber,
  Popover,
  Radio,
  Space,
  Switch,
  Tag,
  Typography
} from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';

import { useCurrency } from 'components/_app/CurrencyProvider';
import { useMetricSystem } from 'components/_app/MetricSystemProvider';
import { formatToDollar } from 'lib/calculator/utils';
import type { ProjectSummary } from 'lib/calculator/getProjections';
import { valueInPounds } from 'lib/number';
import type { ScenarioMultipliers } from './ScenarioPlanner';

const Line = dynamic(() => import('@ant-design/plots').then(r => r.Line), { ssr: false });

type SavedScenario = {
  id: string;
  name: string;
  multipliers: ScenarioMultipliers;
};

type Metric = 'savings' | 'waste' | 'ghg' | 'singleUse';

const ALL_YEARS = [1, 2, 3, 5, 10] as const;
type Year = (typeof ALL_YEARS)[number];
const YEAR_LABELS: Record<Year, string> = { 1: '1yr', 2: '2yr', 3: '3yr', 5: '5yr', 10: '10yr' };

const metricOptions = [
  { label: 'Savings', value: 'savings' as Metric },
  { label: 'Waste', value: 'waste' as Metric },
  { label: 'GHG', value: 'ghg' as Metric },
  { label: 'Single-Use', value: 'singleUse' as Metric }
];

const ACTIVE_SCENARIO_LABEL = 'Current (unsaved)';

type Props = {
  projects: ProjectSummary[];
  orgId: string;
  activeMultipliers: ScenarioMultipliers;
  timelineYear: number;
  onTimelineYearChange: (y: number) => void;
};

// Compute the annual delta (positive = improvement vs baseline) for one project,
// scaled by a scenario's per-project location multiplier.
function annualDeltaFor(
  project: ProjectSummary,
  multipliers: ScenarioMultipliers,
  metric: Metric,
  displayAsMetric: boolean
): number {
  const s = project.projections.annualSummary;
  const mult = multipliers[project.id] ?? 1;

  if (metric === 'savings') {
    return (s.dollarCost.baseline - s.dollarCost.forecast) * mult;
  }
  if (metric === 'waste') {
    const raw = s.wasteWeight.baseline - s.wasteWeight.forecast;
    return valueInPounds(raw, { displayAsMetric, displayAsTons: false }) * mult;
  }
  if (metric === 'ghg') {
    return (s.greenhouseGasEmissions.total.baseline - s.greenhouseGasEmissions.total.forecast) * mult;
  }
  return (s.singleUseProductCount.baseline - s.singleUseProductCount.forecast) * mult;
}

export function ScenarioTimeline({ projects, orgId, activeMultipliers, timelineYear, onTimelineYearChange }: Props) {
  const [metric, setMetric] = useState<Metric>('ghg');
  const displayAsMetric = useMetricSystem();
  const { abbreviation: currency } = useCurrency();

  // Saved scenarios from localStorage. Loaded on mount + refreshed when the
  // ScenarioPlanner save button fires the `cr-scenarios-updated` custom event.
  const [saved, setSaved] = useState<SavedScenario[]>([]);
  useEffect(() => {
    function load() {
      try {
        setSaved(JSON.parse(localStorage.getItem(`cr_scenarios_${orgId}`) ?? '[]'));
      } catch {
        setSaved([]);
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

  // Which saved scenarios are toggled on for overlay. Default: all saved on.
  const [enabledIds, setEnabledIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    setEnabledIds(new Set(saved.map(s => s.id)));
  }, [saved]);

  // Goal-line state. Default goal date: end of timeline window from today.
  const [showGoal, setShowGoal] = useState(false);
  const [goalDate, setGoalDate] = useState<Dayjs>(() => dayjs().add(3, 'year'));
  const [goalValue, setGoalValue] = useState<number>(100);

  const visibleYears = ALL_YEARS.filter(y => y <= timelineYear);
  const startDate = useMemo(() => dayjs(), []);

  // Build chart rows: one row per (scenario, yearOffset). x-axis is an absolute
  // date so the goal-date reference can be plotted on the same axis.
  const chartData = useMemo(() => {
    const scenarios: Array<{ id: string; name: string; multipliers: ScenarioMultipliers }> = [
      { id: '__active__', name: ACTIVE_SCENARIO_LABEL, multipliers: activeMultipliers },
      ...saved.filter(s => enabledIds.has(s.id))
    ];

    const rows: { date: string; value: number; scenario: string }[] = [];
    for (const sc of scenarios) {
      // Always include year 0 (today) at zero so each line anchors on the same starting point.
      rows.push({ date: startDate.format('YYYY-MM-DD'), value: 0, scenario: sc.name });
      for (const yr of visibleYears) {
        let cumulative = 0;
        for (const p of projects) {
          cumulative += annualDeltaFor(p, sc.multipliers, metric, displayAsMetric) * yr;
        }
        rows.push({
          date: startDate.add(yr, 'year').format('YYYY-MM-DD'),
          value: parseFloat(cumulative.toFixed(2)),
          scenario: sc.name
        });
      }
    }
    return rows;
  }, [projects, activeMultipliers, saved, enabledIds, metric, visibleYears, displayAsMetric, startDate]);

  function formatValue(v: number): string {
    if (metric === 'savings') return formatToDollar(v, currency);
    if (metric === 'waste') return `${Math.round(v).toLocaleString()} ${displayAsMetric ? 'kg' : 'lb'}`;
    if (metric === 'ghg') return `${v.toFixed(2)} MTCO2e`;
    return `${Math.round(v).toLocaleString()} units`;
  }

  // Build annotations: a vertical line at the goal date + a horizontal line at the goal value.
  const annotations = useMemo(() => {
    if (!showGoal) return undefined;
    const goalStr = goalDate.format('YYYY-MM-DD');
    return [
      {
        type: 'lineX',
        xField: goalStr,
        style: { stroke: '#ff4d4f', lineWidth: 2, lineDash: [4, 4] },
        label: { text: `Goal: ${goalDate.format('MMM YYYY')}`, position: 'top-right', fill: '#ff4d4f' }
      },
      {
        type: 'lineY',
        yField: goalValue,
        style: { stroke: '#52c41a', lineWidth: 2, lineDash: [4, 4] },
        label: { text: `Target: ${formatValue(goalValue)}`, position: 'right', fill: '#52c41a' }
      }
    ];
  }, [showGoal, goalDate, goalValue, metric, currency, displayAsMetric]);

  const currentLabel = YEAR_LABELS[timelineYear as Year] ?? `${timelineYear}yr`;
  const hasData = projects.length > 0;

  return (
    <Card style={{ marginBottom: 24 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 12
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            Scenario Timeline
          </Typography.Title>
          <Dropdown
            menu={{
              items: ALL_YEARS.map(y => ({ key: String(y), label: YEAR_LABELS[y] })),
              onClick: ({ key }) => onTimelineYearChange(Number(key)),
              selectedKeys: [String(timelineYear)]
            }}
          >
            <Button size='small'>
              Up to {currentLabel} <DownOutlined />
            </Button>
          </Dropdown>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Radio.Group
            value={metric}
            onChange={e => setMetric(e.target.value)}
            optionType='button'
            buttonStyle='outline'
            size='small'
            options={metricOptions}
          />
          <Popover
            trigger='click'
            placement='bottomRight'
            title='Milestone goal'
            content={
              <div style={{ width: 240 }}>
                <Space direction='vertical' size={10} style={{ width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography.Text>Show goal</Typography.Text>
                    <Switch checked={showGoal} onChange={setShowGoal} size='small' />
                  </div>
                  <div>
                    <Typography.Text type='secondary' style={{ fontSize: 12 }}>
                      Goal date
                    </Typography.Text>
                    <DatePicker
                      value={goalDate}
                      onChange={d => d && setGoalDate(d)}
                      style={{ width: '100%' }}
                      disabled={!showGoal}
                    />
                  </div>
                  <div>
                    <Typography.Text type='secondary' style={{ fontSize: 12 }}>
                      Target value (
                      {metric === 'savings'
                        ? currency
                        : metric === 'ghg'
                          ? 'MTCO2e'
                          : metric === 'waste'
                            ? displayAsMetric
                              ? 'kg'
                              : 'lb'
                            : 'units'}
                      )
                    </Typography.Text>
                    <InputNumber
                      value={goalValue}
                      onChange={v => setGoalValue(Number(v ?? 0))}
                      style={{ width: '100%' }}
                      min={0}
                      disabled={!showGoal}
                    />
                  </div>
                </Space>
              </div>
            }
          >
            <Button size='small' icon={<AimOutlined />} type={showGoal ? 'primary' : 'default'}>
              Goal
            </Button>
          </Popover>
        </div>
      </div>

      {saved.length > 0 && (
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Typography.Text type='secondary' style={{ fontSize: 12 }}>
            Compare:
          </Typography.Text>
          <Tag color='processing' style={{ marginRight: 0 }}>
            {ACTIVE_SCENARIO_LABEL}
          </Tag>
          {saved.map(s => {
            const on = enabledIds.has(s.id);
            return (
              <Tag.CheckableTag
                key={s.id}
                checked={on}
                onChange={checked =>
                  setEnabledIds(prev => {
                    const next = new Set(prev);
                    if (checked) next.add(s.id);
                    else next.delete(s.id);
                    return next;
                  })
                }
              >
                {s.name}
              </Tag.CheckableTag>
            );
          })}
        </div>
      )}

      {!hasData ? (
        <Empty description='No projects match the current filters.' style={{ padding: '32px 0' }} />
      ) : (
        <div style={{ height: 360 }}>
          <Line
            key={`${visibleYears.length}-${saved.length}-${enabledIds.size}-${showGoal ? 'g' : 'n'}`}
            data={chartData}
            xField='date'
            yField='value'
            colorField='scenario'
            smooth={false}
            animate={false}
            point={{ shapeField: 'circle', sizeField: 5 }}
            annotations={annotations}
            tooltip={{
              title: (d: any) => d.date,
              items: [
                { field: 'scenario', name: 'Scenario' },
                {
                  field: 'value',
                  name: metricOptions.find(m => m.value === metric)?.label ?? 'Value',
                  valueFormatter: (v: number) => formatValue(v)
                }
              ]
            }}
            axis={{
              y: { title: `${metricOptions.find(m => m.value === metric)?.label ?? ''} (cumulative)` },
              x: { title: 'Date' }
            }}
          />
        </div>
      )}
    </Card>
  );
}
