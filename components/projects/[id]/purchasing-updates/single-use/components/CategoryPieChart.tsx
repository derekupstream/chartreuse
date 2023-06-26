import type { PieConfig } from '@ant-design/plots';
import { Pie, measureTextWidth } from '@ant-design/plots';
import React, { memo, useState, useEffect } from 'react';
import styled from 'styled-components';

const StyledPie = styled(Pie)``;

type Props = {
  data: { label: string; value: number }[];
};

const PieChart = ({ data }: Props) => {
  const config: PieConfig = {
    data,
    autoFit: false,
    height: 160,
    angleField: 'value',
    colorField: 'label',
    radius: 1,
    innerRadius: 0.7,
    meta: {
      value: {
        formatter: v => v.toLocaleString() + ' units'
      }
    },
    label: false,
    statistic: {
      title: false,
      content: false
    }
    // statistic: {
    //   title: {
    //     offsetY: -4,
    //     style: {
    //       fontSize: '14px',
    //     },
    //     formatter: datum => datum?.label,
    //   },
    //   content: {
    //     offsetY: 4,
    //     style: {
    //       fontSize: '24px',
    //     },
    //     customHtml: (container, view, datum, _data) => {
    //       const { width } = container.getBoundingClientRect()
    //       const text = datum ? `${datum.value}%` : ``
    //       return renderStatistic(width, text, {
    //         fontSize: 24,
    //       })
    //     },
    //   },
    // },
    // interactions: [
    //   {
    //     type: 'element-active',
    //   },
    // ],
  };
  return <StyledPie {...config} />;
};

export default memo(PieChart);
