import styled from 'styled-components'
import { Card, Form, Radio, Typography } from 'antd'

export const Wrapper = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  width: 100%;
  margin-top: 50px;
`

export const SetupForm = styled(Form)`
  width: 460px;
`

export const BoxEnd = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 4em;
`

export const RadioGroup = styled(Radio.Group)`
  display: flex;
  width: 100%;

  > label {
    flex: 1;
  }
`

export const OptionSelection = styled(Radio.Group)`
  & {
    margin-left: -10px;
  }

  .ant-radio-button-wrapper {
    margin: 10px;
  }
`

export const StyledCard = styled(Card)`
  border-radius: 4px;
  height: 100%;
`

export const CardTitle = styled(Typography.Text)`
  font-size: 16px;
  line-height: 32px;
  font-weight: bold;
  color: #262626;
`
