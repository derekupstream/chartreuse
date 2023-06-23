import { Divider, Form, Input, Button, Checkbox } from 'antd';
import { useEffect } from 'react';

import { useAuth } from 'hooks/useAuth';

import * as S from './trial-setup.styles';

type Props = {
  onSubmit: (values: unknown) => void;
  isLoading?: boolean;
};

export type TrialSetupFields = {
  title: string;
  email: string;
  name: string;
  phone: string;
};

export function TrialSetupForm({ onSubmit, isLoading }: Props) {
  const { firebaseUser } = useAuth();
  const [form] = Form.useForm<TrialSetupFields>();

  useEffect(() => {
    form.setFieldsValue({
      email: firebaseUser?.email || ''
    });
    if (firebaseUser?.displayName) {
      form.setFieldsValue({
        name: firebaseUser.displayName
      });
    }
    // if (!firebaseUser?.email) {
    //   message.error('There was an error, please refresh your page and try again.');
    //   return;
    // }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser]);

  return (
    <S.Wrapper>
      <S.OrgSetupForm form={form} name='orgAccount' layout='vertical' onFinish={onSubmit}>
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
          <Input autoFocus placeholder='Your name' />
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
            Start trial
          </Button>
        </Form.Item>

        <Form.Item
          rules={[
            {
              required: true,
              transform: value => value || undefined, // Those two lines
              type: 'boolean', // Do the magic
              message: 'Please agree the terms and conditions.'
            }
          ]}
          name='terms'
          valuePropName='checked'
          style={{ textAlign: 'left' }}
        >
          <Checkbox style={{ fontSize: 13 }}>
            I have read and agree to the{' '}
            <a href='https://www.chartreuse.eco/chart-reuse-license-agreement' target='_blank'>
              Software License Agreement
            </a>
            .
          </Checkbox>
        </Form.Item>
      </S.OrgSetupForm>
    </S.Wrapper>
  );
}
