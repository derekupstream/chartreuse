import { Radio, Table, Typography } from 'antd';
import type { ProjectCategory } from '@prisma/client';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useMetricSystem } from 'components/_app/MetricSystemProvider';
import { Spacer } from 'components/common/Spacer';
import type { ProjectionsResponse } from 'lib/calculator/getProjections';
import { formatToDollar } from 'lib/calculator/utils';
import { changeValue, valueInGallons, changeValueInGallons, valueInPounds, formattedValueInGallons } from 'lib/number';
import { useCurrency } from 'components/_app/CurrencyProvider';
import BarChart from '../common/BarChart';
import { KPIContent } from '../common/KPICard';
import { CardTitle, ChangeColumn, Divider, SectionContainer, SectionHeader } from '../common/styles';

import { Card, Body, Section, Row, Label } from './styles';
import { isTruthy } from 'lib/types';

interface TableData {
  product: string;
  baselineSpending: number;
  forecastSpending: number;
  // gasReductions: number
  change: string | ReactNode;
}

const LABELS = {
  single_use: {
    title: 'Single-use',
    costsDescription: 'Estimated annual savings',
    unitsDescription: 'Reduction in single-use purchasing',
    greenHouseGasLabel: 'Greenhouse gas emissions',
    waterUsageLabel: 'Single-use foodware water usage',
    baselineLabel: 'Baseline',
    forecastLabel: 'Forecast'
  },
  reusable: {
    title: 'Reusable',
    costsDescription: 'One-time versus Annually recurring costs',
    unitsDescription: 'Repurchasing of reusable items',
    greenHouseGasLabel: 'Greenhouse gas emissions',
    waterUsageLabel: 'Water usage (including dishwashing)',
    baselineLabel: 'One-time',
    forecastLabel: 'Annually recurring'
  }
};

// override the labels for the on-site dining project so that there is only one title on the first row
const LABELS_ON_SITE_DINING = {
  single_use: LABELS.single_use,
  reusable: {
    ...LABELS.reusable,
    costsDescription: 'Repurchasing of reusable items',
    unitsDescription: ''
  }
};

type VariantType = keyof typeof LABELS;

type RowType = 'productCategory' | 'productType' | 'material';
type ChangeType = 'cost' | 'waste' | 'ghg';

const titleByChangeType = {
  cost: 'Cost',
  waste: 'Waste',
  ghg: 'GHG (MTCO2e)',
  water: 'Water (gal)'
};

export function LineItemSummary({
  lineItemSummary,
  variant,
  showTitle,
  hideWaterUsage,
  projectCategory,
  isOnSiteDiningProjectReusables
}: {
  lineItemSummary: ProjectionsResponse['singleUseResults'] | ProjectionsResponse['reusableResults'];
  variant: VariantType;
  showTitle?: boolean;
  hideWaterUsage?: boolean;
  projectCategory?: ProjectCategory;
  // a UI hack to fix the display the project impact for the shared "on-site dining"project in lib/share/config.ts, where the baseline and forecast are the same
  isOnSiteDiningProjectReusables?: boolean;
}) {
  const [rowType, setRowType] = useState<RowType>('productType');
  const [changeType, setChangeType] = useState<ChangeType>(projectCategory === 'event' ? 'waste' : 'cost');
  const { symbol: currencySymbol, abbreviation: currencyAbbreviation } = useCurrency();
  const displayAsMetric = useMetricSystem();
  const [displayWeightAsMetric, setDisplayWeightAsMetric] = useState(displayAsMetric);

  const hideCost = rowType === 'material';

  function changeRowType(e: any) {
    setRowType(e.target.value);
  }

  function changeChangeType(e: any) {
    setChangeType(e.target.value);
  }

  function changeWeightType(e: any) {
    setDisplayWeightAsMetric(e.target.value === 'metric');
  }

  const labels = isOnSiteDiningProjectReusables ? LABELS_ON_SITE_DINING[variant] : LABELS[variant];

  const { annualCost, annualUnits, annualGHG, annualWater, reusableWater } = lineItemSummary.summary;

  const costsData = [
    { label: labels.baselineLabel, value: annualCost.baseline },
    { label: labels.forecastLabel, value: annualCost.forecast }
  ];

  const unitCountData = [
    { label: labels.baselineLabel, value: annualUnits.baseline },
    { label: labels.forecastLabel, value: annualUnits.forecast }
  ];

  const ghgData = [
    { label: labels.baselineLabel, value: annualGHG.baseline },
    { label: labels.forecastLabel, value: annualGHG.forecast }
  ];

  const waterData = annualWater
    ? // single-item usage
      [
        {
          label: labels.baselineLabel,
          value: valueInGallons(annualWater.baseline, { displayAsMetric: displayAsMetric })
        },
        {
          label: labels.forecastLabel,
          value: valueInGallons(annualWater.forecast, { displayAsMetric: displayAsMetric })
        }
      ]
    : // reusable item usage
      [
        {
          label: 'Reusable foodware water usage',
          value: valueInGallons(reusableWater!.lineItemForecast, { displayAsMetric: displayAsMetric })
        },
        {
          label: 'Dishwasher water usage',
          value: valueInGallons(reusableWater!.dishwasherForecast, { displayAsMetric: displayAsMetric })
        }
      ];

  const dataSource: TableData[] = useMemo(
    () =>
      lineItemSummary.resultsByType[rowType].rows
        .map((item, index) => {
          let baseline = 0;
          let forecast = 0;
          if (changeType === 'cost') {
            baseline = item.cost.baseline;
            forecast = item.cost.forecast;
          } else if (changeType === 'waste') {
            baseline = valueInPounds(item.weight.baseline, { displayAsMetric: displayWeightAsMetric });
            forecast = valueInPounds(item.weight.forecast, { displayAsMetric: displayWeightAsMetric });
          } else if (changeType === 'ghg') {
            baseline = item.gasEmissions.baseline;
            forecast = item.gasEmissions.forecast;
          } else if (changeType === 'water') {
            baseline = valueInGallons(item.waterUsage.baseline, { displayAsMetric: displayAsMetric });
            forecast = valueInGallons(item.waterUsage.forecast, { displayAsMetric: displayAsMetric });
          }
          if (baseline === 0 && forecast === 0) {
            return null;
          }

          return {
            key: index, // for @antd/table
            product: item.title,
            baselineSpending: baseline,
            forecastSpending: forecast,
            forecastStr: formatNumber(forecast || 0, changeType, currencyAbbreviation),
            baselineStr: formatNumber(baseline || 0, changeType, currencyAbbreviation),
            change: baseline ? (
              <ChangeColumn>
                <span>
                  {forecast > baseline && '+'}
                  {formatNumber(forecast - baseline, changeType, currencyAbbreviation)}
                </span>{' '}
                <span>
                  {forecast > baseline && '+'}
                  {Math.round(((forecast - baseline) / baseline) * 100)}%
                </span>
              </ChangeColumn>
            ) : (
              'N/A'
            )
          };
        })
        .filter(isTruthy),
    [lineItemSummary.resultsByType[rowType].rows, changeType, displayAsMetric, displayWeightAsMetric]
  );

  // if cost is hidden, default to waste when rowType changes
  useEffect(() => {
    if (hideCost && changeType === 'cost') {
      setChangeType('waste');
    }
  }, [hideCost, changeType, rowType]);

  return (
    <SectionContainer>
      {showTitle && (
        <>
          <SectionHeader style={{ margin: 0 }}>{labels.title} details report</SectionHeader>
          <Divider />
        </>
      )}
      {projectCategory !== 'event' && (
        <Card style={{ marginRight: 0 }}>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Section>
              <CardTitle>{labels.costsDescription}</CardTitle>
            </Section>

            <Section>
              <CardTitle>{labels.unitsDescription}</CardTitle>
            </Section>
          </div>
          <Body>
            <Section>
              {/* if on-site dining project and reusables, show the baseline cost because the change is 0 */}
              {isOnSiteDiningProjectReusables ? (
                <KPIContent
                  changeStr={`${changeValue(annualCost.baseline, { preUnit: currencySymbol }).toLocaleString()}`}
                />
              ) : (
                <KPIContent
                  changePercent={annualCost.changePercent * -1}
                  changeStr={`${changeValue(annualCost.change * -1, { preUnit: currencySymbol }).toLocaleString()}`}
                />
              )}
              <BarChart
                data={costsData}
                formatter={(label, data) => `${data.label}: ${currencySymbol}${data.value.toLocaleString()}`}
                seriesField='label'
              />
            </Section>

            <Section>
              {/* if on-site dining project and reusables, show the baseline cost because the change is 0 */}
              {isOnSiteDiningProjectReusables ? (
                <KPIContent changeStr={changeValue(annualUnits.baseline) + ' units'} />
              ) : (
                <KPIContent
                  changePercent={annualUnits.changePercent * -1}
                  changeStr={changeValue(annualUnits.change * -1) + ' units'}
                />
              )}
              <BarChart
                data={unitCountData}
                formatter={(label, data) => `${data.label}: ${data.value.toLocaleString()} pieces`}
                seriesField='label'
              />
            </Section>
          </Body>
        </Card>
      )}

      <Card style={{ marginRight: 0 }}>
        <div style={{ display: 'flex', gap: '20px' }}>
          <Section>
            <CardTitle>{labels.greenHouseGasLabel}</CardTitle>
          </Section>

          <Section>
            <CardTitle>{labels.waterUsageLabel}</CardTitle>
          </Section>
        </div>
        <Body>
          <Section style={hideWaterUsage ? { width: '100%' } : {}}>
            {/* if reusable, don't show change percent - according to madhavi :) */}
            <KPIContent
              changePercent={annualGHG.changePercent === 0 || variant === 'reusable' ? 0 : annualGHG.changePercent * -1}
              changeStr={changeValue(annualGHG.change * -1) + ' MTCO2e'}
            />
            {/* <ChartTitle>Annual {title} total changes</ChartTitle> */}
            <BarChart
              data={ghgData}
              formatter={(label, data) => `${data.label}: ${data.value.toLocaleString()} MTCO2e`}
              seriesField='label'
            />
          </Section>

          {!hideWaterUsage && (
            <Section>
              {annualWater ? (
                <KPIContent
                  changePercent={annualWater.changePercent * -1}
                  changeStr={changeValueInGallons(annualWater.change * -1, { displayAsMetric: displayAsMetric })}
                />
              ) : (
                <KPIContent
                  changeStr={changeValueInGallons(reusableWater!.total, { displayAsMetric: displayAsMetric })}
                />
              )}
              <BarChart
                data={waterData}
                formatter={(label, data) =>
                  `${data.label}: ${formattedValueInGallons(data.value, { displayAsMetric: displayAsMetric })}`
                }
                seriesField='label'
              />
            </Section>
          )}
        </Body>
      </Card>

      <SectionHeader>{labels.title} item purchasing</SectionHeader>
      <Divider />
      <Card style={{ marginRight: 0 }}>
        <Row $spaceBetween>
          <CardTitle>{titleByChangeType[changeType]}</CardTitle>
          <Row $marginBottom={15}>
            <Label>View change in</Label>
            <Radio.Group value={changeType} buttonStyle='solid' onChange={changeChangeType}>
              {Object.entries(titleByChangeType)
                .filter(([value]) => (hideWaterUsage ? value !== 'water' : hideCost ? value !== 'cost' : true))
                .map(([value, label]) => (
                  <Radio.Button key={value} value={value}>
                    {label.split(' ')[0]}
                  </Radio.Button>
                ))}
            </Radio.Group>
            <Spacer horizontal={16} />
          </Row>
        </Row>

        <Row $marginBottom={16} $spaceBetween>
          <Row>
            <Label>View results by</Label>
            <Radio.Group defaultValue='productType' buttonStyle='solid' onChange={changeRowType}>
              <Radio.Button value='productType'>Product</Radio.Button>
              <Radio.Button value='productCategory'>Category</Radio.Button>
              {changeType !== 'cost' && <Radio.Button value='material'>Material</Radio.Button>}
            </Radio.Group>
            <Spacer horizontal={16} />
            {changeType === 'waste' && (
              <Radio.Group
                defaultValue={displayWeightAsMetric ? 'metric' : 'standard'}
                buttonStyle='solid'
                onChange={changeWeightType}
              >
                {!displayAsMetric && <Radio.Button value='standard'>Pounds</Radio.Button>}
                <Radio.Button value='metric'>Kilograms</Radio.Button>
                {/* show standard second if they prefer metric */}
                {displayAsMetric && <Radio.Button value='standard'>Pounds</Radio.Button>}
              </Radio.Group>
            )}
          </Row>
          {/*
          <div>
            Sort By:
            <Dropdown.Button
              onClick={console.log}
              overlay={
                <Menu onClick={console.log}>
                  <Menu.Item key="1">1st menu item</Menu.Item>
                  <Menu.Item key="2">2nd menu item</Menu.Item>
                  <Menu.Item key="3">3rd menu item</Menu.Item>
                </Menu>
              }
            >
              Dropdown
            </Dropdown.Button>
          </div> */}
        </Row>
        <Spacer horizontal={16} />
        <ItemsTable variant={variant} className='dont-print-me' dataSource={dataSource} changeType={changeType} />
        <ItemsTable
          variant={variant}
          className='print-only'
          disablePagination
          dataSource={dataSource}
          changeType={changeType}
        />
      </Card>
    </SectionContainer>
  );
}

function formatNumber(value: number, changeType: ChangeType, currencyAbbreviation?: string) {
  if (changeType === 'cost') {
    return formatToDollar(value, currencyAbbreviation!);
  }
  return value.toLocaleString();
}

function ItemsTable({
  className,
  changeType,
  dataSource,
  disablePagination,
  variant
}: {
  className: string;
  changeType: ChangeType;
  dataSource: TableData[];
  disablePagination?: boolean;
  variant: VariantType;
}) {
  const { abbreviation: currencyAbbreviation } = useCurrency();
  const labels = LABELS[variant];
  const columns = [
    {
      title: 'Product',
      dataIndex: 'product',
      key: 'product'
    },
    {
      title: labels.baselineLabel,
      dataIndex: 'baselineStr',
      key: 'baselineSpending'
    },
    {
      title: labels.forecastLabel,
      dataIndex: 'forecastStr',
      key: 'forecastSpending'
    },
    ...(variant === 'single_use'
      ? [
          {
            title: 'Change',
            dataIndex: 'change',
            key: 'change'
          }
        ]
      : [])
  ];
  return (
    <Table<TableData>
      className={className}
      dataSource={dataSource}
      pagination={{ hideOnSinglePage: true, pageSize: disablePagination ? dataSource.length : 10 }}
      columns={columns}
      summary={pageData => {
        const baselineTotal = pageData.reduce((acc, curr) => acc + curr.baselineSpending, 0);
        const forecastTotal = pageData.reduce((acc, curr) => acc + curr.forecastSpending, 0);

        return (
          <Table.Summary.Row>
            <Table.Summary.Cell index={0}>Total</Table.Summary.Cell>
            <Table.Summary.Cell index={1}>
              <Typography.Text strong>{formatNumber(baselineTotal, changeType, currencyAbbreviation)}</Typography.Text>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={2}>
              <Typography.Text strong>{formatNumber(forecastTotal, changeType, currencyAbbreviation)}</Typography.Text>
            </Table.Summary.Cell>
            {variant === 'single_use' && (
              <Table.Summary.Cell index={3}>
                <Typography.Text strong>
                  {forecastTotal > baselineTotal && '+'}
                  {formatNumber(forecastTotal - baselineTotal, changeType, currencyAbbreviation)}
                </Typography.Text>
              </Table.Summary.Cell>
            )}
          </Table.Summary.Row>
        );
      }}
    />
  );
}
