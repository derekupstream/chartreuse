import type { RadioChangeEvent } from 'antd';
import { Radio, Typography, Row, Col } from 'antd';
import { useState } from 'react';
import styled from 'styled-components';

import { poundsToTons } from 'lib/calculator/constants/conversions';
import type { ProjectionsResponse } from 'lib/calculator/getProjections';
import { changeValue } from 'lib/number';

import BigNumber from '../components/big-number';
import Card from '../components/card';
import Chart from '../components/chart-column';
import { SectionContainer, SectionHeader } from '../components/styles';
import TitleWithTooltip from '../components/title-with-tooltip';

import { ViewResultsWrapper, BigNumberWrapper, ChartTitle } from './components/styles';

const StyledCol = styled(Col)`
  @media print {
    flex: 0 0 50% !important;
    max-width: 50% !important;
  }
`;
type Props = {
  data: ProjectionsResponse['environmentalResults'];
};

const EnvironmentalSummary: React.FC<Props> = ({ data }) => {
  const [units, setUnits] = useState<'pounds' | 'tons'>('pounds');
  const onChangeResults = (event: RadioChangeEvent) => {
    setUnits(event.target.value);
  };

  function formatWeight(value: number) {
    return units === 'pounds' ? value : poundsToTons(value);
  }

  const annualWasteData = [
    {
      label: 'Single-Use Product Weight',
      value: formatWeight(data.annualWasteChanges.disposableProductWeight.baseline),
      wasteType: 'Baseline'
    },
    {
      label: 'Single-Use Product Weight',
      value: formatWeight(data.annualWasteChanges.disposableProductWeight.forecast),
      wasteType: 'Forecast'
    },
    {
      label: 'Disposable Shipping Box Weight',
      value: formatWeight(data.annualWasteChanges.disposableShippingBoxWeight.baseline),
      wasteType: 'Baseline'
    },
    {
      label: 'Disposable Shipping Box Weight',
      value: formatWeight(data.annualWasteChanges.disposableShippingBoxWeight.forecast),
      wasteType: 'Forecast'
    }
  ];

  const ghgData = [
    {
      label: 'Landfill waste (EPA WARM)',
      value: data.annualGasEmissionChanges.landfillWaste.baseline,
      wasteType: 'Baseline'
    },
    {
      label: 'Landfill waste (EPA WARM)',
      value: data.annualGasEmissionChanges.landfillWaste.forecast,
      wasteType: 'Forecast'
    }
  ];

  if (data.annualGasEmissionChanges.dishwashing.change) {
    ghgData.push(
      {
        label: 'Dishwashing',
        value: data.annualGasEmissionChanges.dishwashing.baseline,
        wasteType: 'Baseline'
      },
      {
        label: 'Dishwashing',
        value: data.annualGasEmissionChanges.dishwashing.forecast,
        wasteType: 'Forecast'
      }
    );
  }

  return (
    <SectionContainer>
      <SectionHeader>Environmental summary</SectionHeader>

      <Row gutter={[30, 24]}>
        <StyledCol xs={24} lg={12}>
          <Card>
            <TitleWithTooltip title='Your total annual waste changes' />

            <BigNumberWrapper>
              <BigNumber
                value={`${changeValue(formatWeight(data.annualWasteChanges.total.change))} ${
                  units === 'pounds' ? 'lbs.' : 'tons'
                }`}
              />
            </BigNumberWrapper>

            <ChartTitle>Annual waste changes</ChartTitle>
            <Chart data={annualWasteData} seriesField='wasteType' />
            <ViewResultsWrapper>
              <Typography.Text style={{ marginRight: '20px' }}>View results in:</Typography.Text>
              <Radio.Group onChange={onChangeResults} defaultValue={units}>
                <Radio.Button value='pounds'>Pounds</Radio.Button>
                <Radio.Button value='tons'>Tons</Radio.Button>
              </Radio.Group>
            </ViewResultsWrapper>
          </Card>
        </StyledCol>

        <StyledCol xs={24} lg={12}>
          <Card style={{ height: '100%' }}>
            <TitleWithTooltip title='Annual net GHG emissions changes' />

            <BigNumberWrapper>
              <BigNumber value={`${changeValue(data.annualGasEmissionChanges.total.change)} MTCO2e`} />
            </BigNumberWrapper>

            <ChartTitle>Annual greenhouse gas changes</ChartTitle>
            <Chart data={ghgData} seriesField='wasteType' />
          </Card>
        </StyledCol>
      </Row>
    </SectionContainer>
  );
};

export default EnvironmentalSummary;
