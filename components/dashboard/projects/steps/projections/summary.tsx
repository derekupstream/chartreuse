import { Typography } from 'antd'
import { ProjectionsResponse } from 'internal-api/calculator'

const Summary = ({ projections }: { projections: ProjectionsResponse }) => {
  return (
    <div>
      <Typography.Title level={2}>Summary report for Redding Cafe West</Typography.Title>
      Summary page
    </div>
  )
}

export default Summary
