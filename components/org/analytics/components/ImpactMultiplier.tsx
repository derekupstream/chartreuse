import { GlobalOutlined } from '@ant-design/icons';
import { Card, Col, InputNumber, Row, Statistic, Typography } from 'antd';
import { useState } from 'react';
import type { AllProjectsSummary } from 'lib/calculator/getProjections';
import { formatToDollar } from 'lib/calculator/utils';
import { valueInGallons, valueInPounds } from 'lib/number';
import { useMetricSystem } from 'components/_app/MetricSystemProvider';
import { useCurrency } from 'components/_app/CurrencyProvider';

function scaleImpact(total: number, projectCount: number, multiplier: number): number {
  if (projectCount === 0) return 0;
  return (total / projectCount) * multiplier;
}

export function ImpactMultiplier({ data }: { data: AllProjectsSummary }) {
  const displayAsMetric = useMetricSystem();
  const { abbreviation: currencyAbbreviation } = useCurrency();
  const [multiplier, setMultiplier] = useState(10);

  const projectCount = data.projects.length;
  if (projectCount === 0) return null;

  const totalGhgReduction = data.summary.gas.baseline - data.summary.gas.forecast;
  const totalWasteReduction = data.summary.waste.baseline - data.summary.waste.forecast;
  const totalCostSavings = data.summary.savings.baseline - data.summary.savings.forecast;
  const totalWaterChange = data.summary.water.baseline - data.summary.water.forecast;

  const scaledGhg = scaleImpact(totalGhgReduction, projectCount, multiplier);
  const scaledWaste = scaleImpact(totalWasteReduction, projectCount, multiplier);
  const scaledCost = scaleImpact(totalCostSavings, projectCount, multiplier);
  const scaledWater = scaleImpact(totalWaterChange, projectCount, multiplier);

  return (
    <Card style={{ marginTop: 24 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12
        }}
      >
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>
            <GlobalOutlined style={{ marginRight: 8, color: '#52c41a' }} />
            Community Impact Multiplier
          </Typography.Title>
          <Typography.Text type='secondary' style={{ fontSize: 12 }}>
            Scale your average project impact across any number of locations
          </Typography.Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <Typography.Text>Locations:</Typography.Text>
          <InputNumber
            min={1}
            max={100000}
            value={multiplier}
            onChange={val => setMultiplier(val ?? 1)}
            style={{ width: 100 }}
          />
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Statistic
            title='GHG Reduction'
            value={scaledGhg.toFixed(1)}
            suffix='MTCO2e/yr'
            valueStyle={{ color: scaledGhg > 0 ? '#3f8600' : undefined, fontSize: 20 }}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title='Waste Avoided'
            value={Math.round(valueInPounds(scaledWaste, { displayAsMetric, displayAsTons: false })).toLocaleString()}
            suffix={displayAsMetric ? 'kg/yr' : 'lbs/yr'}
            valueStyle={{ color: scaledWaste > 0 ? '#3f8600' : undefined, fontSize: 20 }}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title='Cost Savings'
            value={formatToDollar(scaledCost, currencyAbbreviation)}
            suffix='/yr'
            formatter={v => v}
            valueStyle={{ color: scaledCost > 0 ? '#3f8600' : undefined, fontSize: 20 }}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title='Water Saved'
            value={Math.round(valueInGallons(scaledWater, { displayAsMetric })).toLocaleString()}
            suffix={displayAsMetric ? 'L/yr' : 'gal/yr'}
            valueStyle={{ color: scaledWater > 0 ? '#3f8600' : undefined, fontSize: 20 }}
          />
        </Col>
      </Row>

      <Typography.Text type='secondary' style={{ fontSize: 11, marginTop: 12, display: 'block' }}>
        Based on average impact across {projectCount} project{projectCount !== 1 ? 's' : ''} × {multiplier} location
        {multiplier !== 1 ? 's' : ''}
      </Typography.Text>
    </Card>
  );
}
