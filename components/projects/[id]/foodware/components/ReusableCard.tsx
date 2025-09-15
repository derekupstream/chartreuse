import { Col, Row, Typography } from 'antd';
import type { FC } from 'react';
import type { FoodwareLineItem } from 'lib/projects/getProjectFoodwareLineItems';

import { InfoCard } from '../../styles';
import { MATERIAL_MAP } from 'lib/calculator/constants/materials';

interface Props {
  item: FoodwareLineItem;
}

export const ReusableCard: FC<Props> = ({ item }) => {
  return (
    <InfoCard theme='baseline' style={{ height: '160px' }}>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        Material
      </Typography.Title>
      <Typography.Text>{MATERIAL_MAP[item.reusableProduct.primaryMaterial]?.name ?? 'N/A'}</Typography.Text>
    </InfoCard>
  );
};
