import { DownOutlined } from '@ant-design/icons';
import { Button, Card, Dropdown, Empty, Radio, Typography } from 'antd';
import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';

import { useCurrency } from 'components/_app/CurrencyProvider';
import { useMetricSystem } from 'components/_app/MetricSystemProvider';
import { formatToDollar } from 'lib/calculator/utils';
import type { ProjectSummary } from 'lib/calculator/getProjections';
import { valueInPounds } from 'lib/number';
import type { ScenarioMultipliers } from './ScenarioPlanner';

const Line = dynamic(() => import('@ant-design/plots').then(r => r.Line), { ssr: false });

type Metric = 'savings' | 'waste' | 'ghg' | 'singleUse';

const ALL_YEARS = [1, 2, 5, 10] as const;
type Year = (typeof ALL_YEARS)[number];
const YEAR_LABELS: Record<Year, string> = { 1: '1yr', 2: '2yr', 5: '5yr', 10: '10yr' };

const metricOptions = [
  { label: 'Savings', value: 'savings' as Metric },
  { label: 'Waste', value: 'waste' as Metric },
  { label: 'GHG', value: 'ghg' as Metric },
  { label: 'Single-Use', value: 'singleUse' as Metric }
];

type Props = {
  projects: ProjectSummary[];
  multipliers: ScenarioMultipliers;
  timelineYear: number;
  onTimelineYearChange: (y: number) => void;
};

export function ProjectionTimeline({ projects, multipliers, timelineYear, onTimelineYearChange }: Props) {
  const [metric, setMetric] = useState<Metric>('savings');
  const displayAsMetric = useMetricSystem();
  const { abbreviation: currency } = useCurrency();

  const visibleYears = ALL_YEARS.filter(y => y <= timelineYear);

  const chartData = useMemo(() => {
    const rows: { year: string; value: number; project: string }[] = [];

    for (const yr of visibleYears) {
      for (const p of projects) {
        const s = p.projections.annualSummary;
        const locationMult = multipliers[p.id] ?? 1;

        let annual: number;
        if (metric === 'savings') {
          annual = (s.dollarCost.baseline - s.dollarCost.forecast) * locationMult;
        } else if (metric === 'waste') {
          const raw = s.wasteWeight.baseline - s.wasteWeight.forecast;
          annual = valueInPounds(raw, { displayAsMetric, displayAsTons: false }) * locationMult;
        } else if (metric === 'ghg') {
          annual = (s.greenhouseGasEmissions.total.baseline - s.greenhouseGasEmissions.total.forecast) * locationMult;
        } else {
          annual = (s.singleUseProductCount.baseline - s.singleUseProductCount.forecast) * locationMult;
        }

        rows.push({
          year: YEAR_LABELS[yr],
          value: parseFloat((annual * yr).toFixed(2)),
          project: p.name
        });
      }
    }

    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, multipliers, metric, timelineYear, displayAsMetric]);

  function formatValue(v: number): string {
    if (metric === 'savings') return formatToDollar(v, currency);
    if (metric === 'waste') return `${Math.round(v).toLocaleString()} ${displayAsMetric ? 'kg' : 'lb'}`;
    if (metric === 'ghg') return `${v.toFixed(2)} MTCO2e`;
    return `${Math.round(v).toLocaleString()} units`;
  }

  const currentLabel = YEAR_LABELS[timelineYear as Year] ?? `${timelineYear}yr`;

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            Impact Projection
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
        <Radio.Group
          value={metric}
          onChange={e => setMetric(e.target.value)}
          optionType='button'
          buttonStyle='outline'
          size='small'
          options={metricOptions}
        />
      </div>

      {projects.length === 0 ? (
        <Empty description='No projects match the current filters.' style={{ padding: '32px 0' }} />
      ) : (
        <div style={{ height: 320 }}>
          <Line
            key={visibleYears.length}
            data={chartData}
            xField='year'
            yField='value'
            colorField='project'
            smooth={false}
            animate={false}
            point={{ shapeField: 'circle', sizeField: 5 }}
            tooltip={{
              title: (d: any) => `Year: ${d.year}`,
              items: [
                { field: 'project', name: 'Project' },
                {
                  field: 'value',
                  name: metricOptions.find(m => m.value === metric)?.label ?? 'Value',
                  valueFormatter: (v: number) => formatValue(v)
                }
              ]
            }}
            axis={{
              y: {
                title: `${metricOptions.find(m => m.value === metric)?.label ?? ''} (cumulative)`
              }
            }}
          />
        </div>
      )}
    </Card>
  );
}
