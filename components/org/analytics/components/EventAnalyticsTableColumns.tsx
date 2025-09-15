import { Col, Row, Typography } from 'antd';
import type { ReactNode } from 'react';

import type { ProjectSummary } from 'lib/calculator/getProjections';
import { useMetricSystem } from 'components/_app/MetricSystemProvider';
import { valueInPounds } from 'lib/number';
import { defaultFormatter } from '../utils';

export const columns = [
  {
    title: 'Name',
    key: 'name',
    render: (record: ProjectSummary & { useShrinkageRate: boolean }) => {
      const displayAsMetric = useMetricSystem();
      return (
        <>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {record.name}
          </Typography.Title>
          <Typography.Paragraph style={{ color: 'grey', marginTop: 0, marginBottom: '1em' }}>
            {record.account.name}
          </Typography.Paragraph>
          <Typography.Text style={{ fontWeight: 500, lineHeight: 2 }}>
            Single-use reduction
            <br />
            Waste to landfill prevention <span style={{ color: 'grey' }}>({displayAsMetric ? 'kg' : 'lb'})</span>
            <br />
            GHG emissions <span style={{ color: 'grey' }}>(MTC02e)</span>
            <br />
            Water usage <span style={{ color: 'grey' }}>({displayAsMetric ? 'L' : 'gal'})</span>
            <br />
            {record.useShrinkageRate ? 'Shrinkage rate' : 'Return rate'}
          </Typography.Text>
        </>
      );
    }
  },
  {
    title: 'Single-use items',
    key: 'singleuse',
    render: (record: ProjectSummary) => {
      const displayAsMetric = useMetricSystem();
      return (
        <>
          <Typography.Title level={4} style={{ margin: 0 }}>
            &nbsp;
          </Typography.Title>
          <Typography.Paragraph>&nbsp;</Typography.Paragraph>
          <Typography.Text style={{ lineHeight: 2 }}>
            {record.projections.annualSummary.singleUseProductCount.baseline.toLocaleString()}
            <br />
            {valueInPounds(record.projections.annualSummary.wasteWeight.baseline, {
              displayAsMetric,
              displayAsTons: false
            }).toLocaleString()}
            <br />
            {record.projections.annualSummary.greenhouseGasEmissions.total.baseline.toLocaleString()}
            <br />
            {record.projections.environmentalResults.annualWaterUsageChanges.total.baseline.toLocaleString()}
            <br />
            &nbsp;{/* return rate */}
          </Typography.Text>
        </>
      );
    }
  },
  {
    title: 'Reusable items',
    key: 'reusable',
    render: (record: ProjectSummary) => {
      const displayAsMetric = useMetricSystem();
      return (
        <>
          <Typography.Title level={4} style={{ margin: 0 }}>
            &nbsp;
          </Typography.Title>
          <Typography.Paragraph>&nbsp;</Typography.Paragraph>
          <Typography.Text style={{ lineHeight: 2 }}>
            0
            <br />
            {valueInPounds(record.projections.annualSummary.wasteWeight.forecast, {
              displayAsMetric,
              displayAsTons: false
            }).toLocaleString()}
            <br />
            {record.projections.annualSummary.greenhouseGasEmissions.total.forecast.toLocaleString()}
            <br />
            {record.projections.environmentalResults.annualWaterUsageChanges.total.baseline.toLocaleString()}
            <br />
            &nbsp;{/* return rate */}
          </Typography.Text>
        </>
      );
    }
  },
  {
    // think of these changes as 'reductions', hence we multiply them * -1
    title: '',
    key: 'change',
    render: (record: ProjectSummary & { useShrinkageRate: boolean }) => {
      const displayAsMetric = useMetricSystem();
      return (
        <>
          <Typography.Title level={4} style={{ margin: 0 }}>
            &nbsp;
          </Typography.Title>
          <Typography.Paragraph>&nbsp;</Typography.Paragraph>
          <Typography.Text style={{ lineHeight: 2 }}>
            <ReductionValue value={record.projections.annualSummary.singleUseProductCount} />
            <ReductionValue
              value={record.projections.annualSummary.wasteWeight}
              formatter={val => defaultFormatter(valueInPounds(val, { displayAsMetric, displayAsTons: false }))}
            />
            <ReductionValue value={record.projections.annualSummary.greenhouseGasEmissions.total} />
            <ReductionValue value={record.projections.environmentalResults.annualWaterUsageChanges.total} />
            {record.useShrinkageRate
              ? record.projections.reusableResults.summary.returnRate?.shrinkageRate
              : record.projections.reusableResults.summary.returnRate?.returnRate}
            %
          </Typography.Text>
        </>
      );
    }
  }
];

const ReductionValue = ({
  value,
  formatter = defaultFormatter
}: {
  value: { change: number; changePercent?: number };
  formatter?: (val: number) => string | ReactNode;
}) => {
  const change = value.change * -1;
  const changePercent = value.changePercent ? value.changePercent * -1 : 0;
  return (
    <Row>
      <Col span={12} style={{ fontWeight: 500 }}>
        {change > 0 && '+'}
        {formatter(change)}
      </Col>
      <Col span={12} style={{ color: change < 0 ? 'red' : change > 0 ? '#2bbe50' : 'inherit' }}>
        {changePercent > 0 && '+'}
        {changePercent ? `${changePercent}%` : null}
      </Col>
    </Row>
  );
};
