import { EyeOutlined, LogoutOutlined } from '@ant-design/icons';
import { Button, message } from 'antd';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

const Banner = styled.div`
  background: #faad14;
  color: #262626;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 500;
  gap: 8px;
  flex-shrink: 0;
`;

const Left = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

type ImpersonationState =
  | { impersonating: false }
  | { impersonating: true; targetUser: { name: string | null; email: string; orgName: string } };

export function ImpersonationBanner() {
  const router = useRouter();
  const [state, setState] = useState<ImpersonationState>({ impersonating: false });

  useEffect(() => {
    fetch('/api/admin/impersonation-status')
      .then(r => r.json())
      .then(setState)
      .catch(() => {});
  }, [router.asPath]);

  if (!state.impersonating) return null;

  const { targetUser } = state;

  async function exitImpersonation() {
    try {
      await fetch('/api/admin/impersonate', { method: 'DELETE' });
      router.push('/admin');
    } catch {
      message.error('Failed to exit impersonation');
    }
  }

  return (
    <Banner>
      <Left>
        <EyeOutlined />
        <span>
          Viewing as <strong>{targetUser.name || targetUser.email}</strong> &mdash; {targetUser.orgName}
        </span>
      </Left>
      <Button size='small' icon={<LogoutOutlined />} onClick={exitImpersonation}>
        Exit
      </Button>
    </Banner>
  );
}
