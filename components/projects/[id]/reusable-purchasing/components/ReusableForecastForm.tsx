import { LeftOutlined } from '@ant-design/icons';
import { Typography, Form, Button, InputNumber } from 'antd';
import type { FC } from 'react';
import { useEffect } from 'react';

import { requiredRule } from 'utils/forms';

import * as S from '../../styles';
import type { ReusableFormValues } from '../reusable-purchasing';

type Props = {
  input: Partial<ReusableFormValues>;
  goBack: (form: Partial<ReusableFormValues>) => void;
  onSubmit(values: { casesAnnually: number }): void;
  productName?: string;
};

const ReusablePurchasingSecondStepForm: FC<Props> = props => {
  const { input, goBack, onSubmit, productName } = props;

  const [form] = Form.useForm<{ casesAnnually: number; casesPurchased: number }>();

  function _goBack() {
    const casesAnnually = form.getFieldValue('casesAnnually');
    const casesPurchased = form.getFieldValue('casesPurchased');
    const annualRepurchasePercentage = casesPurchased ? casesAnnually / casesPurchased : 0;
    goBack({
      annualRepurchasePercentage
    });
  }

  useEffect(() => {
    if (input.annualRepurchasePercentage && input.casesPurchased) {
      const casesAnnually = Math.ceil(input.annualRepurchasePercentage * input.casesPurchased);
      form.setFieldsValue({ ...input, casesAnnually });
    }
  }, [input]);

  return (
    <div>
      <p>
        You will occasionally need to replenish reusable stock due to loss, damage, or breakage. Estimate the number of
        cases you will need to re-purchase.
      </p>
      <Typography.Title level={4}>{productName}</Typography.Title>

      <Form form={form} layout='vertical' onFinish={onSubmit}>
        <Form.Item label='Cases Repurchased Annually' name='casesAnnually' rules={requiredRule}>
          <InputNumber autoFocus style={{ width: '100%' }} />
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
