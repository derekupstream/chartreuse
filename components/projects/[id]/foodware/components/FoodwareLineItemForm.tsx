import { Button, Form, Select } from 'antd';
import { useState, useEffect } from 'react';

import * as S from '../../styles';
import type { FoodwareOption } from 'lib/inventory/assets/event-foodware/getFoodwareOptions';
import type { ReusableProduct, SingleUseProduct } from 'lib/inventory/types/products';

export type FoodwareLineItemFormValues = {
  id?: string;
  reusableProductId: string;
  singleUseProductId: string;
};

const searchByLabel = (input: string, option?: { label?: string }) =>
  (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

export function FoodwareLineItemForm({
  input,
  onSubmit,
  options,
  reusableProducts,
  singleUseProducts
}: {
  input?: FoodwareLineItemFormValues | null;
  onSubmit: (values: FoodwareLineItemFormValues) => void;
  options: FoodwareOption[];
  reusableProducts: ReusableProduct[];
  singleUseProducts: SingleUseProduct[];
}) {
  const [reusableProductId, setReusableProductId] = useState<string | undefined>(undefined);
  const [singleUseProductId, setSingleUseProductId] = useState<string | undefined>(undefined);

  useEffect(() => {
    // set the default values if we already have a product — any pairing from the
    // full catalogs is valid, not just the curated foodware options
    setReusableProductId(input?.reusableProductId);
    setSingleUseProductId(input?.singleUseProductId);
  }, [input]);

  const selectedPairing =
    options.find(o => o.reusable.id === reusableProductId && o.singleuse.id === singleUseProductId) ?? null;

  function _onSubmit() {
    if (reusableProductId && singleUseProductId) {
      onSubmit({
        id: input?.id,
        reusableProductId,
        singleUseProductId
      });
    }
  }

  return (
    <Form layout='vertical'>
      <Form.Item label='Common pairings' help='Optional shortcut — picking one fills in both products below.'>
        <Select
          placeholder='Select a common pairing'
          value={selectedPairing ? `${selectedPairing.reusable.id}-${selectedPairing.singleuse.id}` : undefined}
          onChange={value => {
            const [reusableId, singleId] = value.split('-');
            setReusableProductId(reusableId);
            setSingleUseProductId(singleId);
          }}
          style={{ width: '100%' }}
          options={options.map(option => ({
            value: `${option.reusable.id}-${option.singleuse.id}`,
            label: option.title
          }))}
        />
      </Form.Item>
      <Form.Item label='Reusable product' required>
        <Select
          placeholder='Search the reusable catalog'
          showSearch
          filterOption={searchByLabel}
          value={reusableProductId}
          onChange={setReusableProductId}
          style={{ width: '100%' }}
          options={[...reusableProducts]
            .sort((a, b) => a.description.localeCompare(b.description))
            .map(product => ({ value: product.id, label: product.description }))}
        />
      </Form.Item>
      <Form.Item label='Single-use product being replaced' required>
        <Select
          placeholder='Search the single-use catalog'
          showSearch
          filterOption={searchByLabel}
          value={singleUseProductId}
          onChange={setSingleUseProductId}
          style={{ width: '100%' }}
          options={[...singleUseProducts]
            .sort((a, b) => a.description.localeCompare(b.description))
            .map(product => ({ value: product.id, label: product.description }))}
        />
      </Form.Item>
      <S.BoxEnd>
        <div></div>
        <Button size='large' type='primary' disabled={!reusableProductId || !singleUseProductId} onClick={_onSubmit}>
          {'Next'}
        </Button>
      </S.BoxEnd>
    </Form>
  );
}
