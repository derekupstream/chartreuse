import type { DualAxesConfig } from '@ant-design/plots';
import dynamic from 'next/dynamic';
const DualAxes = dynamic(() => import('@ant-design/plots/es/components/dual-axes'), { ssr: false });

type Props = {
  data: { label: string; value: number }[];
  seriesField?: string;
  useUnits: boolean;
};

const Chart: React.FC<Props> = ({ data, seriesField, useUnits }) => {
  const config: DualAxesConfig = {
    height: 300,
    data: [data, []],
    // legend: {
    //   position: 'bottom-left',
    //   // items: [{ name: 'Units', value: 'count' }],
    //   itemName: {
    //     formatter: () => 'units'
    //   }
    // },
    legend: false,
    theme: {
      styleSheet: {
        brandColor: '#95EE49'
      }
    },
    xField: 'label',
    yField: ['value', 'count'],
    meta: {
      value: {
        formatter: (v: string) => (useUnits ? v.toLocaleString() + ' units' : '$' + v.toLocaleString())
      }
    },
    geometryOptions: [
      {
        geometry: 'column',
        seriesField,
        //color: '#E0FACA',
        color: ['#E0FACA', '#95EE49'],
        isGroup: true
      },
      {
        color: '#95EE49',
        geometry: 'line',
        // ref: https://charts.ant.design/en/docs/api/plots/line#linestyle
        line: {
          lineWidth: 2,
          shapeField: 'smooth',
          lineDash: [8, 8]
        }
      }
    ]
  };
  return <DualAxes {...config} />;
};

export default Chart;
