import { Typography } from 'antd'
import styled from 'styled-components'
import Card from './card'
import { CardTitle } from './styles'
import Tag from './tag'

const Value = styled(Typography.Text)`
  font-weight: bold;
  font-size: 32px;
  line-height: 40px;
  margin-right: 10px;
  color: #141414;
`

export const Header = styled.div`
  display: flex;
  flex-direction: column;
  ${CardTitle} {
    margin-bottom: 16px;
  }
  div {
    display: flex;
    align-items: center;
  }
`

type Props = {
  baseline?: number
  followup?: number
  change: number
  changeStr: string
  changePercent?: number
  title?: string
}

const CardComponent: React.FC<Props> = ({ children, ...props }) => {
  return (
    <Card>
      <KPIContent {...props} />
      {children}
    </Card>
  )
}

export const KPIContent: React.FC<Props> = props => {
  const { changePercent, changeStr, children } = props

  return (
    <Header>
      {props.title && <CardTitle>{props.title}</CardTitle>}
      <div>
        <Value>{changeStr}</Value>{' '}
        {changePercent && (
          <Tag flipColor={true} rising={changePercent < 0}>
            {changePercent}%
          </Tag>
        )}
      </div>
    </Header>
  )
}

export default CardComponent
