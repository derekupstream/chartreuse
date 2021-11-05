import dynamic from 'next/dynamic'
// import { Column } from '@ant-design/charts'
const Column = dynamic(() => import('@ant-design/charts').then(mod => mod.Column) as any, { ssr: false })

const Chart: React.FC = () => {
  const data = [
    {
      name: 'London',
      month: 'Single-use product weight',
      value: 35.6,
    },
    {
      name: 'Berlin',
      month: 'Single-use product weight',
      value: 12.4,
    },
    {
      name: 'London',
      month: 'Disposable shipping box weight',
      value: 23.2,
    },
    {
      name: 'Berlin',
      month: 'Disposable shipping box weight',
      value: 34.5,
    },
  ]

  return (
    <Column
      // @ts-ignore
      data={data}
      isGroup
      xField="month"
      yField="value"
      seriesField="name"
      legend={{
        position: 'bottom-left',
      }}
      layout={[{ type: 'interval-adjust-position' }, { type: 'interval-hide-overlap' }, { type: 'adjust-color' }]}
    />
  )
}

export default Chart
