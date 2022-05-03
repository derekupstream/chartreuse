import { useRouter } from 'next/router'
import Image from 'next/image'
import { Button, Dropdown, message, Typography, Divider } from 'antd'
import { useAuth } from 'hooks/useAuth'
import { Layout, Menu } from 'antd'
import Logo from 'public/images/chartreuse-logo-icon.png'
import { DownOutlined } from '@ant-design/icons'
import { MenuClickEventHandler, MenuInfo } from 'rc-menu/lib/interface'
import { createGlobalStyle } from 'styled-components'
import { DashboardUser } from 'components/dashboard'
import * as S from 'components/dashboard/styles'
import Header from 'components/header'

type DashboardProps = {
  selectedMenuItem?: string
  title: string
  user: DashboardUser
}

const GlobalStyles = createGlobalStyle`
  body {
    background-color: #f4f3f0;
  }
`

const INITIAL_SELECTED_MENU_ITEM = 'projects'

const DashboardTemplate: React.FC<DashboardProps> = ({ user, selectedMenuItem, title, children }) => {
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
      <Header title={title} />
      <GlobalStyles />
      <Layout style={{ display: 'flex', minHeight: '100vh' }}>
        <S.LayoutHeader>
          <S.LogoAndMenuWrapper>
            <Image src={Logo} alt='Chareuse logo' objectFit='contain' />
            <Menu mode='horizontal' disabledOverflow={true} defaultSelectedKeys={[selectedMenuItem || INITIAL_SELECTED_MENU_ITEM]} onClick={handleMenuClick}>
              <Menu.Item key='projects'>Projects</Menu.Item>
              <Menu.Item key='accounts'>Accounts</Menu.Item>
              <Menu.Item key='members'>Members</Menu.Item>
            </Menu>
            {user.org.isUpstream && (
              <Menu mode='horizontal' disabledOverflow={true} defaultSelectedKeys={[selectedMenuItem || INITIAL_SELECTED_MENU_ITEM]} onClick={handleMenuClick}>

                <Menu.Item key='divider' disabled style={{ cursor: 'default' }}>
                  <Divider type='vertical' style={{ height: '3em' }} />
                </Menu.Item>
                <Menu.Item key='orgs'>All Organizations</Menu.Item>
              </Menu>
            )}
          </S.LogoAndMenuWrapper>
          <S.OrgAndUserWrapper>
            <Typography.Text type='secondary'>{user.org.name}</Typography.Text>
            <Dropdown
              overlay={
                <Menu theme='light'>
                  <Menu.Item>
                    <a href='https://chartreuse.eco'>Help</a>
                  </Menu.Item>
                  <Menu.Item>
                    <a onClick={handleLogout}>Logout</a>
                  </Menu.Item>
                </Menu>
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
