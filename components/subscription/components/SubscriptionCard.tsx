import { Elements } from '@stripe/react-stripe-js';
import type { RadioChangeEvent } from 'antd';
import { Button, Radio, Drawer, Card, Divider, Space, List, Typography, message } from 'antd';
import { useState } from 'react';

import { getStripe } from 'components/setup/trial/getStripe';
import { useSubscription } from 'hooks/useSubscription';
import * as S from 'layouts/styles';
import { useCancelSubscription, useUpdateSubscription, useGetSubscriptionProduct } from 'lib/api';
import type { ProductTier, ProductTierSettings } from 'lib/stripe/config';

import { CancelModal } from './CancelModal';

export interface SubscriptionCardProps {
  isModalVisible: boolean;
  modalView: 'cancel' | 'feedback';
  confirmLoading: boolean;
  onConfirmCancel: () => void;
  onCancel: () => void;
}

export function SubscriptionCard() {
  const stripePromise = getStripe();

  const [sidebarView, setSidebarView] = useState<'cancel' | 'update' | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalView, setModalView] = useState<'cancel' | 'feedback'>('cancel');
  const [loading, setLoading] = useState(false);

  const { subscription, refresh, monthlyRate } = useSubscription();
  const { trigger } = useCancelSubscription();
  const { trigger: updateSubscription } = useUpdateSubscription();

  // function showDrawer() {
  //   setSidebarView('update');
  // }

  function closeDrawer() {
    setSidebarView(null);
  }

  function showCancelForm() {
    setModalView('cancel');
    setIsModalVisible(true);
  }

  const handleCancel = () => {
    setLoading(true);
    setTimeout(() => {
      setIsModalVisible(false);
      setLoading(false);
    }, 2000);
  };

  function closeModal(): void {
    setIsModalVisible(false);
  }

  async function submitSubscriptionForm(fields: { price: ProductTierSettings['stripePrice'] }) {
    try {
      await updateSubscription({
        stripePrice: fields.price
      });
      await refresh();
      closeDrawer();
      message.success('Subscription updated successfully.');
    } catch (error) {
      message.error((error as Error).message || 'Something went wrong, please try again.');
    }
  }

  return (
    <>
      <Card style={{ height: '100%' }} bodyStyle={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography.Title level={3}>Subscription plan</Typography.Title>
        <S.ProjectInfo>
          <Typography.Title level={5}>Subscription payment:</Typography.Title>
          <Typography.Text>${monthlyRate} / month</Typography.Text>
          <br />
          <br />
          <Typography.Title level={5}>Next charge date:</Typography.Title>
          <Typography.Text>
            {subscription?.current_period_end && new Date(subscription.current_period_end * 1000).toLocaleDateString()}
          </Typography.Text>
          {/* {tier && (
            <>
              <Typography.Title level={5}>{tier.name} plan includes:</Typography.Title>
              <List bordered size='small' dataSource={featureList} renderItem={item => <List.Item>{item}</List.Item>} />
            </>
          )} */}

          <br />
          <br />
          <Typography.Text underline type='secondary' style={{ cursor: 'pointer' }} onClick={showCancelForm}>
            Cancel Subscription
          </Typography.Text>
        </S.ProjectInfo>
        {/* <S.Actions>
          <Button icon={<EditOutlined />} type='text' onClick={showDrawer} />
        </S.Actions> */}
      </Card>
      <CancelModal
        isModalVisible={isModalVisible}
        modalView={modalView}
        onConfirmCancel={handleCancel}
        confirmLoading={loading}
        onCancel={closeModal}
      />
      <Drawer
        title={sidebarView === 'update' ? 'Update your subscription' : 'Cancel subscription'}
        placement='right'
        onClose={closeDrawer}
        open={!!sidebarView}
        contentWrapperStyle={{ width: '600px' }}
        destroyOnClose={true}
      >
        <Elements
          stripe={stripePromise}
          options={{
            mode: 'setup',
            paymentMethodCreation: 'manual',
            currency: 'usd',
            appearance: { variables: { colorPrimary: '#2bbe50' } }
          }}
        >
          {sidebarView === 'update' && <SubscriptionForm onCancel={showCancelForm} onSubmit={submitSubscriptionForm} />}
        </Elements>
      </Drawer>
    </>
  );
}

function SubscriptionForm({
  onCancel,
  onSubmit
}: {
  onCancel: VoidFunction;
  onSubmit: (fields: { price: ProductTierSettings['stripePrice'] }) => void;
}) {
  return (
    <>
      <SubscriptionTierForm currentTier={'tier_1'} onSubmit={onSubmit} />
      <Typography.Text type='secondary' underline style={{ cursor: 'pointer' }} onClick={onCancel}>
        Cancel subscription
      </Typography.Text>
    </>
  );
}

export function SubscriptionTierForm({
  buttonText,
  onSubmit,
  currentTier
}: {
  currentTier: ProductTier;
  buttonText?: string;
  onSubmit: (fields: { price: ProductTierSettings['stripePrice'] }) => void;
}) {
  const { data: product } = useGetSubscriptionProduct();
  const tiers = product?.tiers;
  const [selectedTier, setSelectedTier] = useState<ProductTier>(currentTier);

  const selectedTierOptions = tiers?.[selectedTier];
  const featureList = selectedTierOptions
    ? [
        `$${selectedTierOptions.monthlyAmount / 100} Monthly Fee`,
        `Up to ${selectedTierOptions.projectLimit} projects`,
        `$${selectedTierOptions.additionalProjectCost / 100} per additional project`
      ]
    : [];

  function onChange(e: RadioChangeEvent) {
    setSelectedTier(e.target.value);
  }

  function _onSubmit() {
    const price = selectedTierOptions?.stripePrice;
    if (price) {
      onSubmit({ price });
    }
  }

  return (
    <>
      <Typography.Title level={5}>Select a plan:</Typography.Title>
      <Radio.Group buttonStyle='outline' value={selectedTier} onChange={onChange} style={{ marginBottom: 16 }}>
        <Radio.Button value='tier_1'>Tier 1</Radio.Button>
        <Radio.Button value='tier_2'>Tier 2</Radio.Button>
        <Radio.Button value='tier_3'>Tier 3</Radio.Button>
      </Radio.Group>
      <List bordered dataSource={featureList} renderItem={item => <List.Item>{item}</List.Item>} />
      <br />
      <Button type='primary' onClick={_onSubmit}>
        {buttonText || 'Update plan'}
      </Button>
      <Divider />
    </>
  );
}
