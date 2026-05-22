import { Card, Form, Input, Button, Checkbox, Typography } from 'antd';
import { useEffect, useState } from 'react';

import { useAuth } from 'hooks/useAuth';
import type { SuggestedOrg } from 'pages/api/orgs/suggest';

import * as S from './Onboarding.styles';

type Props = {
  onSubmit: (values: unknown) => void;
  isLoading?: boolean;
  suggestions?: SuggestedOrg[];
};

export type OnboardingFields = {
  title: string;
  email: string;
  name: string;
  phone: string;
  orgName: string;
  inviteCode?: string;
};

export function OnboardingForm({ onSubmit, isLoading, suggestions = [] }: Props) {
  const { firebaseUser } = useAuth();
  const [form] = Form.useForm<OnboardingFields>();
  const [showInviteCode, setShowInviteCode] = useState(false);

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
      {suggestions.length > 0 && (
        <Card
          size='small'
          style={{ marginBottom: 16, borderColor: '#1677ff', background: '#e6f4ff' }}
          title={
            <span>
              We found {suggestions.length} existing organization{suggestions.length === 1 ? '' : 's'} for your email
            </span>
          }
        >
          <Typography.Paragraph style={{ marginBottom: 12, fontSize: 13 }}>
            If your team is already on Chart-Reuse, you should join an existing org instead of creating a new one.
          </Typography.Paragraph>
          {suggestions.map(s => (
            <div
              key={s.id}
              style={{
                padding: '8px 12px',
                background: '#fff',
                marginBottom: 8,
                border: '1px solid #d6e4ff',
                borderRadius: 4
              }}
            >
              <Typography.Text strong>{s.name}</Typography.Text>{' '}
              <Typography.Text type='secondary' style={{ fontSize: 12 }}>
                ({s.memberCount} member{s.memberCount === 1 ? '' : 's'})
              </Typography.Text>
              {s.adminName && (
                <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.65)' }}>
                  Ask {s.adminName}
                  {s.adminEmail && ` (${s.adminEmail})`} for an invite code.
                </div>
              )}
            </div>
          ))}
          <Button
            type='link'
            size='small'
            onClick={() => setShowInviteCode(v => !v)}
            style={{ padding: 0, marginTop: 4 }}
          >
            {showInviteCode ? 'Hide invite code field' : 'I have an invite code →'}
          </Button>
        </Card>
      )}

      <S.OrgSetupForm form={form} name='orgAccount' layout='vertical' onFinish={onSubmit}>
        {(showInviteCode || suggestions.length === 0) && showInviteCode && (
          <Form.Item
            label='Invite code (optional)'
            name='inviteCode'
            help='If a teammate gave you a code, enter it to join their org instead of creating a new one.'
          >
            <Input placeholder='e.g. A1B2C3D4' style={{ textTransform: 'uppercase' }} />
          </Form.Item>
        )}

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
