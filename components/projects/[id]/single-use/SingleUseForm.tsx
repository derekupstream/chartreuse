import { message } from 'antd';
import { useEffect, useState } from 'react';

import chartreuseClient from 'lib/chartreuseClient';
import type { SingleUseProduct } from 'lib/inventory/types/products';
import type { SingleUseLineItem } from 'lib/inventory/types/projects';

import SingleUseBaselineForm from './SingleUseBaselineForm';
import SingleUseForecastForm from './SingleUseForecastForm';
import SingleUseProductForm from './SingleUseProductForm';

type SingleUseProps = {
  lineItem: SingleUseLineItem | null;
  onSubmit: (values: SingleUseLineItem) => void;
  formStep: number;
  setFormStep: (step: number) => void;
  products: SingleUseProduct[];
};

export default function SingleUseForm({ lineItem, onSubmit, products, formStep, setFormStep }: SingleUseProps) {
  const [lineItemInput, setLineItemInput] = useState<Partial<SingleUseLineItem>>({
    ...(lineItem ? lineItem : {})
  });

  // reset the view whenever line item changes from parent scope
  useEffect(() => {
    setLineItemInput({ ...lineItem });
    setFormStep(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineItem]);

  function enterProduct(productId: string) {
    setLineItemInput({ ...lineItemInput, productId });
    setFormStep(2);
  }

  function enterQuantity(params: Partial<SingleUseLineItem>) {
    setLineItemInput({ ...lineItemInput, ...params });
    setFormStep(3);
  }

  function enterForecast(params: Partial<SingleUseLineItem>) {
    const finalItem = { ...lineItemInput, ...params } as SingleUseLineItem;
    setLineItemInput(finalItem);
    onSubmit(finalItem);
  }

  function goBack(params: Partial<SingleUseLineItem> = {}) {
    setLineItemInput({ ...lineItemInput, ...params });
    setFormStep(formStep - 1);
  }

  const product = products.find(p => p.id === lineItemInput?.productId);

  return (
    <>
      {formStep === 1 && <SingleUseProductForm input={lineItemInput} products={products} onSubmit={enterProduct} />}
      {formStep === 2 && (
        <SingleUseBaselineForm
          input={lineItemInput}
          productName={product?.description}
          goBack={goBack}
          onSubmit={enterQuantity}
        />
      )}
      {formStep === 3 && (
        <SingleUseForecastForm
          input={lineItemInput}
          productName={product?.description}
          frequency={lineItemInput.frequency}
          goBack={goBack}
          onSubmit={enterForecast}
        />
      )}
    </>
  );
}
