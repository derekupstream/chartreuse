import { useEffect, useState } from 'react';

import type { ReusableProduct } from 'lib/inventory/types/products';

import type { ReusableFormValues } from '../reusable-purchasing';

import FirstStepForm from './ReusableBaselineForm';
import SecondStepForm from './ReusableForecastForm';
import { ReusableProductForm } from './ReusableProductForm';

type Props = {
  lineItem: ReusableFormValues | null;
  onSubmit: (values: ReusableFormValues) => void;
  formStep: number;
  setFormStep: (step: number) => void;
  products: ReusableProduct[];
  isUpstream: boolean;
};

export function ReusableItemForm({ lineItem, onSubmit, products, formStep, setFormStep, isUpstream }: Props) {
  const [lineItemInput, setLineItemInput] = useState<Partial<ReusableFormValues>>({
    ...(lineItem ? lineItem : {})
  });

  // reset the view whenever line item changes from parent scope
  useEffect(() => {
    setLineItemInput({ ...lineItem });
    setFormStep(1);
  }, [lineItem, setLineItemInput, setFormStep]);

  function enterProduct(productId: string) {
    setLineItemInput({ ...lineItemInput, productId });
    setFormStep(2);
  }

  function goBack(params: Partial<ReusableFormValues> = {}) {
    setLineItemInput({ ...lineItemInput, ...params });
    setFormStep(formStep - 1);
  }

  const product = products.find(p => p.id === lineItemInput?.productId);

  function onSubmitFirstStep(values: ReusableFormValues) {
    setLineItemInput({ ...lineItemInput, ...values });
    setFormStep(3);
  }

  function onSubmitForecast({ casesAnnually }: { casesAnnually: number }) {
    const annualRepurchasePercentage = lineItemInput!.casesPurchased
      ? casesAnnually / lineItemInput!.casesPurchased
      : 0;
    const newFormValues = { ...lineItemInput!, annualRepurchasePercentage } as ReusableFormValues;
    setLineItemInput(newFormValues);
    onSubmit(newFormValues);
  }

  return (
    <>
      {formStep === 1 && (
        <ReusableProductForm
          input={lineItemInput}
          products={products}
          isUpstream={isUpstream}
          onSubmit={enterProduct}
        />
      )}
      {formStep === 2 && (
        <FirstStepForm
          input={lineItemInput}
          productName={product?.description}
          goBack={goBack}
          onSubmit={onSubmitFirstStep}
        />
      )}
      {formStep === 3 && (
        <SecondStepForm
          input={lineItemInput}
          productName={product?.description}
          goBack={goBack}
          onSubmit={onSubmitForecast}
        />
      )}
    </>
  );
}
