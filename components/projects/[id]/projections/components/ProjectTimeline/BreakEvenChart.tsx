import { Card, Typography } from 'antd';
import dynamic from 'next/dynamic';
import type { ProjectionsResponse } from 'lib/calculator/getProjections';

const Line = dynamic(() => import('@ant-design/plots').then(r => r.Line), { ssr: false });

type ChartPoint = { month: number; value: number; type: string };

function buildChartData(baseline: number, forecast: number, oneTimeCost: number, paybackMonths: number): ChartPoint[] {
  const maxMonths = Math.min(Math.ceil(paybackMonths * 1.5), 120);
  const step = Math.max(1, Math.floor(maxMonths / 40));
  const data: ChartPoint[] = [];

  for (let month = 0; month <= maxMonths; month += step) {
    data.push({ month, value: (baseline / 12) * month, type: 'Single-Use (cumulative)' });
    data.push({ month, value: oneTimeCost + (forecast / 12) * month, type: 'Reusable (cumulative)' });
  }

  // Always include the exact break-even month
  data.push({
    month: paybackMonths,
    value: (baseline / 12) * paybackMonths,
    type: 'Single-Use (cumulative)'
  });
  data.push({
    month: paybackMonths,
    value: oneTimeCost + (forecast / 12) * paybackMonths,
    type: 'Reusable (cumulative)'
  });

  return data;
}

export function BreakEvenChart({ financialResults }: { financialResults: ProjectionsResponse['financialResults'] }) {
  const { annualCostChanges, oneTimeCosts, summary } = financialResults;
  const { baseline, forecast } = annualCostChanges;
  const oneTimeCost = oneTimeCosts.total;
  const paybackMonths = summary.paybackPeriodsMonths;

  const canShowChart = paybackMonths > 0 && oneTimeCost > 0 && baseline > forecast;

  const chartData = canShowChart ? buildChartData(baseline, forecast, oneTimeCost, paybackMonths) : [];

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Break-Even Projection
        </Typography.Title>
        <Typography.Text type='secondary' style={{ fontSize: 12 }}>
          Cumulative costs over time — where the lines cross is your break-even point
        </Typography.Text>
      </div>

      {!canShowChart && (
        <div style={{ padding: '32px 0', textAlign: 'center' }}>
          <Typography.Text type='secondary'>
            {paybackMonths === 0
              ? 'Reusable costs are already lower — no break-even period needed.'
              : 'Not enough cost data to generate a break-even chart.'}
          </Typography.Text>
        </div>
      )}

      {canShowChart && (
        <>
          <div style={{ height: 300 }}>
            <Line
              data={chartData}
              xField='month'
              yField='value'
              colorField='type'
              smooth={false}
              color={['#d48806', '#1d39c4']}
              annotations={[
                {
                  type: 'lineX',
                  data: [paybackMonths],
                  style: { stroke: '#52c41a', strokeWidth: 2, strokeDasharray: '6 4', strokeOpacity: 0.8 }
                } as any,
                {
                  type: 'text',
                  data: [paybackMonths],
                  style: {
                    text: `Break-Even: month ${paybackMonths}`,
                    textAlign: 'left',
                    dx: 6,
                    dy: -8,
                    fill: '#52c41a',
                    fontSize: 12,
                    fontWeight: 600
                  }
                } as any
              ]}
              tooltip={{
                title: (d: any) => `Month ${d.month}`,
                items: [
                  {
                    field: 'value',
                    name: (d: any) => d.type,
                    valueFormatter: (v: number) => formatCurrency(v)
                  }
                ]
              }}
              axis={{
                x: { title: 'Month' },
                y: { title: 'Cumulative Cost (USD)', labelFormatter: (v: number) => formatCurrency(v) }
              }}
              legend={{ color: { position: 'bottom' } }}
            />
          </div>
          <div style={{ display: 'flex', gap: 24, marginTop: 12, fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
            <span>
              Upfront investment: <strong>{formatCurrency(oneTimeCost)}</strong>
            </span>
            <span>
              Annual savings after break-even: <strong>{formatCurrency(Math.abs(annualCostChanges.change))}/yr</strong>
            </span>
          </div>
        </>
      )}
    </Card>
  );
}
