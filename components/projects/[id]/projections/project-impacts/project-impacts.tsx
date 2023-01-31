import { Row, Col } from 'antd';
import React from 'react';
import styled from 'styled-components';

import type { ProjectionsResponse } from 'lib/calculator/getProjections';
import { changeValue } from 'lib/number';

import BarChart from '../components/chart-bar';
import Card from '../components/kpi-card';
import { Divider, SectionContainer, SectionHeader, ChartTitle } from '../components/styles';

const StyledCol = styled(Col)`
  @media print {
    flex: 0 0 50% !important;
    max-width: 50% !important;
  }
`;
type Props = {
  data: ProjectionsResponse['annualSummary'];
};

const ProjectImpacts: React.FC<Props> = ({ data }) => {
  const savingsData = [
    { label: 'Baseline', value: data.dollarCost.baseline },
    { label: 'Forecast', value: data.dollarCost.forecast }
  ];

  const singleUseData = [
    { label: 'Baseline', value: data.singleUseProductCount.baseline },
    { label: 'Forecast', value: data.singleUseProductCount.forecast }
  ];

  const wasteData = [
    { label: 'Baseline', value: data.wasteWeight.baseline },
    { label: 'Forecast', value: data.wasteWeight.forecast }
  ];

  const ghgData = [
    { label: 'Baseline', value: data.greenhouseGasEmissions.total.baseline },
    { label: 'Forecast', value: data.greenhouseGasEmissions.total.forecast }
  ];

  return (
    <SectionContainer>
      <SectionHeader style={{ margin: 0 }}>Project Impacts</SectionHeader>
      <Divider />
      <Row gutter={[30, 24]}>
        <StyledCol xs={24} lg={12}>
          <Card title='Your estimated annual savings' changePercent={data.dollarCost.changePercent * -1} changeStr={`${changeValue(data.dollarCost.change * -1, { preUnit: '$' }).toLocaleString()}`}>
            <br />
            <BarChart data={savingsData} formatter={(data: any) => `${data.label}: $${data.value.toLocaleString()}`} seriesField='label' />
          </Card>
        </StyledCol>
        <StyledCol xs={24} lg={12}>
          <Card title='Reductions in single-use purchasing' changePercent={data.singleUseProductCount.changePercent * -1} changeStr={changeValue(data.singleUseProductCount.change * -1) + ' units'}>
            <br />
            <BarChart data={singleUseData} formatter={(data: any) => `${data.label}: ${data.value.toLocaleString()} pieces`} seriesField='label' />
          </Card>
        </StyledCol>
        <StyledCol xs={24} lg={12}>
          <Card title='Your waste reductions' changePercent={data.wasteWeight.changePercent * -1} changeStr={changeValue(data.wasteWeight.change * -1) + ' lbs'}>
            <br />
            <BarChart data={wasteData} formatter={(data: any) => `${data.label}: ${data.value.toLocaleString()} lbs`} seriesField='label' />
          </Card>
        </StyledCol>
        <StyledCol xs={24} lg={12}>
          <Card title='Your GHG reductions' changeStr={changeValue(data.greenhouseGasEmissions.total.change * -1) + ' MTC02e'}>
            <br />
            <BarChart data={ghgData} formatter={(data: any) => `${data.label}: ${data.value.toLocaleString()} MTC02e`} seriesField='label' />
          </Card>
        </StyledCol>
      </Row>
    </SectionContainer>
  );
};

export default ProjectImpacts;
