import { Button, Form, Input, InputNumber, RadioChangeEvent, Row, Tooltip } from 'antd';

import { useEffect } from 'react';
import styled from 'styled-components';

import CurrencySymbol from 'components/_app/CurrencySymbol';
import { requiredRule } from 'utils/forms';

import { TruckTransportationCost } from '@prisma/client';
import { useMetricSystem } from 'components/_app/MetricSystemProvider';

export type FormValues = Pick<TruckTransportationCost, 'distanceInMiles'> & { id?: string };

// enter round-trip distance

type Props = {
  input: FormValues | null;
  onSubmit(values: FormValues): void;
};

export const TruckTransportationForm: React.FC<Props> = ({ input, onSubmit }) => {
  const [form] = Form.useForm<FormValues>();
  const displayAsMetric = useMetricSystem();

  const handleSubmit = () => {
    const { distanceInMiles } = form.getFieldsValue();
    const finalValue = displayAsMetric ? distanceInMiles / 1.60934 : distanceInMiles;
    onSubmit({ distanceInMiles: finalValue });
  };

  useEffect(() => {
    if (input) {
      const finalValue = displayAsMetric ? input.distanceInMiles * 1.60934 : input.distanceInMiles;
      form.setFieldsValue({ distanceInMiles: finalValue });
    }
  }, [input, displayAsMetric]);

  return (
    <>
      <p>Enter the distance for one round trip from the event to the off-site dishwashing facility.</p>
      <Form form={form} layout='vertical' onFinish={handleSubmit} style={{ paddingBottom: '24px' }}>
        <FormItem label='Round trip distance' name='distanceInMiles' rules={requiredRule}>
          <InputNumber style={{ width: '100%' }} suffix={displayAsMetric ? 'km' : 'miles'} />
        </FormItem>
        <Button htmlType='submit' size='large' type='primary' style={{ float: 'right' }}>
          {input?.id ? 'Update' : 'Add'}
        </Button>
      </Form>
    </>
  );
};

const FormItem = styled(Form.Item)`
  .ant-form-item-label label {
    font-size: 18px;
    font-weight: 500;
    height: auto;
    &:after {
      content: '';
    }
  }
`;
