import { Typography, Row, Col, Popconfirm, message } from 'antd';

import CurrencySymbol from 'components/_app/CurrencySymbol';
import { getAnnualOccurrence } from 'lib/calculator/constants/frequency';
import chartreuseClient from 'lib/chartreuseClient';
import type { SingleUseProduct } from 'lib/inventory/types/products';
import type { SingleUseLineItem } from 'lib/inventory/types/projects';
import { PRODUCT_TYPES_MAP } from 'lib/calculator/constants/product-types';
import { MATERIAL_MAP } from 'lib/calculator/constants/materials';
import * as S from '../../styles';
import { DisabledLink } from 'components/common/DisabledLink';

export type SingleUseItemRecord = {
  lineItem: SingleUseLineItem;
  product: SingleUseProduct;
};

const BaselineCard = ({ item }: { item: SingleUseItemRecord }) => {
  const annualOccurrence = getAnnualOccurrence(item.lineItem.frequency);
  const baselineTotal = annualOccurrence * item.lineItem.caseCost * item.lineItem.casesPurchased;

  return (
    <S.InfoCard theme='baseline'>
      <Row>
        <Col span={16}>
          <Typography.Title level={5}>Baseline</Typography.Title>
        </Col>
        <Col span={8}>
          <Typography.Text>Total</Typography.Text>
        </Col>
      </Row>
      <Row>
        <Col span={16}>
          <S.SmallText>Annual cost</S.SmallText>
          <br />
          <S.SmallerText>
            (<CurrencySymbol value={item.lineItem.caseCost} />
            /case x {annualOccurrence * item.lineItem.casesPurchased})
          </S.SmallerText>
        </Col>
        <Col span={8}>
          <Typography.Text>
            <strong>${baselineTotal.toLocaleString()}</strong>
          </Typography.Text>
        </Col>
      </Row>
    </S.InfoCard>
  );
};

const InfoCard = ({ item }: { item: SingleUseItemRecord }) => {
  const annualOccurrence = getAnnualOccurrence(item.lineItem.frequency);
  const baselineTotal = annualOccurrence * item.lineItem.caseCost * item.lineItem.casesPurchased;
  const forecastTotal = annualOccurrence * item.lineItem.newCaseCost * item.lineItem.newCasesPurchased;
  const change = forecastTotal - baselineTotal;
  const isNegativeChange = change < 0;
  return (
    <S.InfoCard theme='forecast'>
      <Row>
        <Col span={10}>
          <Typography.Title level={5}>Forecast</Typography.Title>
        </Col>
        <Col span={7}>
          <S.SmallText>Total</S.SmallText>
        </Col>
        <Col span={7}>
          <S.SmallText>Change</S.SmallText>
        </Col>
      </Row>
      <Row>
        <Col span={10}>
          <S.SmallText>Annual cost</S.SmallText>
        </Col>
        <Col span={7}>
          <Typography.Text>
            <strong>${forecastTotal.toLocaleString()}</strong>
          </Typography.Text>
        </Col>
        <Col span={7}>
          <Typography.Text>
            <strong>
              {isNegativeChange ? '-' : '+'}
              <CurrencySymbol value={Math.abs(change)} />
            </strong>
          </Typography.Text>
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <S.SmallerText>
            (${item.lineItem.newCaseCost}/case x {annualOccurrence * item.lineItem.newCasesPurchased})
          </S.SmallerText>
        </Col>
      </Row>
    </S.InfoCard>
  );
};

export const ItemRow = ({
  item,
  onEdit,
  onDelete,
  readOnly
}: {
  item: SingleUseItemRecord;
  onEdit: (item: SingleUseItemRecord) => void;
  onDelete: () => void;
  readOnly: boolean;
}) => {
  function confirm() {
    chartreuseClient
      .deleteSingleUseItem(item.lineItem.projectId, item.lineItem.id)
      .then(() => {
        message.success('Item removed');
        onDelete();
      })
      .catch(error => {
        if (error.error || error.message) {
          message.error(error.error || error.message);
        }
      });
  }

  return (
    <S.InfoRow>
      <Col span={8}>
        <Typography.Title level={5} style={{ marginBottom: '0.5em' }}>
          {PRODUCT_TYPES_MAP[item.product.type]}
        </Typography.Title>
        <Typography.Paragraph style={{ fontSize: 12 }}>
          {MATERIAL_MAP[item.product.primaryMaterial]?.name}
        </Typography.Paragraph>
        {!readOnly && (
          <>
            <DisabledLink onClick={() => onEdit(item)}>Edit</DisabledLink>
            <Typography.Text style={{ opacity: '.25' }}> | </Typography.Text>
            <Popconfirm
              title='Are you sure you want to delete this item?'
              onConfirm={confirm}
              okText='Yes'
              cancelText='No'
            >
              <DisabledLink>Delete</DisabledLink>
            </Popconfirm>
          </>
        )}
      </Col>
      <Col span={8}>
        <BaselineCard item={item} />
      </Col>
      <Col span={8}>
        <InfoCard item={item} />
      </Col>
    </S.InfoRow>
  );
};
