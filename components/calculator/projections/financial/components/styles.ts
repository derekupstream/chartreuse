import { Typography } from 'antd'
import styled from 'styled-components'

export const Card = styled.div`
  width: 300px;
  padding: 8px;
`

export const Background = styled.div`
  margin-top: 24px;
  padding: 16px;
  background-color: #ffffff;
  border: 1px solid #eeeeed;
  box-sizing: border-box;
  box-shadow: 0px 0px 12px rgba(0, 0, 0, 0.08);
  border-radius: 8px;
`

export const Col = styled.div`
  display: flex;
  flex-direction: column;
`

export const Text = styled(Typography.Text)`
  display: block;
  margin-right: 15px;
  margin-bottom: 1em;
  margin-top: 1em;
`

export const Title = styled.p`
  font-size: 12px;
  color: #475569;
  margin-bottom: 0.25em;
`

interface ValueProps {
  color?: 'green' | 'black'
}

export const Value = styled.p<ValueProps>`
  font-weight: bold;
  font-size: 24px;
  line-height: 32px;
  color: ${p => p.color ?? 'black'};
`
