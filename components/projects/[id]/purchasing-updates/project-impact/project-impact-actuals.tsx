import { Col, Row as AntdRow, Form, Select } from 'antd';

import { getActuals } from 'lib/calculator/getActuals';
import type { DateRange } from 'lib/calculator/types';
import type { ProjectInventory } from 'lib/inventory/types/projects';

import BarChart from '../../projections/components/chart-bar';
import Card from '../../projections/components/kpi-card';
import { CardTitle } from '../../projections/components/styles';
import { Row } from '../../projections/single-use-details/styles';

export function ProjectImpact({ inventory, dateRange }: { inventory: ProjectInventory; dateRange?: DateRange }) {
  const actuals = getActuals(inventory, { dateRange });

  const savingsData = [
    // { label: 'Baseline', value: data.dollarCost.baseline },
    // { label: 'Forecast', value: data.dollarCost.forecast },
    { label: 'Baseline', value: 100 },
    { label: 'Forecast', value: 170 }
  ];

  const singleUseData = [
    { label: 'Baseline', value: 69000 },
    { label: 'Forecast', value: 32000 }
  ];

  const wasteData = [
    { label: 'Baseline', value: 1204020 },
    { label: 'Forecast', value: 450450 }
  ];

  const ghgData = [
    { label: 'Baseline', value: 50 },
    { label: 'Forecast', value: 424 }
  ];

  return (
    <>
      <AntdRow gutter={[29, 29]}>
        <Col xs={24} lg={12}>
          <Card changeStr='25%' title='Your annual savings'>
            <br />
            <BarChart data={savingsData} formatter={(data: any) => `${data.label}: $${data.value.toLocaleString()}`} seriesField='label' />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card changeStr='25%' style={{ marginRight: 0 }} title='Your single-use purchasing'>
            <br />
            <BarChart data={singleUseData} formatter={(data: any) => `${data.label}: $${data.value.toLocaleString()}`} seriesField='label' />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card changeStr='25%' style={{ marginRight: 0 }} title='Your waste reductions'>
            <br />
            <BarChart data={wasteData} formatter={(data: any) => `${data.label}: $${data.value.toLocaleString()}`} seriesField='label' />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card changeStr='25%' style={{ marginRight: 0 }} title='Your GHG reductions'>
            <br />
            <BarChart data={ghgData} formatter={(data: any) => `${data.label}: $${data.value.toLocaleString()}`} seriesField='label' />
          </Card>
        </Col>
      </AntdRow>
    </>
  );
}
