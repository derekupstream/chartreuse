import { BarChartOutlined, HomeOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { Layout, Menu } from 'antd';
import Link from 'next/link';
import styled from 'styled-components';

import { ErrorBoundary } from 'components/common/errors/ErrorBoundary';
import type { DashboardUser } from 'interfaces';
import * as S from 'layouts/styles';

import { BaseLayout } from './BaseLayout';

const Sider = styled(Layout.Sider)`
  background: white !important;
  border-right: 1px solid #f0f0f0;

  .ant-layout-sider-children {
    display: flex;
    flex-direction: column;
  }

  @media (max-width: 767px) {
    display: none;
  }
`;

const AdminContent = styled(Layout)`
  background: #f4f3f0;
`;

const siderMenuItems = [
  { key: 'admin', icon: <HomeOutlined />, label: <Link href='/admin'>Overview</Link> },
  { key: 'admin/orgs', icon: <TeamOutlined />, label: <Link href='/admin/orgs'>Organizations</Link> },
  { key: 'admin/users', icon: <UserOutlined />, label: <Link href='/admin/users'>Users</Link> },
  {
    key: 'upstream/total-annual-impact',
    icon: <BarChartOutlined />,
    label: <Link href='/upstream/total-annual-impact'>Analytics</Link>
  }
];

type Props = {
  children: any;
  selectedMenuItem: string;
  title: string;
  user: DashboardUser;
};

export const AdminLayout: React.FC<Props> = ({ children, selectedMenuItem, ...props }) => {
  return (
    <BaseLayout selectedMenuItem={selectedMenuItem} {...props}>
      <AdminContent style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
        <Sider width={200}>
          <Menu
            mode='inline'
            selectedKeys={[selectedMenuItem]}
            style={{ height: '100%', borderRight: 0, paddingTop: 16 }}
            items={siderMenuItems}
          />
        </Sider>
        <S.ContentContainer style={{ flex: 1 }}>
          <S.Content style={{ maxWidth: 1200 }}>
            <ErrorBoundary>{children}</ErrorBoundary>
          </S.Content>
        </S.ContentContainer>
      </AdminContent>
    </BaseLayout>
  );
};
