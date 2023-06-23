import { Badge, List, Alert, Typography } from 'antd';
import styled from 'styled-components';

import * as S from 'components/dashboard/styles';
import type { SubscriptionStatus } from 'lib/stripe/getCustomerSubscription';

const Header = styled.div`
  align-items: center;
  display: flex;
  flex-grow: 1;
  flex-direction: column;
  flex-grow: 1;
  gap: 1em;
  justify-content: center;
  padding: 0 2rem;
`;

const Footer = styled.div`
  background-color: white;
  flex-grow: 1;
  padding: 4rem 2rem 0;
  width: 100%;
`;

const featureList = [
  `Ability to set up multiple projects`,
  `A communications guide to help you prepare your customers and clients for the exciting transition to reuse`,
  `One-on-one consultation on your project(s)`
];

export function ComingSoon({ subscriptionStatus }: { subscriptionStatus: SubscriptionStatus | 'no_subscription' }) {
  return (
    <>
      <S.ContentContainer>
        <S.Content>
          {subscriptionStatus === 'Expired_Trial' && (
            <div style={{ textAlign: 'center' }}>
              <Alert
                style={{ display: 'inline-block' }}
                type='error'
                message={`Your Free Trial has expired. Please contact chartreuse@upstreamsolutions.org to continue using Chartreuse.`}
              />
            </div>
          )}
          {subscriptionStatus === 'Canceled' && (
            <div style={{ textAlign: 'center' }}>
              <Alert
                style={{ display: 'inline-block' }}
                type='error'
                message={`Your subscription has been canceled. Please contact chartreuse@upstreamsolutions.org to continue using Chartreuse.`}
              />
            </div>
          )}
          <Header>
            <Typography.Title style={{ textAlign: 'center', fontSize: 44 }}>
              Are you ready to make the switch to reuse and join us in creating a future that makes throw away, go away?
            </Typography.Title>
            <Typography.Title level={5}>
              Stay tuned, we will be releasing pricing options and more features soon!
            </Typography.Title>
          </Header>
        </S.Content>
      </S.ContentContainer>
      <Footer>
        <S.Content>
          <Typography.Title level={3}>All subscriptions include</Typography.Title>
          <List
            size='large'
            itemLayout='vertical'
            dataSource={featureList}
            renderItem={item => (
              <List.Item style={{ paddingLeft: 0 }}>
                <Badge status='default' style={{ paddingRight: '1em' }} />{' '}
                <Typography.Title level={5} style={{ display: 'inline' }}>
                  {item}
                </Typography.Title>
              </List.Item>
            )}
            footer={
              <Typography.Title level={5} style={{ margin: '1em 0' }}>
                Need more info? Email{' '}
                <a href='mailto:chartreuse@upstreamsolutions.org'>chartreuse@upstreamsolutions.org</a> to schedule a
                consultation.
              </Typography.Title>
            }
          />
        </S.Content>
      </Footer>
    </>
  );
}
