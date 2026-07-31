import {
  ApiOutlined,
  BarChartOutlined,
  ExperimentOutlined,
  FlagOutlined,
  HomeOutlined,
  MailOutlined,
  ProjectOutlined,
  TeamOutlined,
  UserOutlined,
  WarningOutlined
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
  'data-science/databases',
  'admin/methodology',
  'data-science/golden-datasets',
  'data-science/test-runs',
  'data-science/constants',
  'data-science/change-requests',
  'data-science/calculations',
  'data-science/designer-v2',
  'data-science/smart-fields',
  'data-science/import',
  'data-science/data-products',
  'data-science/pipeline',
  'data-science/snapshots',
  'data-science/runs',
  'data-science/impact',
  'data-science/inputs',
  'data-science/data-map',
  'data-science/lineage'
];

const RSP_KEYS = ['rsp', 'rsp/api-keys', 'rsp/test-hub', 'rsp/feed', 'rsp/key-detail'];

const ORGS_KEYS = ['admin/orgs', 'admin/duplicates'];

const siderMenuItems = [
  { key: 'admin', icon: <HomeOutlined />, label: <Link href='/admin'>Overview</Link> },
  {
    key: 'orgs-group',
    icon: <TeamOutlined />,
    label: <Link href='/admin/orgs'>Organizations</Link>,
    children: [
      { key: 'admin/orgs', label: <Link href='/admin/orgs'>All Organizations</Link> },
      { key: 'admin/duplicates', icon: <WarningOutlined />, label: <Link href='/admin/duplicates'>Duplicates</Link> }
    ]
  },
  { key: 'admin/projects', icon: <ProjectOutlined />, label: <Link href='/admin/projects'>Projects</Link> },
  { key: 'admin/users', icon: <UserOutlined />, label: <Link href='/admin/users'>Users</Link> },
  { key: 'admin/feedback', icon: <FlagOutlined />, label: <Link href='/admin/feedback'>Feedback</Link> },
  { key: 'admin/emails', icon: <MailOutlined />, label: <Link href='/admin/emails'>Emails</Link> },
  {
    key: 'admin/analytics',
    icon: <BarChartOutlined />,
    label: <Link href='/admin/analytics'>Analytics</Link>
  },
  {
    key: 'data-science-group',
    icon: <ExperimentOutlined />,
    label: <Link href='/admin/data-science'>Data Science</Link>,
    children: [
      { key: 'data-science', label: <Link href='/admin/data-science'>Overview</Link> },
      { key: 'data-science/inputs', label: <Link href='/admin/data-science/inputs'>Inputs</Link> },
      { key: 'data-science/data-map', label: <Link href='/admin/data-science/data-map'>Data Map</Link> },
      { key: 'data-science/constants', label: <Link href='/admin/data-science/constants'>Factors</Link> },
      { key: 'data-science/databases', label: <Link href='/admin/data-science/databases'>Databases</Link> },
      {
        key: 'data-science/smart-fields',
        label: <Link href='/admin/data-science/smart-fields'>Calculations</Link>
      },
      {
        key: 'data-science/designer-v2',
        label: <Link href='/admin/data-science/data-product-designer-v2'>Data Product Designer</Link>
      },
      {
        key: 'data-science/data-products',
        label: <Link href='/admin/data-science/data-products'>Data Products</Link>
      },
      {
        key: 'data-science/calculations',
        label: <Link href='/admin/data-science/calculations'>Functions</Link>
      },
      { key: 'data-science/test-runs', label: <Link href='/admin/data-science/test-runs'>Test Runs</Link> },
      { key: 'admin/methodology', label: <Link href='/admin/methodology'>Methodology</Link> },
      {
        key: 'data-science/change-requests',
        label: <Link href='/admin/data-science/change-requests'>Change Requests</Link>
      },
      { key: 'data-science/import', label: <Link href='/admin/data-science/import'>AI Data Uploader</Link> },
      {
        key: 'data-science-advanced',
        label: 'Advanced',
        children: [
          { key: 'data-science/lineage', label: <Link href='/admin/data-science/lineage'>Lineage</Link> },
          { key: 'data-science/snapshots', label: <Link href='/admin/data-science/snapshots'>Snapshots</Link> },
          { key: 'data-science/runs', label: <Link href='/admin/data-science/runs'>Run History</Link> },
          { key: 'data-science/impact', label: <Link href='/admin/data-science/impact'>Impact Simulator</Link> }
        ]
      }
    ]
  },
  {
    key: 'rsp-group',
    icon: <ApiOutlined />,
    label: <Link href='/admin/rsp'>RSP Hub</Link>,
    children: [
      { key: 'rsp', label: <Link href='/admin/rsp'>Dashboard</Link> },
      { key: 'rsp/feed', label: <Link href='/admin/rsp/feed'>Activity Feed</Link> },
      { key: 'rsp/api-keys', label: <Link href='/admin/rsp/api-keys'>API Keys</Link> },
      { key: 'rsp/test-hub', label: <Link href='/admin/rsp/test-hub'>Test Hub</Link> }
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
  const openKeys = [
    ...(ORGS_KEYS.includes(selectedMenuItem) ? ['orgs-group'] : []),
    ...(DATA_SCIENCE_KEYS.includes(selectedMenuItem) ? ['data-science-group'] : []),
    ...(RSP_KEYS.includes(selectedMenuItem) ? ['rsp-group'] : [])
  ];

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
