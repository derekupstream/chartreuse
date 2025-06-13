import { Col, Row, Typography } from 'antd';
import type { FC } from 'react';

import { InfoCard, SmallText, SmallerText } from '../../styles';
import { MATERIAL_MAP } from 'lib/calculator/constants/materials';
import { FoodwareLineItem } from 'lib/projects/getProjectFoodwareLineItems';

interface Props {
  item: FoodwareLineItem;
}

export const SingleUseCard: FC<Props> = ({ item }) => {
  return (
    <InfoCard theme='forecast' style={{ height: '160px' }}>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        Replacing
      </Typography.Title>
      <Typography.Text>{MATERIAL_MAP[item.singleUseProduct.primaryMaterial]?.name}</Typography.Text>
    </InfoCard>
  );
};
