import { Button, Form, Select } from 'antd';
import { useState, useEffect } from 'react';

import * as S from '../../styles';
import type { FoodwareOption } from 'lib/inventory/assets/event-foodware/getFoodwareOptions';

export type FoodwareLineItemFormValues = {
  id?: string;
  reusableProductId: string;
  singleUseProductId: string;
};

export function FoodwareLineItemForm({
  input,
  onSubmit,
  options
}: {
  input?: FoodwareLineItemFormValues | null;
  onSubmit: (values: FoodwareLineItemFormValues) => void;
  options: FoodwareOption[];
}) {
  const [selectedOption, setOption] = useState<FoodwareOption | null>(null);

  useEffect(() => {
    // set the default values if we already have a product
    if (input) {
      const foodwareOption = options.find(
        p => p.reusable.id === input.reusableProductId && p.singleuse.id === input.singleUseProductId
      );
      if (foodwareOption) {
        setOption(foodwareOption);
      }
    }
  }, [input, options, setOption]);

  function _onSubmit() {
    if (selectedOption) {
      onSubmit({
        id: input?.id,
        reusableProductId: selectedOption.reusable.id,
        singleUseProductId: selectedOption.singleuse.id
      });
    }
  }

  return (
    <Form layout='vertical'>
      <Form.Item label='Select a product'>
        <Select
          placeholder='Select a product'
          value={selectedOption ? `${selectedOption.reusable.id}-${selectedOption.singleuse.id}` : undefined}
          onChange={value => {
            const [reusableId, singleId] = value.split('-');
            const option = options.find(o => o.reusable.id === reusableId && o.singleuse.id === singleId);
            setOption(option || null);
          }}
          style={{ width: '100%' }}
        >
          {options.map(option => (
            <Select.Option
              key={`${option.reusable.id}-${option.singleuse.id}`}
              value={`${option.reusable.id}-${option.singleuse.id}`}
            >
              {option.title}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
      <S.BoxEnd>
        <div></div>
        <Button size='large' type='primary' disabled={!selectedOption} onClick={_onSubmit}>
          {'Next'}
        </Button>
      </S.BoxEnd>
    </Form>
  );
}
