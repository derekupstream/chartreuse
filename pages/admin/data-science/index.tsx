import { Button, Card, Col, Row, Statistic, Typography } from 'antd';
import { LinkOutlined, CalculatorOutlined, FileTextOutlined, ExperimentOutlined } from '@ant-design/icons';
import { GetServerSideProps } from 'next';
import { getUserFromContext } from 'lib/middleware';
import type { DashboardUser } from 'interfaces';
import { serializeJSON } from 'lib/objects';
import { AdminLayout } from 'layouts/AdminLayout';
import styled from 'styled-components';

const { Title, Paragraph } = Typography;

const StyledCard = styled(Card)`
  height: 100%;
  .ant-card-body {
    padding: 24px;
  }

  .ant-statistic-title {
    font-size: 14px;
    color: #8c8c8c;
    margin-bottom: 8px;
  }

  .ant-statistic-content {
    font-size: 24px;
    font-weight: 600;
  }
`;

const IconWrapper = styled.div`
  font-size: 48px;
  color: #2bbe50;
  margin-bottom: 16px;
`;

export default function DataSciencePage({ user }: { user: DashboardUser }) {
  return (
    <AdminLayout title='Data Science Admin' selectedMenuItem='data-science' user={user}>
      <div style={{ padding: '24px' }}>
        <Title level={2}>Data Science Admin</Title>
        <Paragraph>
          Manage calculation methodologies, logic rules, and golden dataset testing for the Chart-Reuse calculator
          engine.
        </Paragraph>

        <Row gutter={[16, 16]} style={{ marginTop: '32px' }}>
          <Col xs={24} sm={12} lg={6}>
            <StyledCard>
              <IconWrapper>
                <FileTextOutlined />
              </IconWrapper>
              <Statistic title='Methodologies' value={12} suffix='documents' />
              <div style={{ marginTop: '16px' }}>
                <Button type='primary' href='/admin/methodology' block>
                  Manage Methodologies
                </Button>
              </div>
            </StyledCard>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <StyledCard>
              <IconWrapper>
                <CalculatorOutlined />
              </IconWrapper>
              <Statistic title='Calculation Rules' value={48} suffix='rules' />
              <div style={{ marginTop: '16px' }}>
                <Button href='/admin/data-science/calculations' block>
                  Edit Calculations
                </Button>
              </div>
            </StyledCard>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <StyledCard>
              <IconWrapper>
                <ExperimentOutlined />
              </IconWrapper>
              <Statistic title='Golden Datasets' value={8} suffix='datasets' />
              <div style={{ marginTop: '16px' }}>
                <Button href='/admin/data-science/golden-datasets' block>
                  Manage Test Data
                </Button>
              </div>
            </StyledCard>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <StyledCard>
              <IconWrapper>
                <LinkOutlined />
              </IconWrapper>
              <Statistic title='Test Runs' value={156} suffix='runs' />
              <div style={{ marginTop: '16px' }}>
                <Button href='/admin/data-science/test-results' block>
                  View Test Results
                </Button>
              </div>
            </StyledCard>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: '32px' }}>
          <Col xs={24} lg={12}>
            <Card title='Recent Activity' extra={<Button href='/admin/data-science/activity'>View All</Button>}>
              <div style={{ padding: '16px 0' }}>
                <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ fontWeight: 500, marginBottom: '4px' }}>Calculation rule updated</div>
                  <div style={{ color: '#8c8c8c', fontSize: '12px' }}>Water usage calculations - 2 hours ago</div>
                </div>
                <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ fontWeight: 500, marginBottom: '4px' }}>Golden test completed</div>
                  <div style={{ color: '#8c8c8c', fontSize: '12px' }}>Event projections dataset - 5 hours ago</div>
                </div>
                <div>
                  <div style={{ fontWeight: 500, marginBottom: '4px' }}>New methodology published</div>
                  <div style={{ color: '#8c8c8c', fontSize: '12px' }}>Construction waste calculations - 1 day ago</div>
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title='System Health' extra={<Button href='/admin/data-science/health'>Details</Button>}>
              <div style={{ padding: '16px 0' }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title='Test Success Rate'
                      value={94.2}
                      precision={1}
                      suffix='%'
                      valueStyle={{ color: '#3f8600' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic title='Pending Reviews' value={3} valueStyle={{ color: '#cf1322' }} />
                  </Col>
                </Row>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context);

  if (!user) {
    return { redirect: { permanent: false, destination: '/login' } };
  }

  // TODO: Add data admin role check
  return {
    props: serializeJSON({ user })
  };
};
