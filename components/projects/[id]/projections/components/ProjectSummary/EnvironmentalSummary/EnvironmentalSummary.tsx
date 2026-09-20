import type { RadioChangeEvent } from 'antd';
import { Radio, Typography, Row, Col, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useState } from 'react';
import styled from 'styled-components';

import { InspectTooltip } from 'components/common/InspectMode';
import { CalculationCard } from 'components/common/CalculationInspector';
import { poundsToTons } from 'lib/calculator/constants/conversions';
import type { ProjectionsResponse } from 'lib/calculator/getProjections';
import { changeValue, valueInGallons, valueInPounds, changeValueInGallons, changeValueInPounds } from 'lib/number';

import KPICard, { Value } from '../../common/KPICard';
import PercentTag from '../../common/PercentTag';
import Card from '../../common/Card';
import Chart from '../../common/ChartColumn';
import { CardTitle } from '../../common/styles';
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
              {/* The same "View calculation" hover pill + side pop-out every other stat card
                  has — the assumptions live in that pop-out (Derek, 2026-09-20). */}
              <CalculationCard outputKey='envBreakEven' label='environmental break-even'>
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
                  <Card style={{ height: '100%' }}>
                    {/* header: title and one-line subtitle, styled like every other card */}
                    <div style={{ marginBottom: 18 }}>
                      <CardTitle>
                        Environmental break-even{' '}
                        <Tooltip title='How many months until the manufacturing carbon footprint of all reusables purchased is offset by avoided single-use emissions. Based on material embodied carbon, transportation, and annual avoided GHG emissions.'>
                          <InfoCircleOutlined style={{ fontSize: '14px', color: '#8c8c8c', cursor: 'help' }} />
                        </Tooltip>
                      </CardTitle>
                      <Typography.Text type='secondary' style={{ display: 'block', marginTop: 2 }}>
                        Cumulative GHG emissions · Single-use vs. reusables
                      </Typography.Text>
                    </div>

                    {/* the three headline stats */}
                    <div style={{ display: 'flex', gap: 48, rowGap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
                      <div>
                        <Typography.Text type='secondary' style={{ fontSize: 13, display: 'block' }}>
                          Break-even point
                        </Typography.Text>
                        <Value>{data.envBreakEven.co2BreakEvenMonths ?? '—'}</Value>
                        <Typography.Text type='secondary'>
                          {data.envBreakEven.co2BreakEvenMonths === 1 ? 'month' : 'months'}
                        </Typography.Text>
                      </div>
                      <div>
                        <Typography.Text type='secondary' style={{ fontSize: 13, display: 'block' }}>
                          Emissions avoided at 12 months
                        </Typography.Text>
                        <Value>
                          {Math.abs(data.envBreakEven.annualCO2SavingsMtco2e) >= 10
                            ? Math.round(data.envBreakEven.annualCO2SavingsMtco2e).toLocaleString()
                            : parseFloat(data.envBreakEven.annualCO2SavingsMtco2e.toPrecision(2))}
                        </Value>
                        <Typography.Text type='secondary'>MTCO2e</Typography.Text>
                      </div>
                      <div>
                        <Typography.Text type='secondary' style={{ fontSize: 13, display: 'block' }}>
                          Compared with single-use
                        </Typography.Text>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                          {/* changePercent is already whole percent (-78 means a 78% cut) */}
                          <PercentTag value={Math.round(data.annualGasEmissionChanges.total.changePercent * -1)} />
                          <Typography.Text type='secondary'>GHG emissions</Typography.Text>
                        </span>
                      </div>
                    </div>

                    {/* legend — the site's chart palette: light green baseline, brand green forecast */}
                    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <svg width='26' height='4' aria-hidden='true'>
                          <line x1='0' y1='2' x2='26' y2='2' stroke='#8c8c8c' strokeWidth='2.5' strokeDasharray='6 4' />
                        </svg>
                        <Typography.Text style={{ fontSize: 13 }}>Single-use</Typography.Text>
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <svg width='26' height='4' aria-hidden='true'>
                          <line x1='0' y1='2' x2='26' y2='2' stroke='#95EE49' strokeWidth='3' />
                        </svg>
                        <Typography.Text style={{ fontSize: 13 }}>Reusables</Typography.Text>
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: 3,
                            background: '#E0FACA',
                            display: 'inline-block'
                          }}
                        />
                        <Typography.Text style={{ fontSize: 13 }}>Emissions avoided</Typography.Text>
                      </span>
                    </div>

                    <Typography.Text type='secondary' style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>
                      Cumulative GHG emissions (MTCO2e)
                    </Typography.Text>
                    <EnvBreakEvenChart
                      embodied={data.envBreakEven.embodiedCO2Mtco2e}
                      baselineAnnual={data.annualGasEmissionChanges.total.baseline}
                      forecastAnnual={data.annualGasEmissionChanges.total.forecast}
                      breakEvenMonths={data.envBreakEven.co2BreakEvenMonths}
                    />

                    {/* footer: provenance on the left, assumptions on the right */}
                    <div
                      style={{
                        borderTop: '1px solid #f0f0f0',
                        marginTop: 14,
                        paddingTop: 10,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        gap: 12,
                        flexWrap: 'wrap'
                      }}
                    >
                      <Typography.Text type='secondary' style={{ fontSize: 12 }}>
                        Reusables manufacturing footprint{' '}
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
                        </InspectTooltip>{' '}
                        · Annual avoided emissions{' '}
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
                          <strong>{data.envBreakEven.annualCO2SavingsMtco2e.toFixed(2)} MTCO2e/yr</strong>
                        </InspectTooltip>
                      </Typography.Text>
                    </div>
                  </Card>
                </InspectTooltip>
              </CalculationCard>
            </StyledCol>
          )}
      </Row>
    </SectionContainer>
  );
};

/**
 * The Environmental Break-Even chart (Derek's mockup, 2026-09-20): cumulative GHG of the
 * two paths — single-use dashed from zero, reusables in the site's brand green starting at
 * the one-time manufacturing footprint. Where they cross is the break-even month (dashed
 * marker with a pill label and a ring at the crossing); the gap after it is shaded as
 * emissions avoided. Drawn as plain SVG (site font and chart palette) so the shading,
 * marker and pill are exactly where the math says; moving the mouse across it tracks a
 * month and reads out both lines and the amount avoided.
 */
function EnvBreakEvenChart({
  embodied,
  baselineAnnual,
  forecastAnnual,
  breakEvenMonths
}: {
  embodied: number;
  baselineAnnual: number;
  forecastAnnual: number;
  breakEvenMonths: number | null;
}) {
  const [hoverMonth, setHoverMonth] = useState<number | null>(null);
  // Horizon: 12 months, stretched when break-even lands later so the crossing stays visible.
  const horizon = breakEvenMonths != null ? Math.min(Math.max(12, Math.ceil(breakEvenMonths * 1.5)), 60) : 12;
  const singleUseAt = (m: number) => (baselineAnnual / 12) * m;
  const reusablesAt = (m: number) => embodied + (forecastAnnual / 12) * m;

  const rawMax = Math.max(singleUseAt(horizon), reusablesAt(horizon), 1e-9);
  // Four equal divisions with a ROUND step, so tick labels never land on values like 112.5.
  const roughStep = rawMax / 4;
  const stepPower = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const step = [1, 2, 2.5, 4, 5, 10].map(m => m * stepPower).find(v => v * 4 >= rawMax) ?? roughStep;
  const yMax = step * 4;

  const W = 720;
  const HT = 300;
  const L = 56;
  const R = 710;
  const T = 48;
  const B = 250;
  const x = (m: number) => L + ((R - L) * m) / horizon;
  const y = (v: number) => B - ((B - T) * v) / yMax;

  const fmt = (v: number) =>
    Math.abs(v) >= 100 ? Math.round(v).toLocaleString() : parseFloat(v.toPrecision(3)).toLocaleString();
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => t * yMax);
  const xStep = horizon <= 12 ? 2 : horizon <= 24 ? 4 : horizon <= 40 ? 6 : 12;
  const xTicks: number[] = [];
  for (let m = 0; m <= horizon; m += xStep) xTicks.push(m);

  const breakEven = breakEvenMonths != null && breakEvenMonths <= horizon ? breakEvenMonths : null;
  const shadePoints =
    breakEven != null
      ? [
          `${x(breakEven)},${y(singleUseAt(breakEven))}`,
          `${x(horizon)},${y(singleUseAt(horizon))}`,
          `${x(horizon)},${y(reusablesAt(horizon))}`,
          `${x(breakEven)},${y(reusablesAt(breakEven))}`
        ].join(' ')
      : null;
  const pillWidth = 148;
  const pillCenter = breakEven != null ? Math.min(Math.max(x(breakEven), L + pillWidth / 2), R - pillWidth / 2) : 0;

  // The hover tracker: the mouse position, snapped to the nearest whole month.
  function onMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    const month = Math.round(((svgX - L) / (R - L)) * horizon);
    setHoverMonth(month < 0 || month > horizon ? null : month);
  }
  const tipWidth = 210;
  const tipX =
    hoverMonth != null ? (x(hoverMonth) + 14 + tipWidth > R ? x(hoverMonth) - 14 - tipWidth : x(hoverMonth) + 14) : 0;

  return (
    <svg
      viewBox={`0 0 ${W} ${HT}`}
      style={{ width: '100%', height: 'auto', display: 'block', fontFamily: 'inherit' }}
      role='img'
      aria-label={
        breakEven != null
          ? `Cumulative emissions chart: the reusable program breaks even with single-use after ${breakEven} month${breakEven === 1 ? '' : 's'}`
          : 'Cumulative emissions chart comparing single-use and reusables'
      }
      onMouseMove={onMouseMove}
      onMouseLeave={() => setHoverMonth(null)}
    >
      {/* gridlines and y-axis values */}
      {yTicks.map(v => (
        <g key={v}>
          <line x1={L} x2={R} y1={y(v)} y2={y(v)} stroke='#eef0f2' strokeWidth={1} />
          <text x={L - 10} y={y(v) + 4} textAnchor='end' fontSize={12.5} fill='#8c8c8c'>
            {fmt(v)}
          </text>
        </g>
      ))}
      {/* the emissions-avoided wedge, under the lines — the site's light chart green */}
      {shadePoints && <polygon points={shadePoints} fill='#E0FACA' opacity={0.8} />}
      {/* single-use: dashed, from zero */}
      <line
        x1={x(0)}
        y1={y(singleUseAt(0))}
        x2={x(horizon)}
        y2={y(singleUseAt(horizon))}
        stroke='#8c8c8c'
        strokeWidth={2.5}
        strokeDasharray='8 6'
        strokeLinecap='round'
      />
      {/* reusables: the site's brand green, starting at the manufacturing footprint */}
      <line
        x1={x(0)}
        y1={y(reusablesAt(0))}
        x2={x(horizon)}
        y2={y(reusablesAt(horizon))}
        stroke='#95EE49'
        strokeWidth={3}
        strokeLinecap='round'
      />
      {/* break-even: dashed vertical, pill label, ring at the crossing */}
      {breakEven != null && (
        <g>
          <line
            x1={x(breakEven)}
            x2={x(breakEven)}
            y1={T - 10}
            y2={B}
            stroke='#b8bcc2'
            strokeWidth={1.5}
            strokeDasharray='4 4'
          />
          <rect x={pillCenter - pillWidth / 2} y={6} rx={11} ry={11} width={pillWidth} height={26} fill='#E0FACA' />
          <text x={pillCenter} y={24} textAnchor='middle' fontSize={13} fontWeight={600} fill='#237804'>
            Break-even: {breakEven} month{breakEven === 1 ? '' : 's'}
          </text>
          <circle
            cx={x(breakEven)}
            cy={y(reusablesAt(breakEven))}
            r={6.5}
            fill='#fff'
            stroke='#95EE49'
            strokeWidth={3.5}
          />
        </g>
      )}
      {/* x axis */}
      <line x1={L} x2={R} y1={B} y2={B} stroke='#d9d9d9' />
      {xTicks.map(m => (
        <text key={m} x={x(m)} y={B + 22} textAnchor='middle' fontSize={12.5} fill='#8c8c8c'>
          {m}
        </text>
      ))}
      <text x={(L + R) / 2} y={HT - 4} textAnchor='middle' fontSize={13} fill='#595959'>
        Months since launch
      </text>
      {/* hover tracker: a month readout that follows the mouse */}
      {hoverMonth != null && (
        <g pointerEvents='none'>
          <line x1={x(hoverMonth)} x2={x(hoverMonth)} y1={T - 4} y2={B} stroke='rgba(0,0,0,0.3)' strokeWidth={1} />
          <circle
            cx={x(hoverMonth)}
            cy={y(singleUseAt(hoverMonth))}
            r={4.5}
            fill='#fff'
            stroke='#8c8c8c'
            strokeWidth={2.5}
          />
          <circle
            cx={x(hoverMonth)}
            cy={y(reusablesAt(hoverMonth))}
            r={4.5}
            fill='#fff'
            stroke='#95EE49'
            strokeWidth={2.5}
          />
          <rect
            x={tipX}
            y={T + 4}
            width={tipWidth}
            height={86}
            rx={8}
            fill='#fff'
            stroke='#e5e5e5'
            filter='drop-shadow(0 2px 6px rgba(0,0,0,0.12))'
          />
          <text x={tipX + 12} y={T + 24} fontSize={12.5} fontWeight={600} fill='#262626'>
            Month {hoverMonth}
          </text>
          <circle cx={tipX + 16} cy={T + 40} r={4} fill='#8c8c8c' />
          <text x={tipX + 26} y={T + 44} fontSize={12} fill='#595959'>
            Single-use: {fmt(singleUseAt(hoverMonth))} MTCO2e
          </text>
          <circle cx={tipX + 16} cy={T + 58} r={4} fill='#95EE49' />
          <text x={tipX + 26} y={T + 62} fontSize={12} fill='#595959'>
            Reusables: {fmt(reusablesAt(hoverMonth))} MTCO2e
          </text>
          <rect x={tipX + 12} y={T + 71} width={8} height={8} rx={2} fill='#E0FACA' />
          <text x={tipX + 26} y={T + 80} fontSize={12} fill='#595959'>
            Avoided: {fmt(singleUseAt(hoverMonth) - reusablesAt(hoverMonth))} MTCO2e
          </text>
        </g>
      )}
    </svg>
  );
}
