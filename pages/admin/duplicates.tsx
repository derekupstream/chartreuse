import { ExclamationCircleOutlined, MergeCellsOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Empty, Popconfirm, Space, Spin, Statistic, Tag, Typography, message } from 'antd';
import type { GetServerSideProps } from 'next';
import { useState } from 'react';
import useSWR from 'swr';

import type { DuplicateReport } from 'lib/admin/duplicateDetector';
import chartreuseClient from 'lib/chartreuseClient';
import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { getUserFromContext } from 'lib/middleware';
import { ACCESS_DENIED_REDIRECT, checkIsUpstream } from 'lib/middleware/requireUpstream';
import { serializeJSON } from 'lib/objects';
import type { PageProps } from 'pages/_app';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return ACCESS_DENIED_REDIRECT;
  const isUpstream = await checkIsUpstream(user.org.id);
  if (!isUpstream) return ACCESS_DENIED_REDIRECT;
  return { props: serializeJSON({ user }) };
};

const bucketTag = (bucket: string) => {
  if (bucket === 'AUTO_MERGE') return <Tag color='green'>Auto-merge</Tag>;
  if (bucket === 'EMPTY_DELETE') return <Tag color='blue'>Empty</Tag>;
  return <Tag color='orange'>Needs review</Tag>;
};

function AdminDuplicatesPage(_: { user: DashboardUser }) {
  const { data, error, isLoading, mutate } = useSWR<DuplicateReport>('/api/admin/duplicates', fetcher);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleMerge(sourceOrgId: string, targetOrgId: string) {
    setBusyId(sourceOrgId);
    try {
      const res = await fetch('/api/admin/duplicates/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceOrgId, targetOrgId })
      });
      if (!res.ok) {
        const { error: errMsg } = await res.json();
        throw new Error(errMsg ?? 'Merge failed');
      }
      message.success('Merged successfully');
      await mutate();
    } catch (err: any) {
      message.error(err?.message ?? 'Merge failed');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(orgId: string) {
    setBusyId(orgId);
    try {
      await chartreuseClient.deleteOrganization(orgId);
      message.success('Organization deleted');
      await mutate();
    } catch (err: any) {
      message.error(err?.message ?? 'Delete failed');
    } finally {
      setBusyId(null);
    }
  }

  if (isLoading) return <Spin />;
  if (error) return <Alert type='error' message='Failed to load duplicate report' description={String(error)} />;
  if (!data) return null;

  const { groups, counts } = data;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={2} style={{ margin: 0 }}>
          Duplicate Organizations
        </Typography.Title>
        <Button icon={<ReloadOutlined />} onClick={() => mutate()}>
          Refresh
        </Button>
      </div>

      <Typography.Paragraph type='secondary'>
        Organizations with the same name. Auto-mergeable rows (matching work-email domain) and empty placeholders are
        handled by the <code>backfill-duplicate-orgs</code> script. Anything left here needs a human decision.
      </Typography.Paragraph>

      <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
        <Card size='small'>
          <Statistic
            title='Needs review'
            value={counts.needsReview}
            valueStyle={{ color: counts.needsReview ? '#d46b08' : undefined }}
          />
        </Card>
        <Card size='small'>
          <Statistic title='Auto-mergeable (pending script run)' value={counts.autoMerge} />
        </Card>
        <Card size='small'>
          <Statistic title='Empty (pending script run)' value={counts.emptyDelete} />
        </Card>
      </div>

      {groups.length === 0 ? (
        <Empty description='No duplicate organizations 🎉' />
      ) : (
        <Space direction='vertical' size={16} style={{ width: '100%' }}>
          {groups.map(group => (
            <Card
              key={group.key}
              title={
                <Space>
                  <ExclamationCircleOutlined style={{ color: '#d46b08' }} />
                  <strong>{group.displayName}</strong>
                  <Typography.Text type='secondary' style={{ fontWeight: 'normal' }}>
                    ({group.duplicates.length + 1} rows)
                  </Typography.Text>
                </Space>
              }
            >
              <div
                style={{
                  marginBottom: 12,
                  padding: 12,
                  background: '#f6ffed',
                  border: '1px solid #b7eb8f',
                  borderRadius: 4
                }}
              >
                <Space direction='vertical' size={4} style={{ width: '100%' }}>
                  <Space>
                    <Tag color='green'>Canonical</Tag>
                    <code style={{ fontSize: 12 }}>{group.canonical.id}</code>
                    <Typography.Text type='secondary' style={{ fontSize: 12 }}>
                      created {new Date(group.canonical.createdAt).toLocaleDateString()}
                    </Typography.Text>
                  </Space>
                  <Typography.Text>
                    {group.canonical.userCount} users · {group.canonical.accountCount} accounts ·{' '}
                    {group.canonical.projectCount} projects
                  </Typography.Text>
                  {group.canonical.users.length > 0 && (
                    <Typography.Text type='secondary' style={{ fontSize: 12 }}>
                      {group.canonical.users
                        .slice(0, 3)
                        .map(u => u.email)
                        .join(', ')}
                      {group.canonical.users.length > 3 && ` +${group.canonical.users.length - 3} more`}
                    </Typography.Text>
                  )}
                </Space>
              </div>

              <Space direction='vertical' size={8} style={{ width: '100%' }}>
                {group.duplicates.map(dup => (
                  <div
                    key={dup.org.id}
                    style={{ padding: 12, background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 4 }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: 12,
                        flexWrap: 'wrap'
                      }}
                    >
                      <Space direction='vertical' size={4} style={{ flex: 1 }}>
                        <Space wrap>
                          {bucketTag(dup.bucket)}
                          <code style={{ fontSize: 12 }}>{dup.org.id}</code>
                          <Typography.Text type='secondary' style={{ fontSize: 12 }}>
                            created {new Date(dup.org.createdAt).toLocaleDateString()}
                          </Typography.Text>
                        </Space>
                        <Typography.Text style={{ fontSize: 13 }}>
                          {dup.org.userCount} users · {dup.org.accountCount} accounts · {dup.org.projectCount} projects
                        </Typography.Text>
                        <Typography.Text type='secondary' style={{ fontSize: 12 }}>
                          {dup.reason}
                        </Typography.Text>
                        {dup.org.users.length > 0 && (
                          <div style={{ fontSize: 12, color: '#595959' }}>
                            {dup.org.users.map(u => (
                              <div key={u.id}>
                                {u.name ? `${u.name} · ` : ''}
                                {u.email}
                              </div>
                            ))}
                          </div>
                        )}
                      </Space>
                      <Space>
                        <Popconfirm
                          title={
                            <>
                              Merge <code>{dup.org.id.slice(0, 8)}…</code> into canonical{' '}
                              <strong>{group.displayName}</strong>?
                            </>
                          }
                          description='All users, accounts, projects, and other data will move to the canonical org. This cannot be undone.'
                          onConfirm={() => handleMerge(dup.org.id, group.canonical.id)}
                          okText='Merge'
                          okButtonProps={{ danger: true }}
                        >
                          <Button
                            type='primary'
                            icon={<MergeCellsOutlined />}
                            loading={busyId === dup.org.id}
                            size='small'
                          >
                            Merge into canonical
                          </Button>
                        </Popconfirm>
                        <Popconfirm
                          title={<>Delete this duplicate org?</>}
                          description='Deletes the org and all its accounts, projects, and users. This cannot be undone.'
                          onConfirm={() => handleDelete(dup.org.id)}
                          okText='Delete'
                          okButtonProps={{ danger: true }}
                        >
                          <Button danger icon={<DeleteOutlined />} loading={busyId === dup.org.id} size='small'>
                            Delete
                          </Button>
                        </Popconfirm>
                      </Space>
                    </div>
                  </div>
                ))}
              </Space>
            </Card>
          ))}
        </Space>
      )}
    </>
  );
}

AdminDuplicatesPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => (
  <AdminLayout {...(pageProps as any)} selectedMenuItem='admin/duplicates' title='Duplicates'>
    {page}
  </AdminLayout>
);

export default AdminDuplicatesPage;
