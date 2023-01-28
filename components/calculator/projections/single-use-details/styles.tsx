import { Typography } from 'antd'
import styled, { css } from 'styled-components'
import _Card from '../components/card'

export const Card = styled(_Card)`
  margin: 0 29px 29px 0;
  display: flex;
  flex-direction: column;
`

export const Section = styled.div`
  width: 50%;
`

export const Body = styled.div`
  display: flex;
  margin-top: 12px;
  gap: 20px;
`

export const Value = styled(Typography.Text)`
  font-weight: bold;
  font-size: 32px;
  line-height: 40px;
  margin-right: 10px;
  color: #141414;
`

export const Header = styled.div`
  display: flex;
  align-items: center;
`

type RowProps = {
  spaceBetween?: boolean
  marginBottom?: number
  flexStart?: boolean
}

export const Row = styled.div<RowProps>`
  display: flex;
  align-items: ${p => (p.flexStart ? 'flex-start' : 'center')};
  ${p =>
    p.spaceBetween &&
    css`
      justify-content: space-between;
    `}
  ${p =>
    p.marginBottom &&
    css`
      margin-bottom: ${p.marginBottom}px;
    `}
`

export const Label = styled.span`
  margin-right: 8px;
`
