import styled from "styled-components";
import { Layout, Menu } from "antd";
import { blue } from "@ant-design/colors";

export const Sider = styled(Layout.Sider)`
  overflow: auto;
  height: 100vh;
  position: fixed;
  left: 0;
`;

export const LayoutHeader = styled(Layout.Header)`
  padding: 0 1rem;
  display: flex;
  justify-content: flex-end;
  align-items: center;
`;

export const Content = styled(Layout.Content)`
  min-height: calc(100vh - 64px);
  padding: 2rem;
`;

export const SpaceBetween = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const SiderWrapper = styled.div`
  padding: 1rem;

  .ant-typography {
    color: white;
  }
`;

export const MenuItem = styled(Menu.Item)`
  &.ant-menu-item-selected {
    background-color: ${blue[7]} !important;
  }
`;
