import { Button, Form, Input, RadioChangeEvent, Row } from 'antd';
import { useEffect } from 'react';
import styled from 'styled-components';

import type { WasteHaulingService } from 'lib/inventory/types/projects';
import { requiredRule } from 'utils/forms';

const categoryOptions = ['Garbage', 'Recycling', 'Organics', 'Additional Changes'].map((c, i) => ({
  value: i.toString(),
  label: c
}));
const serviceTypeOptions = ['Cart', 'Bin', 'Rolloff bin', 'Additional charges'].map(c => ({ value: c, label: c }));

type Props = {
  input?: WasteHaulingService | null;
  onClose(monthlyCost: number): void;
};
type FormValues = {
  monthlyCost: number;
};

const WasteHaulingSecondFormDrawer: React.FC<Props> = ({ input, onClose }) => {
  const [form] = Form.useForm<FormValues>();

  const handleSubmit = () => {
    const { monthlyCost } = form.getFieldsValue();
    onClose(Number(monthlyCost));
  };

  useEffect(() => {
    if (input) {
      form.setFieldsValue({ monthlyCost: input.newMonthlyCost });
    }
  }, [input]);

  return (
    <Form form={form} layout='vertical' onFinish={handleSubmit} style={{ paddingBottom: '24px' }}>
      <FormItem label='Forecasted Monthly cost' name='monthlyCost' rules={requiredRule}>
        <Input type='number' prefix='$' />
      </FormItem>
      <Button htmlType='submit' size='large' type='primary' style={{ float: 'right' }}>
        {input?.id ? 'Update' : 'Add'} forecast
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

export default WasteHaulingSecondFormDrawer;
