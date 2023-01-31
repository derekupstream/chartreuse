import { RightOutlined } from '@ant-design/icons';
import { Form, Input, Button, Checkbox } from 'antd';
import type { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { useState, useEffect } from 'react';

import { useAuth } from 'hooks/useAuth';

import * as S from './styles';

type Props = {
  onSubmit: (values: unknown) => void;
  isLoading?: boolean;
};

export default function AccountSetupForm({ onSubmit, isLoading }: Props) {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [useOrgEmail, setUseOrgEmail] = useState<boolean>(true);

  const handleUseOrgEmailChange = (e: CheckboxChangeEvent) => {
    const { checked } = e.target;
    setUseOrgEmail(checked);
    if (checked) {
      form.setFieldsValue({
        useOrgEmail: checked,
        email: user?.email || ''
      });
    }
  };

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        email: user.email
      });
    }
  }, [user]);

  return (
    <S.Wrapper>
      <S.AccountSetupForm form={form} name='accountSetup' layout='vertical' onFinish={onSubmit}>
        <Form.Item
          label='Account Name'
          name='name'
          rules={[
            {
              required: true,
              message: 'Please input the account name!'
            }
          ]}
        >
          <Input placeholder='Company name' />
        </Form.Item>

        <Form.Item
          label="Account Contact's Email"
          name='email'
          tooltip='If you enter a new email address, an invite will be sent to join this account'
          rules={[
            {
              required: true,
              message: 'Email is required!'
            },
            {
              type: 'email',
              message: 'Please input a valid email!'
            }
          ]}
        >
          <Input defaultValue={user?.email || ''} type='email' placeholder='Your email' disabled={useOrgEmail} />
        </Form.Item>

        <div className='ant-form-item'>
          <Checkbox onChange={handleUseOrgEmailChange} defaultChecked>
            Use your contact email for this account.
          </Checkbox>
        </div>

        <Form.Item>
          <Button type='primary' htmlType='submit' block loading={isLoading}>
            Create Account <RightOutlined />
          </Button>
        </Form.Item>
      </S.AccountSetupForm>
    </S.Wrapper>
  );
}
