import type { LaborCost } from '@prisma/client';
import { Button, Form, Input } from 'antd';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import React from 'react';

import CurrencySymbol from 'components/_app/CurrencySymbol';
import { useSimpleMutation } from 'hooks/useSimpleQuery';
import { LABOR_CATEGORIES } from 'lib/calculator/constants/labor-categories';
import { OTHER_EXPENSES_FREQUENCIES } from 'lib/calculator/constants/other-expenses';
import { requiredRule } from 'utils/forms';

import { OptionSelection } from '../../../styles';
import { FormItem } from '../styles';

const categoryOptions = LABOR_CATEGORIES.map(i => ({ value: i.id, label: i.name }));
const frequencyOptions = OTHER_EXPENSES_FREQUENCIES.map(i => ({ value: i.name, label: i.name }));

type Props = {
  input: LaborCost | null;
  onClose(): void;
};

const LaborFormDrawer: React.FC<Props> = ({ input, onClose }) => {
  const [form] = Form.useForm<LaborCost>();
  const createLaborCost = useSimpleMutation('/api/labor-costs', 'POST');

  const route = useRouter();
  const projectId = route.query.id as string;

  const handleSubmit = () => {
    const { frequency, cost, ...formFields } = form.getFieldsValue();

    const values = {
      ...formFields,
      cost: Number(cost),
      frequency: String(frequency),
      projectId
    };

    createLaborCost.mutate(values, {
      onSuccess: onClose
    });
  };

  useEffect(() => {
    if (input) {
      form.setFieldsValue(input);
    }
  }, [input]);

  return (
    <Form form={form} layout='vertical' onFinish={handleSubmit} style={{ paddingBottom: '24px' }}>
      <FormItem hidden name='id'>
        <Input type='hidden' value={input?.id} />
      </FormItem>
      <FormItem label='Category' name='categoryId' rules={requiredRule}>
        <OptionSelection options={categoryOptions} optionType='button' />
      </FormItem>
      <FormItem label='Frequency' name='frequency' rules={requiredRule}>
        <OptionSelection name='frequecy' options={frequencyOptions} optionType='button' />
      </FormItem>
      <FormItem
        label='Labor cost or savings'
        name='cost'
        extra='To enter a labor savings, format your number as a negative value. Ex. “-500”'
      >
        <Input type='number' prefix={<CurrencySymbol />} name='cost' />
      </FormItem>
      <FormItem label='Description' name='description' rules={requiredRule}>
        <Input.TextArea rows={4} />
      </FormItem>
      <Button htmlType='submit' size='large' type='primary' style={{ float: 'right' }}>
        {input?.id ? 'Save' : 'Add'} labor cost
      </Button>
    </Form>
  );
};

export default LaborFormDrawer;
