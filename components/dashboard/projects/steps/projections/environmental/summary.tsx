import { Radio, RadioChangeEvent, Typography } from 'antd'
import BigNumber from '../components/big-number'
import TitleWithTooltip from '../components/title-with-tooltip'
import Chart from './components/charts'
import { ViewResultsWrapper, CardsBox, Card, BigNumberWrapper, ChartTitle, Spacer } from './components/styles'

const EnvironmentalSummary: React.FC = () => {
  const onChangeResults = (event: RadioChangeEvent) => {
    console.log(event.target.value)
    // @todo continue implementation!
  }

  return (
    <div>
      <Typography.Title level={2}>Environmental summary</Typography.Title>

      <Typography.Title level={5}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed aliquam massa vel erat commodo, ut aliquam nibh convallis. Vivamus ullamcorper magna non sollicitudin pellentesque. Vestibulum
        cursus fringilla interdum. Etiam gravida sem sed magna luctus, ut faucibus nisi interdum. In blandit quis elit volutpat consequat.
      </Typography.Title>

      <ViewResultsWrapper>
        <Typography.Text css="margin-right: 20px;">View results in:</Typography.Text>
        <Radio.Group onChange={onChangeResults} defaultValue="punds">
          <Radio.Button value="punds">Punds</Radio.Button>
          <Radio.Button value="tons">Tons</Radio.Button>
        </Radio.Group>
      </ViewResultsWrapper>

      <CardsBox>
        <Card>
          <TitleWithTooltip title="Your total annual waste changes" />

          <BigNumberWrapper>
            <BigNumber value="- 33,644 lbs." />
          </BigNumberWrapper>

          <ChartTitle>Annual waste changes</ChartTitle>
          <Chart />
        </Card>

        <Spacer />

        <Card>
          <TitleWithTooltip title="Annual net GHG emissions changes" />

          <BigNumberWrapper>
            <BigNumber value="35.27 lbs." />
          </BigNumberWrapper>

          <ChartTitle>Annual waste changes (pounds)</ChartTitle>
          <Chart />
        </Card>
      </CardsBox>
    </div>
  )
}

export default EnvironmentalSummary
