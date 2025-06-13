import { Button, Form, InputNumber, Typography } from 'antd';
import { useEffect } from 'react';
import styled from 'styled-components';

import { requiredRule } from 'utils/forms';

import * as S from '../../styles';
import type { ReusableFormValues } from '../ReusablePurchasingStep';

const StyledFormItem = styled(Form.Item)`
  .ant-form-item-label label {
    font-size: 18px;
    font-weight: 500;
    height: auto;
    &:after {
      content: '';
    }
  }
`;

type Props = {
  input: Partial<ReusableFormValues> | null;
  goBack: (form: Partial<ReusableFormValues>) => void;
  onSubmit(values: ReusableFormValues): void;
  productName?: string;
};

const ReusableBaselineForm: React.FC<Props> = ({ goBack, input, onSubmit, productName }) => {
  const [form] = Form.useForm<ReusableFormValues>();

  function _goBack() {
    goBack({
      unitsPerCase: form.getFieldValue('unitsPerCase'),
      casesPurchased: form.getFieldValue('casesPurchased'),
      caseCost: form.getFieldValue('caseCost')
    });
  }

  useEffect(() => {
    if (input) {
      form.setFieldsValue(input);
    } else {
      form.resetFields();
    }
  }, [input]);

  return (
    <Form form={form} layout='vertical' onFinish={onSubmit}>
      <p>
        You will occasionally need to replenish reusable stock due to loss, damage, or breakage. We recommend following
        a 3:1 ratio to your daily number of disposables being replaced, allowing time for use, washing, and drying.
      </p>
      <Typography.Title level={4}>{productName}</Typography.Title>

      <StyledFormItem label=''>
        <Form.Item label='Cases purchased' name='casesPurchased' rules={requiredRule}>
          <InputNumber min={1} style={{ width: '100%' }} autoFocus />
        </Form.Item>

        <Form.Item name='unitsPerCase' label='Units per case' rules={requiredRule}>
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label='Cost per case' name='caseCost' rules={requiredRule}>
          <InputNumber prefix='$' style={{ width: '100%' }} />
        </Form.Item>
      </StyledFormItem>

      <S.BoxEnd>
        <Button onClick={_goBack}>{'Go Back'}</Button>
        <Button htmlType='submit' type='primary'>
          {'Next'}
        </Button>
      </S.BoxEnd>
    </Form>
  );
};

export default ReusableBaselineForm;
