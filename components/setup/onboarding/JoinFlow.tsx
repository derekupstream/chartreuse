import { ArrowLeftOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Form, Input, Modal, Typography, message } from 'antd';
import { useState } from 'react';

import { useAuth } from 'hooks/useAuth';
import type { OnboardingFields } from 'components/setup/onboarding/Onboarding';
import type { SuggestedOrg } from 'pages/api/orgs/suggest';

type Props = {
  suggestions: SuggestedOrg[];
  isRegistering: boolean;
  onSubmitInviteCode: (values: OnboardingFields & { inviteCode: string }) => void;
  onRequestSent: (orgName: string) => void;
  onBack: () => void;
};

type RequestState = { orgId: string; orgName: string } | null;

export function JoinFlow({ suggestions, isRegistering, onSubmitInviteCode, onRequestSent, onBack }: Props) {
  const { firebaseUser } = useAuth();
  const [requestTarget, setRequestTarget] = useState<RequestState>(null);
  const [inviteCodeOrgId, setInviteCodeOrgId] = useState<string | null>(null);
  const [inviteCodeForm] = Form.useForm<{ inviteCode: string }>();

  function handleInviteCodeSubmit({ inviteCode }: { inviteCode: string }) {
    onSubmitInviteCode({
      inviteCode,
      email: firebaseUser?.email || '',
      name: firebaseUser?.displayName || '',
      title: '',
      phone: '',
      orgName: ''
    });
  }

  return (
    <div style={{ maxWidth: 540, margin: '0 auto' }}>
      <Button type='link' icon={<ArrowLeftOutlined />} onClick={onBack} style={{ marginBottom: 12, paddingLeft: 0 }}>
        Back
      </Button>

      <Typography.Title level={4} style={{ marginBottom: 16, fontWeight: 500 }}>
        Join your team's organization
      </Typography.Title>

      {suggestions.length === 0 ? (
        <Alert
          type='info'
          showIcon
          style={{ marginBottom: 16 }}
          message="We couldn't find any orgs matching your email domain."
          description='If a teammate sent you an invite code, enter it below.'
        />
      ) : (
        <Typography.Paragraph style={{ marginBottom: 16, fontSize: 14 }}>
          We found {suggestions.length} {suggestions.length === 1 ? 'organization' : 'organizations'} matching your
          email. Pick one and either enter an invite code or request to join.
        </Typography.Paragraph>
      )}

      {suggestions.map(org => (
        <Card key={org.id} size='small' style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div>
              <Typography.Text strong>{org.name}</Typography.Text>{' '}
              <Typography.Text type='secondary' style={{ fontSize: 12 }}>
                ({org.memberCount} {org.memberCount === 1 ? 'member' : 'members'})
              </Typography.Text>
              {org.adminName && (
                <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.55)', marginTop: 4 }}>
                  Admin: {org.adminName}
                  {org.adminEmail && ` (${org.adminEmail})`}
                </div>
              )}
            </div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button
              size='small'
              onClick={() => {
                setInviteCodeOrgId(org.id);
                inviteCodeForm.resetFields();
              }}
            >
              I have an invite code
            </Button>
            <Button size='small' type='primary' onClick={() => setRequestTarget({ orgId: org.id, orgName: org.name })}>
              Request to join
            </Button>
          </div>
          {inviteCodeOrgId === org.id && (
            <Form form={inviteCodeForm} layout='vertical' onFinish={handleInviteCodeSubmit} style={{ marginTop: 12 }}>
              <Form.Item
                label='Invite code'
                name='inviteCode'
                rules={[{ required: true, message: 'Enter the invite code your admin shared.' }]}
              >
                <Input placeholder='e.g. A1B2C3D4' style={{ textTransform: 'uppercase' }} />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0 }}>
                <Button type='primary' htmlType='submit' loading={isRegistering}>
                  Join {org.name}
                </Button>
              </Form.Item>
            </Form>
          )}
        </Card>
      ))}

      {suggestions.length === 0 && (
        <Card size='small'>
          <Form layout='vertical' onFinish={handleInviteCodeSubmit}>
            <Form.Item
              label='Invite code'
              name='inviteCode'
              rules={[{ required: true, message: 'Enter the invite code your admin shared.' }]}
            >
              <Input placeholder='e.g. A1B2C3D4' style={{ textTransform: 'uppercase' }} />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button type='primary' htmlType='submit' loading={isRegistering}>
                Join
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )}

      {requestTarget && (
        <RequestToJoinModal
          target={requestTarget}
          onClose={() => setRequestTarget(null)}
          onSent={() => {
            const orgName = requestTarget.orgName;
            setRequestTarget(null);
            onRequestSent(orgName);
          }}
        />
      )}
    </div>
  );
}

type RequestModalProps = {
  target: { orgId: string; orgName: string };
  onClose: () => void;
  onSent: () => void;
};

function RequestToJoinModal({ target, onClose, onSent }: RequestModalProps) {
  const { firebaseUser } = useAuth();
  const [form] = Form.useForm<{ name: string; message?: string }>();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(values: { name: string; message?: string }) {
    setSubmitting(true);
    try {
      const res = await fetch('/api/join-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId: target.orgId, name: values.name, message: values.message })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to send request');
      }
      onSent();
    } catch (err: any) {
      message.error(err.message || 'Failed to send request');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open title={`Request to join ${target.orgName}`} onCancel={onClose} footer={null} destroyOnClose>
      <Typography.Paragraph style={{ marginBottom: 16, fontSize: 13 }}>
        An admin at {target.orgName} will be emailed and can approve or decline your request.
      </Typography.Paragraph>
      <Form
        form={form}
        layout='vertical'
        initialValues={{ name: firebaseUser?.displayName || '' }}
        onFinish={handleSubmit}
      >
        <Form.Item label='Your name' name='name' rules={[{ required: true, message: 'Please enter your name.' }]}>
          <Input placeholder='Jane Doe' />
        </Form.Item>
        <Form.Item label='Message to admins (optional)' name='message'>
          <Input.TextArea rows={3} placeholder='e.g. New team member joining the Foodware program.' />
        </Form.Item>
        <Form.Item style={{ marginBottom: 0 }}>
          <Button type='primary' htmlType='submit' block loading={submitting}>
            Send request
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
