import { useRouter } from 'next/router'
import { Button, Space, Table, Tag, Typography, Popconfirm, message } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import { ColumnType } from 'antd/lib/table/interface'
import { User } from '@prisma/client'
import { OrgSummary } from 'pages/upstream/orgs'
import chartreuseClient from 'lib/chartreuseClient'
import { formatDateShort } from 'lib/dates'

import * as S from '../styles'

export interface PageProps {
  orgs: OrgSummary[]
  user: User
}

export default function Organizations({ orgs }: PageProps) {
  const router = useRouter()

  const handleAccountDeletion = (org: OrgSummary) => {
    chartreuseClient
      .deleteOrganization(org.id)
      .then(() => {
        message.success('Organization deleted')
        router.replace(router.asPath)
      })
      .catch(err => {
        message.error((err as Error)?.message)
      })
  }

  const columns: ColumnType<OrgSummary>[] = [
    {
      title: 'Name',
      key: 'name',
      sorter: (a, b) => (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1),
      // eslint-disable-next-line react/display-name
      render: (org: OrgSummary) => {
        return <strong>{org.name}</strong>
      },
    },
    {
      title: 'Signup date',
      align: 'right',
      key: 'createdAt',
      defaultSortOrder: 'descend',
      sorter: (a, b) => (a.createdAt < b.createdAt ? -1 : 1),
      // eslint-disable-next-line react/display-name
      render: (org: OrgSummary) => {
        return formatDateShort(org.createdAt)
      },
    },
    {
      title: 'Accounts',
      align: 'right',
      dataIndex: ['_count', 'accounts'],
      key: 'accounts',
      sorter: (a, b) => (a._count.accounts < b._count.accounts ? -1 : 1),
    },
    {
      title: 'Users',
      align: 'right',
      dataIndex: ['_count', 'users'],
      key: 'users',
      sorter: (a, b) => (a._count.accounts < b._count.accounts ? -1 : 1),
    },
    {
      title: 'Projects',
      align: 'right',
      dataIndex: ['_count', 'projects'],
      key: 'projects',
      sorter: (a, b) => (a._count.accounts < b._count.accounts ? -1 : 1),
    },
    {
      title: 'Actions',
      key: 'actions',
      // eslint-disable-next-line react/display-name
      render: (_, org: OrgSummary) => {
        return (
          <Space size="middle">
            {!org.isUpstream && (
              <Popconfirm
                title={
                  <Space direction="vertical" size="small">
                    <Typography.Title level={4}>Are you sure you want to delete &quot;{org.name}&quot;?</Typography.Title>
                    <Typography.Text>This action cannot be undone</Typography.Text>
                  </Space>
                }
                onConfirm={() => handleAccountDeletion(org)}
              >
                <Button icon={<DeleteOutlined />} />
              </Popconfirm>
            )}
          </Space>
        )
      },
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <S.SpaceBetween>
        <Typography.Title>Organizations</Typography.Title>
      </S.SpaceBetween>
      {/* @ts-ignore */}
      <Table columns={columns} dataSource={orgs} pagination={false} />
    </Space>
  )
}
