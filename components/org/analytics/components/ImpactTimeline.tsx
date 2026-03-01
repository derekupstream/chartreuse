import { Card, Empty, Radio, Spin, Typography } from 'antd';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import useSWR from 'swr';

const Line = dynamic(() => import('@ant-design/plots').then(r => r.Line), { ssr: false });

type Milestone = {
  id: string;
  snapshotDate: string;
  label: string | null;
  co2AvoidedMtco2e: number | null;
  waterSavedGallons: number | null;
  wasteDivertedLbs: number | null;
  annualCostSavings: number | null;
  project: { id: string; name: string; category: string };
};

type Metric = 'co2AvoidedMtco2e' | 'annualCostSavings' | 'wasteDivertedLbs' | 'waterSavedGallons';

const metricOptions: { label: string; value: Metric; unit: string }[] = [
  { label: 'CO2 Avoided', value: 'co2AvoidedMtco2e', unit: 'MTCO2e' },
  { label: 'Cost Savings', value: 'annualCostSavings', unit: '$/yr' },
  { label: 'Waste Diverted', value: 'wasteDivertedLbs', unit: 'lbs' },
  { label: 'Water Saved', value: 'waterSavedGallons', unit: 'gal' }
];

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function ImpactTimeline() {
  const { data, isLoading } = useSWR<{ milestones: Milestone[] }>('/api/org/milestones', fetcher);
  const [metric, setMetric] = useState<Metric>('co2AvoidedMtco2e');

  const milestones = data?.milestones ?? [];
  const selectedMetric = metricOptions.find(m => m.value === metric)!;

  const chartData = milestones
    .filter(m => m[metric] != null)
    .map(m => ({
      date: m.snapshotDate,
      value: m[metric] as number,
      project: m.project.name,
      label: m.label ?? ''
    }));

  const hasSufficientData = milestones.length >= 2;

  return (
    <Card style={{ marginTop: 24 }}>
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
        <Typography.Title level={4} style={{ margin: 0 }}>
          Impact Over Time
        </Typography.Title>
        <Radio.Group
          value={metric}
          onChange={e => setMetric(e.target.value)}
          optionType='button'
          buttonStyle='outline'
          size='small'
          options={metricOptions.map(m => ({ label: m.label, value: m.value }))}
        />
      </div>

      {isLoading && (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin />
        </div>
      )}

      {!isLoading && !hasSufficientData && (
        <Empty
          description={
            <span>
              Save project snapshots to track your impact over time.
              <br />
              <Typography.Text type='secondary' style={{ fontSize: 12 }}>
                Open a project → click &quot;Save Snapshot&quot; to capture a milestone.
              </Typography.Text>
            </span>
          }
          style={{ padding: '32px 0' }}
        />
      )}

      {!isLoading && hasSufficientData && chartData.length > 0 && (
        <div style={{ height: 320 }}>
          <Line
            data={chartData}
            xField='date'
            yField='value'
            colorField='project'
            smooth
            point={{ shapeField: 'circle', sizeField: 5 }}
            tooltip={{
              title: (d: any) => d.date,
              items: [
                {
                  field: 'value',
                  name: selectedMetric.label,
                  valueFormatter: (v: number) => `${v.toFixed(3)} ${selectedMetric.unit}`
                },
                { field: 'project', name: 'Project' }
              ]
            }}
            axis={{
              y: { title: `${selectedMetric.label} (${selectedMetric.unit})` },
              x: { title: 'Snapshot Date' }
            }}
          />
        </div>
      )}
    </Card>
  );
}
