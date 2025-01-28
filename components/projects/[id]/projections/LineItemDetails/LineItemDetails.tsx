import { Radio, Table, Typography } from 'antd';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { Spacer } from 'components/common/Spacer';
import type { ProjectionsResponse } from 'lib/calculator/getProjections';
import { formatToDollar } from 'lib/calculator/utils';
import { changeValue } from 'lib/number';
import { useCurrency } from 'components/_app/CurrencyProvider';
import BarChart from '../components/BarChart';
import { KPIContent } from '../components/KPICard';
import { CardTitle, ChangeColumn, Divider, SectionContainer, SectionHeader } from '../components/styles';

import { Card, Body, Section, Row, Label } from './styles';

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
    description: 'Your estimated annual savings',
    greenHouseGasLabel: 'Greenhouse gas emissions',
    waterUsageLabel: 'Single-use foodware water usage',
    baselineLabel: 'Baseline',
    forecastLabel: 'Forecast'
  },
  reusable: {
    title: 'Reusable',
    description: 'One-time versus Annually recurring costs',
    greenHouseGasLabel: 'Greenhouse gas emissions',
    waterUsageLabel: 'Water usage (including dishwashing)',
    baselineLabel: 'One-time',
    forecastLabel: 'Annually recurring'
  }
};

type VariantType = keyof typeof LABELS;

type Props = {
  lineItemSummary: ProjectionsResponse['singleUseResults'] | ProjectionsResponse['reusableResults'];
  variant: VariantType;
  showTitle?: boolean;
  hideWaterUsage?: boolean;
};

type RowType = 'productCategory' | 'productType' | 'material';
type ChangeType = 'cost' | 'waste' | 'ghg';

const titleByChangeType = {
  cost: 'Cost',
  waste: 'Waste',
  ghg: 'GHG',
  water: 'Water'
};

export const LineItemDetails: React.FC<Props> = ({ lineItemSummary, variant, showTitle, hideWaterUsage }) => {
  const [rowType, setRowType] = useState<RowType>('productType');
  const [changeType, setChangeType] = useState<ChangeType>('cost');
  const { symbol: currencySymbol, abbreviation: currencyAbbreviation } = useCurrency();
  const [useTons, setUseTons] = useState(false);

  const hideCost = rowType === 'material';

  function changeRowType(e: any) {
    setRowType(e.target.value);
  }

  function changeChangeType(e: any) {
    setChangeType(e.target.value);
  }

  function changeWeightType(e: any) {
    setUseTons(e.target.value === 'tons');
  }

  const labels = LABELS[variant];

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
        { label: labels.baselineLabel, value: annualWater.baseline },
        { label: labels.forecastLabel, value: annualWater.forecast }
      ]
    : // reusable item usage
      [
        { label: 'Reusable foodware water usage', value: reusableWater!.lineItemForecast },
        { label: 'Dishwasher water usage', value: reusableWater!.dishwasherForecast }
      ];

  const items = lineItemSummary.resultsByType[rowType];
  const dataSource: TableData[] = items.rows.map((item, index) => {
    let baseline = 0;
    let forecast = 0;
    if (changeType === 'cost') {
      baseline = item.cost.baseline;
      forecast = item.cost.forecast;
    } else if (changeType === 'waste') {
      baseline = item.weight.baseline;
      forecast = item.weight.forecast;
      if (useTons) {
        baseline = baseline / 2000;
        forecast = forecast / 2000;
      }
    } else if (changeType === 'ghg') {
      baseline = item.gasEmissions.baseline;
      forecast = item.gasEmissions.forecast;
    } else if (changeType === 'water') {
      baseline = item.waterUsage.baseline;
      forecast = item.waterUsage.forecast;
    }

    return {
      key: index, // for @antd/table
      product: item.title,
      baselineSpending: baseline,
      forecastSpending: forecast,
      forecastStr: formatNumber(forecast, changeType, currencyAbbreviation),
      baselineStr: formatNumber(baseline, changeType, currencyAbbreviation),
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
  });

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
      <Card style={{ marginRight: 0 }}>
        <CardTitle>{labels.description}</CardTitle>
        <Body>
          <Section>
            <KPIContent
              changePercent={annualCost.changePercent * -1}
              changeStr={`${changeValue(annualCost.change * -1, { preUnit: currencySymbol }).toLocaleString()}`}
            />
            {/* <ChartTitle>Annual Spending changes</ChartTitle> */}
            <BarChart
              data={costsData}
              formatter={(data: any) => `${data.label}: ${currencySymbol}${data.value.toLocaleString()}`}
              seriesField='label'
            />
          </Section>

          <Section>
            <KPIContent
              changePercent={annualUnits.changePercent * -1}
              changeStr={changeValue(annualUnits.change * -1) + ' units'}
            />
            {/* <ChartTitle>Annual {title} total changes</ChartTitle> */}
            <BarChart
              data={unitCountData}
              formatter={(data: any) => `${data.label}: ${data.value.toLocaleString()} pieces`}
              seriesField='label'
            />
          </Section>
        </Body>
      </Card>

      <Card style={{ marginRight: 0 }}>
        {/* <CardTitle>{labels.greenHouseGasLabel}</CardTitle> */}
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
            <KPIContent
              changePercent={annualGHG.changePercent === 0 ? 0 : annualGHG.changePercent * -1}
              changeStr={changeValue(annualGHG.change * -1) + ' MTCO2e'}
            />
            {/* <ChartTitle>Annual {title} total changes</ChartTitle> */}
            <BarChart
              data={ghgData}
              formatter={(data: any) => `${data.label}: ${data.value.toLocaleString()} MTCO2e`}
              seriesField='label'
            />
          </Section>

          {!hideWaterUsage && (
            <Section>
              {annualWater ? (
                <KPIContent
                  changePercent={annualWater.changePercent * -1}
                  changeStr={changeValue(annualWater.change * -1) + ' gallons'}
                />
              ) : (
                <KPIContent changeStr={changeValue(reusableWater!.total) + ' gallons'} />
              )}
              <BarChart
                data={waterData}
                formatter={(data: any) => `${data.label}: ${data.value.toLocaleString()} gallons`}
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
                    {label}
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
              <Radio.Button value='material'>Material</Radio.Button>
            </Radio.Group>
            <Spacer horizontal={16} />
            {changeType === 'waste' && (
              <Radio.Group defaultValue={useTons ? 'tons' : 'pounds'} buttonStyle='solid' onChange={changeWeightType}>
                <Radio.Button value='pounds'>Pounds</Radio.Button>
                <Radio.Button value='tons'>Tons</Radio.Button>
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
};

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
