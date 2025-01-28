import { Button, Form, Input, RadioChangeEvent, Row, Tooltip } from 'antd';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import styled from 'styled-components';

import CurrencySymbol from 'components/_app/CurrencySymbol';
import { SERVICE_TYPES, WASTE_STREAMS } from 'lib/calculator/constants/waste-hauling';
import type { WasteHaulingService } from 'lib/inventory/types/projects';
import { requiredRule } from 'utils/forms';

import { OptionSelection } from '../../../styles';

const wasteStreamOptions = WASTE_STREAMS.map(w => ({ value: w, label: w }));
const serviceTypeOptions = SERVICE_TYPES.map(s => ({
  value: s.type,
  label: <Tooltip title={s.description}>{s.type}</Tooltip>
}));

type Props = {
  input: WasteHaulingService | null;
  onClose(values: WasteHaulingService): void;
};

const WasteHaulingFormDrawer: React.FC<Props> = ({ input, onClose }) => {
  const [form] = Form.useForm<WasteHaulingService>();

  const route = useRouter();
  const projectId = route.query.id as string;

  const handleSubmit = () => {
    const { monthlyCost, ...formFields } = form.getFieldsValue();

    const values: WasteHaulingService = {
      ...formFields,
      projectId,
      monthlyCost: Number(monthlyCost)
    };
    onClose(values);
  };

  useEffect(() => {
    if (input) {
      form.setFieldsValue(input);
    }
  }, [input]);

  return (
    <Form form={form} layout='vertical' onFinish={handleSubmit} style={{ paddingBottom: '24px' }}>
      <FormItem label='Waste Stream' name='wasteStream' rules={requiredRule}>
        <OptionSelection options={wasteStreamOptions} optionType='button' />
      </FormItem>
      <FormItem label='Service type' name='serviceType' rules={requiredRule}>
        <OptionSelection options={serviceTypeOptions} optionType='button' />
      </FormItem>
      <FormItem label='Description' name='description' rules={requiredRule}>
        <Input.TextArea rows={4} />
      </FormItem>
      <FormItem label='Monthly cost' name='monthlyCost' rules={requiredRule}>
        <Input type='number' prefix={<CurrencySymbol />} />
      </FormItem>
      <Button htmlType='submit' size='large' type='primary' style={{ float: 'right' }}>
        {input?.id ? 'Update' : 'Add'} expense
      </Button>
    </Form>
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

export default WasteHaulingFormDrawer;
