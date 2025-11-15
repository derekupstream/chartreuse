import { DeleteOutlined, EditOutlined, PlusOutlined, CopyOutlined, LinkOutlined } from '@ant-design/icons';
import type { Account, User, Invite } from '@prisma/client';
import { Button, Space, Table, Tag, Typography, Popconfirm, message, Input } from 'antd';
import type { ColumnType } from 'antd/lib/table/interface';
import { useRouter } from 'next/router';
import { useCallback, useState } from 'react';
import { useMutation } from 'react-query';

import { members } from 'lib/api';
import chartreuseClient from 'lib/chartreuseClient';

import * as S from '../../layouts/styles';

interface Member {
  key: string;
  name: string;
  email: string;
  jobTitle: string;
  account?: string;
  accountId?: string;
  isInvite: boolean;
}

export interface PageProps {
  accounts: Account[];
  users: User[];
  invites: Invite[];
  org: {
    orgInviteCode: string | null;
  };
  user?: {
    role: string;
  };
}

export function MembersPage({ accounts, users, invites, org, user }: PageProps) {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState<string | null>(org.orgInviteCode);

  const deleteAccount = members.useDeleteMember();

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

  const handleAccountDeletion = useCallback(
    async (member: Member) => {
      try {
        await deleteAccount.trigger(member);
        message.success(member.isInvite ? 'Invitation cancelled' : 'Account deleted');
        router.replace(router.asPath);
      } catch (error) {
        message.error((error as Error)?.message);
      }
    },
    [deleteAccount, router]
  );

  const columns: (ColumnType<Member> & { showPending?: boolean })[] = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      // eslint-disable-next-line react/display-name
      render: (text: string) => {
        return text || '-';
      }
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      sorter: (a, b) => (a.email.toLowerCase() < b.email.toLowerCase() ? -1 : 1),
      showPending: true
    },
    {
      title: 'Job title',
      dataIndex: 'jobTitle',
      key: 'jobTitle',
      // eslint-disable-next-line react/display-name
      render: text => {
        return text || '-';
      }
    },
    {
      title: 'Account',
      dataIndex: 'account',
      key: 'account',
      filters: accounts.map(account => ({
        text: account.name,
        value: account.id
      })),
      onFilter: (value, member) => member.accountId === value,
      defaultSortOrder: 'ascend',
      sorter: (a, b) => (a.account?.toLowerCase() || '' < (b.account?.toLowerCase() || '') ? -1 : 1),
      showPending: true,
      render: text => {
        return text || <span style={{ color: '#999' }}>All accounts</span>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      // eslint-disable-next-line react/display-name
      render: (_, member) => {
        return (
          <Space size='middle'>
            {!member.isInvite && <Button href={`/edit-member-profile/${member.key}`} icon={<EditOutlined />} />}
            <Popconfirm
              title={
                <Space direction='vertical' size='small'>
                  <Typography.Title level={4}>
                    Are you sure you want to delete the {member.isInvite ? 'invitation to' : 'member'} &quot;
                    {member.email}&quot;?
                  </Typography.Title>
                  <Typography.Text>This action cannot be undone</Typography.Text>
                </Space>
              }
              onConfirm={() => handleAccountDeletion(member)}
            >
              <Button icon={<DeleteOutlined />} loading={deleteAccount.isMutating} />
            </Popconfirm>
          </Space>
        );
      },
      showPending: true
    }
  ];

  const pendingColumns = columns.filter(col => col.showPending);

  const activeUsers: Member[] = users.map((user): Member => {
    const account = accounts.find(account => account.id === user.accountId);
    return {
      key: user.id,
      name: user.name || '',
      email: user.email,
      jobTitle: user.title || '',
      account: account?.name,
      accountId: account?.id,
      isInvite: false
    };
  });

  const pendingUsers = invites.map((invite): Member => {
    const account = accounts.find(account => account.id === invite.accountId);
    return {
      key: invite.id,
      name: '',
      email: invite.email,
      jobTitle: '',
      account: account?.name,
      accountId: account?.id,
      isInvite: true
    };
  });

  const handleAddAccountUser = () => {
    router.push('/invite-member?dashboard=1');
  };

  return (
    <Space direction='vertical' size='large' style={{ width: '100%' }}>
      <S.HeaderRow>
        <Typography.Title>Members</Typography.Title>
        {user?.role === 'ORG_ADMIN' && (
          <Space
            direction='horizontal'
            size='middle'
            align='end'
            style={{ background: '#f5f5f5', borderRadius: '4px' }}
          >
            <Button type='primary' onClick={handleAddAccountUser} icon={<PlusOutlined />}>
              Invite new member
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
      </S.HeaderRow>
      {/* @ts-ignore */}
      {activeUsers.length > 0 && <Table columns={columns} dataSource={activeUsers} pagination={false} />}
      {activeUsers.length === 0 && (
        <Typography.Text>
          You have no users in your organization. Click <strong>+ Invite new member</strong> above to get started.
        </Typography.Text>
      )}
      {pendingUsers.length > 0 && (
        <>
          <br />
          <Typography.Title level={2}>Pending Invitations</Typography.Title>
          <Table<Member> columns={pendingColumns} dataSource={pendingUsers} pagination={false} />
        </>
      )}
    </Space>
  );
}
