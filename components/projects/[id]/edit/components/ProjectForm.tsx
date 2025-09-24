import type { Project } from '@prisma/client';
import {
  Button,
  InputNumber,
  Form,
  Select,
  Radio,
  InputRef,
  Checkbox,
  Input,
  Typography,
  Slider,
  Alert,
  Card
} from 'antd';
import type { Store } from 'antd/lib/form/interface';
import { useRef, useEffect, useState } from 'react';

import type { DashboardUser } from 'interfaces';
import { STATES } from 'lib/calculator/constants/utilities';
import type { ProjectInput } from 'lib/chartreuseClient';

import { useMetricSystem } from 'components/_app/MetricSystemProvider';
import { useCurrency } from 'components/_app/CurrencyProvider';
import type { ProjectInventory } from 'lib/inventory/types/projects';
import LocationInput from 'components/common/LocationInput';
import type { LocationData } from 'components/common/LocationInput';

// component and config for currency select is from the example at https://codesandbox.io/s/currency-wrapper-antd-input-3ynzo?file=/src/index.js
// referenced at https://ant.design/components/input-number
const locale = 'en-us';

// Google Maps API key for location input
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

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
    // Handle empty input
    if (typeof val === 'string' && !val.length) {
      return 0;
    }

    // Remove currency symbols and other non-numeric characters except decimal point
    const cleanVal = val.toString().replace(/[^0-9.]/g, '');

    // Parse as float
    const result = parseFloat(cleanVal);

    // Return 0 if NaN, otherwise return the parsed number
    return Number.isNaN(result) ? 0 : result;
  } catch (error) {
    console.error('Error parsing currency value:', error);
    return 0;
  }
};

const projectTypes = [
  'Cafe/Cafeteria',
  'Kitchenette/Employee Breakroom',
  'Event',
  'Coffee Shop',
  'Fast Casual Restaurant',
  'Food Hall Stand',
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
  type: (typeof projectTypes)[number];
  customers: string;
  dineInVsTakeOut: number;
  whereIsFoodPrepared: (typeof WhereFoodIsPrepared)[number];
};

type Props = {
  actionLabel: string;
  org: DashboardUser['org'];
  project?: Project;
  template?: Pick<Project, 'name'>;
  onComplete: (values: ProjectInput) => void;
};

export function ProjectForm({ actionLabel, org, project, template, onComplete }: Props) {
  // disable save button if there are no updates or there are errors
  const [form] = Form.useForm();
  const { abbreviation: currencyAbbreviation } = useCurrency();
  const autofocusRef = useRef<InputRef>(null);
  const [disabledSave, setDisabledSave] = useState(false);
  const displayAsMetric = useMetricSystem();
  function handleFormChange(changedFields: any[], allFields: any[]) {
    const hasErrors = form.getFieldsError().some(({ errors }) => errors.length);
    // Enable save button when there are no errors
    setDisabledSave(hasErrors);
  }

  const [showCustomUtilities, setShowCustomUtilities] = useState(project ? !project?.USState : false);

  const isUpstream = org.isUpstream || process.env.NODE_ENV === 'development';

  const currentLocation = project?.location as ProjectInput['location'] | null;
  const initialValues = {
    accountId: org.accounts[0].id,
    customers: 0,
    dineInVsTakeOut: 0,
    category: 'default',
    currency: currencyAbbreviation,
    ...((project?.metadata as any) || {}),
    ...(project || {}),
    projectLocation: currentLocation?.formatted,
    projectCity: currentLocation?.city,
    projectState: currentLocation?.state,
    projectCountry: currentLocation?.country,
    projectLatitude: currentLocation?.latitude,
    projectLongitude: currentLocation?.longitude
  };

  function toggleCustomUtilities(value: boolean) {
    setShowCustomUtilities(value);
  }

  // Handle location selection
  const handleLocationSelect = (locationData: LocationData) => {
    // Update form with structured location data
    form.setFieldsValue({
      projectLocation: locationData.formatted_address,
      projectCity: locationData.city,
      projectState: locationData.state,
      projectCountry: locationData.country,
      projectLatitude: locationData.latitude,
      projectLongitude: locationData.longitude
    });
    const USState = form.getFieldValue('USState');
    if (!USState && !showCustomUtilities) {
      form.setFieldValue('USState', locationData.state_short);
    }
  };

  async function saveProject({
    name,
    accountId,
    currency = null,
    USState = null,
    utilityRates = null,
    isTemplate,
    templateDescription,
    projectLocation,
    projectCity,
    projectState,
    projectCountry,
    projectLatitude,
    projectLongitude,
    // category,
    ...metadata
  }: Store) {
    const params: ProjectInput = {
      id: project?.id,
      name,
      metadata,
      location: {
        formatted: projectLocation,
        city: projectCity,
        state: projectState,
        country: projectCountry,
        latitude: projectLatitude,
        longitude: projectLongitude
      },
      accountId,
      USState,
      currency,
      utilityRates,
      isTemplate,
      templateDescription,
      orgId: org.id,
      // project type determines category
      category: metadata.type === 'Event' ? 'event' : 'default'
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

  useEffect(() => {
    if (autofocusRef.current && !project?.name) {
      autofocusRef.current.focus();
    }
  }, [autofocusRef]);

  // Initialize disabled state based on form validity
  useEffect(() => {
    const hasErrors = form.getFieldsError().some(({ errors }) => errors.length);
    setDisabledSave(hasErrors);
  }, [form]);

  if (org.accounts.length === 0) {
    return <Alert message='You need to create an account before you can create a project' type='error' showIcon />;
  }

  return (
    <>
      <div style={{ textAlign: 'center' }}>
        <Typography.Title level={1}>{project ? 'Edit' : 'Setup'} your project</Typography.Title>
      </div>
      {/* <Alert message={`Using the template "${template?.name}"`} /> */}
      {template && (
        <>
          <Typography.Title level={4}>Template being used</Typography.Title>
          <Typography.Paragraph>{template?.name}</Typography.Paragraph>
        </>
      )}
      {/* <Form.Item>
        <Input value={template?.name} style={{ pointerEvents: 'none' }} />
      </Form.Item> */}
      <Typography.Title level={4}>Project Info</Typography.Title>
      <Form
        form={form}
        onFieldsChange={handleFormChange}
        layout='horizontal'
        initialValues={initialValues}
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
          <Input ref={autofocusRef} placeholder={project?.name || 'Project Name'} />
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
          <Select placeholder='Project Type' disabled={!!template}>
            {projectTypes.map(type => {
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

        {/* Location Input */}
        {GOOGLE_MAPS_API_KEY && (
          <LocationInput
            apiKey={GOOGLE_MAPS_API_KEY}
            name='projectLocation'
            label='Project Location'
            placeholder='Enter city, state, country...'
            onLocationSelect={handleLocationSelect}
            showAddressBreakdown={false}
            types={['(cities)']}
            value={(project?.location as ProjectInput['location'])?.formatted}
          />
        )}

        {/* Hidden fields to store structured location data */}
        <Form.Item name='projectCity' style={{ display: 'none' }}>
          <Input />
        </Form.Item>
        <Form.Item name='projectState' style={{ display: 'none' }}>
          <Input />
        </Form.Item>
        <Form.Item name='projectCountry' style={{ display: 'none' }}>
          <Input />
        </Form.Item>
        <Form.Item name='projectLatitude' style={{ display: 'none' }}>
          <Input />
        </Form.Item>
        <Form.Item name='projectLongitude' style={{ display: 'none' }}>
          <Input />
        </Form.Item>

        <Form.Item
          label='Utility Rates'
          required
          {...verticalLayout}
          labelAlign='left'
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
              By US State
            </Radio>
            <Radio value={true}>Custom</Radio>
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
                  defaultValue={(project?.utilityRates as ProjectInventory['utilityRates'])?.electric}
                  step={0.1}
                  formatter={currencyFormatter(currencyAbbreviation)}
                  parser={currencyParser}
                  style={{ width: '100px' }}
                  onChange={value => {
                    // for some reason the form does not put up changes to this input, so adding an onchange handler for now
                    form.setFieldValue(['utilityRates', 'electric'], value);
                  }}
                />
                <Typography.Text style={{ fontSize: '0.8em' }}> /kWh</Typography.Text>
              </Form.Item>
              <Form.Item label='Gas' name={['utilityRates', 'gas']} labelCol={{ span: 5 }}>
                <InputNumber
                  min={0}
                  precision={2}
                  step={0.1}
                  defaultValue={(project?.utilityRates as ProjectInventory['utilityRates'])?.gas}
                  formatter={currencyFormatter(currencyAbbreviation)}
                  parser={currencyParser}
                  style={{ width: '100px' }}
                  onChange={value => {
                    form.setFieldValue(['utilityRates', 'gas'], value);
                  }}
                />
                <Typography.Text style={{ fontSize: '0.8em' }}> /therm</Typography.Text>
              </Form.Item>
              <Form.Item label='Water' name={['utilityRates', 'water']} labelCol={{ span: 5 }}>
                <InputNumber
                  min={0}
                  precision={2}
                  step={0.1}
                  defaultValue={(project?.utilityRates as ProjectInventory['utilityRates'])?.water}
                  formatter={currencyFormatter(currencyAbbreviation)}
                  parser={currencyParser}
                  style={{ width: '100px' }}
                  onChange={value => {
                    form.setFieldValue(['utilityRates', 'water'], value);
                  }}
                />
                <Typography.Text style={{ fontSize: '0.8em' }}>
                  {' '}
                  /thousand {displayAsMetric ? 'liters' : 'gallons'}
                </Typography.Text>
              </Form.Item>
            </>
          )}
        </Form.Item>

        {isUpstream && !project?.templateId && (
          <Card title='Template settings' style={{ marginBottom: '1em' }}>
            <Form.Item name='isTemplate' valuePropName='checked'>
              <Checkbox>Make template</Checkbox>
            </Form.Item>
            <Form.Item labelCol={{ span: 24 }} label='Template description' name='templateDescription'>
              <Input.TextArea />
            </Form.Item>
          </Card>
        )}

        <Form.Item>
          <Button disabled={disabledSave} type='primary' htmlType='submit' block>
            {actionLabel}
          </Button>
        </Form.Item>
      </Form>
    </>
  );
}
