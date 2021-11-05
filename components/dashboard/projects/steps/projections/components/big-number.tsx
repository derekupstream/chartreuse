import { FallOutlined } from '@ant-design/icons'
import { Tag } from 'antd'
import styled from 'styled-components'

type Color = 'success' | 'default'

type Props = {
  value: string
  percentage?: string
  color?: Color
}

const BigNumber: React.FC<Props> = props => {
  const { value, percentage, color } = props
  return (
    <BigNumberContainer>
      <Value color={color}>{value}</Value>
      {percentage && (
        <Tag icon={<FallOutlined />} color={color}>
          {percentage}
        </Tag>
      )}
    </BigNumberContainer>
  )
}

const BigNumberContainer = styled.div`
  display: flex;
  align-items: center;
`

type ValueProps = {
  color?: Color
}

const Value = styled.span<ValueProps>`
  font-weight: 700;
  font-size: 36px;
  line-height: 48px;
  letter-spacing: -2px;
  margin-right: 16px;
  color: ${p => (p.color === 'success' ? '#10B981' : '#000')};
`

export default BigNumber
