import { CheckOutlined, CloseCircleOutlined, EditOutlined } from '@ant-design/icons';
import { Space, Table, Tag, Typography } from 'antd';
import type { ColumnType } from 'antd/lib/table/interface';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import useSWR from 'swr';

import { DashboardLayout as Template } from 'layouts/DashboardLayout/DashboardLayout';
import { checkLogin } from 'lib/middleware';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import type { PageProps } from 'pages/_app';
import type { EmailEventListItem } from 'pages/api/admin/emails/index';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export const getServerSideProps: GetServerSideProps = async context => {
  const response = await checkLogin(context);
  if (response.redirect) return response;
  if (!response.props.user?.org.isUpstream) return { notFound: true };
  const ok = await checkIsUpstream(response.props.user.org.id);
  if (!ok) return { notFound: true };
  return response;
};

type Props = { user: { id: string } };

const AdminEmailsPage = (_props: Props) => {
  const { data, isLoading } = useSWR<{ items: EmailEventListItem[] }>('/api/admin/emails', fetcher);

  const columns: ColumnType<EmailEventListItem>[] = [
    {
      title: 'Event',
      dataIndex: 'displayName',
      key: 'displayName',
      render: (text, row) => (
        <Space direction='vertical' size={2}>
          <Typography.Text strong>{text}</Typography.Text>
          <Typography.Text type='secondary' style={{ fontSize: 12 }}>
            <code>{row.eventKey}</code>
          </Typography.Text>
        </Space>
      )
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: text => <Typography.Text type='secondary'>{text}</Typography.Text>
    },
    {
      title: 'Recipient',
      dataIndex: 'recipientHint',
      key: 'recipientHint',
      render: text => <Tag>{text}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'enabled',
      key: 'enabled',
      render: enabled =>
        enabled ? (
          <Tag color='green' icon={<CheckOutlined />}>
            Enabled
          </Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />}>Disabled</Tag>
        )
    },
    {
      title: 'Last edited',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: iso => new Date(iso).toLocaleString()
    },
    {
      title: '',
      key: 'actions',
      render: (_, row) => (
        <Link href={`/admin/emails/${row.id}`}>
          <EditOutlined /> Edit
        </Link>
      )
    }
  ];

  return (
    <Space direction='vertical' size='large' style={{ width: '100%' }}>
      <Typography.Title>Emails</Typography.Title>
      <Typography.Paragraph type='secondary' style={{ marginTop: -8, maxWidth: 720 }}>
        Edit the content and toggle on/off any transactional email Chart-Reuse sends. Changes apply immediately to all
        organizations. Use <strong>Send test</strong> in the editor to preview a real send to yourself.
      </Typography.Paragraph>
      <Table<EmailEventListItem>
        loading={isLoading}
        rowKey='id'
        columns={columns}
        dataSource={data?.items ?? []}
        pagination={false}
      />
    </Space>
  );
};

AdminEmailsPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => {
  return (
    <Template {...pageProps} selectedMenuItem='admin/emails' title='Emails'>
      {page}
    </Template>
  );
};

export default AdminEmailsPage;
