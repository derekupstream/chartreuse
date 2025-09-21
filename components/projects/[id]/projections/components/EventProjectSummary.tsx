import { Row, Col, Typography } from 'antd';
import React, { useMemo } from 'react';
import styled from 'styled-components';

import { useMetricSystem } from 'components/_app/MetricSystemProvider';
import type { ProjectionsResponse } from 'lib/calculator/getProjections';
import { SingleValueKPICard } from './common/SingleValueKPICard';
import { changeValue, formattedValueInPounds, valueInPounds, changeValueInPounds } from 'lib/number';

import { useCurrency } from 'components/_app/CurrencyProvider';
import BarChart from './common/BarChart';
import Card from './common/KPICard';
import { Divider, SectionContainer, SectionHeader, ChartTitle } from './common/styles';
import { ProjectCategory } from '@prisma/client';

import { EnvironmentalSummary } from './ProjectSummary/EnvironmentalSummary/EnvironmentalSummary';
import { getReturnOrShrinkageRate } from '../../usage/UsageStep';
const StyledCol = styled(Col)`
  @media print {
    flex: 0 0 50% !important;
    max-width: 50% !important;
  }
`;
type Props = {
  data: ProjectionsResponse;
  showTitle?: boolean;
  useShrinkageRate: boolean;
};

export const EventProjectSummary: React.FC<Props> = ({
  data: { reusableResults, annualSummary, environmentalResults, bottleStationResults },
  useShrinkageRate,
  showTitle
}) => {
  const { symbol: currencySymbol } = useCurrency();
  const displayAsMetric = useMetricSystem();

  const firstLabel = 'Baseline';
  const secondLabel = 'Forecast';
  const singleUseData = [
    { label: firstLabel, value: annualSummary.singleUseProductCount.baseline },
    { label: secondLabel, value: annualSummary.singleUseProductCount.forecast }
  ];

  const wasteData = [
    {
      label: firstLabel,
      value: valueInPounds(annualSummary.wasteWeight.baseline, { displayAsMetric, displayAsTons: false })
    },
    {
      label: secondLabel,
      value: valueInPounds(annualSummary.wasteWeight.forecast, { displayAsMetric, displayAsTons: false })
    }
  ];

  const ghgData = [
    { label: firstLabel, value: annualSummary.greenhouseGasEmissions.total.baseline },
    { label: secondLabel, value: annualSummary.greenhouseGasEmissions.total.forecast }
  ];
  const { displayValue: returnRateDisplayValue, returnRatelabel } = useMemo(() => {
    const returnRate = reusableResults.summary.returnRate?.returnRate ?? 100;
    return getReturnOrShrinkageRate({
      returnRate,
      useShrinkageRate
    });
  }, [reusableResults, useShrinkageRate]);

  return (
    <>
      <SectionContainer>
        {showTitle && (
          <>
            <SectionHeader style={{ margin: 0 }}>Project Impacts</SectionHeader>
            <Divider />
          </>
        )}
        <Row gutter={[30, 24]}>
          {/* <StyledCol xs={24} lg={12}>
            <SingleValueKPICard
              title='Your total waste changes'
              value={changeValueInPounds(annualSummary.wasteWeight.change * -1, {
                displayAsMetric,
                displayAsTons: false
              })}
              subtitle=''
            />
          </StyledCol> */}
          {/* <StyledCol xs={24} lg={12}>
            <SingleValueKPICard
              title='Your water usage changes'
              value={`${Math.round(environmentalResults.annualWaterUsageChanges.total.change * -1).toLocaleString()} gal`}
              subtitle=''
            />
          </StyledCol> */}
          {bottleStationResults.bottlesSaved > 0 && (
            <StyledCol xs={24} lg={12}>
              <SingleValueKPICard
                title='Water bottles avoided'
                value={`${Math.round(bottleStationResults.bottlesSaved).toLocaleString()} bottles`}
                subtitle=''
              />
            </StyledCol>
          )}
          <StyledCol xs={24} lg={12}>
            <SingleValueKPICard
              title='Single-use items avoided'
              value={`${changeValue(annualSummary.singleUseProductCount.change * -1)} items`}
              subtitle=''
            />
          </StyledCol>
          <StyledCol xs={24} lg={12}>
            <SingleValueKPICard title={returnRatelabel} value={`${returnRateDisplayValue}%`} subtitle='' />
          </StyledCol>
          {/* <StyledCol xs={24} lg={12}>
            <SingleValueKPICard
              title='Your GHG reductions'
              value={`${changeValue(annualSummary.greenhouseGasEmissions.total.change * -1)} MTC02e`}
              subtitle=''
            />
          </StyledCol> */}
        </Row>
      </SectionContainer>
      <EnvironmentalSummary data={environmentalResults} isEventProject />
    </>
  );
};
