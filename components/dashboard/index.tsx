import { useRouter } from "next/router";
import Image from "next/image";
import { Button, Dropdown, message } from "antd";
import { useAuth } from "hooks/useAuth";
import { Layout, Menu } from "antd";
import Logo from "assets/images/logo-inverted.png";
import { DownOutlined } from "@ant-design/icons";
import { useState } from "react";
import { MenuClickEventHandler, MenuInfo } from "rc-menu/lib/interface";

import * as S from "./styles";

export type Props = {
  user: {
    id: string;
    email: string;
    name: string;
    org: {
      accounts: {
        id: string;
        name: string;
      }[];
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
        <div style={{ padding: "1rem" }}>
          <Image src={Logo} alt="upstream logo" objectFit="contain" />
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={[INITIAL_SELECTED_MENU_ITEM]}
          onClick={handleMenuClick}
        >
          <Menu.Item key="accounts">Accounts</Menu.Item>
          <Menu.Item key="members">Members</Menu.Item>
          <Menu.Item key="projects">Projects</Menu.Item>
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
          {selectedItem === "accounts"
            ? user.org.accounts.map((account) => {
                return <div key={account.id}>{account.name}</div>;
              })
            : selectedItem}
        </S.Content>
      </Layout>
    </Layout>
  );
}
