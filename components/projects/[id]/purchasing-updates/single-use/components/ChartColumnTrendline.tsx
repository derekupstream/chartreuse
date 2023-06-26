import type { DualAxesConfig } from '@ant-design/plots';
import { DualAxes } from '@ant-design/plots';

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
        formatter: v => (useUnits ? v.toLocaleString() + ' units' : '$' + v.toLocaleString())
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
        lineStyle: {
          lineWidth: 2,
          smooth: true,
          lineDash: [8, 8]
        }
      }
    ]
  };
  return <DualAxes {...config} />;
};

export default Chart;
