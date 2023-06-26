import { Alert, Row, Col, Space, Typography } from 'antd';

import { useSubscription } from 'hooks/useSubscription';

import { NewSubscription } from './components/NewSubscription';
import { PaymentInformationCard } from './components/PaymentInformationCard';
import { SubscriptionCard } from './components/SubscriptionCard';

export default function Billing() {
  const { trialEndDateRelative, isLoading } = useSubscription();
  return (
    <Space direction='vertical' size='large' style={{ width: '100%' }}>
      <Typography.Title>Subscription</Typography.Title>
      {trialEndDateRelative && (
        <>
          <Alert
            type='info'
            showIcon
            message={`Your Free Trial expires in ${trialEndDateRelative}`}
            description='Add a payment method to increase the amount of projects you can set up and continue service at the end of your free trial'
          />
          <div style={{ width: 400, margin: '0 auto' }}>
            <NewSubscription />
          </div>
        </>
      )}
      {!isLoading && !trialEndDateRelative && (
        <Row gutter={[36, 36]}>
          <Col xs={24} sm={12}>
            <PaymentInformationCard />
          </Col>
          <Col xs={24} sm={12}>
            <SubscriptionCard />
          </Col>
        </Row>
      )}
    </Space>
  );
}
