import type { BarConfig } from '@ant-design/plots';
import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
const Column: ComponentType<BarConfig> = dynamic(
  () => import('@ant-design/plots/es/components/column').then(mod => mod as any),
  { ssr: false }
);

const ChartColumn: React.FC = () => {
  const data = [
    {
      name: 'London',
      month: 'Single-use product weight',
      value: 35.6
    },
    {
      name: 'Berlin',
      month: 'Single-use product weight',
      value: 12.4
    },
    {
      name: 'London',
      month: 'Disposable shipping box weight',
      value: 23.2
    },
    {
      name: 'Berlin',
      month: 'Disposable shipping box weight',
      value: 34.5
    }
  ];

  return (
    <Column
      data={data}
      isGroup
      color={['#E0FACA', '#95EE49']}
      xField='month'
      yField='value'
      seriesField='name'
      legend={{ position: 'bottom-left' }}
      // layout={[{ type: 'interval-adjust-position' }, { type: 'interval-hide-overlap' }, { type: 'adjust-color' }]}
    />
  );
};

export default ChartColumn;
