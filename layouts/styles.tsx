import { Layout, Steps as AntSteps } from 'antd';
import styled from 'styled-components';

export const LogoAndMenuWrapper = styled.div`
  display: flex;
  align-items: center;
  flex-grow: 1;
  min-width: 0;

  > ul {
    margin-left: 20px;
  }
`;

export const FreeTrialBanner = styled.div`
  flex-grow: 1;
  display: flex;
  justify-content: center;
`;

export const FreeTrialBannerContent = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  display: none;
  > span {
    display: none;
  }
  @media (min-width: 900px) {
    display: flex;
  }
  @media (min-width: 1200px) {
    > span {
      display: block;
    }
  }
`;

export const LayoutHeader = styled(Layout.Header)`
  padding: 0 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: white;
  width: 100%;
`;

export const ContentContainer = styled(Layout.Content)`
  padding: 1rem;
  padding-bottom: calc(1rem + 56px); /* room for sticky footer on mobile */
  margin: 0 auto;
  display: flex;
  width: 100%;
  background-color: #f4f3f0;
  background-position: 100% 0;
  background-repeat: no-repeat;
  background-size: 400px;

  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

export const Content = styled.div`
  align-self: stretch;
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  max-width: 1100px;
  width: 100%;
`;

export const OrgAndUserWrapper = styled.div`
  display: flex;
  align-items: center;

  button {
    margin-left: 20px;
  }
`;

export const DesktopMenu = styled.div`
  display: none;
  align-items: center;
  flex-grow: 1;

  @media (min-width: 768px) {
    display: flex;
  }
`;

export const DesktopUserInfo = styled.div`
  display: none;
  align-items: center;
  gap: 8px;

  button {
    margin-left: 20px;
  }

  @media (min-width: 768px) {
    display: flex;
  }
`;

export const MobileMenuButton = styled.div`
  display: flex;

  @media (min-width: 768px) {
    display: none;
  }
`;

export const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
  h1 {
    margin-top: 0;
    margin-bottom: 0;
    font-size: clamp(22px, 5vw, 38px) !important;
  }
`;

export const SiderWrapper = styled.div`
  padding: 1rem;

  .ant-typography {
    color: white;
  }
`;

export const ProjectType = styled.div`
  text-transform: uppercase;
  font-size: 8px;
  color: #6b6b6b;
`;

export const ProjectInfo = styled.div`
  margin-bottom: 20px;
  margin-top: 20px;
`;

export const Actions = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
`;
