import styled from "styled-components";
import { Layout } from "antd";

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
