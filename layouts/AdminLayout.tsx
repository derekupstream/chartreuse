import {
  BarChartOutlined,
  ExperimentOutlined,
  FlagOutlined,
  HomeOutlined,
  TeamOutlined,
  UserOutlined
} from '@ant-design/icons';
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

const DATA_SCIENCE_KEYS = [
  'data-science',
  'admin/methodology',
  'data-science/golden-datasets',
  'data-science/test-runs',
  'data-science/constants'
];

const siderMenuItems = [
  { key: 'admin', icon: <HomeOutlined />, label: <Link href='/admin'>Overview</Link> },
  { key: 'admin/orgs', icon: <TeamOutlined />, label: <Link href='/admin/orgs'>Organizations</Link> },
  { key: 'admin/users', icon: <UserOutlined />, label: <Link href='/admin/users'>Users</Link> },
  { key: 'admin/feedback', icon: <FlagOutlined />, label: <Link href='/admin/feedback'>Feedback</Link> },
  {
    key: 'upstream/total-annual-impact',
    icon: <BarChartOutlined />,
    label: <Link href='/upstream/total-annual-impact'>Analytics</Link>
  },
  {
    key: 'data-science-group',
    icon: <ExperimentOutlined />,
    label: <Link href='/admin/data-science'>Data Science</Link>,
    children: [
      { key: 'data-science', label: <Link href='/admin/data-science'>Overview</Link> },
      { key: 'admin/methodology', label: <Link href='/admin/methodology'>Methodology</Link> },
      {
        key: 'data-science/golden-datasets',
        label: <Link href='/admin/data-science/golden-datasets'>Golden Datasets</Link>
      },
      { key: 'data-science/test-runs', label: <Link href='/admin/data-science/test-runs'>Test Runs</Link> },
      { key: 'data-science/constants', label: <Link href='/admin/data-science/constants'>Constants</Link> }
    ]
  }
];

type Props = {
  children: any;
  selectedMenuItem: string;
  title: string;
  user: DashboardUser;
};

export const AdminLayout: React.FC<Props> = ({ children, selectedMenuItem, ...props }) => {
  const openKeys = DATA_SCIENCE_KEYS.includes(selectedMenuItem) ? ['data-science-group'] : [];

  return (
    <BaseLayout selectedMenuItem={selectedMenuItem} {...props}>
      <AdminContent style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
        <Sider width={210}>
          <Menu
            mode='inline'
            selectedKeys={[selectedMenuItem]}
            defaultOpenKeys={openKeys}
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
