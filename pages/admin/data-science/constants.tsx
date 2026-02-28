import { InfoCircleOutlined } from '@ant-design/icons';
import { Card, Col, Descriptions, Row, Table, Tag, Tooltip, Typography } from 'antd';
import type { GetServerSideProps } from 'next';

import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { getUserFromContext } from 'lib/middleware';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import { serializeJSON } from 'lib/objects';
import { MATERIALS, REUSABLE_MATERIALS } from 'lib/calculator/constants/materials';
import { STATES } from 'lib/calculator/constants/utilities';
import {
  ELECTRIC_CO2_EMISSIONS_FACTOR,
  NATURAL_GAS_CO2_EMISSIONS_FACTOR,
  TRANSPORTATION_CO2_EMISSIONS_FACTOR
} from 'lib/calculator/constants/carbon-dioxide-emissions';

const { Title, Text } = Typography;

type Props = {
  user: DashboardUser;
};

const materialColumns = [
  { title: 'ID', dataIndex: 'id', width: 60 },
  { title: 'Material', dataIndex: 'name' },
  {
    title: 'MTCO₂e/lb',
    dataIndex: 'mtco2ePerLb',
    render: (v: number) => v.toExponential(4)
  },
  {
    title: 'Water Use (gal/lb)',
    dataIndex: 'waterUsageGalPerLb',
    render: (v: number | undefined) => (v != null ? v.toFixed(4) : '—')
  }
];

const stateColumns = [
  { title: 'State', dataIndex: 'name' },
  {
    title: 'Electric ($/kWh)',
    dataIndex: 'electric',
    render: (v: number) => `$${v.toFixed(2)}`
  },
  {
    title: 'Gas ($/therm)',
    dataIndex: 'gas',
    render: (v: number) => `$${v.toFixed(2)}`
  }
];

export default function ConstantsPage({ user }: Props) {
  return (
    <AdminLayout title='Calculation Constants' selectedMenuItem='data-science/constants' user={user}>
      <div style={{ padding: '24px' }}>
        <div style={{ marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0 }}>
            Calculation Constants
          </Title>
          <Text type='secondary'>
            All hardcoded emission factors, material weights, and utility rates used by the calculator engine. These
            values are compiled into the application and require a code change to update.
          </Text>
        </div>

        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card
              title={
                <span>
                  Emission Factors{' '}
                  <Tooltip title='Source: EPA WARM Model + EIA'>
                    <InfoCircleOutlined style={{ color: '#8c8c8c', fontSize: 14 }} />
                  </Tooltip>
                </span>
              }
            >
              <Descriptions bordered size='small' column={{ xs: 1, sm: 2, md: 3 }}>
                <Descriptions.Item
                  label={
                    <span>
                      Electric CO₂{' '}
                      <Tooltip title='lbs CO₂ per kWh of electricity'>
                        <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
                      </Tooltip>
                    </span>
                  }
                >
                  {ELECTRIC_CO2_EMISSIONS_FACTOR} <Tag>lbs CO₂/kWh</Tag>
                </Descriptions.Item>
                <Descriptions.Item
                  label={
                    <span>
                      Natural Gas CO₂{' '}
                      <Tooltip title='lbs CO₂ per therm of natural gas'>
                        <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
                      </Tooltip>
                    </span>
                  }
                >
                  {NATURAL_GAS_CO2_EMISSIONS_FACTOR} <Tag>lbs CO₂/therm</Tag>
                </Descriptions.Item>
                <Descriptions.Item
                  label={
                    <span>
                      Ocean Transport{' '}
                      <Tooltip title='MTCO₂e per lb of product for standard ocean shipment (19,270 nautical miles)'>
                        <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
                      </Tooltip>
                    </span>
                  }
                >
                  {TRANSPORTATION_CO2_EMISSIONS_FACTOR.toExponential(4)} <Tag>MTCO₂e/lb</Tag>
                </Descriptions.Item>
              </Descriptions>
              <Text type='secondary' style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                Source: EPA WARM Model Assumptions, EIA Commercial Energy Rates
              </Text>
            </Card>
          </Col>

          <Col xs={24} xl={12}>
            <Card
              title={
                <span>
                  Single-Use Materials <Tag color='orange'>{MATERIALS.length} materials</Tag>
                </span>
              }
            >
              <Table
                dataSource={MATERIALS as any[]}
                columns={materialColumns}
                rowKey='id'
                size='small'
                pagination={false}
                scroll={{ x: 500 }}
              />
              <Text type='secondary' style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                Source: EPA WARM Model — Hidden: EPA WARM Assumptions, Sheet !$B$4:$D$15
              </Text>
            </Card>
          </Col>

          <Col xs={24} xl={12}>
            <Card
              title={
                <span>
                  Reusable Materials <Tag color='green'>{REUSABLE_MATERIALS.length} materials</Tag>
                </span>
              }
            >
              <Table
                dataSource={REUSABLE_MATERIALS as unknown as any[]}
                columns={materialColumns}
                rowKey='id'
                size='small'
                pagination={false}
                scroll={{ x: 500 }}
              />
              <Text type='secondary' style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                Source: EPA WARM Model
              </Text>
            </Card>
          </Col>

          <Col span={24}>
            <Card
              title={
                <span>
                  Utility Rates by State <Tag color='blue'>{STATES.length} states</Tag>
                </span>
              }
            >
              <Table
                dataSource={STATES as unknown as any[]}
                columns={stateColumns}
                rowKey='name'
                size='small'
                pagination={{ pageSize: 15 }}
                scroll={{ x: 400 }}
              />
              <Text type='secondary' style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                Source: EIA Commercial Electric Rate ($/kWh) and Commercial Gas Rate ($/therm) — U.S. averages applied
                where state data unavailable
              </Text>
            </Card>
          </Col>
        </Row>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return { notFound: true };
  const isUpstream = await checkIsUpstream(user.org.id);
  if (!isUpstream) return { notFound: true };

  return { props: serializeJSON({ user }) };
};
