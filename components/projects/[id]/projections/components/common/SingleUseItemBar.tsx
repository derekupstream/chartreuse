import type { ReactNode } from 'react';
import styled from 'styled-components';
import dynamic from 'next/dynamic';
import type { BulletConfig } from '@ant-design/plots';
// lazy import because ant-design charts does not work with SSR
const Bullet = dynamic(() => import('@ant-design/plots/es/components/bullet'), { ssr: false });

const ChartContainer = styled.div`
  height: 100px;
  width: 100%;
`;

type Props = {
  data: { bottles: number; foodware: number };
  formatter?: (datum: any) => string | ReactNode;
};

export function SingleUseItemBar({ data }: Props) {
  // reference: https://ant-design-charts.antgroup.com/en/components/plots/bullet#%E6%A6%82%E8%A7%88 (use browser translate to read)
  const config: Partial<BulletConfig> = {
    data: [
      {
        title: '',
        ranges: [data.foodware, data.bottles]
      }
    ],
    measureField: 'measures',
    rangeField: 'ranges',
    xField: 'title',
    color: {
      ranges: ['#E0FACA', '#95EE49'],
      measures: [],
      target: []
    },
    mapField: {
      ranges: ['Foodware', 'Bottles'],
      measures: [],
      target: []
    },
    axis: {
      x: {
        line: null
      },
      y: {
        tickMethod: () => {
          return [];
        }
      }
    },
    // ref: https://ant-design-charts.antgroup.com/options/plots/legend
    legend: {
      color: {
        position: 'bottom',
        layout: { justifyContent: 'flex-end' }
      }
    }
  };
  return (
    <ChartContainer>
      <Bullet {...config} />
    </ChartContainer>
  );
}
