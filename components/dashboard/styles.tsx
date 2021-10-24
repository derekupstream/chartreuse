import styled from 'styled-components'
import { Layout, Steps as AntSteps } from 'antd'

export const LogoAndMenuWrapper = styled.div`
  display: flex;

  > ul {
    margin-left: 20px;
  }
`

export const LayoutHeader = styled(Layout.Header)`
  padding: 0 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: white;
`

export const Content = styled(Layout.Content)`
  min-height: calc(100vh - 64px);
  padding: 2rem;
  background-color: #f4f3f0;
  max-width: 1080px;
  margin: 0 auto;
  width: 100%;
`

export const OrgAndUserWrapper = styled.div`
  display: flex;
  align-items: center;

  button {
    margin-left: 20px;
  }
`

export const SpaceBetween = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

export const SiderWrapper = styled.div`
  padding: 1rem;

  .ant-typography {
    color: white;
  }
`

export const Steps = styled(AntSteps)`
  .ant-steps-item-description {
    min-width: 150px;
    font-size: 13px;
  }
`

export const ProjectType = styled.div`
  text-transform: uppercase;
  font-size: 8px;
  color: #6b6b6b;
`

export const ProjectInfo = styled.div`
  margin-bottom: 20px;
`

export const Actions = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
`
