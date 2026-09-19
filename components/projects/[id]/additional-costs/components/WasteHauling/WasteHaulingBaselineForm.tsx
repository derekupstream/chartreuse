import { Alert, Button, Form, Input, RadioChangeEvent, Row, Tooltip } from 'antd';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import styled from 'styled-components';

import CurrencySymbol from 'components/_app/CurrencySymbol';
import { CANADIAN_TIPPING_FEE_RANGE, getTippingFeesForRegion } from 'lib/calculator/constants/canadian-reference';
import { isCanadianRegion } from 'lib/calculator/constants/utilities';
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
  /** The project's state or province — Canadian provinces get local disposal-fee guidance. */
  region?: string | null;
};

const WasteHaulingFormDrawer: React.FC<Props> = ({ input, onClose, region }) => {
  const [form] = Form.useForm<WasteHaulingService>();
  const localTippingFees = getTippingFeesForRegion(region);
  const showCanadianGuidance = !!region && isCanadianRegion(region);

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
      {showCanadianGuidance && (
        <Alert
          style={{ marginBottom: 16 }}
          type='info'
          showIcon
          message={`Disposal cost reference for ${region}`}
          description={
            <>
              {localTippingFees.length > 0 ? (
                <>
                  Published 2026 landfill fees near you:{' '}
                  {localTippingFees
                    .map(fee => `${fee.city} C$${fee.garbagePerTonne}/tonne${fee.note ? ` (${fee.note})` : ''}`)
                    .join(', ')}
                  .{' '}
                </>
              ) : (
                <>
                  Landfill fees at major Canadian city facilities run about C${CANADIAN_TIPPING_FEE_RANGE.low}–
                  {CANADIAN_TIPPING_FEE_RANGE.high} per tonne (2026 municipal schedules).{' '}
                </>
              )}
              Your monthly bill also depends on bin size and pickup frequency — check your hauler&apos;s invoice for the
              exact amount.
            </>
          }
        />
      )}
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
