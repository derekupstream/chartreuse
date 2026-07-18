import { ArrowLeftOutlined, MailOutlined, SaveOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Modal, Space, Switch, Tabs, Tag, Typography, message } from 'antd';
import type { GetServerSideProps } from 'next';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import useSWR from 'swr';

import { DashboardLayout as Template } from 'layouts/DashboardLayout/DashboardLayout';
import { checkLogin } from 'lib/middleware';
import { ACCESS_DENIED_REDIRECT, checkIsUpstream } from 'lib/middleware/requireUpstream';
import type { PageProps } from 'pages/_app';
import type { EmailEventDetail } from 'pages/api/admin/emails/[id]';

const EmailEditor = dynamic(() => import('components/admin/emails/EmailEditor').then(m => m.EmailEditor), {
  ssr: false
});

const fetcher = (url: string) => fetch(url).then(r => r.json());

export const getServerSideProps: GetServerSideProps = async context => {
  const response = await checkLogin(context);
  if (response.redirect) return response;
  if (!response.props.user?.org.isUpstream) return ACCESS_DENIED_REDIRECT;
  const ok = await checkIsUpstream(response.props.user.org.id);
  if (!ok) return ACCESS_DENIED_REDIRECT;
  return response;
};

const AdminEmailEditPage = () => {
  const router = useRouter();
  const id = router.query.id as string;
  const { data, mutate, isLoading } = useSWR<EmailEventDetail>(id ? `/api/admin/emails/${id}` : null, fetcher);

  const [subjectLine, setSubjectLine] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [testTo, setTestTo] = useState('');
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview-desktop' | 'preview-mobile'>('edit');

  useEffect(() => {
    if (data) {
      setSubjectLine(data.subjectLine);
      setHtmlContent(data.htmlContent);
      setEnabled(data.enabled);
      setDirty(false);
    }
  }, [data]);

  async function save() {
    if (!data) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/emails/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectLine, htmlContent, enabled })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Save failed');
      }
      const updated = await res.json();
      mutate(updated, { revalidate: false });
      message.success('Saved');
      setDirty(false);
    } catch (err: any) {
      message.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function sendTest() {
    setSendingTest(true);
    try {
      const res = await fetch(`/api/admin/emails/${id}/test-send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testTo.trim() || undefined })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Send failed');
      }
      const { sentTo } = await res.json();
      message.success(`Test sent to ${sentTo}`);
      setTestModalOpen(false);
    } catch (err: any) {
      message.error(err.message || 'Send failed');
    } finally {
      setSendingTest(false);
    }
  }

  if (isLoading || !data) {
    return <Typography.Text>Loading…</Typography.Text>;
  }

  return (
    <Space direction='vertical' size='large' style={{ width: '100%' }}>
      <div>
        <Link href='/admin/emails'>
          <ArrowLeftOutlined /> Back to emails
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div>
          <Typography.Title style={{ marginBottom: 4 }}>{data.displayName}</Typography.Title>
          <Typography.Text type='secondary'>{data.description}</Typography.Text>
          <div style={{ marginTop: 8 }}>
            <Tag>{data.recipientHint}</Tag>
            <Tag color='blue'>
              <code>{data.eventKey}</code>
            </Tag>
          </div>
        </div>
        <Space>
          <Typography.Text>Enabled</Typography.Text>
          <Switch
            checked={enabled}
            onChange={v => {
              setEnabled(v);
              setDirty(true);
            }}
          />
          <Button icon={<MailOutlined />} onClick={() => setTestModalOpen(true)}>
            Send test
          </Button>
          <Button type='primary' icon={<SaveOutlined />} loading={saving} disabled={!dirty} onClick={save}>
            Save
          </Button>
        </Space>
      </div>

      <Card size='small'>
        <Form layout='vertical'>
          <Form.Item label='Subject line' style={{ marginBottom: 12 }}>
            <Input
              value={subjectLine}
              onChange={e => {
                setSubjectLine(e.target.value);
                setDirty(true);
              }}
              placeholder='You can use {{variable}} substitutions'
            />
          </Form.Item>
        </Form>
      </Card>

      <Tabs
        activeKey={previewMode}
        onChange={k => setPreviewMode(k as any)}
        items={[
          {
            key: 'edit',
            label: 'Edit',
            children: (
              <EmailEditor
                html={htmlContent}
                variables={data.variables}
                onChange={html => {
                  setHtmlContent(html);
                  setDirty(true);
                }}
              />
            )
          },
          {
            key: 'preview-desktop',
            label: 'Preview (desktop)',
            children: <PreviewFrame html={htmlContent} width={600} />
          },
          {
            key: 'preview-mobile',
            label: 'Preview (mobile)',
            children: <PreviewFrame html={htmlContent} width={360} />
          }
        ]}
      />

      <Card size='small' style={{ background: '#fafafa' }}>
        <Typography.Title level={5}>Available variables</Typography.Title>
        <Typography.Paragraph type='secondary' style={{ marginTop: -4, fontSize: 13 }}>
          Use these tokens anywhere in the subject or body. They'll be replaced with real values when the email is sent.
        </Typography.Paragraph>
        <Space wrap>
          {data.variables.map(v => (
            <Tag key={v}>
              <code>{`{{${v}}}`}</code>
            </Tag>
          ))}
        </Space>
        <Typography.Paragraph type='secondary' style={{ marginTop: 12, fontSize: 12 }}>
          You can also wrap optional content in <code>{`{{#if variableName}}…{{/if}}`}</code> blocks — the block is
          stripped entirely if the variable is empty.
        </Typography.Paragraph>
      </Card>

      <Modal
        title='Send a test email'
        open={testModalOpen}
        onCancel={() => setTestModalOpen(false)}
        onOk={sendTest}
        confirmLoading={sendingTest}
        okText='Send'
      >
        <Typography.Paragraph style={{ fontSize: 13 }}>
          A test will be sent with sample values for each variable. Leave blank to send to your own login email.
        </Typography.Paragraph>
        <Input value={testTo} onChange={e => setTestTo(e.target.value)} placeholder='you@example.com' />
      </Modal>
    </Space>
  );
};

function PreviewFrame({ html, width }: { html: string; width: number }) {
  return (
    <div style={{ background: '#f4f3f0', padding: 24, borderRadius: 6 }}>
      <iframe
        srcDoc={html}
        style={{
          width,
          maxWidth: '100%',
          minHeight: 480,
          border: '1px solid #ddd',
          background: '#fff',
          display: 'block',
          margin: '0 auto',
          borderRadius: 4
        }}
      />
    </div>
  );
}

AdminEmailEditPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => {
  return (
    <Template {...pageProps} selectedMenuItem='admin/emails' title='Emails'>
      {page}
    </Template>
  );
};

export default AdminEmailEditPage;
