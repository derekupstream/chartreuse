import { LeftOutlined } from '@ant-design/icons';
import { Typography, Form, Button, InputNumber } from 'antd';
import type { FC } from 'react';
import { useEffect } from 'react';

import { requiredRule } from 'utils/forms';

import * as S from '../../styles';
import type { ReusableFormValues } from '../ReusablePurchasingStep';

const DEFAULT_RETURN_RATE = 95;

type Props = {
  input: Partial<ReusableFormValues>;
  goBack: (form: Partial<ReusableFormValues>) => void;
  onSubmit(values: { annualRepurchasePercentage: number }): void;
  productName?: string;
};

// The Return Rate is stored directly as annualRepurchasePercentage (1 - rate/100).
// It must NOT round-trip through an integer case count: with small orders the
// ceiling distorts it badly (95% return on 1 case purchased became 100% repurchase).
function toRepurchasePercentage(returnRate: number | undefined): number {
  return Math.max(0, Math.min(1, 1 - (returnRate ?? DEFAULT_RETURN_RATE) / 100));
}

const ReusablePurchasingSecondStepForm: FC<Props> = props => {
  const { input, goBack, onSubmit, productName } = props;

  const [form] = Form.useForm<{ returnRate: number; casesPurchased: number }>();

  function _goBack() {
    goBack({
      annualRepurchasePercentage: toRepurchasePercentage(form.getFieldValue('returnRate'))
    });
  }

  function handleFinish(values: { returnRate: number }) {
    onSubmit({ annualRepurchasePercentage: toRepurchasePercentage(values.returnRate) });
  }

  useEffect(() => {
    // Derive return rate from saved annualRepurchasePercentage on edit;
    // default to 95% when adding a new item or no value yet.
    const pct = input.annualRepurchasePercentage;
    const returnRate =
      pct !== undefined && pct !== null && !Number.isNaN(pct)
        ? Math.max(0, Math.min(100, Math.round((1 - pct) * 100)))
        : DEFAULT_RETURN_RATE;
    form.setFieldsValue({ returnRate, casesPurchased: input.casesPurchased ?? 0 });
  }, [input, form]);

  return (
    <div>
      <p>
        How many reusables come back? Customers can lose or damage some — the rest you'll need to repurchase. If{' '}
        <strong>95%</strong> come back, you'll repurchase about <strong>5%</strong> of your initial order each year.
      </p>
      <Typography.Title level={4}>{productName}</Typography.Title>

      <Form form={form} layout='vertical' initialValues={{ returnRate: DEFAULT_RETURN_RATE }} onFinish={handleFinish}>
        <Form.Item
          label='Return Rate (%)'
          name='returnRate'
          rules={requiredRule}
          help='Percentage of reusables your customers return. Industry typical is 90–98%.'
        >
          <InputNumber autoFocus min={0} max={100} step={1} style={{ width: '100%' }} addonAfter='%' />
        </Form.Item>

        <S.BoxEnd>
          <Button htmlType='button' onClick={_goBack} icon={<LeftOutlined />}>
            Previous
          </Button>
          <Button htmlType='submit' type='primary'>
            {input?.id ? 'Save' : 'Add item'}
          </Button>
        </S.BoxEnd>
      </Form>
    </div>
  );
};

export default ReusablePurchasingSecondStepForm;
