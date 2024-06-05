import { Typography, Row, Col, Popconfirm, message } from 'antd';

import { getAnnualOccurrence } from 'lib/calculator/constants/frequency';
import chartreuseClient from 'lib/chartreuseClient';
import type { SingleUseProduct } from 'lib/inventory/types/products';
import type { SingleUseLineItem } from 'lib/inventory/types/projects';

import * as S from '../../styles';

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
            (${item.lineItem.caseCost}/case x {annualOccurrence * item.lineItem.casesPurchased})
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
              {isNegativeChange ? '-' : '+'}${Math.abs(change).toLocaleString()}
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
  onDelete
}: {
  item: SingleUseItemRecord;
  onEdit: (item: SingleUseItemRecord) => void;
  onDelete: () => void;
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
        <Typography.Title level={5}>{item.product.description}</Typography.Title>
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
        <Popconfirm title='Are you sure you want to delete this item?' onConfirm={confirm} okText='Yes' cancelText='No'>
          <a href='#'>Delete</a>
        </Popconfirm>
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
