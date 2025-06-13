import type { RadioChangeEvent } from 'antd';
import { Radio, Typography, Row, Col } from 'antd';
import { useState } from 'react';
import styled from 'styled-components';

import { poundsToTons } from 'lib/calculator/constants/conversions';
import type { ProjectionsResponse } from 'lib/calculator/getProjections';
import { changeValue, valueInGallons, valueInPounds, changeValueInGallons, changeValueInPounds } from 'lib/number';

import BigNumber from '../../common/BigNumber';
import KPICard from '../../common/KPICard';
import Card from '../../common/Card';
import Chart from '../../common/ChartColumn';
import { SectionContainer, SectionHeader, SectionTitle } from '../../common/styles';
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
  isEventProject?: boolean;
};

export const EnvironmentalSummary: React.FC<Props> = ({ data, hideWaterUsage, isEventProject }) => {
  const displayAsMetric = useMetricSystem();
  const [units, setUnits] = useState<'pounds' | 'tons'>('pounds');
  const onChangeResults = (event: RadioChangeEvent) => {
    setUnits(event.target.value);
  };
  const displayAsTons = units === 'tons';
  const options = { displayAsMetric, displayAsTons };

  const firstLabel = isEventProject ? 'Single-use' : 'Baseline';
  const secondLabel = isEventProject ? 'Reusable' : 'Forecast';

  const annualWasteData = [
    {
      label: 'Landfilled foodware weight',
      value: valueInPounds(
        isEventProject
          ? data.eventProjectWaste.singleUseItems.total
          : data.annualWasteChanges.disposableProductWeight.baseline,
        options
      ),
      wasteType: firstLabel
    },
    {
      label: 'Landfilled foodware weight',
      value: valueInPounds(
        isEventProject
          ? data.eventProjectWaste.reusableItems.total
          : data.annualWasteChanges.disposableProductWeight.forecast,
        options
      ),
      wasteType: secondLabel
    },
    {
      label: 'Shipping box weight',
      value: valueInPounds(
        isEventProject
          ? data.eventProjectWaste.singleUseItems.shippingBoxWeight
          : data.annualWasteChanges.disposableShippingBoxWeight.baseline,
        options
      ),
      wasteType: firstLabel
    },
    {
      label: 'Shipping box weight',
      value: valueInPounds(
        isEventProject
          ? 0 // no shipping box weight for reusables
          : data.annualWasteChanges.disposableShippingBoxWeight.forecast,
        options
      ),
      wasteType: secondLabel
    }
  ];

  const ghgData = [
    {
      label: 'Foodware emissions',
      value: data.annualGasEmissionChanges.landfillWaste.baseline,
      wasteType: firstLabel
    },
    {
      label: 'Foodware emissions',
      value: data.annualGasEmissionChanges.landfillWaste.forecast,
      wasteType: secondLabel
    },
    {
      label: 'Shipping box emissions',
      value: data.annualGasEmissionChanges.shippingBox.baseline,
      wasteType: firstLabel
    },
    {
      label: 'Shipping box emissions',
      value: data.annualGasEmissionChanges.shippingBox.forecast,
      wasteType: secondLabel
    }
  ];

  if (data.annualGasEmissionChanges.dishwashing.change) {
    ghgData.push(
      {
        label: 'Dishwashing emissions',
        value: data.annualGasEmissionChanges.dishwashing.baseline,
        wasteType: firstLabel
      },
      {
        label: 'Dishwashing emissions',
        value: data.annualGasEmissionChanges.dishwashing.forecast,
        wasteType: secondLabel
      }
    );
  }

  const waterData = [
    {
      label: 'Foodware water usage',
      value: valueInGallons(data.annualWaterUsageChanges.landfillWaste.baseline, { displayAsMetric }),
      wasteType: firstLabel
    },
    {
      label: 'Foodware water usage',
      value: valueInGallons(data.annualWaterUsageChanges.landfillWaste.forecast, { displayAsMetric }),
      wasteType: secondLabel
    }
  ];

  if (data.annualWaterUsageChanges.dishwashing.change) {
    waterData.push(
      {
        label: 'Dishwashing water usage',
        value: valueInGallons(data.annualWaterUsageChanges.dishwashing.baseline, { displayAsMetric }),
        wasteType: firstLabel
      },
      {
        label: 'Dishwashing water usage',
        value: valueInGallons(data.annualWaterUsageChanges.dishwashing.forecast, { displayAsMetric }),
        wasteType: secondLabel
      }
    );
  }

  return (
    <SectionContainer>
      <SectionHeader>Environmental summary</SectionHeader>

      <Row gutter={[30, 24]}>
        <StyledCol xs={24} lg={12}>
          <Card>
            <SectionTitle>Your {isEventProject ? 'total' : 'annual'} waste changes</SectionTitle>

            <BigNumberWrapper>
              <BigNumber
                value={changeValueInPounds(
                  isEventProject ? data.eventProjectWaste.summary.change : data.annualWasteChanges.summary.change,
                  options
                )}
              />
            </BigNumberWrapper>

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
              title={`Your ${isEventProject ? 'total' : 'annual'} water usage changes`}
              changePercent={data.annualWaterUsageChanges.total.changePercent * -1}
              changeStr={`${changeValueInGallons(data.annualWaterUsageChanges.total.change, {
                displayAsMetric
              })}`}
            >
              <br />
              <Chart data={waterData} seriesField='wasteType' />
            </KPICard>
          </StyledCol>
        )}

        <StyledCol xs={24} lg={hideWaterUsage ? 12 : 24}>
          <Card style={{ height: '100%' }}>
            <SectionTitle>Your {isEventProject ? 'total' : 'annual'} GHG changes</SectionTitle>

            <BigNumberWrapper>
              <BigNumber value={`${changeValue(data.annualGasEmissionChanges.total.change)} MTCO2e`} />
            </BigNumberWrapper>

            <Chart data={ghgData} seriesField='wasteType' />
          </Card>
        </StyledCol>
      </Row>
    </SectionContainer>
  );
};
