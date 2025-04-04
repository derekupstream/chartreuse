import { Form, Input, Button, Select, Radio } from 'antd';
import type { Org } from '@prisma/client';
import type { Currency } from '@lib/currencies/currencies';
import { currencies } from '@lib/currencies/currencies';
import * as S from './styles';

import { getCurrencySymbol } from 'utils/currency';
type Props = {
  onSubmit: (values: unknown) => void;
  isLoading?: boolean;
  initialValues?: Pick<Org, 'name' | 'currency'>;
  onCancel?: () => void;
};

export function OrgEditPage({ onSubmit, isLoading, initialValues, onCancel }: Props) {
  return (
    <S.Wrapper>
      <S.AccountEditForm initialValues={initialValues} name='orgEdit' layout='vertical' onFinish={onSubmit}>
        <Form.Item
          label='Organization name'
          name='name'
          rules={[
            {
              required: true,
              message: 'Please input your organization name!'
            }
          ]}
        >
          <Input autoFocus placeholder='Organization name' />
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
          <S.ActionsSpace>
            {onCancel && (
              <Button block onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type='primary' htmlType='submit' block loading={isLoading}>
              Save
            </Button>
          </S.ActionsSpace>
        </Form.Item>
      </S.AccountEditForm>
    </S.Wrapper>
  );
}
