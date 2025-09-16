import { Col, message, Popconfirm, Row, Typography } from 'antd';
import type { FC } from 'react';

import { PRODUCT_TYPES_MAP } from 'lib/calculator/constants/reusable-product-types';
import { MATERIAL_MAP } from 'lib/calculator/constants/materials';
import { DELETE } from 'lib/http';
import type { ReusableProduct } from 'lib/inventory/types/products';
import type { ReusableLineItem } from 'lib/inventory/types/projects';
import type { FoodwareLineItem } from 'lib/projects/getProjectFoodwareLineItems';

import { InfoRow as StyledInfoRow } from '../../styles';

import { SingleUseCard } from './SingleUseCard';
import { ReusableCard } from './ReusableCard';
import { FoodwareArtwork } from './FoodwareArtwork';
import { DisabledLink } from 'components/common/DisabledLink';

export type ReusableItemRecord = {
  lineItem: ReusableLineItem;
  product?: ReusableProduct;
};

interface Props {
  item: FoodwareLineItem;
  onDelete(): void;
  onEdit: (item: FoodwareLineItem) => void;
  readOnly: boolean;
}

interface deleteResponse {
  lineItem: ReusableLineItem;
}

export const ItemRow: FC<Props> = ({ item, onEdit, onDelete, readOnly }) => {
  const onClickConfirm = async () => {
    const url = `/api/projects/${item.projectId}/foodware-items`;
    try {
      await DELETE<deleteResponse>(url, { id: item.id });
      message.success(`Item removed`);
      onDelete();
    } catch (error: any) {
      if (error.error || error.message) {
        message.error(error.error || error.message);
      }
    }
  };

  return (
    <StyledInfoRow>
      <Col span={8} style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ float: 'left', marginRight: '20px' }}>
          <FoodwareArtwork reusableProductId={item.reusableProduct.id} />
        </div>
        <div>
          <Typography.Title level={5} style={{ marginBottom: '0.5em', marginTop: 0 }}>
            {PRODUCT_TYPES_MAP[item.reusableProduct.type]}
          </Typography.Title>
          <Typography.Paragraph style={{ fontSize: 12 }}>{item.foodwareTitle}</Typography.Paragraph>
          {/* <Typography.Title level={5}>{item.lineItem.productName || item.product?.description}</Typography.Title> */}
          {!readOnly && (
            <>
              <DisabledLink onClick={() => onEdit(item)}>Edit</DisabledLink>
              <Typography.Text style={{ opacity: '.25' }}> | </Typography.Text>
              <Popconfirm
                title='Are you sure to delete this item?'
                onConfirm={onClickConfirm}
                okText='Yes'
                cancelText='No'
              >
                <DisabledLink>Delete</DisabledLink>
              </Popconfirm>
            </>
          )}
        </div>
      </Col>
      <Col span={8}>
        <ReusableCard item={item} />
      </Col>
      <Col span={8}>
        <SingleUseCard item={item} />
      </Col>
    </StyledInfoRow>
  );
};
