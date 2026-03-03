import { Card, Empty, Radio, Spin, Typography } from 'antd';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useGetProjectMilestones } from 'client/projects';

const Line = dynamic(() => import('@ant-design/plots').then(r => r.Line), { ssr: false });

type Metric = 'co2AvoidedMtco2e' | 'annualCostSavings' | 'wasteDivertedLbs' | 'waterSavedGallons';

const metricOptions: { label: string; value: Metric; unit: string }[] = [
  { label: 'CO2 Avoided', value: 'co2AvoidedMtco2e', unit: 'MTCO2e' },
  { label: 'Cost Savings', value: 'annualCostSavings', unit: '$/yr' },
  { label: 'Waste Diverted', value: 'wasteDivertedLbs', unit: 'lbs' },
  { label: 'Water Saved', value: 'waterSavedGallons', unit: 'gal' }
];

export function SnapshotTimeline({ projectId }: { projectId: string }) {
  const { data, isLoading } = useGetProjectMilestones(projectId);
  const [metric, setMetric] = useState<Metric>('co2AvoidedMtco2e');

  const milestones = data?.milestones ?? [];
  const selectedMetric = metricOptions.find(m => m.value === metric)!;

  const chartData = milestones
    .filter(m => m[metric] != null)
    .map(m => ({
      date: m.snapshotDate.slice(0, 10),
      value: m[metric] as number,
      label: m.label ?? m.snapshotDate.slice(0, 10)
    }));

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

      {!isLoading && milestones.length === 0 && (
        <Empty
          description={
            <span>
              Save snapshots to track your impact over time.
              <br />
              <Typography.Text type='secondary' style={{ fontSize: 12 }}>
                Click &quot;Save Snapshot&quot; above to capture a milestone.
              </Typography.Text>
            </span>
          }
          style={{ padding: '32px 0' }}
        />
      )}

      {!isLoading && chartData.length > 0 && (
        <div style={{ height: 280 }}>
          <Line
            data={chartData}
            xField='date'
            yField='value'
            smooth
            point={{ shapeField: 'circle', sizeField: 5 }}
            tooltip={{
              title: (d: any) => d.label,
              items: [
                {
                  field: 'value',
                  name: selectedMetric.label,
                  valueFormatter: (v: number) => `${v.toFixed(2)} ${selectedMetric.unit}`
                }
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
