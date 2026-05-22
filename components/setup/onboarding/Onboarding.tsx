import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Form, Input, Checkbox } from 'antd';
import { useEffect } from 'react';

import { useAuth } from 'hooks/useAuth';

import * as S from './Onboarding.styles';

type Props = {
  onSubmit: (values: unknown) => void;
  isLoading?: boolean;
  onBack?: () => void;
};

export type OnboardingFields = {
  title: string;
  email: string;
  name: string;
  phone: string;
  orgName: string;
  inviteCode?: string;
};

export function OnboardingForm({ onSubmit, isLoading, onBack }: Props) {
  const { firebaseUser } = useAuth();
  const [form] = Form.useForm<OnboardingFields>();

  useEffect(() => {
    form.setFieldsValue({
      email: firebaseUser?.email || ''
    });
    if (firebaseUser?.displayName) {
      form.setFieldsValue({
        name: firebaseUser.displayName
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser]);

  const hideLicenseAgreement = firebaseUser?.email?.includes('@flysfo.com');

  return (
    <S.Wrapper>
      {onBack && (
        <Button type='link' icon={<ArrowLeftOutlined />} onClick={onBack} style={{ marginBottom: 8, paddingLeft: 0 }}>
          Back
        </Button>
      )}

      <S.OrgSetupForm form={form} name='orgAccount' layout='vertical' onFinish={onSubmit}>
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
        <Form.Item
          label='Your name'
          name='name'
          rules={[
            {
              required: true,
              message: 'Please input your name!'
            }
          ]}
        >
          <Input placeholder='Your name' />
        </Form.Item>

        <Form.Item
          label='Your email'
          name='email'
          rules={[
            {
              required: true
            }
          ]}
        >
          <Input disabled type='email' placeholder='billing@acme.org' />
        </Form.Item>

        <Form.Item label='Your job title' name='title'>
          <Input placeholder='Your job title' />
        </Form.Item>

        <Form.Item label='Your contact phone number' name='phone'>
          <Input placeholder='(720) 555-1234' />
        </Form.Item>

        <Form.Item>
          <Button type='primary' htmlType='submit' block loading={isLoading}>
            Get started
          </Button>
        </Form.Item>

        {!hideLicenseAgreement && (
          <Form.Item
            rules={[
              {
                required: true,
                transform: value => value || undefined,
                type: 'boolean',
                message: 'Please agree the terms and conditions.'
              }
            ]}
            name='terms'
            valuePropName='checked'
            style={{ textAlign: 'left' }}
          >
            <Checkbox style={{ fontSize: 13 }}>
              I have read and agree to the{' '}
              <a href='https://www.chart-reuse.eco/chart-reuse-license-agreement' target='_blank'>
                Software License Agreement
              </a>
              .
            </Checkbox>
          </Form.Item>
        )}
      </S.OrgSetupForm>
    </S.Wrapper>
  );
}
