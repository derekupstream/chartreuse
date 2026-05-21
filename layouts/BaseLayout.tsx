import { DownOutlined, MenuOutlined, RocketOutlined } from '@ant-design/icons';
import { Layout, Menu, Drawer } from 'antd';
import { Button, Dropdown, message, Typography, Divider } from 'antd';
import type { MenuProps } from 'antd';
import Image from 'next/legacy/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { MenuClickEventHandler, MenuInfo } from 'rc-menu/lib/interface';
import { useState, useEffect } from 'react';
import { createGlobalStyle } from 'styled-components';

import { SubscriptionCheck } from 'components/_app/SubscriptionCheck';
import { ImpersonationBanner } from 'components/admin/ImpersonationBanner';
import { Header } from 'components/common/Header';
import { InspectModeProvider, InspectFAB } from 'components/common/InspectMode';
import { useAuth } from 'hooks/useAuth';
import { useChartReuse2 } from 'hooks/useChartReuse2';
import { useSubscription } from 'hooks/useSubscription';
import type { DashboardUser } from 'interfaces';
import * as S from 'layouts/styles';
import { analytics } from 'lib/analytics/mixpanel.browser';
import Logo from 'public/images/chartreuse-logo-icon.png';

type DashboardProps = {
  children: any;
  selectedMenuItem: string;
  title: string;
  user: DashboardUser;
};

const GlobalStyles = createGlobalStyle`
  body {
    background-color: #f4f3f0;
  }
`;

const legacyMenuLinks: MenuProps['items'] = [
  { key: 'projects', label: <Link href='/projects'>Projects</Link> },
  { key: 'org/analytics', label: <Link href='/org/analytics'>Analytics</Link> },
  { key: 'accounts', label: <Link href='/accounts'>Accounts</Link> }
];

// In v2, the home is /dashboard, reached only by clicking the logo. The
// "Analytics" nav target is the full reporting page at /org/analytics —
// the same destination as the dashboard's "Open full Reporting" link.
const v2MenuLinks: MenuProps['items'] = [
  { key: 'projects', label: <Link href='/projects'>Calculators</Link> },
  { key: 'dashboards', label: <Link href='/dashboards'>Dashboards</Link> },
  { key: 'scenarios', label: <Link href='/scenarios'>Scenarios</Link> },
  { key: 'org/analytics', label: <Link href='/org/analytics'>Analytics</Link> },
  { key: 'accounts', label: <Link href='/accounts'>Accounts</Link> }
];

// All keys that the validation guard accepts as a top-level menu position.
// 'dashboard' is the home — valid as a selectedMenuItem even though it's
// no longer in the visible v2 menu (you reach it via the logo).
const VALID_TOP_MENU_KEYS = new Set([
  'projects',
  'dashboards',
  'org/analytics',
  'accounts',
  'members',
  'scenarios',
  'dashboard'
]);

// All valid admin keys — used for validation in the guard below
const adminLinks: MenuProps['items'] = [
  { key: 'admin', label: <Link href='/admin'>Overview</Link> },
  { key: 'admin/orgs', label: <Link href='/admin/orgs'>Organizations</Link> },
  { key: 'admin/users', label: <Link href='/admin/users'>Users</Link> },
  { key: 'admin/duplicates', label: <Link href='/admin/duplicates'>Duplicates</Link> },
  { key: 'admin/feedback', label: <Link href='/admin/feedback'>Feedback</Link> },
  { key: 'data-science', label: <Link href='/admin/data-science'>Data Science</Link> },
  { key: 'admin/methodology', label: <Link href='/admin/methodology'>Methodology</Link> },
  { key: 'data-science/golden-datasets', label: <Link href='/admin/data-science/golden-datasets'>Golden Datasets</Link> },
  { key: 'data-science/test-runs', label: <Link href='/admin/data-science/test-runs'>Test Runs</Link> },
  { key: 'data-science/constants', label: <Link href='/admin/data-science/constants'>Constants</Link> },
  {
    key: 'data-science/change-requests',
    label: <Link href='/admin/data-science/change-requests'>Change Requests</Link>
  },
  { key: 'data-science/inputs', label: <Link href='/admin/data-science/inputs'>Data Inputs</Link> },
  { key: 'data-science/data-map', label: <Link href='/admin/data-science/data-map'>Data Map</Link> },
  { key: 'data-science/lineage', label: <Link href='/admin/data-science/lineage'>Data Lineage</Link> },
  { key: 'data-science/calculations', label: <Link href='/admin/data-science/calculations'>Calculations</Link> },
  {
    key: 'data-science/data-products',
    label: <Link href='/admin/data-science/data-products'>Data Products</Link>
  },
  { key: 'data-science/import', label: <Link href='/admin/data-science/import'>Import Data</Link> },
  { key: 'data-science/pipeline', label: <Link href='/admin/data-science/pipeline'>Pipeline</Link> },
  { key: 'data-science/snapshots', label: <Link href='/admin/data-science/snapshots'>Snapshots</Link> },
  { key: 'data-science/runs', label: <Link href='/admin/data-science/runs'>Run History</Link> },
  { key: 'data-science/impact', label: <Link href='/admin/data-science/impact'>Impact Simulator</Link> },
  { key: 'admin/analytics', label: <Link href='/admin/analytics'>Analytics</Link> },
  { key: 'settings', label: <Link href='/settings'>Settings</Link> },
  { key: 'rsp', label: <Link href='/admin/rsp'>RSP Dashboard</Link> },
  { key: 'rsp/api-keys', label: <Link href='/admin/rsp/api-keys'>RSP API Keys</Link> },
  { key: 'rsp/test-hub', label: <Link href='/admin/rsp/test-hub'>RSP Test Hub</Link> },
  { key: 'rsp/feed', label: <Link href='/admin/rsp/feed'>RSP Activity Feed</Link> },
  { key: 'rsp/key-detail', label: <Link href='/admin/rsp/api-keys'>RSP Key Detail</Link> },
  { key: 'admin/projects', label: <Link href='/admin/projects'>All Projects</Link> }
];

// Top-level items shown in the Admin dropdown — matches sidebar order
const adminDropdownItems: MenuProps['items'] = [
  { key: 'admin', label: <Link href='/admin'>Overview</Link> },
  { key: 'admin/orgs', label: <Link href='/admin/orgs'>Organizations</Link> },
  { key: 'admin/projects', label: <Link href='/admin/projects'>Projects</Link> },
  { key: 'admin/users', label: <Link href='/admin/users'>Users</Link> },
  { key: 'admin/feedback', label: <Link href='/admin/feedback'>Feedback</Link> },
  { key: 'admin/analytics', label: <Link href='/admin/analytics'>Analytics</Link> },
  { key: 'data-science', label: <Link href='/admin/data-science'>Data Science</Link> },
  { key: 'rsp', label: <Link href='/admin/rsp'>RSP Hub</Link> }
];

export const BaseLayout: React.FC<DashboardProps> = ({ user, selectedMenuItem, title, children }) => {
  const { signout } = useAuth();
  const router = useRouter();
  const [keys, setKeys] = useState<string[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { trialEndDateRelative } = useSubscription();
  const { enabled: v2Enabled, setEnabled: setV2Enabled, hydrated: v2Hydrated } = useChartReuse2();
  const menuLinks = v2Enabled ? v2MenuLinks : legacyMenuLinks;

  useEffect(() => {
    analytics.identify(user.id, {
      $name: user.name,
      Organization: user.org.name
    });
  }, [user.id]);

  if (
    !VALID_TOP_MENU_KEYS.has(selectedMenuItem) &&
    !adminLinks.some(link => link?.key === selectedMenuItem)
  ) {
    throw new Error('Menu link key not found: ' + selectedMenuItem);
  }

  const handleLogout = async (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault();

    try {
      await signout();
      router.push('/login');
    } catch (error: any) {
      message.error(error.message);
    }
  };

  const handleMenuClick: MenuClickEventHandler = ({ key }: MenuInfo) => {
    router.push(`/${key}`);
    setKeys([key]);
    setDrawerOpen(false);
  };

  useEffect(() => {
    setKeys([selectedMenuItem]);
  }, [selectedMenuItem]);

  const accountLinks: MenuProps['items'] = [
    {
      key: 'members',
      label: <Link href='/members'>Members</Link>
    },
    {
      key: 'help',
      label: (
        <a href='mailto:chart-reuse@upstreamsolutions.org' target='_blank' rel='noreferrer'>
          Help
        </a>
      )
    },
    {
      key: 'logout',
      label: <a onClick={handleLogout}>Logout</a>
    }
  ];

  if (user.role === 'ORG_ADMIN') {
    accountLinks.unshift({
      key: 'settings',
      label: <Link href='/settings'>Settings</Link>
    });
  }

  const isOnAdminPage = adminLinks.some(link => link?.key === selectedMenuItem);

  const allMobileMenuItems: MenuProps['items'] = [
    ...(menuLinks ?? []),
    ...(user.org.isUpstream ? [{ key: 'admin', label: 'Admin', children: adminDropdownItems }] : []),
    { type: 'divider' },
    ...(accountLinks ?? [])
  ];

  return (
    <InspectModeProvider>
    <SubscriptionCheck>
      <Header title={title} />
      <GlobalStyles />
      <Layout style={{ display: 'flex', minHeight: '100vh' }}>
        <S.LayoutHeader>
          <S.LogoAndMenuWrapper>
            <Link
              href={v2Enabled ? '/dashboard' : '/projects'}
              aria-label='Home'
              style={{ display: 'inline-flex', alignItems: 'center' }}
            >
              <Image src={Logo} alt='Chartreuse logo' objectFit='contain' />
            </Link>
            <S.DesktopMenu>
              <Menu items={menuLinks} mode='horizontal' disabledOverflow selectedKeys={keys} onClick={handleMenuClick} />
              {trialEndDateRelative && (
                <S.FreeTrialBanner>
                  <S.FreeTrialBannerContent>
                    <Typography.Text type='secondary'>Your trial expires in {trialEndDateRelative}</Typography.Text>
                    <Link href={`/subscription`} passHref>
                      <Button type='primary' ghost>
                        Upgrade now
                      </Button>
                    </Link>
                  </S.FreeTrialBannerContent>
                </S.FreeTrialBanner>
              )}
              {user.org.isUpstream && (
                <>
                  <Divider type='vertical' style={{ height: '3em' }} />
                  <Dropdown trigger={['hover']} placement='bottomLeft' menu={{ items: adminDropdownItems }}>
                    <Link
                      href='/admin'
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '0 12px',
                        height: 46,
                        color: isOnAdminPage ? '#52c41a' : 'rgba(0,0,0,0.88)',
                        borderBottom: isOnAdminPage ? '2px solid #52c41a' : '2px solid transparent',
                        fontWeight: isOnAdminPage ? 600 : 400,
                        fontSize: 14
                      }}
                    >
                      Admin <DownOutlined style={{ fontSize: 10 }} />
                    </Link>
                  </Dropdown>
                </>
              )}
            </S.DesktopMenu>
          </S.LogoAndMenuWrapper>
          <S.OrgAndUserWrapper>
            <S.DesktopUserInfo>
              {v2Hydrated && (
                <Button
                  size='small'
                  icon={<RocketOutlined />}
                  onClick={() => setV2Enabled(!v2Enabled)}
                  style={{
                    background: v2Enabled
                      ? 'linear-gradient(90deg, #722ed1 0%, #1677ff 100%)'
                      : 'linear-gradient(90deg, #fff7e6 0%, #ffeed7 100%)',
                    color: v2Enabled ? 'white' : '#d46b08',
                    border: v2Enabled ? 'none' : '1px solid #ffd591',
                    fontWeight: 600,
                    boxShadow: v2Enabled ? '0 2px 6px rgba(114,46,209,0.25)' : 'none'
                  }}
                >
                  {v2Enabled ? 'Switch back to legacy' : 'Try Chart-Reuse 2.0'}
                </Button>
              )}
              <Typography.Text type='secondary'>{user.org.name}</Typography.Text>
              <Dropdown
                menu={{ items: accountLinks }}
                placement='bottomRight'
              >
                <Button ghost>
                  {user.name} <DownOutlined />
                </Button>
              </Dropdown>
            </S.DesktopUserInfo>
            <S.MobileMenuButton>
              <Button type='text' icon={<MenuOutlined />} onClick={() => setDrawerOpen(true)} />
            </S.MobileMenuButton>
          </S.OrgAndUserWrapper>
        </S.LayoutHeader>
        <Drawer
          title={user.org.name}
          placement='right'
          onClose={() => setDrawerOpen(false)}
          open={drawerOpen}
          width={240}
        >
          <Menu
            items={allMobileMenuItems}
            mode='inline'
            selectedKeys={keys}
            onClick={handleMenuClick}
          />
        </Drawer>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <ImpersonationBanner />
          {children}
        </div>
        {user.org.isUpstream && <InspectFAB />}
      </Layout>
    </SubscriptionCheck>
    </InspectModeProvider>
  );
};
