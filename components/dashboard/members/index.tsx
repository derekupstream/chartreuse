import { useRouter } from 'next/router'
import { Button, Space, Table, Tag, Typography, Popconfirm, message } from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { useMutation } from 'react-query'
import { useCallback } from 'react'

import * as S from '../styles'
import { LoggedinProps } from 'lib/middleware'

export default function Members({ user }: LoggedinProps) {
  const router = useRouter()

  const deleteAccount = useMutation((id: string) => {
    return fetch(`/api/profile/${id}`, {
      method: 'DELETE',
      headers: {
        'content-type': 'application/json',
      },
    })
  })
  console.log(user.org.accounts)
  const handleAccountDeletion = useCallback(
    (id: string) => {
      deleteAccount.mutate(id, {
        onSuccess: () => {
          message.success(`Account deleted`)
          router.replace(router.asPath)
        },
        onError: err => {
          message.error((err as Error)?.message)
        },
      })
    },
    [deleteAccount, router]
  )

  const columns = [
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
      sorter: (a: { email: string }, b: { email: string }) => a.email.toLowerCase() < b.email.toLowerCase() ? -1 : 1,
    },
    {
      title: 'Job title',
      dataIndex: 'jobTitle',
      key: 'jobTitle',
      // eslint-disable-next-line react/display-name
      render: (text: string) => {
        return text || '-'
      },
    },
    {
      title: 'Account',
      dataIndex: 'account',
      key: 'account',
      filters: user.org.accounts.map(account => ({
        text: account.name,
        value: account.id
      })),
      onFilter: (value: string, record: { accountId: string }) => record.accountId === value,
      defaultSortOrder: 'ascend',
      sorter: (a: { account: string }, b: { account: string }) => a.account.toLowerCase() < b.account.toLowerCase() ? -1 : 1,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      // eslint-disable-next-line react/display-name
      render: (_: string, record: any) => {
        return <Space size="small">{record.invitingPending ? <Tag color="orange">Pending</Tag> : <Tag color="blue">Active</Tag>}</Space>
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      // eslint-disable-next-line react/display-name
      render: (_: any, record: any) => {
        return (
          <Space size="middle">
            <Button
              // TODO: Edit member
              onClick={() => router.push(`/edit-member-profile/${record.key}`)}
              icon={<EditOutlined />}
              disabled={!record.name}
            />
            <Popconfirm
              title={
                <Space direction="vertical" size="small">
                  <Typography.Title level={4}>
                    Are you sure you want to delete the user &quot;
                    {record.name}&quot;?
                  </Typography.Title>
                  <Typography.Text>It&apos;s permanent.</Typography.Text>
                </Space>
              }
              onConfirm={() => handleAccountDeletion(record.key)}
            >
              <Button icon={<DeleteOutlined />} loading={deleteAccount.isLoading} disabled={!record.name} />
            </Popconfirm>
          </Space>
        )
      },
    },
  ]

  const data = user.org.accounts.reduce((data: any[], account) => {
    return data.concat(
      account.users
        .map(user => {
          const invitingPending = account.invites.some(i => i.email === user.email && !i.accepted)

          return {
            key: user.id,
            name: user.name,
            email: user.email,
            jobTitle: user.title,
            account: user.account.name,
            accountId: user.account.id,
            status: invitingPending ? 'Pending' : 'Active',
            invitingPending,
          }
        })
        .concat(
          account.invites
            .filter(i => !i.accepted)
            .map(invite => ({
              key: invite.id,
              name: '',
              email: invite.email,
              jobTitle: '',
              account: invite.account.name,
              accountId: invite.account.id,
              status: 'Pending',
              invitingPending: true,
            }))
        )
    )
  }, [])

  const handleAddAccountUser = () => {
    router.push('/invite-member?dashboard=1')
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <S.SpaceBetween>
        <Typography.Title>Account members</Typography.Title>
        <Button type='primary' onClick={handleAddAccountUser} icon={<PlusOutlined />}>
          Add user
        </Button>
      </S.SpaceBetween>
      {/* @ts-ignore */}
      {data.length > 0 && <Table columns={columns} dataSource={data} pagination={false} />}
      {data.length === 0 && <Typography.Text>You have no users in your account. Click ‘+ Add user’ above to get started.</Typography.Text>}
    </Space>
  )
}
