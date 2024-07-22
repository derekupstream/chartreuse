import { Col, message, Popconfirm, Row, Typography } from 'antd';
import type { FC } from 'react';

import { DELETE } from 'lib/http';
import type { ReusableProduct } from 'lib/inventory/types/products';
import type { ReusableLineItem } from 'lib/inventory/types/projects';

import { InfoRow as StyledInfoRow } from '../../styles';

import Forecast from './Forecast';
import InitialCosts from './InitialCosts';

export type ReusableItemRecord = {
  lineItem: ReusableLineItem;
  product?: ReusableProduct;
};

interface Props {
  item: ReusableItemRecord;
  onDelete(): void;
  onEdit: (item: ReusableItemRecord) => void;
  readOnly: boolean;
}

interface deleteResponse {
  lineItem: ReusableLineItem;
}

export const ItemRow: FC<Props> = ({ item, onEdit, onDelete, readOnly }) => {
  const onClickConfirm = async () => {
    const url = `/api/projects/${item.lineItem.projectId}/reusable-items`;
    try {
      await DELETE<deleteResponse>(url, { id: item.lineItem.id });
      message.success(`Item "${item.lineItem.productName}" removed`);
      onDelete();
    } catch (error: any) {
      if (error.error || error.message) {
        message.error(error.error || error.message);
      }
    }
  };

  return (
    <StyledInfoRow>
      <Col span={8}>
        <Typography.Title level={5}>{item.lineItem.productName || item.product?.description}</Typography.Title>
        {!readOnly && (
          <>
            <a
              href='#'
              onClick={e => {
                onEdit(item);
                e.preventDefault();
              }}
            >
              Edit
            </a>
            <Typography.Text style={{ opacity: '.25' }}> | </Typography.Text>
            <Popconfirm
              title='Are you sure to delete this item?'
              onConfirm={onClickConfirm}
              okText='Yes'
              cancelText='No'
            >
              <a href='#'>Delete</a>
            </Popconfirm>
          </>
        )}
      </Col>
      <Col span={8}>
        <InitialCosts item={item.lineItem} />
      </Col>
      <Col span={8}>
        <Forecast item={item.lineItem} />
      </Col>
    </StyledInfoRow>
  );
};
