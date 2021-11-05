import { InfoCircleOutlined } from '@ant-design/icons'
import { Popover } from 'antd'
import styled from 'styled-components'

type Props = {
  title: string
  tooltipTitle?: string
  tooltipContent?: JSX.Element
}

const TitleWithTooltip: React.FC<Props> = props => {
  const { title, tooltipTitle, tooltipContent } = props

  return (
    <Box>
      <Title>{title}</Title>
      {}
    </Box>
  )
}

const Box = styled.div`
  display: flex;
  align-items: center;
`

const Title = styled.span`
  color: #262626;
  font-size: 1rem;
  font-weight: 700;
  margin-right: 6px;
`

export default TitleWithTooltip
