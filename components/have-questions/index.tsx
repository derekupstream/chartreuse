import { Typography } from 'antd'
import styled from 'styled-components'

const Container = styled(Typography.Text)`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  font-size: 0.9em;
  text-align: right;
  margin: 2em 0;
  padding: 0 2em;
  width: 100%;
  a {
    color: inherit;
  }
`

const HaveQuestions = () => {
  return (
    <Container type="secondary">
      <span>
        <a href="https://chartreuse.eco" target="_blank" rel="noreferrer">
          Chart Reuse
        </a>
      </span>
      <span style={{ opacity: '30%' }}>|</span>
      <span>
        Have questions? Email{' '}
        <a style={{ textDecoration: 'underline' }} href="mailto:chartreuse@upstreamsolutions.org">
          chartreuse@upstreamsolutions.org
        </a>
      </span>
    </Container>
  )
}

export default HaveQuestions
