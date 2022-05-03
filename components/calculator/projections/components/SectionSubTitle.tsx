import { Typography } from 'antd'
import styled from 'styled-components'

const Text = styled(Typography.Text)`
  color: #8c8c8c;
  line-height: 32px;
  font-size: 16px;
`

const SectionSubTitle: React.FC<{ children: any }> = ({ children }) => {
  return <Text>{children}</Text>
}

export default SectionSubTitle
