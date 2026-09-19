import type { RadioChangeEvent } from 'antd';
import { Radio, Typography, Row, Col, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import styled from 'styled-components';

const Line = dynamic(() => import('@ant-design/plots').then(r => r.Line), { ssr: false });

import { InspectTooltip } from 'components/common/InspectMode';
import { CalculationCard } from 'components/common/CalculationInspector';
import { poundsToTons } from 'lib/calculator/constants/conversions';
import type { ProjectionsResponse } from 'lib/calculator/getProjections';
import { changeValue, valueInGallons, valueInPounds, changeValueInGallons, changeValueInPounds } from 'lib/number';

import KPICard from '../../common/KPICard';
import Card from '../../common/Card';
import Chart from '../../common/ChartColumn';
import { SectionContainer, SectionHeader, SectionTitle } from '../../common/styles';
import { useMetricSystem } from 'components/_app/MetricSystemProvider';
import { ViewResultsWrapper, ChartTitle } from './components/styles';

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
  /**
   * The Environmental Break-Even card is a Chart-Reuse 2.0 feature, so it is OFF unless a
   * caller explicitly turns it on (the projections page passes its 2.0-mode flag). Public
   * share pages compute with the legacy engine, so leaving this out hides the card there
   * too (Derek, 2026-09-19: "doesn't belong in Chart-Reuse legacy").
   */
  showEnvBreakEven?: boolean;
};

export const EnvironmentalSummary: React.FC<Props> = ({
  data,
  hideWaterUsage,
  isEventProject,
  showEnvBreakEven = false
}) => {
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
          <CalculationCard outputKey='wasteWeight' label='waste avoided'>
            <InspectTooltip
              meta={{
                id: 'env-annual-waste',
                label: 'Annual Waste Changes',
                type: 'calculation',
                path: 'environmentalResults.annualWasteChanges.summary.change',
                description: 'Sum of landfill product weight + shipping box weight, baseline vs forecast',
                calculatorFunction: 'getAnnualWasteChanges()',
                sourceFile: 'lib/calculator/calculations/waste/getAnnualWasteChanges.ts'
              }}
            >
              <KPICard
                style={{ height: '100%' }}
                title={isEventProject ? 'Waste to landfill prevented' : `Annual waste changes`}
                changePercent={
                  isEventProject
                    ? data.eventProjectWaste.summary.changePercent * -1
                    : data.annualWasteChanges.summary.changePercent * -1
                }
                changeStr={`${changeValueInPounds(isEventProject ? data.eventProjectWaste.summary.change * -1 : data.annualWasteChanges.summary.change, options)}`}
              >
                <br />
                <Chart data={annualWasteData} seriesField='wasteType' />
                <ViewResultsWrapper>
                  <Typography.Text style={{ marginRight: '20px' }}>View results in:</Typography.Text>
                  <Radio.Group onChange={onChangeResults} defaultValue={units}>
                    <Radio.Button value='pounds'>{displayAsMetric ? 'kilograms' : 'pounds'}</Radio.Button>
                    <Radio.Button value='tons'>tons</Radio.Button>
                  </Radio.Group>
                </ViewResultsWrapper>
              </KPICard>
            </InspectTooltip>
          </CalculationCard>
        </StyledCol>
        {!hideWaterUsage && (
          <StyledCol xs={24} lg={12}>
            <CalculationCard outputKey='waterTotal' label='water avoided'>
              <InspectTooltip
                meta={{
                  id: 'env-annual-water',
                  label: 'Annual Water Usage Changes',
                  type: 'calculation',
                  path: 'environmentalResults.annualWaterUsageChanges.total.change',
                  description:
                    'Water used in manufacturing single-use items vs washing reusables (material water + dishwashing water)',
                  calculatorFunction: 'getAnnualWaterUsageChanges()',
                  sourceFile: 'lib/calculator/calculations/water/getAnnualWaterUsageChanges.ts',
                  factorName: 'MATERIALS[*].waterUsageGalPerLb'
                }}
              >
                <KPICard
                  style={{ height: '100%' }}
                  title={
                    <span>
                      {isEventProject ? 'Water Usage' : 'Annual water usage changes'}{' '}
                      <Tooltip title='This metric covers water used specifically for foodware: the manufacturing of single-use items or the washing of reusables.'>
                        <InfoCircleOutlined style={{ fontSize: '14px', color: '#8c8c8c', cursor: 'help' }} />
                      </Tooltip>
                    </span>
                  }
                  changePercent={data.annualWaterUsageChanges.total.changePercent * -1}
                  changeStr={`${changeValueInGallons(data.annualWaterUsageChanges.total.change, {
                    displayAsMetric
                  })}`}
                >
                  <br />
                  <Chart data={waterData} seriesField='wasteType' />
                </KPICard>
              </InspectTooltip>
            </CalculationCard>
          </StyledCol>
        )}

        <StyledCol xs={24} lg={hideWaterUsage ? 12 : 24}>
          <CalculationCard outputKey='ghgTotal' label='GHG avoided'>
            <InspectTooltip
              meta={{
                id: 'env-annual-ghg',
                label: 'Annual GHG Emission Changes',
                type: 'calculation',
                path: 'environmentalResults.annualGasEmissionChanges.total.change',
                description: 'Total MTCO2e change: landfill waste + shipping box + dishwashing emissions',
                calculatorFunction: 'getAnnualGasEmissionChanges()',
                sourceFile: 'lib/calculator/calculations/ghg/getAnnualGasEmissionChanges.ts',
                factorName: 'MATERIALS[*].mtco2ePerLb, ELECTRIC_CO2_EMISSIONS_FACTOR, NATURAL_GAS_CO2_EMISSIONS_FACTOR'
              }}
            >
              <KPICard
                style={{ height: '100%' }}
                title={isEventProject ? 'GHG Emissions' : `Annual GHG changes`}
                changePercent={data.annualGasEmissionChanges.total.changePercent * -1}
                changeStr={`${changeValue(data.annualGasEmissionChanges.total.change)} MTCO2e`}
              >
                <br />
                <Chart data={ghgData} seriesField='wasteType' />
              </KPICard>
            </InspectTooltip>
          </CalculationCard>
        </StyledCol>

        {showEnvBreakEven &&
          data.envBreakEven &&
          (data.envBreakEven.co2BreakEvenMonths != null || data.envBreakEven.embodiedCO2Mtco2e > 0) && (
            <StyledCol xs={24}>
              <InspectTooltip
                meta={{
                  id: 'env-break-even',
                  label: 'Environmental Break-Even',
                  type: 'calculation',
                  path: 'environmentalResults.envBreakEven.co2BreakEvenMonths',
                  description:
                    'Embodied CO2 of reusables (material MTCO2e + transport + box) / annual CO2 savings → months',
                  calculatorFunction: 'getEnvBreakEven()',
                  sourceFile: 'lib/calculator/calculations/getEnvBreakEven.ts'
                }}
              >
                <KPICard
                  style={{ height: '100%' }}
                  changeStr={
                    data.envBreakEven.co2BreakEvenMonths != null
                      ? `${data.envBreakEven.co2BreakEvenMonths} mos.`
                      : 'N/A'
                  }
                  title={
                    <span>
                      Environmental Break-Even{' '}
                      <Tooltip title='How many months until the manufacturing carbon footprint of all reusables purchased is offset by avoided single-use emissions. Based on material embodied carbon, transportation, and annual avoided GHG emissions.'>
                        <InfoCircleOutlined style={{ fontSize: '14px', color: '#8c8c8c', cursor: 'help' }} />
                      </Tooltip>
                    </span>
                  }
                >
                  <Typography.Text type='secondary' style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                    How many months until the manufacturing carbon footprint of all reusables purchased is offset by
                    avoided single-use emissions. Based on material embodied carbon, transportation, and annual avoided
                    GHG emissions.
                  </Typography.Text>
                  <br />
                  <EnvBreakEvenChart
                    embodied={data.envBreakEven.embodiedCO2Mtco2e}
                    annualSavings={data.envBreakEven.annualCO2SavingsMtco2e}
                    breakEvenMonths={data.envBreakEven.co2BreakEvenMonths}
                  />
                  <Typography.Text type='secondary' style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                    Reusable manufacturing footprint:{' '}
                    <InspectTooltip
                      meta={{
                        id: 'env-break-even-embodied',
                        label: 'Embodied CO2',
                        type: 'calculation',
                        path: 'environmentalResults.envBreakEven.embodiedCO2Mtco2e',
                        description:
                          'Sum of material embodied carbon + transportation carbon for all reusable items purchased',
                        calculatorFunction: 'getEnvBreakEven()',
                        factorName: 'REUSABLE_MATERIALS[*].mtco2ePerLb, TRANSPORTATION_CO2_EMISSIONS_FACTOR'
                      }}
                    >
                      <strong>{data.envBreakEven.embodiedCO2Mtco2e.toFixed(4)} MTCO2e</strong>
                    </InspectTooltip>
                  </Typography.Text>
                  <Typography.Text type='secondary' style={{ fontSize: 12, display: 'block' }}>
                    Annual avoided emissions:{' '}
                    <InspectTooltip
                      meta={{
                        id: 'env-break-even-annual-savings',
                        label: 'Annual CO2 Savings',
                        type: 'calculation',
                        path: 'environmentalResults.envBreakEven.annualCO2SavingsMtco2e',
                        description: 'Annual GHG avoided by switching from single-use to reusable',
                        calculatorFunction: 'getEnvBreakEven()'
                      }}
                    >
                      <strong>{data.envBreakEven.annualCO2SavingsMtco2e.toFixed(4)} MTCO2e/yr</strong>
                    </InspectTooltip>
                  </Typography.Text>
                </KPICard>
              </InspectTooltip>
            </StyledCol>
          )}
      </Row>
    </SectionContainer>
  );
};

/**
 * The Environmental Break-Even chart (Derek, 2026-09-19): the reusables' one-time
 * manufacturing footprint drawn as a flat line, and the avoided single-use emissions
 * accumulating month by month — where the rising line crosses the flat one is the
 * break-even month, marked with a dashed vertical line. Shows a horizon of about
 * 1.5× the break-even time so the crossing sits comfortably inside the chart.
 */
function EnvBreakEvenChart({
  embodied,
  annualSavings,
  breakEvenMonths
}: {
  embodied: number;
  annualSavings: number;
  breakEvenMonths: number | null;
}) {
  const horizon = breakEvenMonths != null ? Math.min(Math.max(Math.ceil(breakEvenMonths * 1.5), 12), 120) : 24;
  const chartData: { month: number; value: number; series: string }[] = [];
  for (let month = 0; month <= horizon; month++) {
    chartData.push({
      month,
      value: (annualSavings / 12) * month,
      series: 'Avoided single-use emissions (cumulative)'
    });
    chartData.push({ month, value: embodied, series: 'Reusables manufacturing footprint' });
  }
  const annotations =
    breakEvenMonths != null
      ? [
          {
            type: 'lineX',
            xField: breakEvenMonths,
            style: { stroke: '#52c41a', lineWidth: 2, lineDash: [4, 4] },
            label: { text: `Break-even: ${breakEvenMonths} mos.`, position: 'top', fill: '#3f8600' }
          }
        ]
      : [];
  return (
    <div style={{ height: 280 }}>
      <Line
        data={chartData}
        xField='month'
        yField='value'
        colorField='series'
        animate={false}
        scale={{ color: { range: ['#52a41c', '#8c8c8c'] } }}
        annotations={annotations}
        axis={{ x: { title: 'Months' }, y: { title: 'MTCO2e' } }}
        legend={{ color: { position: 'bottom' } }}
        tooltip={{
          title: (d: { month: number }) => `Month ${d.month}`,
          items: [
            {
              field: 'value',
              valueFormatter: (v: number) => `${Number(v).toFixed(2)} MTCO2e`
            }
          ]
        }}
      />
    </div>
  );
}
