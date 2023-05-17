import type { Project } from '@prisma/client';
import { Input, Typography, Slider } from 'antd';
import { InputNumber, Form, Select } from 'antd';
import { Button, Radio } from 'antd';
import type { Store } from 'antd/lib/form/interface';
import { useState } from 'react';

import type { DashboardUser } from 'components/dashboard';
import { STATES } from 'lib/calculator/constants/utilities';
import type { ProjectInput } from 'lib/chartreuseClient';

import currencyOptions from '../../components/currencyList';
import * as S from '../../styles';

// component and config for currency select is from the example at https://codesandbox.io/s/currency-wrapper-antd-input-3ynzo?file=/src/index.js
// referenced at https://ant.design/components/input-number
const locale = 'en-us';

const USDollarOption = currencyOptions[0];

const currencyFormatter =
  (selectedCurrOpt: string) =>
  (value = 0) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: selectedCurrOpt
    }).format(value);
  };

const currencyParser = (val = ''): number => {
  try {
    // for when the input gets clears
    if (typeof val === 'string' && !val.length) {
      val = '0.0';
    }

    // detecting and parsing between comma and dot
    const group = new Intl.NumberFormat(locale).format(1111).replace(/1/g, '');
    const decimal = new Intl.NumberFormat(locale).format(1.1).replace(/1/g, '');
    let reversedVal = val.replace(new RegExp('\\' + group, 'g'), '');
    reversedVal = reversedVal.replace(new RegExp('\\' + decimal, 'g'), '.');
    //  => 1232.21 €

    // removing everything except the digits and dot
    reversedVal = reversedVal.replace(/[^0-9.]/g, '');
    //  => 1232.21

    // appending digits properly
    const digitsAfterDecimalCount = (reversedVal.split('.')[1] || []).length;
    const needsDigitsAppended = digitsAfterDecimalCount > 2;

    let result = parseFloat(reversedVal);
    if (needsDigitsAppended) {
      // Note: Javascript returns a number when multiplying a string by a number, but TS does not understand this
      result = (reversedVal as unknown as number) * Math.pow(10, digitsAfterDecimalCount - 2);
    }

    return Number.isNaN(result) ? 0 : result;
  } catch (error) {
    console.error(error);
    return 0;
  }
};

const ProjectTypes = [
  'Cafe/Cafeteria',
  'Kitchenette/Employee Breakroom',
  'Event Catering',
  'Special Event (Venue)',
  'Coffee Shop',
  'Fast Casual Restaurant',
  'Food Hall Stand',
  'Live Events',
  'Other'
] as const;

const WhereFoodIsPrepared = ['On-Site', 'Off-Site', 'Both'] as const;
const dishwashingTypes = [
  'Mechanized Dishwasher (owned)',
  'Mechanized Dishwasher (leased)',
  'Wash by hand (3 sink system)',
  'Combination'
];

export type ProjectMetadata = {
  type: (typeof ProjectTypes)[number];
  customers: string;
  dineInVsTakeOut: number;
  whereIsFoodPrepared: (typeof WhereFoodIsPrepared)[number];
};

type Props = { org: DashboardUser['org']; project?: Project; onComplete: (values: ProjectInput) => void };

export function ProjectForm({ org, project, onComplete }: Props) {
  // disable save button if there are no updates or there are errors
  const [form] = Form.useForm();
  const [disabledSave, setDisabledSave] = useState(true);
  function handleFormChange() {
    const hasErrors = form.getFieldsError().some(({ errors }) => errors.length);
    setDisabledSave(hasErrors);
  }

  const [showCustomUtilities, setShowCustomUtilities] = useState(project ? !project?.USState : false);

  function toggleCustomUtilities(value: boolean) {
    setShowCustomUtilities(value);
  }

  async function saveProject({
    name,
    accountId,
    currency = null,
    USState = null,
    utilityRates = null,
    ...metadata
  }: Store) {
    const params: ProjectInput = {
      id: project?.id,
      name,
      metadata,
      accountId,
      USState,
      currency,
      utilityRates,
      orgId: org.id
    };

    if (showCustomUtilities) {
      params.USState = null;
    } else {
      params.utilityRates = null;
    }

    onComplete(params);
  }

  // make some inputs vertical so that nested layout for custom utilities can be horizontal: https://stackoverflow.com/questions/64451233/how-to-set-the-layout-horizontal-inside-for-few-form-item-while-keeping-for
  const verticalLayout = { labelCol: { span: 24 } };

  return (
    <>
      <div style={{ textAlign: 'center' }}>
        <Typography.Title level={1}>Setup your project</Typography.Title>
      </div>
      <Typography.Title level={4}>Project Info</Typography.Title>
      <Form
        form={form}
        onFieldsChange={handleFormChange}
        layout='horizontal'
        initialValues={{
          accountId: org.accounts[0].id,
          customers: 0,
          dineInVsTakeOut: 0,
          currency: USDollarOption.value,
          ...((project?.metadata as any) || {}),
          ...(project || {})
        }}
        onFinish={saveProject as any}
      >
        <Form.Item
          {...verticalLayout}
          label='Project Name'
          name='name'
          labelCol={{ span: 24 }}
          rules={[
            {
              required: true,
              message: 'Name is required!'
            }
          ]}
        >
          <Input placeholder='Project Name' />
        </Form.Item>

        <Form.Item
          {...verticalLayout}
          label='Project Type'
          name='type'
          rules={[
            {
              required: true,
              message: 'Type is required!'
            }
          ]}
        >
          <Select placeholder='Project Type'>
            {ProjectTypes.map(type => {
              return (
                <Select.Option key={type} value={type}>
                  {type}
                </Select.Option>
              );
            })}
          </Select>
        </Form.Item>

        <Form.Item
          {...verticalLayout}
          label='Account'
          name='accountId'
          rules={[
            {
              required: true,
              message: 'Account is required!'
            }
          ]}
        >
          <Select placeholder='Account to create project on'>
            {org.accounts.map(account => {
              return (
                <Select.Option key={account.id} value={account.id}>
                  {account.name}
                </Select.Option>
              );
            })}
          </Select>
        </Form.Item>

        <Form.Item
          label='Utility Rates'
          required
          {...verticalLayout}
          style={{
            marginBottom: '0'
          }}
        >
          <Radio.Group
            style={{ width: '100%' }}
            onChange={e => toggleCustomUtilities(e.target.value)}
            value={showCustomUtilities}
          >
            <Radio style={{ width: '40%' }} value={false}>
              Select by US State
            </Radio>
            <Radio value={true}>Enter custom rates</Radio>
          </Radio.Group>
          <br />
          <br />
          {!showCustomUtilities && (
            <Form.Item label='' name='USState'>
              <Select showSearch style={{ width: '100%' }} placeholder='Select a state'>
                {STATES.map(state => (
                  <Select.Option key={state.name} value={state.name}>
                    {state.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}
          {showCustomUtilities && (
            <>
              {/* <Form.Item label='Currency' name='currency' labelCol={{ span: 6 }}>
                <Select showSearch style={{ width: 120 }}>
                  {currencyOptions.map(opt => (
                    <Select.Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item> */}
              <Form.Item label='Electric' name={['utilityRates', 'electric']} labelCol={{ span: 5 }}>
                <InputNumber
                  min={0}
                  precision={2}
                  step={0.1}
                  formatter={currencyFormatter(USDollarOption.value)}
                  parser={currencyParser}
                />
              </Form.Item>
              <Form.Item label='Gas' name={['utilityRates', 'gas']} labelCol={{ span: 5 }}>
                <InputNumber
                  min={0}
                  precision={2}
                  step={0.1}
                  formatter={currencyFormatter(USDollarOption.value)}
                  parser={currencyParser}
                />
              </Form.Item>
              <Form.Item label='Water' name={['utilityRates', 'water']} labelCol={{ span: 5 }}>
                <InputNumber
                  min={0}
                  precision={2}
                  step={0.1}
                  formatter={currencyFormatter(USDollarOption.value)}
                  parser={currencyParser}
                />
              </Form.Item>
            </>
          )}
        </Form.Item>

        <Typography.Title level={4}>Traffic patterns</Typography.Title>

        <Form.Item {...verticalLayout} label='On average, how many customers do you serve daily?' name='customers'>
          <Slider
            marks={{
              50: 50,
              250: 250,
              500: 500,
              1000: '1000+'
            }}
            min={50}
            max={1000}
            step={50}
            style={{ marginTop: 0 }}
          />
        </Form.Item>

        <Form.Item
          {...verticalLayout}
          label='What percent of your daily volume is dine-in vs. take-out?'
          name='dineInVsTakeOut'
        >
          <Slider
            marks={{
              0: 'Dine-in',
              100: { style: { width: '100px' }, label: 'Take-out' }
            }}
            style={{ marginTop: 0 }}
          />
        </Form.Item>

        <Form.Item {...verticalLayout} label='Where is the food primarily prepared?' name='whereIsFoodPrepared'>
          <S.RadioGroup
            style={{ width: '100%' }}
            options={WhereFoodIsPrepared.map(wfp => ({
              label: wfp,
              value: wfp
            }))}
            optionType='button'
          />
        </Form.Item>

        <Typography.Title level={4}>Dishwashing</Typography.Title>

        <Form.Item
          {...verticalLayout}
          label='What type of dishwashing capacity best describes your operation?'
          name='dishwashingType'
        >
          <Select placeholder='Select dishwashing type'>
            {dishwashingTypes.map(type => {
              return (
                <Select.Option key={type} value={type}>
                  {type}
                </Select.Option>
              );
            })}
          </Select>
        </Form.Item>

        <Form.Item>
          <Button disabled={disabledSave} type='primary' htmlType='submit' block>
            {project ? 'Update Project' : 'Add project'}
          </Button>
        </Form.Item>
      </Form>
    </>
  );
}
