import type { RadioChangeEvent } from 'antd';
import { Radio, Typography, Row, Col } from 'antd';
import { useState } from 'react';
import styled from 'styled-components';

import { poundsToTons } from 'lib/calculator/constants/conversions';
import type { ProjectionsResponse } from 'lib/calculator/getProjections';
import { changeValue, valueInGallons, valueInPounds, changeValueInGallons, changeValueInPounds } from 'lib/number';

import BigNumber from '../components/BigNumber';
import KPICard from '../components/KPICard';
import Card from '../components/Card';
import Chart from '../components/ChartColumn';
import { SectionContainer, SectionHeader, SectionTitle } from '../components/styles';
import { useMetricSystem } from 'components/_app/MetricSystemProvider';
import { ViewResultsWrapper, BigNumberWrapper, ChartTitle } from './components/styles';

const StyledCol = styled(Col)`
  @media print {
    flex: 0 0 50% !important;
    max-width: 50% !important;
  }
`;
type Props = {
  data: ProjectionsResponse['environmentalResults'];
  hideWaterUsage?: boolean;
};

const EnvironmentalSummary: React.FC<Props> = ({ data, hideWaterUsage }) => {
  const displayAsMetric = useMetricSystem();
  const [units, setUnits] = useState<'pounds' | 'tons'>('pounds');
  const onChangeResults = (event: RadioChangeEvent) => {
    setUnits(event.target.value);
  };
  const displayAsTons = units === 'tons';
  const options = { displayAsMetric, displayAsTons };

  const annualWasteData = [
    {
      label: 'Landfilled foodware weight',
      value: valueInPounds(data.annualWasteChanges.disposableProductWeight.baseline, options),
      wasteType: 'Baseline'
    },
    {
      label: 'Landfilled foodware weight',
      value: valueInPounds(data.annualWasteChanges.disposableProductWeight.forecast, options),
      wasteType: 'Forecast'
    },
    {
      label: 'Shipping box weight',
      value: valueInPounds(data.annualWasteChanges.disposableShippingBoxWeight.baseline, options),
      wasteType: 'Baseline'
    },
    {
      label: 'Shipping box weight',
      value: valueInPounds(data.annualWasteChanges.disposableShippingBoxWeight.forecast, options),
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
    },
    {
      label: 'Shipping box emissions',
      value: data.annualGasEmissionChanges.shippingBox.baseline,
      wasteType: 'Baseline'
    },
    {
      label: 'Shipping box emissions',
      value: data.annualGasEmissionChanges.shippingBox.forecast,
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

  const waterData = [
    {
      label: 'Foodware water usage',
      value: valueInGallons(data.annualWaterUsageChanges.landfillWaste.baseline, { displayAsMetric }),
      wasteType: 'Baseline'
    },
    {
      label: 'Foodware water usage',
      value: valueInGallons(data.annualWaterUsageChanges.landfillWaste.forecast, { displayAsMetric }),
      wasteType: 'Forecast'
    }
  ];

  if (data.annualWaterUsageChanges.dishwashing.change) {
    waterData.push(
      {
        label: 'Dishwashing water usage',
        value: valueInGallons(data.annualWaterUsageChanges.dishwashing.baseline, { displayAsMetric }),
        wasteType: 'Baseline'
      },
      {
        label: 'Dishwashing water usage',
        value: valueInGallons(data.annualWaterUsageChanges.dishwashing.forecast, { displayAsMetric }),
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
            <SectionTitle>Your total annual waste changes</SectionTitle>

            <BigNumberWrapper>
              <BigNumber value={changeValueInPounds(data.annualWasteChanges.total.change, options)} />
            </BigNumberWrapper>

            <ChartTitle>Annual waste changes</ChartTitle>
            <Chart data={annualWasteData} seriesField='wasteType' />
            <ViewResultsWrapper>
              <Typography.Text style={{ marginRight: '20px' }}>View results in:</Typography.Text>
              <Radio.Group onChange={onChangeResults} defaultValue={units}>
                <Radio.Button value='pounds'>{displayAsMetric ? 'kilograms' : 'pounds'}</Radio.Button>
                <Radio.Button value='tons'>tons</Radio.Button>
              </Radio.Group>
            </ViewResultsWrapper>
          </Card>
        </StyledCol>
        {!hideWaterUsage && (
          <StyledCol xs={24} lg={12}>
            <KPICard
              style={{ height: '100%' }}
              title='Your annual water usage changes'
              changePercent={data.annualWaterUsageChanges.total.changePercent * -1}
              changeStr={`${changeValueInGallons(data.annualWaterUsageChanges.total.change, {
                displayAsMetric
              })}`}
            >
              <br />
              <ChartTitle>Annual water usage changes</ChartTitle>
              <Chart data={waterData} seriesField='wasteType' />
            </KPICard>
          </StyledCol>
        )}

        <StyledCol xs={24} lg={hideWaterUsage ? 12 : 24}>
          <Card style={{ height: '100%' }}>
            <SectionTitle>Your annual net GHG changes</SectionTitle>

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
