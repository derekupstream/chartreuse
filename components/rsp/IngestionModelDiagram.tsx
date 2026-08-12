/**
 * The data ingestion model, drawn rather than described: what happens to an RSP's payload
 * from the moment their system sends it to the moment it appears on a customer dashboard.
 *
 * Lives in two places — embedded in Settings → API Integration, and on the public
 * /rsp/ingestion-model page so a partner can hand the link to their engineers and customers.
 * Everything shown here is implemented behavior, not aspiration; when the pipeline changes,
 * change this too.
 */
import {
  ApiOutlined,
  CalculatorOutlined,
  CheckCircleOutlined,
  DatabaseOutlined,
  LineChartOutlined,
  LockOutlined,
  SafetyOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Card, Col, Row, Table, Tag, Typography } from 'antd';
import styled from 'styled-components';

const { Text, Title, Paragraph } = Typography;

const Pipeline = styled.div`
  display: flex;
  align-items: stretch;
  gap: 0;
  overflow-x: auto;
  padding: 8px 0 16px;
`;

const Step = styled.div`
  flex: 1;
  min-width: 150px;
  position: relative;
  padding: 14px 22px 14px 14px;
  border: 1px solid #d9e6dd;
  background: #f6faf7;
  border-radius: 10px;

  & + & {
    margin-left: 26px;
  }
  & + &::before {
    content: '→';
    position: absolute;
    left: -21px;
    top: 50%;
    transform: translateY(-50%);
    color: #1f7a4d;
    font-size: 16px;
    font-weight: 700;
  }
`;

const StepTitle = styled.div`
  font-weight: 600;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #14532d;
`;

const StepBody = styled.div`
  font-size: 12px;
  color: #556b60;
  margin-top: 6px;
  line-height: 1.5;
`;

const STEPS = [
  {
    icon: <ApiOutlined />,
    title: '1 · Your system sends',
    body: 'One HTTPS message per customer per reporting period: your client_id, a date range, and per product type the items sent out and returned. That is the entire payload.'
  },
  {
    icon: <LockOutlined />,
    title: '2 · Authenticate',
    body: 'Your API key travels as a Bearer header and is checked against a SHA-256 hash — we never store the key itself. Every request is logged, and you can see your own log in Settings.'
  },
  {
    icon: <CheckCircleOutlined />,
    title: '3 · Validate',
    body: 'Dates, counts and product types are checked. A malformed payload is rejected with the exact field named. Problems that don’t justify rejection come back as warnings you can act on.'
  },
  {
    icon: <UserOutlined />,
    title: '4 · Route to the customer',
    body: 'Your client_id resolves to that customer’s account. A first-time client_id creates the account automatically, so onboarding a customer is just sending their first period.'
  },
  {
    icon: <CalculatorOutlined />,
    title: '5 · Calculate impact',
    body: 'Items sent out are priced with standardized per-product-type factors: greenhouse gas, water, and landfill waste avoided, plus single-use items displaced. Same model for every provider, so results are comparable.'
  },
  {
    icon: <DatabaseOutlined />,
    title: '6 · Store the period',
    body: 'Stored as a reporting period attached to the customer’s account. Re-sending a date range supersedes the older version instead of double-counting — corrections are just re-sends.'
  },
  {
    icon: <LineChartOutlined />,
    title: '7 · Results flow back',
    body: 'The computed metrics return in the API response, appear on the customer’s dashboard, total up in your own Settings view, and are queryable any time via the read API for your own site.'
  }
];

const STORED_ROWS = [
  { key: '1', shared: 'Your identifier for the customer (client_id)', why: 'Routes data to the right account' },
  { key: '2', shared: 'Reporting period dates', why: 'Time-series and supersession' },
  { key: '3', shared: 'Items sent out and returned, per product type', why: 'The basis of every impact number' }
];

const NEVER_ROWS = [
  'Pricing, contract terms, or revenue',
  'Routes, logistics, or labor data',
  'Customer contact lists',
  'Anything about how you run your operation'
];

export function IngestionModelDiagram() {
  return (
    <div>
      <Pipeline>
        {STEPS.map(step => (
          <Step key={step.title}>
            <StepTitle>
              {step.icon} {step.title}
            </StepTitle>
            <StepBody>{step.body}</StepBody>
          </Step>
        ))}
      </Pipeline>

      <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
        <Col xs={24} md={12}>
          <Card
            size='small'
            title={
              <>
                <DatabaseOutlined /> What we store
              </>
            }
          >
            <Table
              size='small'
              pagination={false}
              dataSource={STORED_ROWS}
              columns={[
                { title: 'Data', dataIndex: 'shared' },
                { title: 'Why', dataIndex: 'why', width: '45%' }
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            size='small'
            title={
              <>
                <SafetyOutlined /> What we never receive
              </>
            }
          >
            {NEVER_ROWS.map(row => (
              <Paragraph key={row} style={{ marginBottom: 6 }}>
                <Tag color='red'>never</Tag> {row}
              </Paragraph>
            ))}
            <Text type='secondary' style={{ fontSize: 12 }}>
              The payload is counts and dates. There is no mechanism in the API for sending anything else.
            </Text>
          </Card>
        </Col>
      </Row>

      <Card size='small' style={{ marginTop: 16 }} title='Data use, in plain terms'>
        <Paragraph style={{ marginBottom: 8 }}>
          <b>Your customer sees their own data.</b> Each customer&apos;s account shows only that customer&apos;s periods
          and impact — never another customer&apos;s, never another provider&apos;s.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <b>You see everything you&apos;ve shared.</b> Settings → API Integration lists every client, every period, the
          computed totals, and a log of every API call your systems made.
        </Paragraph>
        <Paragraph style={{ marginBottom: 0 }}>
          <b>Benchmarking uses aggregated, anonymized figures only.</b> Comparisons are against groups of similar
          programs — no operator or site is identifiable, and no operator sees another&apos;s data. We are putting this
          commitment into the written data agreement rather than leaving it as an assurance.
        </Paragraph>
      </Card>

      <Paragraph type='secondary' style={{ fontSize: 12, marginTop: 12, marginBottom: 0 }}>
        Impact factors are standardized per product type and consistent across all providers; results should be treated
        as provisional while product-level matching (your specific products matched to the single-use items they
        displace) is completed. Full API contract:{' '}
        <Title level={5} style={{ display: 'inline', fontSize: 12 }}>
          docs/RSP-API.md
        </Title>{' '}
        from your Upstream contact.
      </Paragraph>
    </div>
  );
}
