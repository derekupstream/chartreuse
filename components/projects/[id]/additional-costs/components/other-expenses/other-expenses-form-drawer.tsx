import type { OtherExpense } from '@prisma/client';
import { Button, Col, Form, Input, Popover, Row, Typography } from 'antd';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import React from 'react';

import { useSimpleMutation } from 'hooks/useSimpleQuery';
import {
  OTHER_EXPENSES,
  OTHER_EXPENSES_CATEGORIES,
  OTHER_EXPENSES_FREQUENCIES
} from 'lib/calculator/constants/other-expenses';
import { requiredRule } from 'utils/forms';

import { OptionSelection } from '../../../styles';
import { FormItem } from '../styles';

const categoryOptions = OTHER_EXPENSES_CATEGORIES.map(i => ({ value: i.id, label: i.name }));
const frequencyOptions = OTHER_EXPENSES_FREQUENCIES.map(i => ({ value: i.name, label: i.name }));

type Props = {
  input: OtherExpense | null;
  onClose(): void;
};

const OtherExpensesFormDrawer: React.FC<Props> = ({ input, onClose }) => {
  const [form] = Form.useForm<OtherExpense>();
  const createOtherExpense = useSimpleMutation('/api/other-expenses', 'POST');

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

    createOtherExpense.mutate(values, {
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
      <p>
        For additional details on how to categorize your expenses,{' '}
        <Popover content={OtherExpensesDetails} placement='bottom' trigger='click'>
          <a href='#'>view help</a>
        </Popover>
        .
      </p>
      <FormItem hidden name='id'>
        <Input type='hidden' value={input?.id} />
      </FormItem>
      <FormItem label='Category' name='categoryId' rules={requiredRule}>
        <OptionSelection options={categoryOptions} optionType='button' />
      </FormItem>
      <FormItem label='Frequency' name='frequency' rules={requiredRule}>
        <OptionSelection name='frequecy' options={frequencyOptions} optionType='button' />
      </FormItem>
      <FormItem label='Cost' name='cost'>
        <Input type='number' prefix='$ ' name='cost' />
      </FormItem>
      <FormItem label='Description' name='description' rules={requiredRule}>
        <Input.TextArea rows={4} />
      </FormItem>
      <Button htmlType='submit' size='large' type='primary' style={{ float: 'right' }}>
        {input?.id ? 'Save' : 'Add'} expense
      </Button>
    </Form>
  );
};

const OtherExpensesDetails = () => {
  return (
    <div style={{ maxWidth: '900px', padding: '8px' }}>
      <Typography.Title level={4}>Additional expense category help</Typography.Title>
      <Row gutter={[10, 20]}>
        {OTHER_EXPENSES.map(expense => (
          <React.Fragment key={expense.name}>
            <Col span={12}>{expense.name}</Col>
            <Col span={12}>{expense.description}</Col>
          </React.Fragment>
        ))}
      </Row>
    </div>
  );
};

export default OtherExpensesFormDrawer;
