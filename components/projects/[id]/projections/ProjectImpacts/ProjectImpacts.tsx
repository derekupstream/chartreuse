import { Row, Col } from 'antd';
import React from 'react';
import styled from 'styled-components';

import { useMetricSystem } from 'components/_app/MetricSystemProvider';
import type { ProjectionsResponse } from 'lib/calculator/getProjections';
import { changeValue, formattedValueInPounds, changeValueInPounds } from 'lib/number';

import { useCurrency } from 'components/_app/CurrencyProvider';
import BarChart from '../components/BarChart';
import Card from '../components/KPICard';
import { Divider, SectionContainer, SectionHeader, ChartTitle } from '../components/styles';

const StyledCol = styled(Col)`
  @media print {
    flex: 0 0 50% !important;
    max-width: 50% !important;
  }
`;
type Props = {
  data: ProjectionsResponse['annualSummary'];
  showTitle?: boolean;
};

const ProjectImpacts: React.FC<Props> = ({ data, showTitle }) => {
  const { symbol: currencySymbol } = useCurrency();
  const displayAsMetric = useMetricSystem();
  const savingsData = [
    { label: 'Baseline', value: data.dollarCost.baseline },
    { label: 'Forecast', value: data.dollarCost.forecast }
  ];

  const singleUseData = [
    { label: 'Baseline', value: data.singleUseProductCount.baseline },
    { label: 'Forecast', value: data.singleUseProductCount.forecast }
  ];

  const wasteData = [
    {
      label: 'Baseline',
      value: changeValueInPounds(data.wasteWeight.baseline, { displayAsMetric, displayAsTons: false })
    },
    {
      label: 'Forecast',
      value: changeValueInPounds(data.wasteWeight.forecast, { displayAsMetric, displayAsTons: false })
    }
  ];

  const ghgData = [
    { label: 'Baseline', value: data.greenhouseGasEmissions.total.baseline },
    { label: 'Forecast', value: data.greenhouseGasEmissions.total.forecast }
  ];

  return (
    <SectionContainer>
      {showTitle && (
        <>
          <SectionHeader style={{ margin: 0 }}>Project Impacts</SectionHeader>
          <Divider />
        </>
      )}
      <Row gutter={[30, 24]}>
        <StyledCol xs={24} lg={12}>
          <Card
            title='Your estimated annual savings'
            changePercent={data.dollarCost.changePercent * -1}
            changeStr={`${changeValue(data.dollarCost.change * -1, { preUnit: currencySymbol }).toLocaleString()}`}
          >
            <br />
            <BarChart
              data={savingsData}
              formatter={(text, data) => {
                return `${data.label}: ${currencySymbol}${data.value.toLocaleString()}`;
              }}
              seriesField='label'
            />
          </Card>
        </StyledCol>
        <StyledCol xs={24} lg={12}>
          <Card
            title='Your reduction in single-use purchasing'
            changePercent={data.singleUseProductCount.changePercent * -1}
            changeStr={changeValue(data.singleUseProductCount.change * -1) + ' units'}
          >
            <br />
            <BarChart
              data={singleUseData}
              formatter={(text, data) => `${data.label}: ${data.value.toLocaleString()} pieces`}
              seriesField='label'
            />
          </Card>
        </StyledCol>
        <StyledCol xs={24} lg={12}>
          <Card
            title='Your waste reductions'
            changePercent={data.wasteWeight.changePercent * -1}
            changeStr={changeValueInPounds(data.wasteWeight.change * -1, { displayAsMetric, displayAsTons: false })}
          >
            <br />
            <BarChart
              data={wasteData}
              formatter={(text, data) =>
                `${data.label}: ${formattedValueInPounds(data.value, { displayAsMetric, displayAsTons: false })}`
              }
              seriesField='label'
            />
          </Card>
        </StyledCol>
        <StyledCol xs={24} lg={12}>
          <Card
            title='Your GHG reductions'
            changePercent={data.greenhouseGasEmissions.total.changePercent * -1}
            changeStr={changeValue(data.greenhouseGasEmissions.total.change * -1) + ' MTC02e'}
          >
            <br />
            <BarChart
              data={ghgData}
              formatter={(text, data) => `${data.label}: ${data.value.toLocaleString()} MTC02e`}
              seriesField='label'
            />
          </Card>
        </StyledCol>
      </Row>
    </SectionContainer>
  );
};

export default ProjectImpacts;
