import { RightOutlined } from '@ant-design/icons';
import { Divider, Form, Input, Button, Select } from 'antd';
import { useEffect } from 'react';

import { useAuth } from 'hooks/useAuth';

import * as S from './styles';

type Props = {
  onSubmit: (values: unknown) => void;
  isLoading?: boolean;
};

export default function OrgSetupForm({ onSubmit, isLoading }: Props) {
  const { user } = useAuth();
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({
      name: user?.displayName
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
          <Input placeholder='Your name' />
        </Form.Item>

        <Form.Item label='Your job title' name='title' rules={[{ required: true, message: 'Please input your title!' }]}>
          <Input placeholder='Your job title' />
        </Form.Item>

        <Form.Item label='Your contact phone number' name='phone'>
          <Input placeholder='(720) 555-1234' />
        </Form.Item>

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
          <Input placeholder='Organization name' />
        </Form.Item>

        <Form.Item label='Number of client accounts' name='numberOfClientAccounts'>
          <Select placeholder='Select the number of client accounts'>
            <Select.Option value='1'>1</Select.Option>
            <Select.Option value='2'>2</Select.Option>
            <Select.Option value='3'>3</Select.Option>
            <Select.Option value='4'>4</Select.Option>
            <Select.Option value='5+'>5+</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Button type='primary' htmlType='submit' block loading={isLoading}>
            Create Organization <RightOutlined />
          </Button>
        </Form.Item>
      </S.OrgSetupForm>
    </S.Wrapper>
  );
}
