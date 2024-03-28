import type { RadioChangeEvent } from 'antd';
import { Radio, Typography, Row, Col } from 'antd';
import { useState } from 'react';
import styled from 'styled-components';

import { poundsToTons } from 'lib/calculator/constants/conversions';
import type { ProjectionsResponse } from 'lib/calculator/getProjections';
import { changeValue } from 'lib/number';

import BigNumber from '../components/BigNumber';
import Card from '../components/Card';
import Chart from '../components/ChartColumn';
import { SectionContainer, SectionHeader } from '../components/styles';
import TitleWithTooltip from '../components/TitleWithTooltip';

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
      label: 'Landfilled Foodware Weight',
      value: formatWeight(data.annualWasteChanges.disposableProductWeight.baseline),
      wasteType: 'Baseline'
    },
    {
      label: 'Landfilled Foodware Weight',
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
      label: 'Foodware emissions',
      value: data.annualGasEmissionChanges.landfillWaste.baseline,
      wasteType: 'Baseline'
    },
    {
      label: 'Foodware emissions',
      value: data.annualGasEmissionChanges.landfillWaste.forecast,
      wasteType: 'Forecast'
    }
  ];

  if (data.annualGasEmissionChanges.dishwashing.change) {
    ghgData.push(
      {
        label: 'Dishwashing emissions',
        value: data.annualGasEmissionChanges.dishwashing.baseline,
        wasteType: 'Baseline'
      },
      {
        label: 'Dishwashing emissions',
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
            <TitleWithTooltip title='Your annual net GHG changes' />

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
