import { Layout, Steps as AntSteps } from 'antd';
import styled from 'styled-components';

export const LogoAndMenuWrapper = styled.div`
  display: flex;
  flex-grow: 1;

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
`;

export const ContentContainer = styled(Layout.Content)`
  padding: 2rem;
  margin: 0 auto;
  background: red;
  display: flex;
  width: 100%;
  background-color: #f4f3f0;
  background-position: 100% 0;
  background-repeat: no-repeat;
  background-size: 400px;
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

export const HeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  h1 {
    margin-top: 0;
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
