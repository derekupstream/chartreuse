import { Col, Row as AntdRow, Form, Radio, Select } from 'antd';
import { useState } from 'react';
import styled from 'styled-components';

import { Spacer } from 'components/common/Spacer';
import { PRODUCT_CATEGORIES } from 'lib/calculator/constants/product-categories';
import { getActuals } from 'lib/calculator/getActuals';
import type { DateRange } from 'lib/calculator/types';
import type { ProjectInventory } from 'lib/inventory/types/projects';
import { changeValue } from 'lib/number';

import { CardTitle, Divider, SectionContainer, SectionHeader } from '../../projections/components/styles';
import { Card, Body, Section, Value, Row, Label } from '../../projections/LineItemDetails/styles';
import KPICard, { Header } from '../components/KpiCard';

import { useCurrency } from 'components/_app/CurrencyProvider';
import PieChart from './components/CategoryPieChart';
import ColumnChart from './components/ChartColumnTrendline';

const StyledCol = styled(Col)`
  @media print {
    flex: 0 0 33.33333333% !important;
    max-width: 33.33333333% !important;
  }
`;

interface SelectOption<T extends string = string> {
  label: string;
  value: T;
}

const categoryOptions: SelectOption[] = [...PRODUCT_CATEGORIES].map(cat => ({ label: cat.name, value: cat.id }));

export function SingleUseActuals({
  inventory,
  dateRange,
  friendlyPeriod,
  periodSelect
}: {
  inventory: ProjectInventory;
  friendlyPeriod: string;
  dateRange?: DateRange;
  periodSelect: JSX.Element;
}) {
  const { symbol: currencySymbol } = useCurrency();
  const [selectedCategoryId, setSelectedCategory] = useState<string | undefined>(undefined);
  const [useUnits, setUseUnits] = useState(true);

  const actuals = getActuals(inventory, { dateRange, categoryId: selectedCategoryId });
  const categories = inventory.singleUseItems.map(item => item.product.category);
  const availableCategories = categoryOptions.filter(option => categories.includes(option.value));

  // add All Categories to top of list
  availableCategories.unshift({ label: 'All categories', value: '' });

  const selectedCategory = availableCategories.find(period => period.value === selectedCategoryId);

  const columnData = Object.entries(actuals.singleUseProducts.purchases)
    .sort(([date]) => new Date(date).getTime())
    .map(([date, record]) => {
      return {
        label: new Date(date).toLocaleDateString(),
        value: useUnits ? record.unitCount : record.totalCost
      };
    });

  const pieData = Object.entries(actuals.singleUseProducts.categories).map(([categoryId, values]) => {
    const category = PRODUCT_CATEGORIES.find(cat => cat.id === categoryId)!;
    return {
      label: category.name,
      value: values.unitCount
    };
  });

  function selectCategory(categoryId: string) {
    setSelectedCategory(categoryId);
  }

  function selectUnits(e: any) {
    setUseUnits(e.target.value === 'units');
  }

  // console.log({ actuals });

  return (
    <>
      <Row $spaceBetween $flexStart>
        <SectionHeader style={{ margin: 0 }}>Total single-use purchasing history</SectionHeader>

        <Form className='dont-print-me' layout='horizontal'>
          {periodSelect}
        </Form>
        {
          <p className='print-only'>
            Time period: <strong>{friendlyPeriod}</strong>
          </p>
        }
      </Row>
      <Divider />
      <Card style={{ marginRight: 0 }}>
        <Row $spaceBetween>
          <CardTitle>{selectedCategory?.label ?? 'All categories'}</CardTitle>

          <Form layout='inline' style={{ width: 'auto' }}>
            <Form.Item label='Categories:' style={{ minWidth: 210 }}>
              <Select defaultValue='' onChange={selectCategory} options={availableCategories} />
            </Form.Item>
            <Form.Item>
              <Radio.Group defaultValue={useUnits ? 'units' : 'cost'} buttonStyle='solid' onChange={selectUnits}>
                <Radio.Button value='units'>Units</Radio.Button>
                <Radio.Button value='cost'>Cost</Radio.Button>
              </Radio.Group>
            </Form.Item>
          </Form>
        </Row>
        <Spacer vertical={16} />
        <ColumnChart data={columnData} useUnits={useUnits} />
      </Card>
      <AntdRow gutter={[29, 29]}>
        <StyledCol xs={24} lg={8} className='print-kpi-card'>
          <Card style={{ margin: 0 }}>
            <Header>
              <CardTitle>Breakdown by category</CardTitle>
            </Header>
            <div>
              <PieChart data={pieData} />
            </div>
          </Card>
        </StyledCol>
        <StyledCol xs={24} md={12} lg={8} className='print-kpi-card'>
          <KPICard
            style={{ height: '100%' }}
            title='Biggest change'
            changePercent={actuals.singleUseProducts.biggestChangeCategory?.changePercent}
            changeStr={
              actuals.singleUseProducts.biggestChangeCategory
                ? `${categoryName(actuals.singleUseProducts.biggestChangeCategory.id)}: ${changeValue(
                    actuals.singleUseProducts.biggestChangeCategory.change
                  ).toLocaleString()} units`
                : 'N/A'
            }
          />
        </StyledCol>
        <StyledCol xs={24} md={12} lg={8} className='print-kpi-card'>
          <KPICard
            style={{ height: '100%' }}
            title='Biggest savings'
            changePercent={actuals.singleUseProducts.biggestSavingsCategory?.changePercent}
            changeStr={
              actuals.singleUseProducts.biggestSavingsCategory
                ? `${categoryName(actuals.singleUseProducts.biggestSavingsCategory.id)}: ${changeValue(
                    actuals.singleUseProducts.biggestSavingsCategory.change,
                    {
                      preUnit: currencySymbol
                    }
                  ).toLocaleString()} `
                : 'N/A'
            }
          />
        </StyledCol>
      </AntdRow>
    </>
  );
}

function categoryName(category: string) {
  return PRODUCT_CATEGORIES.find(cat => cat.id === category)?.name ?? category;
}
