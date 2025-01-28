import { Typography, Row, Col } from 'antd';
import styled from 'styled-components';

import CurrencySymbol from 'components/_app/CurrencySymbol';
import { getAnnualOccurrence } from 'lib/calculator/constants/frequency';
import type { SingleUseLineItem } from 'lib/inventory/types/projects';

import * as S from '../../styles';

const SmallText = styled(Typography.Text)`
  font-size: 0.9rem;
`;

export const SummaryRow = ({ lineItems }: { lineItems: SingleUseLineItem[] }) => {
  const baselineProductCount = lineItems.filter(item => item.casesPurchased > 0).length;
  const forecastProductCount = lineItems.filter(item => item.newCasesPurchased > 0).length;
  const baselineCost = lineItems.reduce((total, item) => {
    const annualOccurrence = getAnnualOccurrence(item.frequency);
    const itemTotal = annualOccurrence * item.caseCost * item.casesPurchased;
    return total + itemTotal;
  }, 0);
  const forecastCost = lineItems.reduce((total, item) => {
    const annualOccurrence = getAnnualOccurrence(item.frequency);
    const itemTotal = annualOccurrence * item.newCaseCost * item.newCasesPurchased;
    return total + itemTotal;
  }, 0);
  const change = forecastCost - baselineCost;
  const isChangeNegative = change < 0;
  return (
    <S.InfoCard style={{ boxShadow: 'none' }}>
      <Row>
        <Col span={8}>
          <Typography.Title level={4}>Total annual single-use purchasing</Typography.Title>
        </Col>
        <Col span={8}>
          <Row gutter={[0, 20]}>
            <Col span={24}>
              <SmallText>
                <strong>Baseline</strong>
              </SmallText>
            </Col>
            {/* next row */}
            <Col span={16}>
              <SmallText>Number of products</SmallText>
            </Col>
            <Col span={8}>
              <SmallText>{baselineProductCount}</SmallText>
            </Col>
            {/* next row */}
            <Col span={16}>
              <SmallText>Annual cost</SmallText>
            </Col>
            <Col span={8}>
              <SmallText>
                <CurrencySymbol value={baselineCost} />
              </SmallText>
            </Col>
          </Row>
        </Col>
        <Col span={8}>
          <Row gutter={[0, 20]}>
            <Col span={12}>
              <SmallText>
                <strong>Forecast</strong>
              </SmallText>
            </Col>
            <Col span={12}>
              <SmallText>
                <strong>Change</strong>
              </SmallText>
            </Col>
            {/* next row */}
            <Col span={12}>
              <SmallText>{forecastProductCount}</SmallText>
            </Col>
            <Col span={12}>
              <SmallText>{forecastProductCount - baselineProductCount}</SmallText>
            </Col>
            {/* next row */}
            <Col span={12}>
              <SmallText>${forecastCost.toLocaleString()}</SmallText>
            </Col>
            <Col span={12}>
              <SmallText>
                {isChangeNegative ? '-' : '+'}${Math.abs(change).toLocaleString()}
              </SmallText>
            </Col>
          </Row>
        </Col>
      </Row>
    </S.InfoCard>
  );
};
