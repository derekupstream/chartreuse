import dynamic from 'next/dynamic';
const Column = dynamic(() => import('@ant-design/plots/es/components/column'), { ssr: false });

type Props = {
  data: { label: string; value: number }[];
  seriesField?: string;
};

const layout = [{ type: 'interval-adjust-position' }, { type: 'interval-hide-overlap' }, { type: 'adjust-color' }];

const Chart: React.FC<Props> = props => {
  const { data, seriesField } = props;
  return (
    <Column
      height={300}
      data={data}
      theme={{
        styleSheet: {
          brandColor: '#95EE49'
        }
      }}
      xField='label'
      yField='value'
      minColumnWidth={60}
      maxColumnWidth={60}
      seriesField={seriesField}
      color={['#E0FACA', '#95EE49']}
      isGroup
      colorField={seriesField}
      marginLeft={0}
      marginBottom={0}
      legend={{
        color: {
          position: 'bottom'
          // layout: { alignItems: 'flex-start', justifyContent: 'flex-end' }
        }
      }}
      scale={{
        color: {
          range: ['#E0FACA', '#95EE49']
        }
      }}
      tooltip={{
        items: [
          {
            field: 'value',
            valueFormatter: (text: string) => parseFloat(text || '0').toLocaleString()
          }
        ]
      }}
      axis={{
        x: {
          line: true,
          tick: false,
          lineLineDash: [0, 0],
          label: null,
          labelAutoHide: true
        },
        y: {
          grid: true,
          gridLineDash: [0, 0],
          gridStrokeOpacity: 0.2,
          tick: false,
          labelAutoRotate: false
        }
      }}
      //layout={layout}
    />
  );
};

export default Chart;
