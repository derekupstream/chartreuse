import type { Project, ProjectCategory } from '@prisma/client';
import { DeleteOutlined, AppstoreOutlined, CalendarOutlined, FundProjectionScreenOutlined } from '@ant-design/icons';
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
  Space,
  Alert,
  Card,
  Tag,
  Modal,
  Tooltip,
  DatePicker
} from 'antd';
import dayjs from 'dayjs';
import Image from 'next/image';
import type { Dayjs } from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import localeData from 'dayjs/plugin/localeData';
import 'dayjs/locale/en';
import ProjectionIcon from 'public/images/Projection_icon.png';
import ActualsIcon from 'public/images/Actuals_icon.png';
// Extend dayjs with required plugins for Ant Design DatePicker
dayjs.extend(weekday);
dayjs.extend(localeData);
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
import { useTags } from 'hooks/useTags';

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
  const { confirm } = Modal;

  const isUpstream = org.isUpstream || process.env.NODE_ENV === 'development';

  const currentLocation = project?.location as ProjectInput['location'] | null;
  const projectMetadata = (project?.metadata as any) || {};
  const initialDateType = project?.dateType as 'date' | 'dateRange' | null | undefined;
  const [dateType, setDateType] = useState<'date' | 'dateRange' | null>(initialDateType || null);
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory | undefined>(project?.category);

  const initialValues = {
    accountId: org.accounts[0].id,
    customers: 0,
    dineInVsTakeOut: 0,
    // category: 'default',
    currency: currencyAbbreviation,
    projectType: projectMetadata?.type,
    ...projectMetadata,
    ...(project || {}),
    projectLocation: currentLocation?.formatted,
    projectCity: currentLocation?.city,
    projectState: currentLocation?.state,
    projectCountry: currentLocation?.country,
    projectLatitude: currentLocation?.latitude,
    projectLongitude: currentLocation?.longitude,
    dateType: project?.dateType || null,
    startDate: project?.startDate
      ? dayjs(project.startDate instanceof Date ? project.startDate : new Date(project.startDate as string))
      : null,
    endDate: project?.endDate
      ? dayjs(project.endDate instanceof Date ? project.endDate : new Date(project.endDate as string))
      : null
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
      if (STATES.some(state => state.name === locationData.state)) {
        form.setFieldValue('USState', locationData.state);
      }
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
    tagIds,
    dateType,
    startDate,
    endDate,
    // category,
    ...metadata
  }: Store) {
    const params = {
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
      tagIds,
      USState,
      currency,
      utilityRates,
      isTemplate,
      templateDescription,
      orgId: org.id,
      // use selected category
      category: selectedCategory,
      // date fields for event projects - only include if Event category, otherwise set to null to clear
      dateType: selectedCategory === 'event' ? dateType || null : null,
      startDate: selectedCategory === 'event' && startDate ? (startDate as Dayjs).format('YYYY-MM-DD') : null,
      endDate:
        selectedCategory === 'event' && dateType === 'dateRange' && endDate
          ? (endDate as Dayjs).format('YYYY-MM-DD')
          : null
    };

    if (showCustomUtilities) {
      params.USState = null;
    } else {
      params.utilityRates = null;
    }

    onComplete(params as ProjectInput);
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

  const { tags, loading, createTag, deleteTag } = useTags(org.id);
  if (org.accounts.length === 0) {
    return <Alert message='You need to create an account before you can create a project' type='error' showIcon />;
  }

  return (
    <>
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

      <div style={{ textAlign: 'center' }}>
        <Typography.Title level={1}>{project ? 'Edit' : 'Set up'} your project</Typography.Title>
      </div>
      <Form
        form={form}
        onFieldsChange={handleFormChange}
        layout='horizontal'
        initialValues={initialValues}
        onFinish={saveProject as any}
      >
        <Typography.Title level={4}>Project Type</Typography.Title>
        <Form.Item {...verticalLayout} label='' required>
          <Space direction='vertical' size='large' style={{ width: '100%', marginTop: '15px' }}>
            <Card
              hoverable
              onClick={() => {
                setSelectedCategory('event');
                // Reset date fields when switching away from event
                if (selectedCategory === 'default') {
                  setDateType('date');
                  form.setFieldsValue({ dateType: 'date' });
                }
              }}
              style={{
                flex: 1,
                border: selectedCategory === 'event' ? '2px solid #000' : '1px solid #d9d9d9',
                cursor: 'pointer'
              }}
              bodyStyle={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '30px' }}
            >
              <Image src={ActualsIcon} alt='Actuals' objectFit='contain' width={60} height={60} />
              <div style={{ flex: 1 }}>
                <Typography.Title level={4} style={{ margin: 0, marginBottom: '8px' }}>
                  Actuals
                </Typography.Title>
                <Typography.Text type='secondary'>Real-world environmental and economic impact</Typography.Text>
              </div>
            </Card>
            <Card
              hoverable
              onClick={() => {
                setSelectedCategory('default');
                // Reset date fields when switching away from event
                if (selectedCategory === 'event') {
                  setDateType(null);
                  form.setFieldsValue({ dateType: null, startDate: null, endDate: null });
                }
              }}
              style={{
                flex: 1,
                border: selectedCategory === 'default' ? '2px solid #000' : '1px solid #d9d9d9',
                cursor: 'pointer'
              }}
              bodyStyle={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '30px' }}
            >
              <Image src={ProjectionIcon} alt='Projections' objectFit='contain' width={60} height={60} />
              {/* <FundProjectionScreenOutlined style={{ fontSize: '32px', color: '#1890ff' }} /> */}
              <div style={{ flex: 1 }}>
                <Typography.Title level={4} style={{ margin: 0, marginBottom: '8px' }}>
                  Projections
                </Typography.Title>
                <Typography.Text type='secondary'>Projected environmental and economic impact</Typography.Text>
              </div>
            </Card>
          </Space>
        </Form.Item>

        {selectedCategory && (
          <>
            <Typography.Title level={4}>Project Info</Typography.Title>
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

            <Form.Item label='Tags' name='tagIds'>
              <Select
                mode='tags'
                style={{ width: '100%' }}
                placeholder='Add a tag'
                loading={loading}
                optionRender={option => {
                  return (
                    <Space
                      key={option.value}
                      style={{ display: 'flex', width: '270px', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <div
                        style={{
                          maxWidth: '200px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {option.label}
                      </div>
                      <Tooltip title='Delete tag'>
                        <DeleteOutlined
                          type='close'
                          onClick={e => {
                            e.stopPropagation();
                            confirm({
                              title: 'Are you sure you want to delete this tag?',
                              onOk: async () => {
                                await deleteTag(option.value as string);
                                form.setFieldValue(
                                  'tagIds',
                                  form.getFieldValue('tagIds').filter((t: string) => t !== option.value)
                                );
                              }
                            });
                          }}
                        />
                      </Tooltip>
                    </Space>
                  );
                }}
                options={tags.map(tag => ({ label: tag.label, value: tag.id }))}
                onChange={async (value: string[]) => {
                  const newTag = value.find((tag: string) => !tags.some(t => t.id === tag));
                  if (newTag) {
                    const newTagResult = await createTag(newTag);
                    if (newTagResult) {
                      const validTags = value.filter((tag: string) => tag !== newTag);
                      form.setFieldValue('tagIds', [...validTags, newTagResult.id]);
                    }
                  }
                }}
              />
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
            {/* Date fields for Event projects */}
            {selectedCategory === 'event' && (
              <>
                <Form.Item {...verticalLayout} label='Date Type' name='dateType'>
                  <Radio.Group
                    onChange={e => {
                      setDateType(e.target.value);
                      // Clear endDate when switching to single date
                      if (e.target.value === 'date') {
                        form.setFieldsValue({ endDate: null });
                      }
                    }}
                    value={dateType}
                  >
                    <Radio value='date'>Date</Radio>
                    <Radio value='dateRange'>Date Range</Radio>
                  </Radio.Group>
                </Form.Item>

                {dateType && (
                  <>
                    <Form.Item
                      {...verticalLayout}
                      label={dateType === 'dateRange' ? 'Start Date' : 'Date'}
                      name='startDate'
                      rules={[
                        {
                          required: true,
                          message: 'Date is required!'
                        }
                      ]}
                    >
                      <DatePicker style={{ width: '100%' }} />
                    </Form.Item>

                    {dateType === 'dateRange' && (
                      <Form.Item
                        {...verticalLayout}
                        label='End Date'
                        name='endDate'
                        rules={[
                          {
                            validator: (_rule, value) => {
                              if (!value) {
                                return Promise.resolve();
                              }
                              const startDate = form.getFieldValue('startDate');
                              if (!startDate) {
                                return Promise.resolve();
                              }
                              if (dayjs(value).isBefore(dayjs(startDate), 'day')) {
                                return Promise.reject(new Error('End date must be after start date'));
                              }
                              return Promise.resolve();
                            }
                          }
                        ]}
                        dependencies={['startDate']}
                      >
                        <DatePicker style={{ width: '100%' }} />
                      </Form.Item>
                    )}
                  </>
                )}
              </>
            )}

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
          </>
        )}
      </Form>
    </>
  );
}
