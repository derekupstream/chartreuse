import { Col, Row, Typography } from 'antd';
import type { ReactNode } from 'react';

import type { ProjectSummary } from 'lib/calculator/getProjections';
import { formatToDollar } from 'lib/calculator/utils';
import { useMetricSystem } from 'components/_app/MetricSystemProvider';
import { valueInPounds } from 'lib/number';
import { defaultFormatter } from '../utils';
import { useCurrency } from 'components/_app/CurrencyProvider';

export const columns = [
  {
    title: 'Name',
    key: 'name',
    render: (record: ProjectSummary) => {
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
            Estimated Savings
            <br />
            Waste Reduction <span style={{ color: 'grey' }}>({displayAsMetric ? 'kg' : 'lb'})</span>
            <br />
            Single-Use Reduction <span style={{ color: 'grey' }}>(units)</span>
            <br />
            GHG Reduction <span style={{ color: 'grey' }}>(MTC02e)</span>
          </Typography.Text>
        </>
      );
    }
  },
  {
    title: 'Baseline',
    key: 'baseline',
    render: (record: ProjectSummary) => {
      const { abbreviation: currencyAbbreviation } = useCurrency();
      const displayAsMetric = useMetricSystem();
      return (
        <>
          <Typography.Title level={4} style={{ margin: 0 }}>
            &nbsp;
          </Typography.Title>
          <Typography.Paragraph>&nbsp;</Typography.Paragraph>
          <Typography.Text style={{ lineHeight: 2 }}>
            {formatToDollar(record.projections.annualSummary.dollarCost.baseline, currencyAbbreviation)}
            <br />
            {valueInPounds(record.projections.annualSummary.wasteWeight.baseline, {
              displayAsMetric,
              displayAsTons: false
            }).toLocaleString()}
            <br />
            {record.projections.annualSummary.singleUseProductCount.baseline.toLocaleString()}
            <br />
            {record.projections.annualSummary.greenhouseGasEmissions.total.baseline.toLocaleString()}
          </Typography.Text>
        </>
      );
    }
  },
  {
    title: 'Forecast',
    key: 'forecast',
    render: (record: ProjectSummary) => {
      const { abbreviation: currencyAbbreviation } = useCurrency();
      const displayAsMetric = useMetricSystem();
      return (
        <>
          <Typography.Title level={4} style={{ margin: 0 }}>
            &nbsp;
          </Typography.Title>
          <Typography.Paragraph>&nbsp;</Typography.Paragraph>
          <Typography.Text style={{ lineHeight: 2 }}>
            {formatToDollar(record.projections.annualSummary.dollarCost.forecast, currencyAbbreviation)}
            <br />
            {valueInPounds(record.projections.annualSummary.wasteWeight.forecast, {
              displayAsMetric,
              displayAsTons: false
            }).toLocaleString()}
            <br />
            {record.projections.annualSummary.singleUseProductCount.forecast.toLocaleString()}
            <br />
            {record.projections.annualSummary.greenhouseGasEmissions.total.forecast.toLocaleString()}
          </Typography.Text>
        </>
      );
    }
  },
  {
    // think of these changes as 'reductions', hence we multiply them * -1
    title: '',
    key: 'change',
    render: (record: ProjectSummary) => {
      const { abbreviation: currencyAbbreviation } = useCurrency();
      const displayAsMetric = useMetricSystem();
      return (
        <>
          <Typography.Title level={4} style={{ margin: 0 }}>
            &nbsp;
          </Typography.Title>
          <Typography.Paragraph>&nbsp;</Typography.Paragraph>
          <Typography.Text style={{ lineHeight: 2 }}>
            <ReductionValue
              value={record.projections.annualSummary.dollarCost}
              formatter={val => formatToDollar(val, currencyAbbreviation)}
            />
            <ReductionValue
              value={record.projections.annualSummary.wasteWeight}
              formatter={val => defaultFormatter(valueInPounds(val, { displayAsMetric, displayAsTons: false }))}
            />
            <ReductionValue value={record.projections.annualSummary.singleUseProductCount} />
            <ReductionValue value={record.projections.annualSummary.greenhouseGasEmissions.total} />
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
