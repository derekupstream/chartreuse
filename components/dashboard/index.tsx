import { useRouter } from "next/router";
import Image from "next/image";
import { Button, Dropdown, message, Space, Typography } from "antd";
import { useAuth } from "hooks/useAuth";
import { Layout, Menu } from "antd";
import Logo from "assets/images/logo-inverted.png";
import { DownOutlined } from "@ant-design/icons";
import { useState } from "react";
import { MenuClickEventHandler, MenuInfo } from "rc-menu/lib/interface";
import SelectedItem, { itemMap } from "components/dashboard/selected-item";

import * as S from "./styles";

export type AccountDataType = {
  id: string;
  name: string;
  accountContactEmail: string;
  invites: {
    id: string;
    email: string;
    accepted: boolean;
    account: {
      id: string;
      name: string;
    };
  }[];
  users: {
    id: string;
    email: string;
    name: string;
    title: string;
    account: {
      id: string;
      name: string;
    };
  }[];
};

export type Props = {
  user: {
    id: string;
    email: string;
    name: string;
    org: {
      name: string;
      accounts: AccountDataType[];
    };
  };
};

const INITIAL_SELECTED_MENU_ITEM = "accounts";

export default function Dashboard({ user }: Props) {
  const { signout } = useAuth();
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState<string>(
    INITIAL_SELECTED_MENU_ITEM
  );

  const handleLogout = async (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>
  ) => {
    e.preventDefault();

    try {
      await signout();
      router.push("/login");
    } catch (error) {
      message.error(error.message);
    }
  };

  const handleMenuClick: MenuClickEventHandler = ({ key }: MenuInfo) => {
    setSelectedItem(key);
  };

  return (
    <Layout>
      <S.Sider>
        <S.SiderWrapper>
          <Image src={Logo} alt="upstream logo" objectFit="contain" />
        </S.SiderWrapper>
        <S.SiderWrapper>
          <Space direction="vertical" size="small">
            <Typography.Text>Organization</Typography.Text>
            <Typography.Title level={3} type="secondary">
              {user.org.name}
            </Typography.Title>
          </Space>
        </S.SiderWrapper>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={[INITIAL_SELECTED_MENU_ITEM]}
          onClick={handleMenuClick}
        >
          <S.MenuItem key="accounts">Accounts</S.MenuItem>
          <S.MenuItem key="members">Members</S.MenuItem>
          <S.MenuItem key="projects">Projects</S.MenuItem>
        </Menu>
      </S.Sider>
      <Layout style={{ marginLeft: 200 }}>
        <S.LayoutHeader>
          <Dropdown
            overlay={
              <Menu>
                <Menu.Item>
                  <a onClick={handleLogout}>Logout</a>
                </Menu.Item>
              </Menu>
            }
            placement="bottomRight"
          >
            <Button type="primary">
              {user.name} <DownOutlined />
            </Button>
          </Dropdown>
        </S.LayoutHeader>
        <S.Content>
          <SelectedItem
            item={selectedItem as keyof typeof itemMap}
            user={user}
          />
        </S.Content>
      </Layout>
    </Layout>
  );
}
