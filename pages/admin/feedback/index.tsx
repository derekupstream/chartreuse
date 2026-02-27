import { CheckOutlined, SyncOutlined, WarningOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Select, Space, Table, Tag, Typography, message } from 'antd';
import type { GetServerSideProps } from 'next';
import { useState } from 'react';

import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import { getUserFromContext } from 'lib/middleware';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';
import { formatDateShort } from 'lib/dates';
import type { PageProps } from 'pages/_app';

type Submission = {
  id: string;
  createdAt: string;
  category: string;
  message: string;
  pageUrl: string | null;
  status: string;
  user: { name: string | null; email: string; org: { name: string } } | null;
};

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return { notFound: true };
  const isUpstream = await checkIsUpstream(user.org.id);
  if (!isUpstream) return { notFound: true };

  try {
    const submissions = await prisma.feedbackSubmission.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const userIds = Array.from(new Set(submissions.map(s => s.userId)));
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      include: { org: { select: { name: true } } }
    });
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));
    const enriched = submissions.map(s => ({ ...s, user: userMap[s.userId] ?? null }));

    return { props: serializeJSON({ user, submissions: enriched, migrationPending: false }) };
  } catch (e) {
    console.error('FeedbackSubmission table missing — run migration in Supabase SQL editor', e);
    return { props: serializeJSON({ user, submissions: [], migrationPending: true }) };
  }
};

const CATEGORY_LABELS: Record<string, string> = {
  bug: 'Bug',
  suggestion: 'Suggestion',
  data_question: 'Data question',
  other: 'Other'
};

const STATUS_COLORS: Record<string, string> = {
  open: 'red',
  in_review: 'orange',
  closed: 'green'
};

function AdminFeedbackPage({
  submissions: initialSubmissions,
  migrationPending
}: {
  user: DashboardUser;
  submissions: Submission[];
  migrationPending: boolean;
}) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  const displayed = statusFilter ? submissions.filter(s => s.status === statusFilter) : submissions;

  async function updateStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error();
      setSubmissions(prev => prev.map(s => (s.id === id ? { ...s, status } : s)));
    } catch {
      message.error('Failed to update status');
    }
  }

  const columns = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 100,
      render: (v: string) => formatDateShort(v as any)
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 140,
      render: (cat: string) => <Tag>{CATEGORY_LABELS[cat] ?? cat}</Tag>
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message'
    },
    {
      title: 'From',
      key: 'user',
      width: 200,
      render: (_: any, row: Submission) =>
        row.user ? (
          <span>
            {row.user.name || row.user.email}
            <br />
            <Typography.Text type='secondary' style={{ fontSize: 12 }}>
              {row.user.org?.name}
            </Typography.Text>
          </span>
        ) : (
          <Typography.Text type='secondary'>Unknown</Typography.Text>
        )
    },
    {
      title: 'Page',
      dataIndex: 'pageUrl',
      key: 'pageUrl',
      width: 160,
      render: (url: string | null) =>
        url ? (
          <a href={url} target='_blank' rel='noreferrer' style={{ fontSize: 12 }}>
            {url.replace(/^https?:\/\/[^/]+/, '')}
          </a>
        ) : (
          '—'
        )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => <Tag color={STATUS_COLORS[status] ?? 'default'}>{status.replace('_', ' ')}</Tag>
    },
    {
      title: '',
      key: 'actions',
      width: 140,
      render: (_: any, row: Submission) => (
        <Space size='small'>
          {row.status === 'open' && (
            <Button size='small' icon={<SyncOutlined />} onClick={() => updateStatus(row.id, 'in_review')}>
              Review
            </Button>
          )}
          {row.status !== 'closed' && (
            <Button size='small' icon={<CheckOutlined />} onClick={() => updateStatus(row.id, 'closed')}>
              Close
            </Button>
          )}
        </Space>
      )
    }
  ];

  const openCount = submissions.filter(s => s.status === 'open').length;

  return (
    <>
      {migrationPending && (
        <Alert
          type='warning'
          icon={<WarningOutlined />}
          showIcon
          style={{ marginBottom: 16 }}
          message='Database migration required'
          description={
            <>
              The <code>FeedbackSubmission</code> table doesn&apos;t exist in your production database yet. Go to your{' '}
              <strong>Supabase dashboard → SQL Editor</strong> and run:
              <pre
                style={{
                  marginTop: 8,
                  background: '#f5f5f5',
                  padding: 8,
                  borderRadius: 4,
                  fontSize: 12,
                  overflowX: 'auto'
                }}
              >{`CREATE TABLE "FeedbackSubmission" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "pageUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    CONSTRAINT "FeedbackSubmission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ImpersonationSession" (
    "id" UUID NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ImpersonationSession_pkey" PRIMARY KEY ("id")
);`}</pre>
            </>
          }
        />
      )}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 8
        }}
      >
        <Typography.Title level={2} style={{ margin: 0 }}>
          Feedback{' '}
          {openCount > 0 && (
            <Tag color='red' style={{ fontSize: 13 }}>
              {openCount} open
            </Tag>
          )}
        </Typography.Title>
        <Select
          placeholder='Filter by status'
          allowClear
          style={{ width: 160 }}
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'open', label: 'Open' },
            { value: 'in_review', label: 'In review' },
            { value: 'closed', label: 'Closed' }
          ]}
        />
      </div>
      <Card>
        <Table
          columns={columns}
          dataSource={displayed}
          rowKey='id'
          pagination={{ pageSize: 25, hideOnSinglePage: true }}
          size='small'
        />
      </Card>
    </>
  );
}

AdminFeedbackPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => (
  <AdminLayout {...(pageProps as any)} selectedMenuItem='admin/feedback' title='Feedback'>
    {page}
  </AdminLayout>
);

export default AdminFeedbackPage;
