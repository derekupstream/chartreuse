import styled from 'styled-components'

const Title = styled.span`
  font-weight: bold;
  font-size: 12px;
  line-height: 24px;
`

export const TabPaneTitle: React.FC = ({ children }) => {
  return <Title>{children}</Title>
}
