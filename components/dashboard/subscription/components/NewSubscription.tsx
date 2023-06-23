import { message } from 'antd';
import { useState, useEffect } from 'react';

import { useSubscription } from 'hooks/useSubscription';

import { WrappedPaymentMethodForm } from './PaymentInformationCard';
import { SubscriptionTierForm } from './SubscriptionCard';

export function NewSubscription() {
  const [formStep, setFormStep] = useState(0);
  const [price, setPrice] = useState('');
  const { refresh } = useSubscription();

  function selectTier({ price }: { price: string }) {
    setPrice(price);
    setFormStep(1);
  }

  function submitForm() {
    refresh();
    message.success('Subscription created successfully.');
  }

  return (
    <>
      {formStep === 0 && <SubscriptionTierForm currentTier={'tier_1'} buttonText='Select plan' onSubmit={selectTier} />}
      {formStep === 1 && <WrappedPaymentMethodForm onSubmit={submitForm} />}
    </>
  );
}
