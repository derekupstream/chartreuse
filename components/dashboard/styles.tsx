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

export const ContentContainer = styled(Layout.Content)`
  min-height: calc(100vh - 64px);
  padding: 2rem;
  margin: 0 auto;
  width: 100%;
  background-color: #f4f3f0;
  background-position: 100% 0;
  background-repeat: no-repeat;
  background-size: 400px;
`

export const Content = styled.div`
  margin: 0 auto;
  max-width: 1100px;
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
  & {
    border-bottom: 1px solid #ccc;
    border-top: 1px solid #ccc;
    padding: 20px 0;
  }

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
