import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Space, Table, Tag, Typography, Popconfirm, message } from 'antd';
import { useRouter } from 'next/router';

import * as http from 'lib/http';
import type { LoggedinProps } from 'lib/middleware';

import * as S from '../styles';

interface AccountRow {
  invitingPending: boolean;
  key: string;
  name: string;
}

export default function Accounts({ user }: LoggedinProps) {
  const router = useRouter();

  function handleAccountDeletion(id: string) {
    return http
      .DELETE(`/api/account/${id}`)
      .then(() => {
        message.success(`Account deleted`);
        router.replace(router.asPath);
      })
      .catch(err => {
        message.error((err as Error)?.message);
      });
  }

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Contact',
      dataIndex: 'contact',
      key: 'contact',
      // eslint-disable-next-line react/display-name
      render: (text: string, record: AccountRow) => {
        return (
          <Space size='small'>
            {text}
            {record.invitingPending ? <Tag color='orange'>Pending</Tag> : <Tag color='blue'>Active</Tag>}
          </Space>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      // eslint-disable-next-line react/display-name
      render: (_: any, record: AccountRow) => {
        return (
          <Space size='middle'>
            <Button onClick={() => router.push(`/edit-account/${record.key}`)} icon={<EditOutlined />} />
            <Popconfirm
              title={
                <Space direction='vertical' size='small'>
                  <Typography.Title level={4}>
                    Are you sure you want to delete the account &quot;
                    {record.name}&quot;?
                  </Typography.Title>
                  <Typography.Text>
                    You will lose any Account Admins, and Projects associated with {record.name}.
                  </Typography.Text>
                </Space>
              }
              onConfirm={() => handleAccountDeletion(record.key)}
            >
              <Button icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        );
      }
    }
  ];

  const data: AccountRow[] = user.org.accounts.map(account => {
    return {
      key: account.id,
      name: account.name,
      contact: account.accountContactEmail,
      invitingPending: account.invites.some(i => i.email === account.accountContactEmail && !i.accepted)
    };
  });

  const handleAddAcount = () => {
    router.push('/setup/account?dashboard=1');
  };

  return (
    <Space direction='vertical' size='large' style={{ width: '100%' }}>
      <S.SpaceBetween>
        <Typography.Title>Accounts</Typography.Title>
        <Button type='primary' onClick={handleAddAcount} icon={<PlusOutlined />}>
          Add account
        </Button>
      </S.SpaceBetween>
      {data.length > 0 && <Table columns={columns} dataSource={data} pagination={false} />}
      {data.length === 0 && (
        <Typography.Text>
          You have no active accounts in your organization. Click ‘+ Add account’ above to get started.
        </Typography.Text>
      )}
    </Space>
  );
}
