import styled from 'styled-components'
// import { Bar } from "@ant-design/charts"
import dynamic from 'next/dynamic'
import { ComponentType } from 'react'
import type { BarConfig } from '@ant-design/plots'
// lazy import because ant-design charts does not work with SSR
const Bar: ComponentType<BarConfig> = dynamic(() => import('@ant-design/plots/es/components/bar'), { ssr: false })

const ChartContainer = styled.div`
  height: 200px;
  width: 100%;
`

type Props = {
  data: { label: string; value: number }[]
  formatter?: (datum: any) => string
  seriesField?: string
}

const layout = [{ type: 'interval-adjust-position' }, { type: 'interval-hide-overlap' }, { type: 'adjust-color' }]

const Chart: React.FC<Props> = props => {
  const { data, seriesField } = props
  return (
    <ChartContainer>
      <Bar
        data={data}
        label={{
          formatter: props.formatter,
          position: 'left',
        }}
        minBarWidth={40}
        maxBarWidth={40}
        yAxis={{
          label: null,
        }}
        theme={{
          styleSheet: {
            brandColor: '#95EE49',
          },
          innerLabels: {
            textStyle: {
              fontWeight: 'bold',
            },
          },
        }}
        xField="value"
        yField="label"
        seriesField={seriesField}
        color={['#E0FACA', '#95EE49']}
        isGroup
        legend={{ position: 'bottom-left' }}
        //layout={layout}
      />
    </ChartContainer>
  )
}

export default Chart
