import { CheckOutlined, CloseCircleOutlined, EditOutlined, ExportOutlined } from '@ant-design/icons';
import { Alert, Button, Space, Table, Tag, Typography } from 'antd';
import type { ColumnType } from 'antd/lib/table/interface';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import useSWR from 'swr';

import { DashboardLayout as Template } from 'layouts/DashboardLayout/DashboardLayout';
import { checkLogin } from 'lib/middleware';
import { ACCESS_DENIED_REDIRECT, checkIsUpstream } from 'lib/middleware/requireUpstream';
import type { PageProps } from 'pages/_app';
import type { EmailEventListItem } from 'pages/api/admin/emails/index';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export const getServerSideProps: GetServerSideProps = async context => {
  const response = await checkLogin(context);
  if (response.redirect) return response;
  if (!response.props.user?.org.isUpstream) return ACCESS_DENIED_REDIRECT;
  const ok = await checkIsUpstream(response.props.user.org.id);
  if (!ok) return ACCESS_DENIED_REDIRECT;
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

  const supabaseProjectRef = getSupabaseProjectRef();
  const supabaseTemplatesUrl = supabaseProjectRef
    ? `https://supabase.com/dashboard/project/${supabaseProjectRef}/auth/templates`
    : 'https://supabase.com/dashboard';
  const supabaseSmtpUrl = supabaseProjectRef
    ? `https://supabase.com/dashboard/project/${supabaseProjectRef}/auth/providers`
    : 'https://supabase.com/dashboard';

  return (
    <Space direction='vertical' size='large' style={{ width: '100%' }}>
      <Typography.Title>Emails</Typography.Title>
      <Typography.Paragraph type='secondary' style={{ marginTop: -8, maxWidth: 720 }}>
        Edit the content and toggle on/off any transactional email Chart-Reuse sends. Changes apply immediately to all
        organizations. Use <strong>Send test</strong> in the editor to preview a real send to yourself.
      </Typography.Paragraph>

      <Typography.Title level={3} style={{ marginBottom: 0 }}>
        App emails
      </Typography.Title>
      <Typography.Paragraph type='secondary' style={{ marginTop: -8, fontSize: 13 }}>
        Sent by Chart-Reuse via Mailgun. Fully editable here.
      </Typography.Paragraph>
      <Table<EmailEventListItem>
        loading={isLoading}
        rowKey='id'
        columns={columns}
        dataSource={data?.items ?? []}
        pagination={false}
      />

      <div style={{ marginTop: 16 }}>
        <Typography.Title level={3} style={{ marginBottom: 0 }}>
          Identity emails
        </Typography.Title>
        <Typography.Paragraph type='secondary' style={{ marginTop: -8, fontSize: 13 }}>
          Triggered by Supabase Auth itself (signup, password reset, etc.) and rendered from templates stored in
          Supabase. Edit them in the Supabase dashboard.
        </Typography.Paragraph>
        <Alert
          type='warning'
          showIcon
          style={{ marginBottom: 12 }}
          message='Check that Supabase is configured to use Mailgun for SMTP'
          description={
            <span>
              By default Supabase sends identity emails through their own service, which is rate-limited (~3-4/hour) and
              can hurt deliverability. For production, configure custom SMTP in{' '}
              <a href={supabaseSmtpUrl} target='_blank' rel='noreferrer'>
                Supabase → Auth → Providers → Email
              </a>{' '}
              and point it at the same Mailgun credentials this app uses.
            </span>
          }
        />
        <Table
          rowKey='key'
          columns={[
            {
              title: 'Email',
              dataIndex: 'displayName',
              key: 'displayName',
              render: (text, row: any) => (
                <Space direction='vertical' size={2}>
                  <Typography.Text strong>{text}</Typography.Text>
                  <Typography.Text type='secondary' style={{ fontSize: 12 }}>
                    <code>{row.key}</code>
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
              dataIndex: 'recipient',
              key: 'recipient',
              render: text => <Tag>{text}</Tag>
            },
            {
              title: 'Managed by',
              key: 'managed',
              render: () => <Tag color='purple'>Supabase Auth</Tag>
            },
            {
              title: '',
              key: 'action',
              render: () => (
                <Button
                  type='link'
                  href={supabaseTemplatesUrl}
                  target='_blank'
                  rel='noreferrer'
                  icon={<ExportOutlined />}
                  style={{ padding: 0 }}
                >
                  Edit in Supabase
                </Button>
              )
            }
          ]}
          dataSource={SUPABASE_AUTH_EMAILS}
          pagination={false}
        />
      </div>
    </Space>
  );
};

function getSupabaseProjectRef(): string | null {
  // Public env var; safe to read from the browser.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  const match = url.match(/^https:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : null;
}

const SUPABASE_AUTH_EMAILS = [
  {
    key: 'confirm-signup',
    displayName: 'Email confirmation',
    description: 'Sent when a new user signs up — they click the link to verify they own the email.',
    recipient: 'New signup'
  },
  {
    key: 'reset-password',
    displayName: 'Password reset',
    description: 'Sent when a user requests a password reset link.',
    recipient: 'Existing user'
  },
  {
    key: 'magic-link',
    displayName: 'Magic sign-in link',
    description: 'Sent when a user requests a passwordless sign-in link (if enabled).',
    recipient: 'Existing user'
  },
  {
    key: 'change-email',
    displayName: 'Email change confirmation',
    description: 'Sent to confirm a user changing the email on their account.',
    recipient: 'Existing user'
  }
];

AdminEmailsPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => {
  return (
    <Template {...pageProps} selectedMenuItem='admin/emails' title='Emails'>
      {page}
    </Template>
  );
};

export default AdminEmailsPage;
