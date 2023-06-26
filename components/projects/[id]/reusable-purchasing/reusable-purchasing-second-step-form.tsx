import { LeftOutlined } from '@ant-design/icons';
import { Typography, Form, Button, Input } from 'antd';
import type { FC } from 'react';
import { useEffect } from 'react';

import * as S from '../styles';

import type { ReusableFormValues } from './index';

type Props = {
  input: ReusableFormValues;
  onPressPrevious(): void;
  onPressSubmit(values: { casesAnnually: number }): void;
};

const ReusablePurchasingSecondStepForm: FC<Props> = props => {
  const { input, onPressPrevious, onPressSubmit } = props;

  const [form] = Form.useForm<{ casesAnnually: number }>();

  useEffect(() => {
    if (input) {
      const casesAnnually = Math.ceil(parseFloat(input.annualRepurchasePercentage) * parseInt(input.casesPurchased));
      form.setFieldsValue({ ...input, casesAnnually });
    }
  }, [input]);

  return (
    <div>
      <p>
        You will occasionally need to replenish reusable stock due to loss, damage, or breakage. Estimate the number of
        cases you will need to re-purchase.
      </p>
      <Typography.Title level={3}>{input.productName}</Typography.Title>
      <Form form={form} layout='vertical' onFinish={onPressSubmit}>
        <Form.Item
          label='Cases Repurchased Annually'
          name='casesAnnually'
          rules={[{ required: true, message: 'This field is required' }]}
        >
          <Input type='number' autoFocus />
        </Form.Item>

        <S.BoxEnd>
          <Button htmlType='button' onClick={onPressPrevious} icon={<LeftOutlined />}>
            Previous
          </Button>
          <Button htmlType='submit' type='primary'>
            {input?.id ? 'Add forecast' : 'Save'}
          </Button>
        </S.BoxEnd>
      </Form>
    </div>
  );
};

export default ReusablePurchasingSecondStepForm;
