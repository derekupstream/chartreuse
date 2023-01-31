import type { Project } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { Button, Input, Typography, Slider, message } from 'antd';
import { Form, Select } from 'antd';
import type { Store } from 'antd/lib/form/interface';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import styled from 'styled-components';

import * as S from 'components/calculator/styles';
import type { DashboardUser } from 'components/dashboard';
import type { ProjectInput } from 'lib/chartreuseClient';
import chartreuseClient from 'lib/chartreuseClient';
import { POST, PUT } from 'lib/http';

import { useFooterState } from '../footer';

const Wrapper = styled(S.Wrapper)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

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
const dishwashingTypes = ['Mechanized Dishwasher (owned)', 'Mechanized Dishwasher (leased)', 'Wash by hand (3 sink system)', 'Combination'];

export type ProjectMetadata = {
  type: (typeof ProjectTypes)[number];
  customers: string;
  dineInVsTakeOut: number;
  whereIsFoodPrepared: (typeof WhereFoodIsPrepared)[number];
};

export default function SetupPage({ user, project }: { user: DashboardUser; project?: Project }) {
  const router = useRouter();

  async function saveProject({ name, accountId, ...metadata }: Store) {
    const params: ProjectInput = {
      id: project?.id,
      name,
      metadata,
      accountId,
      // @ts-ignore
      orgId: user.org.id
    };

    const req = project ? chartreuseClient.updateProject(params) : chartreuseClient.createProject(params);

    req
      .then(res => {
        router.push(`/projects/${res.project.id}/single-use-items`);
      })
      .catch(err => {
        message.error((err as Error)?.message);
      });
  }

  const { setFooterState } = useFooterState();
  useEffect(() => {
    setFooterState({ path: '/setup', stepCompleted: true });
  }, [setFooterState]);

  return (
    <Wrapper>
      <Typography.Title level={1}>Setup your project</Typography.Title>
      <S.SetupForm
        layout='vertical'
        initialValues={{
          accountId: user.org.accounts[0].id,
          customers: 0,
          dineInVsTakeOut: 0,
          ...(project || {}),
          ...((project?.metadata as any) || {})
        }}
        onFinish={saveProject as any}
      >
        <Form.Item
          label='Project Name'
          name='name'
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
            {user.org.accounts.map(account => {
              return (
                <Select.Option key={account.id} value={account.id}>
                  {account.name}
                </Select.Option>
              );
            })}
          </Select>
        </Form.Item>

        <Form.Item label='On average, how many customers do you serve daily?' name='customers'>
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
          />
        </Form.Item>

        <Form.Item label='What percent of your daily volume is dine-in vs. take-out?' name='dineInVsTakeOut'>
          <Slider
            marks={{
              0: 'Dine-in',
              100: { style: { width: '100px' }, label: 'Take-out' }
            }}
          />
        </Form.Item>

        <Form.Item label='Where is the food primarily prepared?' name='whereIsFoodPrepared'>
          <S.RadioGroup
            style={{ width: '100%' }}
            options={WhereFoodIsPrepared.map(wfp => ({
              label: wfp,
              value: wfp
            }))}
            optionType='button'
          />
        </Form.Item>

        <Form.Item label='What type of dishwashing capacity best describes your operation?' name='dishwashingType'>
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
          <Button type='primary' htmlType='submit' block>
            {project ? 'Update Project' : 'Add project'}
          </Button>
        </Form.Item>
      </S.SetupForm>
    </Wrapper>
  );
}
