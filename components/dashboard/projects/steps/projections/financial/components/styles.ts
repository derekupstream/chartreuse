import { Typography } from 'antd'
import styled from 'styled-components'

export const CardsBox = styled.div`
  display: flex;
`

export const Card = styled.div`
  width: 300px;
  padding: 8px;
`

export const Background = styled.div`
  background-color: #f8fafc;
  width: 100%;
  padding: 8px;
`

export const Col = styled.div`
  display: flex;
  flex-direction: column;
`

export const Text = styled(Typography.Text)`
  margin-right: 15px;
`

interface TitleProps {
  fontSize: number
}

export const Title = styled.span<TitleProps>`
  font-size: ${p => p.fontSize}px;
  color: #475569;
`

interface ValueProps {
  color?: 'green' | 'black'
}

export const Value = styled.span<ValueProps>`
  font-weight: bold;
  font-size: 2rem;
  color: ${p => p.color ?? 'black'};
`
