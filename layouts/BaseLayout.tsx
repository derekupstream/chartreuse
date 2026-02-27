import { DownOutlined, MenuOutlined } from '@ant-design/icons';
import { Layout, Menu, Drawer } from 'antd';
import { Button, Dropdown, message, Typography, Divider } from 'antd';
import type { MenuProps } from 'antd';
import Image from 'next/legacy/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { MenuClickEventHandler, MenuInfo, MenuItemType, SubMenuType } from 'rc-menu/lib/interface';
import { useState, useEffect } from 'react';
import { createGlobalStyle } from 'styled-components';

import { SubscriptionCheck } from 'components/_app/SubscriptionCheck';
import { ImpersonationBanner } from 'components/admin/ImpersonationBanner';
import { Header } from 'components/common/Header';
import { useAuth } from 'hooks/useAuth';
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

const menuLinks: MenuProps['items'] = [
  { key: 'projects', label: <Link href='/projects'>Projects</Link> },
  { key: 'org/analytics', label: <Link href='/org/analytics'>Analytics</Link> },
  { key: 'accounts', label: <Link href='/accounts'>Accounts</Link> },
  { key: 'members', label: <Link href='/members'>Members</Link> }
  // { key: 'subscription', label: <Link href='/subscription'>Subscription</Link> }
];

const adminLinks: MenuProps['items'] = [
  { key: 'admin', label: <Link href='/admin'>Overview</Link> },
  { key: 'admin/orgs', label: <Link href='/admin/orgs'>Organizations</Link> },
  { key: 'admin/users', label: <Link href='/admin/users'>Users</Link> },
  { key: 'admin/feedback', label: <Link href='/admin/feedback'>Feedback</Link> },
  { key: 'upstream/total-annual-impact', label: <Link href='/upstream/total-annual-impact'>Analytics</Link> }
];

export const BaseLayout: React.FC<DashboardProps> = ({ user, selectedMenuItem, title, children }) => {
  const { signout } = useAuth();
  const router = useRouter();
  const [keys, setKeys] = useState<string[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { trialEndDateRelative } = useSubscription();

  useEffect(() => {
    analytics.identify(user.id, {
      $name: user.name,
      Organization: user.org.name
    });
  }, [user.id]);

  if (
    !menuLinks.some(link => link?.key === selectedMenuItem) &&
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
      key: 'edit_org',
      label: <Link href={'/org/edit?redirect=' + encodeURIComponent(router.asPath)}>Settings</Link>
    });
  }

  const extendedLinks: (SubMenuType | MenuItemType)[] = [
    {
      key: 'divider',
      disabled: true,
      style: { cursor: 'default' },
      label: <Divider type='vertical' style={{ height: '3em' }} />
    },
    {
      key: 'admin',
      label: 'Admin',
      children: adminLinks
    }
  ];

  const allMobileMenuItems: MenuProps['items'] = [
    ...(menuLinks ?? []),
    ...(user.org.isUpstream ? [{ key: 'admin', label: 'Admin', children: adminLinks }] : []),
    { type: 'divider' },
    ...(accountLinks ?? [])
  ];

  return (
    <SubscriptionCheck>
      <Header title={title} />
      <GlobalStyles />
      <Layout style={{ display: 'flex', minHeight: '100vh' }}>
        <S.LayoutHeader>
          <S.LogoAndMenuWrapper>
            <Image src={Logo} alt='Chartreuse logo' objectFit='contain' />
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
                <Menu
                  items={extendedLinks}
                  mode='horizontal'
                  disabledOverflow
                  selectedKeys={[...keys, 'admin']}
                  onClick={handleMenuClick}
                />
              )}
            </S.DesktopMenu>
          </S.LogoAndMenuWrapper>
          <S.OrgAndUserWrapper>
            <S.DesktopUserInfo>
              <Typography.Text type='secondary'>{user.org.name}</Typography.Text>
              <Dropdown menu={{ items: accountLinks }} placement='bottomRight'>
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
      </Layout>
    </SubscriptionCheck>
  );
};
