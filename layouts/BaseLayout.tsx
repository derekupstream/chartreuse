import { DownOutlined } from '@ant-design/icons';
import { Layout, Menu } from 'antd';
import { Button, Dropdown, message, Typography, Divider } from 'antd';
import type { MenuProps } from 'antd';
import Image from 'next/legacy/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { MenuClickEventHandler, MenuInfo, MenuItemType, SubMenuType } from 'rc-menu/lib/interface';
import { useState, useEffect } from 'react';
import { createGlobalStyle } from 'styled-components';

import { SubscriptionCheck } from 'components/_app/SubscriptionCheck';
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
  { key: 'members', label: <Link href='/members'>Members</Link> },
  { key: 'subscription', label: <Link href='/subscription'>Subscription</Link> }
];

const upstreamLinks: MenuProps['items'] = [
  { key: 'upstream/orgs', label: <Link href='/upstream/orgs'>Organizations</Link> },
  { key: 'upstream/total-annual-impact', label: <Link href='/upstream/total-annual-impact'>Analytics</Link> }
];

export const BaseLayout: React.FC<DashboardProps> = ({ user, selectedMenuItem, title, children }) => {
  const { signout } = useAuth();
  const router = useRouter();
  const [keys, setKeys] = useState<string[]>([]);
  const { trialEndDateRelative } = useSubscription();

  useEffect(() => {
    analytics.identify(user.id, {
      $name: user.name,
      Organization: user.org.name
    });
  }, [user.id]);

  if (
    !menuLinks.some(link => link?.key === selectedMenuItem) &&
    !upstreamLinks.some(link => link?.key === selectedMenuItem)
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
      label: <Link href={'/org/edit?redirect=' + encodeURIComponent(router.asPath)}>Edit organization</Link>
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
      key: 'upstream',
      label: 'Upstream',
      children: upstreamLinks
    }
  ];

  return (
    <SubscriptionCheck>
      <Header title={title} />
      <GlobalStyles />
      <Layout style={{ display: 'flex', minHeight: '100vh' }}>
        <S.LayoutHeader>
          <S.LogoAndMenuWrapper>
            <Image src={Logo} alt='Chareuse logo' objectFit='contain' />
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
                selectedKeys={keys}
                onClick={handleMenuClick}
              />
            )}
          </S.LogoAndMenuWrapper>
          <S.OrgAndUserWrapper>
            <Typography.Text type='secondary'>{user.org.name}</Typography.Text>
            <Dropdown menu={{ items: accountLinks }} placement='bottomRight'>
              <Button ghost>
                {user.name} <DownOutlined />
              </Button>
            </Dropdown>
          </S.OrgAndUserWrapper>
        </S.LayoutHeader>
        {children}
      </Layout>
    </SubscriptionCheck>
  );
};
