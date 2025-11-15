import { RightOutlined } from '@ant-design/icons';
import { Form, Input, Button } from 'antd';

import * as S from './styles';

type Props = {
  onSubmit: (values: unknown) => void;
  isLoading?: boolean;
};

export function InviteSignupForm({ onSubmit, isLoading }: Props) {
  return (
    <S.Wrapper>
      <S.InviteSignupForm name='inviteSignup' layout='vertical' onFinish={onSubmit}>
        <Form.Item
          label='Business / Venue'
          name='businessVenue'
          rules={[
            {
              required: true,
              message: 'Please input your business or venue name!'
            }
          ]}
        >
          <Input placeholder='Business or Venue name' />
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

        <Form.Item label='Your job title' name='title'>
          <Input placeholder='Your job title' />
        </Form.Item>

        <Form.Item label='Your contact phone number' name='phone'>
          <Input placeholder='(720) 555-1234' />
        </Form.Item>

        <Form.Item>
          <Button type='primary' htmlType='submit' block loading={isLoading}>
            Create Account <RightOutlined />
          </Button>
        </Form.Item>
      </S.InviteSignupForm>
    </S.Wrapper>
  );
}
