import { Col, Row, Typography } from 'antd';
import type { FC } from 'react';

import CurrencySymbol from 'components/_app/CurrencySymbol';
import { round } from 'lib/calculator/utils';
import type { ReusableLineItem } from 'lib/inventory/types/projects';

import { InfoCard, SmallText, SmallerText } from '../../styles';

interface Props {
  item: ReusableLineItem;
}

const Forecast: FC<Props> = ({ item }) => {
  const oneTimeCost = item.caseCost * item.casesPurchased;
  const annualCost = oneTimeCost * item.annualRepurchasePercentage;
  const change = -1 * (oneTimeCost - annualCost);

  return (
    <InfoCard theme='forecast'>
      <Row>
        <Col span={14}>
          <Typography.Title level={5}>Repurchase Forecast</Typography.Title>
        </Col>
        <Col span={5}>
          <SmallText>Total</SmallText>
        </Col>
        <Col span={5}>
          <SmallText>Change</SmallText>
        </Col>
      </Row>
      {/* <Row>
        <Col span={17}>
          <SmallText>Annual rate</SmallText>
        </Col>
        <Col span={7}>
          <Typography.Text>
            <strong>{`${round(item.annualRepurchasePercentage * 100)}%`}</strong>
          </Typography.Text>
        </Col>
      </Row> */}
      <Row>
        <Col span={14}>
          <SmallText>Annual cost</SmallText>
          <br />
          <SmallerText>
            (<CurrencySymbol value={item.caseCost} />
            /case x {round(item.casesPurchased * item.annualRepurchasePercentage)})
          </SmallerText>
        </Col>
        <Col span={5}>
          <Typography.Text>
            <strong>
              <CurrencySymbol value={annualCost} />
            </strong>
          </Typography.Text>
        </Col>
        <Col span={5}>
          <Typography.Text>
            <strong>
              <CurrencySymbol value={change} />
            </strong>
          </Typography.Text>
        </Col>
      </Row>
    </InfoCard>
  );
};

export default Forecast;
