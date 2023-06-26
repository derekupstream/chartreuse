import { RightOutlined } from '@ant-design/icons';
import { Form, Input, Button, Select } from 'antd';

import * as S from './styles';

type Props = {
  onSubmit: (values: unknown) => void;
  isLoading?: boolean;
  accounts: {
    id: string;
    name: string;
  }[];
  isOrgAdmin: boolean;
};

export function InviteMemberForm({ onSubmit, isLoading, accounts, isOrgAdmin }: Props) {
  return (
    <S.Wrapper>
      <S.InviteForm name='inviteForm' layout='vertical' onFinish={onSubmit}>
        <Form.Item
          label='Choose account to assign member'
          name='accountId'
          initialValue={isOrgAdmin ? '' : accounts[0].id}
          hidden={!isOrgAdmin}
        >
          <Select placeholder='Account name'>
            <Select.Option value=''>-- Access All Accounts --</Select.Option>
            {accounts.map(account => {
              return (
                <Select.Option key={account.id} value={account.id}>
                  {account.name}
                </Select.Option>
              );
            })}
          </Select>
        </Form.Item>

        <Form.Item
          label="Account member's email"
          name='email'
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
          <Input type='email' placeholder="Account member's email" />
        </Form.Item>

        <Form.Item>
          <Button type='primary' htmlType='submit' block loading={isLoading}>
            Invite Member <RightOutlined />
          </Button>
        </Form.Item>
      </S.InviteForm>
    </S.Wrapper>
  );
}
