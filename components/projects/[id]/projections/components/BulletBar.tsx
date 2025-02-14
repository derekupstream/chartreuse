import type { ReactNode } from 'react';
import styled from 'styled-components';
import dynamic from 'next/dynamic';
// lazy import because ant-design charts does not work with SSR
const Bullet = dynamic(() => import('@ant-design/plots/es/components/bullet'), { ssr: false });

const ChartContainer = styled.div`
  height: 100px;
  width: 100%;
`;

type Props = {
  data: { current: number; max: number; target: number };
  formatter?: (datum: any) => string | ReactNode;
};

export default function KPIBullet({ data, formatter = (val: number) => val?.toLocaleString() }: Props) {
  const baselineField = 'Baseline';
  const targetField = 'Median';
  const forecastField = 'Forecast';

  const config = {
    data: [
      {
        title: '',
        ranges: [data.max],
        [forecastField]: [data.current],
        [targetField]: data.target
      }
    ],
    measureField: forecastField,
    rangeField: 'ranges',
    targetField,
    xField: 'title',
    color: {
      range: '#f0efff',
      measure: '#95EE49',
      target: '#E0FACA'
    },
    meta: {
      [forecastField]: { formatter },
      [targetField]: { formatter },
      ranges: { formatter }
    },
    axis: {
      x: {
        line: null
      },
      y: {
        tickMethod: ({ max }: { max: number }) => {
          const interval = Math.ceil(max / 5); // 自定义刻度 ticks

          return [0, interval, interval * 2, interval * 3, interval * 4, max];
        }
      }
    }
  };
  return (
    <ChartContainer>
      <Bullet {...config} />
    </ChartContainer>
  );
}
