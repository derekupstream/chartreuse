import { useRouter } from 'next/router'
import { Button, Space, Table, Tag, Typography, Popconfirm, message } from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { ColumnType } from 'antd/lib/table/interface'
import { useMutation } from 'react-query'
import { useCallback } from 'react'
import { Account, User, Invite } from '@prisma/client'

import * as S from '../styles'

interface Member {
  key: string
  name: string
  email: string
  jobTitle: string
  account?: string
  accountId?: string
  isInvite: boolean
}

export interface PageProps {
  accounts: Account[]
  users: User[]
  invites: Invite[]
}

export default function Members({ accounts, users, invites }: PageProps) {
  const router = useRouter()

  const deleteAccount = useMutation((member: Member) => {
    const resource = member.isInvite ? 'invite' : 'profile'
    return fetch(`/api/${resource}/${member.key}`, {
      method: 'DELETE',
      headers: {
        'content-type': 'application/json',
      },
    })
  })

  const handleAccountDeletion = useCallback(
    (member: Member) => {
      deleteAccount.mutate(member, {
        onSuccess: () => {
          message.success(member.isInvite ? 'Invitation cancelled' : 'Account deleted')
          router.replace(router.asPath)
        },
        onError: err => {
          message.error((err as Error)?.message)
        },
      })
    },
    [deleteAccount, router]
  )

  const columns: (ColumnType<Member> & { showPending?: boolean })[] = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      // eslint-disable-next-line react/display-name
      render: (text: string) => {
        return text || '-'
      },
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      sorter: (a, b) => (a.email.toLowerCase() < b.email.toLowerCase() ? -1 : 1),
      showPending: true,
    },
    {
      title: 'Job title',
      dataIndex: 'jobTitle',
      key: 'jobTitle',
      // eslint-disable-next-line react/display-name
      render: text => {
        return text || '-'
      },
    },
    {
      title: 'Account',
      dataIndex: 'account',
      key: 'account',
      filters: accounts.map(account => ({
        text: account.name,
        value: account.id,
      })),
      onFilter: (value, member) => member.accountId === value,
      defaultSortOrder: 'ascend',
      sorter: (a, b) => (a.account?.toLowerCase() || '' < (b.account?.toLowerCase() || '') ? -1 : 1),
      showPending: true,
      render: text => {
        return text || <span style={{ color: '#999' }}>All accounts</span>
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      // eslint-disable-next-line react/display-name
      render: (_, member) => {
        return (
          <Space size="middle">
            {!member.isInvite && <Button onClick={() => router.push(`/edit-member-profile/${member.key}`)} icon={<EditOutlined />} />}
            <Popconfirm
              title={
                <Space direction="vertical" size="small">
                  <Typography.Title level={4}>
                    Are you sure you want to delete the {member.isInvite ? 'invitation to' : 'member'} &quot;{member.email}&quot;?
                  </Typography.Title>
                  <Typography.Text>This action cannot be undone</Typography.Text>
                </Space>
              }
              onConfirm={() => handleAccountDeletion(member)}
            >
              <Button icon={<DeleteOutlined />} loading={deleteAccount.isLoading && deleteAccount.variables?.key === member.key} />
            </Popconfirm>
          </Space>
        )
      },
      showPending: true,
    },
  ]

  const pendingColumns = columns.filter(col => col.showPending)

  const activeUsers: Member[] = users.map((user): Member => {
    const account = accounts.find(account => account.id === user.accountId)
    return {
      key: user.id,
      name: user.name || '',
      email: user.email,
      jobTitle: user.title || '',
      account: account?.name,
      accountId: account?.id,
      isInvite: false,
    }
  })

  const pendingUsers = invites.map((invite): Member => {
    const account = accounts.find(account => account.id === invite.accountId)
    return {
      key: invite.id,
      name: '',
      email: invite.email,
      jobTitle: '',
      account: account?.name,
      accountId: account?.id,
      isInvite: true,
    }
  })

  const handleAddAccountUser = () => {
    router.push('/invite-member?dashboard=1')
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <S.SpaceBetween>
        <Typography.Title>Members</Typography.Title>
        <Button type="primary" onClick={handleAddAccountUser} icon={<PlusOutlined />}>
          Invite new member
        </Button>
      </S.SpaceBetween>
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
  )
}
