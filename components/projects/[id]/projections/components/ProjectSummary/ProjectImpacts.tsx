import { Row, Col, Typography } from 'antd';
import React from 'react';
import styled from 'styled-components';

import { useMetricSystem } from 'components/_app/MetricSystemProvider';
import { InspectTooltip } from 'components/common/InspectMode';
import { CalculationIcon } from 'components/common/CalculationInspector';
import type { ProjectionsResponse } from 'lib/calculator/getProjections';
import { changeValue, formattedValueInPounds, valueInPounds, changeValueInPounds } from 'lib/number';

import { useCurrency } from 'components/_app/CurrencyProvider';
import BarChart from '../common/BarChart';
import Card from '../common/KPICard';
import { Divider, SectionContainer, SectionHeader, ChartTitle } from '../common/styles';

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

export const ProjectImpacts: React.FC<Props> = ({ data, showTitle }) => {
  const { symbol: currencySymbol } = useCurrency();
  const displayAsMetric = useMetricSystem();

  const firstLabel = 'Baseline';
  const secondLabel = 'Forecast';
  const savingsData = [
    { label: firstLabel, value: data.dollarCost.baseline },
    { label: secondLabel, value: data.dollarCost.forecast }
  ];

  const singleUseData = [
    { label: firstLabel, value: data.singleUseProductCount.baseline },
    { label: secondLabel, value: data.singleUseProductCount.forecast }
  ];

  const wasteData = [
    {
      label: firstLabel,
      value: valueInPounds(data.wasteWeight.baseline, { displayAsMetric, displayAsTons: false })
    },
    {
      label: secondLabel,
      value: valueInPounds(data.wasteWeight.forecast, { displayAsMetric, displayAsTons: false })
    }
  ];

  const ghgData = [
    { label: firstLabel, value: data.greenhouseGasEmissions.total.baseline },
    { label: secondLabel, value: data.greenhouseGasEmissions.total.forecast }
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
          <InspectTooltip
            meta={{
              id: 'impact-annual-savings',
              label: 'Estimated Annual Savings',
              type: 'calculation',
              path: 'annualSummary.dollarCost.change',
              description: 'Baseline single-use cost minus forecast reusable cost (annual)',
              calculatorFunction: 'getFinancialResults()',
              sourceFile: 'lib/calculator/calculations/getFinancialResults.ts'
            }}
          >
            <Card
              title={
                <span>
                  Your estimated annual savings
                  <CalculationIcon outputKey='annualCostChange' label='annual savings' />
                </span>
              }
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
          </InspectTooltip>
        </StyledCol>
        <StyledCol xs={24} lg={12}>
          <InspectTooltip
            meta={{
              id: 'impact-single-use-reduction',
              label: 'Single-Use Purchasing Reduction',
              type: 'calculation',
              path: 'annualSummary.singleUseProductCount.change',
              description: 'Baseline single-use unit count minus forecast unit count',
              calculatorFunction: 'getSingleUseResults()',
              sourceFile: 'lib/calculator/calculations/foodware/getSingleUseResults.ts'
            }}
          >
            <Card
              title={
                <span>
                  Your reduction in single-use purchasing
                  <CalculationIcon outputKey='singleUseUnits' label='items avoided' />
                </span>
              }
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
          </InspectTooltip>
        </StyledCol>
        <StyledCol xs={24} lg={12}>
          <InspectTooltip
            meta={{
              id: 'impact-waste-reduction',
              label: 'Waste Reductions',
              type: 'calculation',
              path: 'annualSummary.wasteWeight.change',
              description: 'Total landfill waste weight change: baseline product + shipping box weight minus forecast',
              calculatorFunction: 'getAnnualWasteChanges()',
              sourceFile: 'lib/calculator/calculations/waste/getAnnualWasteChanges.ts'
            }}
          >
            <Card
              title={
                <span>
                  Your waste reductions
                  <CalculationIcon outputKey='wasteWeight' label='waste avoided' />
                </span>
              }
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
          </InspectTooltip>
        </StyledCol>
        <StyledCol xs={24} lg={12}>
          <InspectTooltip
            meta={{
              id: 'impact-ghg-reduction',
              label: 'GHG Reductions',
              type: 'calculation',
              path: 'annualSummary.greenhouseGasEmissions.total.change',
              description:
                'Total annual greenhouse gas emission change across landfill waste, shipping, and dishwashing',
              calculatorFunction: 'getAnnualGasEmissionChanges()',
              sourceFile: 'lib/calculator/calculations/ghg/getAnnualGasEmissionChanges.ts'
            }}
          >
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
          </InspectTooltip>
        </StyledCol>
      </Row>
    </SectionContainer>
  );
};
