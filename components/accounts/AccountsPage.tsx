import { DeleteOutlined, EditOutlined, PlusOutlined, CopyOutlined, LinkOutlined } from '@ant-design/icons';
import { Button, Space, Table, Tag, Typography, Popconfirm, message, Input } from 'antd';
import { useRouter } from 'next/router';
import { useCallback, useState } from 'react';
import { useMutation } from 'react-query';

import * as http from 'lib/http';
import type { LoggedinProps } from 'lib/middleware';
import chartreuseClient from 'lib/chartreuseClient';

import * as S from '../../layouts/styles';

type AccountRow = {
  invitingPending: boolean;
  key: string;
  name: string;
};

export function AccountsPage({ user, org }: LoggedinProps & { org: { orgInviteCode: string | null } }) {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState<string | null>(org.orgInviteCode);

  const updateInviteCode = useMutation((enabled: boolean) => chartreuseClient.updateOrgInviteCode(enabled), {
    onSuccess: data => {
      setInviteCode(data.orgInviteCode);
      message.success(data.orgInviteCode ? 'Invite link created' : 'Invite link deleted');
    },
    onError: (error: Error) => {
      message.error(error.message);
    }
  });

  const handleCreateInviteLink = useCallback(() => {
    updateInviteCode.mutate(true);
  }, [updateInviteCode]);

  const handleDeleteInviteLink = useCallback(() => {
    updateInviteCode.mutate(false);
  }, [updateInviteCode]);

  const inviteUrl = inviteCode
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${inviteCode}`
    : '';

  const copyInviteLink = useCallback(() => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl);
      message.success('Invite link copied to clipboard');
    }
  }, [inviteUrl]);

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
            <Button onClick={() => router.push(`/accounts/edit/${record.key}`)} icon={<EditOutlined />} />
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
      <S.HeaderRow>
        <Typography.Title>Accounts</Typography.Title>
        {user.role === 'ORG_ADMIN' && (
          <Space size='middle' align='end'>
            <Button type='primary' onClick={handleAddAcount} icon={<PlusOutlined />}>
              Add account
            </Button>
            {!inviteCode ? (
              <Button onClick={handleCreateInviteLink} loading={updateInviteCode.isLoading} icon={<LinkOutlined />}>
                Generate invite link
              </Button>
            ) : (
              <Input.Group compact>
                <Button icon={<CopyOutlined />} onClick={copyInviteLink}>
                  Copy Invite Link
                </Button>
                <Popconfirm
                  title={
                    <Space direction='vertical' size='small'>
                      <Typography.Text>Are you sure you want to delete this invite link?</Typography.Text>
                      <Typography.Text type='secondary'>
                        The link will no longer work and users won't be able to sign up using it.
                      </Typography.Text>
                    </Space>
                  }
                  onConfirm={handleDeleteInviteLink}
                  okText='Delete'
                  cancelText='Cancel'
                  okButtonProps={{ danger: true }}
                >
                  <Button icon={<DeleteOutlined />} loading={updateInviteCode.isLoading} />
                </Popconfirm>
              </Input.Group>
            )}
          </Space>
        )}
        {user.role !== 'ORG_ADMIN' && (
          <Button type='primary' onClick={handleAddAcount} icon={<PlusOutlined />}>
            Add account
          </Button>
        )}
      </S.HeaderRow>
      {data.length > 0 && <Table columns={columns} dataSource={data} pagination={false} />}
      {data.length === 0 && (
        <Typography.Text>
          You have no active accounts in your organization. Click ‘+ Add account’ above to get started.
        </Typography.Text>
      )}
    </Space>
  );
}
