import dynamic from 'next/dynamic';
import styled from 'styled-components';
const Bar = dynamic(() => import('@ant-design/plots').then(item => item.Bar), { ssr: false });

const ChartContainer = styled.div`
  height: 100px;
  width: 100%;
`;

type Props = {
  data: { baseline: number; forecast: number };
  formatter?: (datum: any) => string;
};

// ref: https://ant-design-charts-v1.antgroup.com/en/examples/bar/grouped#basic

export default function GroupedBar({ data, formatter = (val: number) => val?.toLocaleString() }: Props) {
  const config = {
    data: [
      {
        label: '',
        type: 'Baseline',
        value: data.baseline
      },
      {
        label: '',
        type: 'Forecast',
        value: data.forecast
      }
    ],
    style: {
      minWidth: 25,
      maxWidth: 25
    },
    marginLeft: 0,
    marginTop: 0,
    marginBottom: 0,
    group: true,
    xField: 'type',
    yField: 'value',
    seriesField: 'type',
    scale: {
      color: {
        range: ['#E0FACA', '#95EE49']
      },
      x: {
        padding: 0.7 // pushes the bars a bit from the edge of the chart
      }
    },
    colorField: 'type',
    // axis: { x: {
    //   label: {
    //     formatter: (datum: string) => formatter(parseInt(datum)),
    //   }
    // } },
    axis: {
      x: {
        line: true,
        tick: false,
        label: null
      },
      y: {
        grid: true,
        gridLineDash: [0, 0],
        gridStrokeOpacity: 0.2,
        tick: false,
        labelAutoRotate: false,
        label: {
          formatter: (datum: string) => formatter(parseInt(datum))
        }
      }
    },
    label: {
      formatter: (text: string, datum: any) => formatter(datum.value)
    },
    tooltip: {
      items: [
        {
          field: 'value',
          valueFormatter: (text: string) => formatter(text)
        }
      ]
    },
    // @ts-ignore - make Bar types happy
    legend: false as undefined
  };
  return (
    <ChartContainer>
      <Bar {...config} />
    </ChartContainer>
  );
}
