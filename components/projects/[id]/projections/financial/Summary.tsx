import { Row, Col, Typography } from 'antd';

import type { ProjectionsResponse } from 'lib/calculator/getProjections';
import { formatToDollar } from 'lib/calculator/utils';

import Card from '../components/Card';
import { SectionContainer, SectionHeader } from '../components/styles';
import TitleWithTooltip from '../components/TitleWithTooltip';

import { FooterData } from './components/Footer';
import { Text, Title, Value } from './components/styles';

type Props = {
  data: ProjectionsResponse['financialResults'];
};

const FinancialSummary: React.FC<Props> = ({ data: financialResults }) => {
  return (
    <SectionContainer>
      <SectionHeader>Financial summary</SectionHeader>

      <Card>
        <TitleWithTooltip
          title='Annual program saving &amp; expenses'
          tooltipTitle='title'
          tooltipContent={<p>some description</p>}
        />

        <Row gutter={40}>
          <Col span={8}>
            <Text strong>Savings</Text>
            <Title>Annual total</Title>
            <Value color={financialResults.summary.annualCost < 0 ? 'green' : 'black'}>
              {formatToDollar(financialResults.summary.annualCost * -1)}
            </Value>

            <Title>Annual program ROI</Title>
            <Value>{financialResults.summary.annualROIPercent}%</Value>

            <hr />

            <FooterData
              title='Single-use purchasing'
              value={formatToDollar(financialResults.annualCostChanges.singleUseProductChange)}
            />
            <FooterData title='Waste hauling' value={formatToDollar(financialResults.annualCostChanges.wasteHauling)} />
          </Col>

          <Col span={8}>
            <Text strong>One-time expenses</Text>

            <Title>Annual total</Title>
            <Value color='black'>{formatToDollar(financialResults.oneTimeCosts.total)}</Value>

            <Title>Payback Period</Title>
            <Value>
              {financialResults.summary.paybackPeriodsMonths === 0
                ? 'N/A'
                : financialResults.summary.paybackPeriodsMonths + '  mos.'}
            </Value>

            <hr />

            <FooterData
              title='Reusable purchasing'
              value={formatToDollar(financialResults.oneTimeCosts.reusableProductCosts)}
            />
            <FooterData
              title='Additional expenses'
              value={formatToDollar(financialResults.oneTimeCosts.additionalCosts)}
            />
          </Col>

          <Col span={8}>
            <Text strong>Recurring expenses</Text>
            <Title>Annual total</Title>
            <Value color='black'>
              {formatToDollar(
                financialResults.annualCostChanges.change - financialResults.annualCostChanges.singleUseProductChange
              )}
            </Value>

            <Title>&nbsp;</Title>
            <Value>&nbsp;</Value>
            <hr />

            <FooterData
              title='Reusables restocking'
              value={formatToDollar(financialResults.annualCostChanges.reusableProductCosts)}
            />
            <FooterData title='Labor' value={formatToDollar(financialResults.annualCostChanges.laborCosts)} />
            <FooterData title='Dishwashing' value={formatToDollar(financialResults.annualCostChanges.utilities)} />
            <FooterData title='Waste hauling' value={formatToDollar(financialResults.annualCostChanges.wasteHauling)} />
            <FooterData
              title='Additional expenses'
              value={formatToDollar(financialResults.annualCostChanges.otherExpenses)}
            />
          </Col>
        </Row>
      </Card>
    </SectionContainer>
  );
};

export default FinancialSummary;
