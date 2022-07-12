import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button, Dropdown, message, Typography, Divider, MenuProps } from 'antd'
import { useAuth } from 'hooks/useAuth'
import { Layout, Menu } from 'antd'
import Link from 'next/link';
import Logo from 'public/images/chartreuse-logo-icon.png'
import { DownOutlined } from '@ant-design/icons'
import { MenuClickEventHandler, MenuInfo, MenuItemType, SubMenuType } from 'rc-menu/lib/interface'
import { createGlobalStyle } from 'styled-components'
import { DashboardUser } from 'components/dashboard'
import * as S from 'components/dashboard/styles'
import Header from 'components/header'

type DashboardProps = {
  children: any
  selectedMenuItem: string
  title: string
  user: DashboardUser
}

const GlobalStyles = createGlobalStyle`
  body {
    background-color: #f4f3f0;
  }
`

const menuLinks: MenuProps['items'] = [
  { key: 'projects', label: <Link href='/projects'>Projects</Link> },
  { key: 'org-analytics', label: <Link href='/org-analytics'>Analytics</Link> },
  { key: 'accounts', label: <Link href='/accounts'>Accounts</Link> },
  { key: 'members', label: <Link href='/members'>Members</Link> },
]

const upstreamLinks: MenuProps['items'] = [
  { key: 'upstream/orgs', label: <Link href='/upstream/orgs'>Organizations</Link> },
  { key: 'upstream/total-annual-impact', label: <Link href='/upstream/total-annual-impact'>Analytics</Link> }
]

const DashboardTemplate: React.FC<DashboardProps> = ({ user, selectedMenuItem, title, children }) => {
  const { signout } = useAuth()
  const router = useRouter()
  const [keys, setKeys] = useState<string[]>([])

  if (!menuLinks.some(link => link?.key === selectedMenuItem) && !upstreamLinks.some(link => link?.key === selectedMenuItem)) {
    throw new Error('Menu link key not found: ' + selectedMenuItem)
  }

  const handleLogout = async (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault()

    try {
      await signout()
      router.push('/login')
    } catch (error: any) {
      message.error(error.message)
    }
  }

  const handleMenuClick: MenuClickEventHandler = ({ key }: MenuInfo) => {
    router.push(`/${key}`)
    setKeys([key])
  }

  useEffect(() => {
    setKeys([selectedMenuItem])
  }, [selectedMenuItem])

  const accountLinks: MenuProps['items'] = [
    {
      key: 'accounts',
      label: <a href='mailto:chartreuse@upstreamsolutions.org' target='_blank' rel="noreferrer">Help</a>
    },
    {
      key: 'logout',
      label: <a onClick={handleLogout}>Logout</a>
    },
  ]

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
  ]

  return (
    <>
      <Header title={title} />
      <GlobalStyles />
      <Layout style={{ display: 'flex', minHeight: '100vh' }}>
        <S.LayoutHeader>
          <S.LogoAndMenuWrapper>
            <Image src={Logo} alt='Chareuse logo' objectFit='contain' />
            <Menu
              items={menuLinks}
              mode='horizontal'
              disabledOverflow
              selectedKeys={keys} onClick={handleMenuClick}
            />
            {user.org.isUpstream && (
              <Menu items={extendedLinks} mode='horizontal' disabledOverflow selectedKeys={keys} onClick={handleMenuClick} />
            )}
          </S.LogoAndMenuWrapper>
          <S.OrgAndUserWrapper>
            <Typography.Text type='secondary'>{user.org.name}</Typography.Text>
            <Dropdown
              overlay={
                <Menu theme='light' items={accountLinks} />
              }
              placement='bottomRight'
            >
              <Button type='ghost'>
                {user.name} <DownOutlined />
              </Button>
            </Dropdown>
          </S.OrgAndUserWrapper>
        </S.LayoutHeader>
        {children}
      </Layout>
    </>
  )
}

export default DashboardTemplate
