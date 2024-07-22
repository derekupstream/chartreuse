import type { Dishwasher } from '@prisma/client';
import type { RadioChangeEvent } from 'antd';
import { Button, Form, Input } from 'antd';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useState } from 'react';
import styled from 'styled-components';

import { DISHWASHER_TYPES, FUEL_TYPES, TEMPERATURES } from 'lib/calculator/constants/dishwashers';
import { requiredRule } from 'utils/forms';

import { OptionSelection } from '../../styles';

const typeOptions = DISHWASHER_TYPES.map(t => ({ label: t.name, value: t.name }));
const temperaturesOptions = TEMPERATURES.map((t, i) => ({ label: t.name, value: t.name }));
const fuelTypeOptions = FUEL_TYPES.map(t => ({ label: t.name, value: t.name }));
const yesOrNoOptions = [
  { label: 'No', value: 0 },
  { label: 'Yes', value: 1 }
];

export type DishwasherData = Omit<Dishwasher, 'newOperatingDays' | 'newRacksPerDay'>;

type FormValues = Omit<DishwasherData, 'energyStarCertified'> & { energyStarCertified: 0 | 1 };

type Props = {
  input: DishwasherData | null;
  onSubmit(values: DishwasherData): void;
};

const DishwashingFormDrawer: React.FC<Props> = ({ input, onSubmit }) => {
  const [form] = Form.useForm<FormValues>();
  const [isWaterHeaterFuelVisible, setIsWaterHeaterFuelVisible] = useState(false);

  const route = useRouter();
  const projectId = route.query.id as string;

  const handleSubmit = () => {
    const { racksPerDay, energyStarCertified, operatingDays, ...formFields } = form.getFieldsValue();

    const values: DishwasherData = {
      ...formFields,
      projectId,
      racksPerDay: Number(racksPerDay),
      energyStarCertified: Boolean(energyStarCertified),
      operatingDays: Number(operatingDays)
    };
    onSubmit(values);
  };

  const onChangeTemperature = (event: RadioChangeEvent) => {
    const isVisible = event.target.value === 'High';
    setIsWaterHeaterFuelVisible(isVisible);
    if (!isVisible) {
      form.setFieldsValue({ boosterWaterHeaterFuelType: '' });
    }
  };

  useEffect(() => {
    if (input) {
      form.setFieldsValue({
        ...input,
        energyStarCertified: input.energyStarCertified ? 1 : 0
      });
    }
  }, [input]);

  return (
    <Form form={form} layout='vertical' onFinish={handleSubmit} style={{ paddingBottom: '24px' }}>
      <FormItem hidden name='id'>
        <Input type='hidden' value={input?.id} />
      </FormItem>
      <FormItem label='Dishwasher type' name='type' rules={requiredRule}>
        <OptionSelection options={typeOptions} optionType='button' />
      </FormItem>
      <FormItem label='Temperature' name='temperature' rules={requiredRule}>
        <OptionSelection options={temperaturesOptions} onChange={onChangeTemperature} optionType='button' />
      </FormItem>
      {isWaterHeaterFuelVisible && (
        <FormItem label='Booster Water Heater Fuel Type' name='boosterWaterHeaterFuelType' rules={requiredRule}>
          <OptionSelection options={fuelTypeOptions} optionType='button' />
        </FormItem>
      )}
      <FormItem label='Energy star certification' name='energyStarCertified' rules={requiredRule}>
        <OptionSelection options={yesOrNoOptions} optionType='button' />
      </FormItem>
      <FormItem label='Building water heater fuel type' name='buildingWaterHeaterFuelType' rules={requiredRule}>
        <OptionSelection options={fuelTypeOptions} optionType='button' />
      </FormItem>
      <FormItem label='Dish machine operating days per year' name='operatingDays'>
        <Input type='number' />
      </FormItem>
      <FormItem label='Current racks/per day for reusables' name='racksPerDay'>
        <Input type='number' />
      </FormItem>
      <Button htmlType='submit' size='large' type='primary' style={{ float: 'right' }}>
        Next: Forecast
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

export default DishwashingFormDrawer;
