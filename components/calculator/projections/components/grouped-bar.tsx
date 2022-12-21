import styled from 'styled-components'
import { Bar } from '@ant-design/plots'

const ChartContainer = styled.div`
  height: 100px;
  width: 100%;
`

type Props = {
  data: { baseline: number; forecast: number }
  formatter?: (datum: any) => string
}

// ref: https://charts.ant.design/en/examples/bar/grouped#basic

export default function GroupedBar({ data, formatter = (val: number) => val?.toLocaleString() }: Props) {
  const config = {
    data: [
      {
        label: '',
        type: 'Baseline',
        value: data.baseline,
      },
      {
        label: '',
        type: 'Forecast',
        value: data.forecast,
      },
    ],
    isGroup: true,
    xField: 'value',
    yField: 'label',
    seriesField: 'type',
    color: ['#E0FACA', '#95EE49'],
    // xAxis: {
    //   label: {
    //     formatter: (datum: string) => formatter(parseInt(datum)),
    //   }
    // },
    label: {
      formatter: (datum: any) => formatter(datum.value),
    },
    tooltip: {
      formatter: (datum: any) => ({
        name: datum.type,
        value: formatter(datum.value),
      }),
    },
    // @ts-ignore - make Bar types happy
    legend: false as undefined,
  }
  return (
    <ChartContainer>
      <Bar {...config} />
    </ChartContainer>
  )
}
