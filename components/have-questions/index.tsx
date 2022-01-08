import { Typography } from 'antd'

const HaveQuestions = () => {
  return (
    <div style={{ fontSize: '.9em', textAlign: 'center', margin: '2em 0' }}>
      <Typography.Text type="secondary">
        Have questions? Email{' '}
        <a style={{ color: 'inherit', textDecoration: 'underline' }} href="mailto:chartreuse@upstreamsolutions.org">
          chartreuse@upstreamsolutions.org
        </a>
      </Typography.Text>
    </div>
  )
}

export default HaveQuestions
