import { useRouter } from 'next/router'
import Image from 'next/image'
import { Button, Dropdown, message, Typography } from 'antd'
import { useAuth } from 'hooks/useAuth'
import { Layout, Menu } from 'antd'
import Logo from 'public/images/chartreuse-logo-icon.png'
import { DownOutlined } from '@ant-design/icons'
import { MenuClickEventHandler, MenuInfo } from 'rc-menu/lib/interface'
import { createGlobalStyle } from 'styled-components'
import { DashboardUser } from 'components/dashboard'

import * as S from './styles'

const GlobalStyles = createGlobalStyle`
  body {
    background-color: #f4f3f0;
  }
`

const INITIAL_SELECTED_MENU_ITEM = 'accounts'

type Props = {
  user: DashboardUser
  selectedMenuItem: any
  children: any
}

const DashboardTemplate: React.FC<Props> = ({ user, selectedMenuItem, children }) => {
  const { signout } = useAuth()
  const router = useRouter()

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
  }

  return (
    <>
      <GlobalStyles />
      <Layout>
        <S.LayoutHeader>
          <S.LogoAndMenuWrapper>
            <Image src={Logo} alt="Chareuse logo" objectFit="contain" />
            <Menu mode="horizontal" disabledOverflow={true} defaultSelectedKeys={[selectedMenuItem || INITIAL_SELECTED_MENU_ITEM]} onClick={handleMenuClick}>
              <Menu.Item key="projects">Projects</Menu.Item>
              <Menu.Item key="accounts">Accounts</Menu.Item>
              <Menu.Item key="members">Members</Menu.Item>
            </Menu>
          </S.LogoAndMenuWrapper>
          <S.OrgAndUserWrapper>
            <Typography.Text type="secondary">{user.org.name}</Typography.Text>
            <Dropdown
              overlay={
                <Menu theme="light">
                  <Menu.Item>
                    <a onClick={handleLogout}>Logout</a>
                  </Menu.Item>
                </Menu>
              }
              placement="bottomRight"
            >
              <Button type="ghost">
                {user.name} <DownOutlined />
              </Button>
            </Dropdown>
          </S.OrgAndUserWrapper>
        </S.LayoutHeader>
        <S.Content>{children}</S.Content>
      </Layout>
    </>
  )
}

export default DashboardTemplate
