import { Wrapper } from '../styles'
import FinancialSummary from './financial/summary'
import EnvironmentalSummary from './environmental/summary'
import Summary from './summary'

const Projections = () => {
  return (
    <Wrapper>
      <Summary />
      <FinancialSummary />
      <EnvironmentalSummary />
    </Wrapper>
  )
}

export default Projections
