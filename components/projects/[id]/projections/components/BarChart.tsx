import dynamic from 'next/dynamic';
import type { FC, ComponentType } from 'react';
import styled from 'styled-components';
// lazy import because ant-design charts does not work with SSR
const Bar = dynamic(() => import('@ant-design/plots').then(r => r.Bar), { ssr: false });

const ChartContainer = styled.div`
  height: 200px;
  width: 100%;
`;

type Props = {
  data: { label: string; value: number }[];
  formatter?: (text: string, datum: any) => string;
  seriesField?: string;
};

const layout = [{ type: 'interval-adjust-position' }, { type: 'interval-hide-overlap' }, { type: 'adjust-color' }];

const Chart: React.FC<Props> = props => {
  const { data, seriesField } = props;
  return (
    <ChartContainer>
      <Bar
        data={data}
        marginLeft={0}
        marginTop={0}
        marginBottom={0}
        label={{
          formatter: props.formatter,
          position: 'left',
          dx: 10 // pushes the labels a bit from the edge of the bar
        }}
        style={{
          minWidth: 40,
          maxWidth: 40
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
        theme={{
          styleSheet: {
            brandColor: '#95EE49'
          },
          innerLabels: {
            textStyle: {
              fontWeight: 'bold'
            }
          }
        }}
        xField='label'
        yField='value'
        colorField='label'
        scale={{
          color: {
            range: ['#E0FACA', '#95EE49']
          },
          x: {
            padding: 0.5 // pushes the bars a bit from the edge of the chart
          }
        }}
        seriesField={seriesField}
        color={['#E0FACA', '#95EE49']}
        isGroup
        group
        legend={{
          color: {
            position: 'bottom'
            // layout: { alignItems: 'flex-start', justifyContent: 'flex-end' }
          }
        }}
        tooltip={{
          items: [
            {
              field: 'value',
              valueFormatter: (text: string) => parseFloat(text || '').toLocaleString()
            }
          ]
        }}
        //layout={layout}
      />
    </ChartContainer>
  );
};

export default Chart;
