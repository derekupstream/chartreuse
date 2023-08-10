import { Button, Radio, Drawer, Card, Divider, Space, List, Typography, Modal, message } from 'antd';
import { useState } from 'react';

import { getStripe } from 'components/setup/trial/getStripe';
import { useSubscription } from 'hooks/useSubscription';
import * as S from 'layouts/styles';
import { useCancelSubscription, useUpdateSubscription, useGetSubscriptionProduct } from 'lib/api';

import type { SubscriptionCardProps } from './SubscriptionCard';

export function CancelModal({
  isModalVisible,
  modalView,
  onConfirmCancel,
  confirmLoading,
  onCancel
}: SubscriptionCardProps) {
  const { subscription, refresh, monthlyRate } = useSubscription();
  const { trigger } = useCancelSubscription();

  async function cancelSubscription() {
    try {
      await trigger();
      await refresh();
      message.success('Your subscription was cancelled successfully.');
      onConfirmCancel();
      setTimeout(() => {
        window.location.href =
          'https://us7.list-manage.com/survey?u=483c2915e8ca06ddebaee1a3c&id=0a02414ed5&attribution=false';
      }, 2000);
    } catch (error) {
      message.error((error as Error).message || 'Something went wrong, please try again.');
    }
  }

  return (
    <>
      <Modal title='Cancel Subscription' open={isModalVisible} footer={null} onCancel={onCancel}>
        {modalView === 'cancel' && (
          <CancelForm onSubmit={cancelSubscription} onCancel={onCancel} confirmLoading={confirmLoading} />
        )}
      </Modal>
    </>
  );
}

function CancelForm({
  onSubmit,
  onCancel,
  confirmLoading
}: {
  onSubmit: VoidFunction;
  onCancel: VoidFunction;
  confirmLoading: boolean;
}) {
  return (
    <>
      <Space direction='vertical' size='small'>
        <Typography.Title level={4}>Are you sure you want to cancel your subscription?</Typography.Title>
        <Typography.Text>
          Paid subscriptions will have access until the end of the current billing period.
        </Typography.Text>
        <br></br>
        <Button type='primary' onClick={onCancel}>
          No, Keep My Subscription
        </Button>
        <Button danger loading={confirmLoading} onClick={onSubmit}>
          Yes, Cancel My Subscription
        </Button>
      </Space>
    </>
  );
}
