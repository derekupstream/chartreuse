import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { Button, Drawer, Card, Space, Divider, Form, Typography, message, Input } from 'antd';
import { useEffect, useState } from 'react';

import { getStripe } from 'components/setup/trial/getStripe';
import { useSubscription } from 'hooks/useSubscription';
import * as S from 'layouts/styles';
import { useCreatePaymentMethod } from 'lib/api';
import { useUpdateBillingEmail } from 'lib/api';

export function PaymentInformationCard() {
  const { customer, paymentMethod, refresh } = useSubscription();
  const { trigger } = useUpdateBillingEmail();
  const [sidebarView, setSidebarView] = useState<'billing_email' | 'payment_method' | null>(null);

  async function onSubmitEmailForm({ email }: { email: string }) {
    try {
      await trigger({ email });
      await refresh();
      message.success('Billing email was updated successfully.');
      closeDrawer();
    } catch (error) {
      message.error((error as Error).message || 'Something went wrong, please try again.');
    }
  }

  async function onSubmitPaymentMethodForm() {
    await refresh();
    message.success('Payment method updated successfully.');
    closeDrawer();
  }

  function showEmailForm() {
    setSidebarView('billing_email');
  }

  function showPaymentMethodForm() {
    setSidebarView('payment_method');
  }

  function closeDrawer() {
    setSidebarView(null);
  }

  return (
    <>
      <Card style={{ height: '100%' }} bodyStyle={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography.Title level={3}>Billing information</Typography.Title>
        <S.ProjectInfo>
          <Typography.Title level={5}>
            Billing email
            <Button icon={<EditOutlined />} type='text' onClick={showEmailForm} />
          </Typography.Title>
          <Typography.Text>{customer?.email}</Typography.Text>
          <br />
          <br />
          <Typography.Title level={5}>
            Payment method
            {paymentMethod && <Button icon={<EditOutlined />} type='text' onClick={showPaymentMethodForm} />}
          </Typography.Title>

          {!paymentMethod && (
            <Button type='primary' onClick={showPaymentMethodForm}>
              Add Payment Method
            </Button>
          )}
          {paymentMethod && (
            <Space.Compact direction='vertical'>
              <Typography.Text>
                {paymentMethod.card?.brand.toUpperCase()} &bull;&bull;&bull;&bull; {paymentMethod.card?.last4}
              </Typography.Text>
              <Typography.Text type='secondary'>
                Expires {paymentMethod.card?.exp_month} / {paymentMethod.card?.exp_year}
              </Typography.Text>
            </Space.Compact>
          )}
        </S.ProjectInfo>
        <S.Actions></S.Actions>
      </Card>
      <Drawer
        title={
          sidebarView === 'billing_email'
            ? 'Edit billing email'
            : paymentMethod
            ? 'Change the payment method'
            : 'Add a payment method'
        }
        placement='right'
        onClose={closeDrawer}
        open={!!sidebarView}
        contentWrapperStyle={{ width: '600px' }}
        destroyOnClose={true}
      >
        {sidebarView === 'billing_email' && <EmailForm onSubmit={onSubmitEmailForm} />}
        {sidebarView === 'payment_method' && <WrappedPaymentMethodForm onSubmit={onSubmitPaymentMethodForm} />}
      </Drawer>
    </>
  );
}

function EmailForm({ onSubmit }: { onSubmit: (values: { email: string }) => Promise<void> }) {
  const { customer } = useSubscription();
  const [form] = Form.useForm<{ email: string }>();
  useEffect(() => {
    form.setFieldsValue({
      email: customer?.email || ''
    });
    // if (!firebaseUser?.email) {
    //   message.error('There was an error, please refresh your page and try again.');
    //   return;
    // }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer]);
  return (
    <Form form={form} name='orgAccount' layout='vertical' onFinish={onSubmit}>
      <Form.Item
        label='Billing email'
        name='email'
        rules={[
          {
            required: true
          }
        ]}
      >
        <Input type='email' placeholder='billing@acme.org' />
      </Form.Item>

      <Form.Item>
        <Button type='primary' htmlType='submit'>
          Update
        </Button>
      </Form.Item>
    </Form>
  );
}

export function WrappedPaymentMethodForm({ onSubmit }: { onSubmit: () => void }) {
  const stripePromise = getStripe();
  return (
    <Elements
      stripe={stripePromise}
      options={{
        mode: 'setup',
        paymentMethodCreation: 'manual',
        currency: 'usd',
        appearance: { variables: { colorPrimary: '#2bbe50' } }
      }}
    >
      <PaymentMethodForm onSubmit={onSubmit} />
    </Elements>
  );
}

function PaymentMethodForm({ onSubmit }: { onSubmit: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const { trigger: createPaymentMethod } = useCreatePaymentMethod();
  const { customer } = useSubscription();

  async function handleSubmit() {
    if (!stripe || !elements || !customer) {
      return;
    }

    setIsLoading(true);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      message.error(submitError.message);
    } else {
      // ref: https://stripe.com/docs/js/payment_methods/create_payment_method_elements
      const { error: createPaymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        elements
      });

      if (createPaymentMethodError) {
        message.error('An unexpected error occurred.');
        console.error(`[stripe]: Failed to create payment method. ${createPaymentMethodError.message}`, {
          errorType: createPaymentMethodError.type,
          errorCode: createPaymentMethodError.code
        });
      } else if (paymentMethod) {
        // add payment method
        await createPaymentMethod({ customerId: customer.id, paymentMethodId: paymentMethod.id });
        onSubmit();
      }
    }
    setIsLoading(false);
  }
  return (
    <>
      <Typography.Title level={4}>Payment information</Typography.Title>
      <Form layout='vertical' onFinish={handleSubmit}>
        <PaymentElement />
        <br />
        <Button htmlType='submit' type='primary' loading={isLoading}>
          Submit
        </Button>
      </Form>
    </>
  );
}
