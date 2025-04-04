import { RightOutlined } from '@ant-design/icons';
import { Divider, Form, Input, Button, Select, Radio } from 'antd';

import type { Currency } from '@lib/currencies/currencies';
import { currencies } from '@lib/currencies/currencies';

import * as S from './OrgSetup.styles';
import { getCurrencySymbol } from 'utils/currency';

export type OrgSetupFields = {
  orgName: string;
  numberOfClientAccounts: number;
  currency: string;
};

type Props = {
  onSubmit: (values: unknown) => void;
  isLoading?: boolean;
};

export function OrgSetupForm({ onSubmit, isLoading }: Props) {
  const [form] = Form.useForm<OrgSetupFields>();

  return (
    <S.Wrapper>
      <S.OrgSetupForm
        form={form}
        name='orgAccount'
        layout='vertical'
        onFinish={onSubmit}
        initialValues={{ currency: 'USD' }}
      >
        <Form.Item
          label='Organization name'
          name='orgName'
          rules={[
            {
              required: true,
              message: 'Please input your organization name!'
            }
          ]}
        >
          <Input autoFocus placeholder='Organization name' />
        </Form.Item>

        <Form.Item label='Number of client accounts' name='numberOfClientAccounts'>
          <Select placeholder='Select the number of client accounts'>
            <Select.Option value='1'>1</Select.Option>
            <Select.Option value='2'>2</Select.Option>
            <Select.Option value='3'>3</Select.Option>
            <Select.Option value='4'>4</Select.Option>
            <Select.Option value='5+'>5+</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label='Currency Display' name='currency'>
          <Select placeholder='Select your currency'>
            {currencies.map((currency: Currency) => (
              <Select.Option key={currency.abbreviation} value={currency.abbreviation}>
                {currency.currency} ({getCurrencySymbol(currency.abbreviation)})
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label='Measurements Display' name='useMetricSystem'>
          <Radio.Group>
            <Radio value={false}>Standard</Radio>
            <Radio value={true}>Metric</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item>
          <Button type='primary' htmlType='submit' block loading={isLoading}>
            Create Organization <RightOutlined />
          </Button>
        </Form.Item>
      </S.OrgSetupForm>
    </S.Wrapper>
  );
}
