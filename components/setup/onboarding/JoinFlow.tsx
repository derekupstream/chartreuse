import { ArrowLeftOutlined } from '@ant-design/icons';
import { Alert, Button, Form, Input, Modal, Typography, message } from 'antd';
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

const BRAND_GREEN = '#2bbe50';

export function JoinFlow({ suggestions, isRegistering, onSubmitInviteCode, onRequestSent, onBack }: Props) {
  const { firebaseUser } = useAuth();
  const [requestTarget, setRequestTarget] = useState<SuggestedOrg | null>(null);
  const [inviteCodeTarget, setInviteCodeTarget] = useState<SuggestedOrg | 'no-match' | null>(null);

  function handleInviteCodeSubmit(inviteCode: string) {
    onSubmitInviteCode({
      inviteCode,
      email: firebaseUser?.email || '',
      name: firebaseUser?.displayName || '',
      title: '',
      phone: '',
      orgName: ''
    });
  }

  const hasMatches = suggestions.length > 0;

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
      <Button
        type='link'
        onClick={onBack}
        style={{ color: BRAND_GREEN, fontWeight: 500, marginBottom: 8 }}
        icon={<ArrowLeftOutlined />}
      >
        Back
      </Button>

      <div style={{ marginBottom: 24 }}>
        <img
          src='/images/found-org-icon.jpg'
          alt={hasMatches ? 'Organization found' : 'Searching for organization'}
          style={{ width: '100%', maxWidth: 360, height: 'auto', display: 'block', margin: '0 auto' }}
        />
      </div>

      {hasMatches ? (
        <>
          <Typography.Title level={2} style={{ fontWeight: 700, lineHeight: 1.2, marginBottom: 16 }}>
            {suggestions.length === 1
              ? 'We found an organization that matches your email'
              : `We found ${suggestions.length} organizations that match your email`}
          </Typography.Title>
          <Typography.Paragraph style={{ fontSize: 15, color: 'rgba(0,0,0,0.65)', marginBottom: 32 }}>
            Would you like to request to join {suggestions.length === 1 ? 'this organization' : 'one of them'} or use an
            invite code if you have one?
          </Typography.Paragraph>

          {suggestions.map((org, idx) => (
            <div
              key={org.id}
              style={{
                marginBottom: idx === suggestions.length - 1 ? 0 : 32,
                paddingBottom: idx === suggestions.length - 1 ? 0 : 32,
                borderBottom: idx === suggestions.length - 1 ? 'none' : '1px solid #eee'
              }}
            >
              <Typography.Title level={4} style={{ marginTop: 0, marginBottom: 4 }}>
                {org.name}{' '}
                <Typography.Text type='secondary' style={{ fontWeight: 400, fontSize: 16 }}>
                  ({org.memberCount} {org.memberCount === 1 ? 'member' : 'members'})
                </Typography.Text>
              </Typography.Title>
              {org.adminName && (
                <Typography.Paragraph style={{ color: 'rgba(0,0,0,0.55)', fontSize: 14, marginBottom: 24 }}>
                  Admin: {org.adminName}
                  {org.adminEmail && ` (${org.adminEmail})`}
                </Typography.Paragraph>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
                <Button
                  type='primary'
                  size='large'
                  onClick={() => setRequestTarget(org)}
                  style={{
                    width: '100%',
                    maxWidth: 360,
                    height: 48,
                    background: BRAND_GREEN,
                    borderColor: BRAND_GREEN,
                    fontWeight: 500
                  }}
                >
                  Request to join
                </Button>
                <Button
                  size='large'
                  onClick={() => setInviteCodeTarget(org)}
                  style={{
                    width: '100%',
                    maxWidth: 360,
                    height: 48,
                    borderColor: BRAND_GREEN,
                    color: BRAND_GREEN,
                    fontWeight: 500
                  }}
                >
                  I have an invite code
                </Button>
              </div>
            </div>
          ))}
        </>
      ) : (
        <>
          <Typography.Title level={2} style={{ fontWeight: 700, lineHeight: 1.2, marginBottom: 16 }}>
            We couldn't find an organization for your email
          </Typography.Title>
          <Typography.Paragraph style={{ fontSize: 15, color: 'rgba(0,0,0,0.65)', marginBottom: 32 }}>
            If a teammate gave you an invite code, enter it below. Otherwise, head back to create a new organization.
          </Typography.Paragraph>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              size='large'
              onClick={() => setInviteCodeTarget('no-match')}
              style={{
                width: '100%',
                maxWidth: 360,
                height: 48,
                borderColor: BRAND_GREEN,
                color: BRAND_GREEN,
                fontWeight: 500
              }}
            >
              I have an invite code
            </Button>
          </div>
        </>
      )}

      {requestTarget && (
        <RequestToJoinModal
          target={requestTarget}
          onClose={() => setRequestTarget(null)}
          onSent={() => {
            const orgName = requestTarget.name;
            setRequestTarget(null);
            onRequestSent(orgName);
          }}
        />
      )}

      {inviteCodeTarget && (
        <InviteCodeModal
          target={inviteCodeTarget}
          isSubmitting={isRegistering}
          onClose={() => setInviteCodeTarget(null)}
          onSubmit={handleInviteCodeSubmit}
        />
      )}
    </div>
  );
}

type RequestModalProps = {
  target: SuggestedOrg;
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
        body: JSON.stringify({ orgId: target.id, name: values.name, message: values.message })
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
    <Modal open title={`Request to join ${target.name}`} onCancel={onClose} footer={null} destroyOnClose>
      <Typography.Paragraph style={{ marginBottom: 16, fontSize: 13 }}>
        An admin at {target.name} will be emailed and can approve or decline your request.
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
          <Button
            type='primary'
            htmlType='submit'
            block
            loading={submitting}
            style={{ background: BRAND_GREEN, borderColor: BRAND_GREEN }}
          >
            Send request
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}

type InviteCodeModalProps = {
  target: SuggestedOrg | 'no-match';
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (code: string) => void;
};

function InviteCodeModal({ target, isSubmitting, onClose, onSubmit }: InviteCodeModalProps) {
  const [form] = Form.useForm<{ inviteCode: string }>();
  const title = target === 'no-match' ? 'Enter your invite code' : `Join ${target.name}`;

  return (
    <Modal open title={title} onCancel={onClose} footer={null} destroyOnClose>
      <Form form={form} layout='vertical' onFinish={({ inviteCode }) => onSubmit(inviteCode)}>
        <Form.Item
          label='Invite code'
          name='inviteCode'
          rules={[{ required: true, message: 'Enter the invite code your admin shared.' }]}
        >
          <Input placeholder='e.g. A1B2C3D4' style={{ textTransform: 'uppercase' }} autoFocus />
        </Form.Item>
        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type='primary'
            htmlType='submit'
            block
            loading={isSubmitting}
            style={{ background: BRAND_GREEN, borderColor: BRAND_GREEN }}
          >
            Join
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
