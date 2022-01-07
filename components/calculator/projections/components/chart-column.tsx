import dynamic from 'next/dynamic'
import { ComponentType } from 'react'
import type { ColumnConfig } from '@ant-design/plots'

const Column: ComponentType<ColumnConfig> = dynamic(() => import('@ant-design/charts').then(mod => mod.Column) as any, { ssr: false })

type Props = {
  data: { label: string; value: number }[]
  seriesField?: string
}

const layout = [{ type: 'interval-adjust-position' }, { type: 'interval-hide-overlap' }, { type: 'adjust-color' }]

const Chart: React.FC<Props> = props => {
  const { data, seriesField } = props
  return (
    <Column
      data={data}
      theme={{
        styleSheet: {
          brandColor: '#95EE49',
        },
      }}
      xField="label"
      yField="value"
      minColumnWidth={60}
      maxColumnWidth={60}
      seriesField={seriesField}
      color={['#E0FACA', '#95EE49']}
      isGroup
      legend={{ position: 'bottom-left' }}
      //layout={layout}
    />
  )
}

export default Chart
