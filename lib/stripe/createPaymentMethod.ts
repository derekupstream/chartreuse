import { stripe } from './client';

export async function createDefaultPaymentMethod({
  customerId,
  paymentMethodId,
  setupIntentId
}: {
  customerId: string;
  paymentMethodId: string;
  setupIntentId?: string;
}) {
  const setupIntent =
    typeof setupIntentId === 'string'
      ? await _getSetupIntent({ setupIntentId })
      : await _createSetupIntent({ customerId });

  await _confirmSetupIntent({ setupIntentId: setupIntent.id, paymentMethodId });

  await stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId
    }
  });
}

async function _createSetupIntent({ customerId: customer }: { customerId: string }) {
  return stripe.setupIntents.create({
    customer,
    payment_method_types: ['card']
  });
}

async function _getSetupIntent({ setupIntentId }: { setupIntentId: string }) {
  return stripe.setupIntents.retrieve(setupIntentId);
}

async function _confirmSetupIntent({
  setupIntentId,
  paymentMethodId
}: {
  setupIntentId: string;
  paymentMethodId: string;
}) {
  return stripe.setupIntents.confirm(setupIntentId, {
    payment_method: paymentMethodId
  });
}
