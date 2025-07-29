import { Row, Col, Typography } from 'antd';

import { InfoIcon } from 'components/common/InfoIcon';
import type { ProjectionsResponse } from 'lib/calculator/getProjections';
import { formatToDollar } from 'lib/calculator/utils';

import Card from '../../common/Card';
import { SectionContainer, SectionHeader, SectionTitle } from '../../common/styles';
import { useCurrency } from 'components/_app/CurrencyProvider';
import { FooterData } from './components/Footer';
import { Text, Title, Value } from './components/styles';

type Props = {
  data: ProjectionsResponse['financialResults'];
  businessSize?: number; // related to business size: 0, 1, or 2
};

const tooltipVariants = [
  // Small business
  {
    additionalExpenses0: '$3,216',
    additionalExpenses1: '(2): $945',
    additionalExpenses2: '(2): $40',
    dishwashingSpecs: 'Commercial Under Counter, High Temperature, Energy star certified, Electric Fuel',
    dishwashingRacks: '45',
    dishwashingEnergyUsage: '3,535.89 kWh',
    dishwashingWaterUsage: '49,632.63 L',
    dishwashingUtilityCost: '$484',
    laborHours: '~1 hour/day',
    laborRate: '$20/hour'
  },
  // Medium size business
  {
    additionalExpenses0: '$5,006',
    additionalExpenses1: '(5): $2,362',
    additionalExpenses2: '(4): $79',
    dishwashingSpecs: 'Stationary Single Tank Door dishwasher, High Temperature, Energy star certified, Electric Fuel',
    dishwashingRacks: '119',
    dishwashingEnergyUsage: '10,367.83 kWh',
    dishwashingWaterUsage: '145,531.34 L',
    dishwashingUtilityCost: '$1,419',
    laborHours: '~3 hours/day',
    laborRate: '$20/hour'
  },
  // Large business
  {
    additionalExpenses0: '$12,099',
    additionalExpenses1: '(8): $3,780',
    additionalExpenses2: '(5): $99',
    dishwashingSpecs: 'Single Tank Conveyor, High Temperature, Energy star certified, Electric Fuel',
    dishwashingRacks: '209',
    dishwashingEnergyUsage: '14,321.72 kWh',
    dishwashingWaterUsage: '201,031.39 L',
    dishwashingUtilityCost: '$1,960',
    laborHours: '~5 hours/day',
    laborRate: '$20/hour'
  }
];

const FinancialSummary: React.FC<Props> = ({ data: financialResults, businessSize }) => {
  const { abbreviation: currencyAbbreviation } = useCurrency();
  const showTooltips = typeof businessSize === 'number';
  console.log('businessSize', businessSize);
  const tooltipVars = typeof businessSize === 'number' ? tooltipVariants[businessSize] : tooltipVariants[0];
  console.log('financialResults', currencyAbbreviation);
  return (
    <SectionContainer>
      <SectionHeader>Financial summary</SectionHeader>

      <Card>
        <SectionTitle>Annual program saving &amp; expenses</SectionTitle>

        <Row gutter={40}>
          <Col span={8}>
            <Text strong>Savings</Text>
            <Title>Annual total</Title>
            <Value color={financialResults.summary.annualCost < 0 ? 'green' : 'black'}>
              {formatToDollar(financialResults.summary.annualCost * -1, currencyAbbreviation)}
            </Value>

            <Title>
              Annual program ROI{' '}
              {showTooltips && (
                <InfoIcon>Annual Cost Savings ROI (% of Start-Up Cost): Annual Net Savings/Startup costs</InfoIcon>
              )}
            </Title>
            <Value>{financialResults.summary.annualROIPercent}%</Value>

            <hr />

            <FooterData
              title='Single-use purchasing'
              icon={
                showTooltips && (
                  <InfoIcon>
                    Considers a full “place setting” worth of foodware items per customer, including foodware
                    accessories
                  </InfoIcon>
                )
              }
              value={formatToDollar(financialResults.annualCostChanges.singleUseProductChange, currencyAbbreviation)}
            />
            <FooterData
              title='Waste hauling'
              icon={
                showTooltips && (
                  <InfoIcon maxWidth={450}>
                    <ul style={{ paddingLeft: '1em', margin: 0 }}>
                      <li>Assumes $22/cubic yard.</li>
                    </ul>
                  </InfoIcon>
                )
              }
              value={formatToDollar(financialResults.annualCostChanges.wasteHauling, currencyAbbreviation)}
            />
          </Col>

          <Col span={8}>
            <Text strong>One-time expenses</Text>

            <Title>Annual total</Title>
            <Value color='black'>{formatToDollar(financialResults.oneTimeCosts.total, currencyAbbreviation)}</Value>

            <Title>Payback Period</Title>
            <Value>
              {financialResults.summary.paybackPeriodsMonths === 0
                ? 'N/A'
                : financialResults.summary.paybackPeriodsMonths + '  mos.'}
            </Value>

            <hr />

            <FooterData
              title='Reusables purchasing'
              icon={showTooltips && <InfoIcon maxWidth={400}>Accounts for a 98% return rate</InfoIcon>}
              value={formatToDollar(financialResults.oneTimeCosts.reusableProductCosts, currencyAbbreviation)}
            />
            <FooterData
              title='Additional expenses'
              icon={
                showTooltips && (
                  <InfoIcon maxWidth={500}>
                    <Typography.Text>Initial reuse expenses:</Typography.Text>
                    <ul style={{ paddingLeft: '1em', margin: 0 }}>
                      <li>Commercial under-counter Energy Star dishwasher: {tooltipVars.additionalExpenses0}</li>
                      <li>Commercial drying racks {tooltipVars.additionalExpenses1}</li>
                      <li>Bus tubs/return stations {tooltipVars.additionalExpenses2}</li>
                      <li>Dishwasher installation: $1,500</li>
                    </ul>
                  </InfoIcon>
                )
              }
              value={formatToDollar(financialResults.oneTimeCosts.additionalCosts, currencyAbbreviation)}
            />
          </Col>

          <Col span={8}>
            <Text strong>Recurring expenses</Text>
            <Title>Annual total</Title>
            <Value color='black'>
              {formatToDollar(
                financialResults.annualCostChanges.change - financialResults.annualCostChanges.singleUseProductChange,
                currencyAbbreviation
              )}
            </Value>

            <Title>&nbsp;</Title>
            <Value>&nbsp;</Value>
            <hr />

            <FooterData
              title='Reusables restocking'
              icon={showTooltips && <InfoIcon>Accounts for a 98% return rate</InfoIcon>}
              value={formatToDollar(financialResults.annualCostChanges.reusableProductCosts, currencyAbbreviation)}
            />
            <FooterData
              title='Labor'
              icon={
                showTooltips && (
                  <InfoIcon>
                    <ul style={{ paddingLeft: '1em', margin: 0 }}>
                      <li>Daily dishwashing labor: {tooltipVars.laborHours}</li>
                      <li>Labor staff rate: {tooltipVars.laborRate}</li>
                    </ul>
                  </InfoIcon>
                )
              }
              value={formatToDollar(financialResults.annualCostChanges.laborCosts, currencyAbbreviation)}
            />
            <FooterData
              title='Dishwashing'
              icon={
                showTooltips && (
                  <InfoIcon maxWidth={450}>
                    <ul style={{ paddingLeft: '1em', margin: 0 }}>
                      <li>Dishwasher specs: {tooltipVars.dishwashingSpecs}</li>
                      <li>Utility rates: California</li>
                      <li>Additional racks/day for reusables: {tooltipVars.dishwashingRacks}</li>
                      <li>Annual dishwashing energy usage: {tooltipVars.dishwashingEnergyUsage}</li>
                      <li>Annual dishwashing water usage: {tooltipVars.dishwashingWaterUsage}</li>
                      <li>Annual dishwashing utility cost: {tooltipVars.dishwashingUtilityCost}</li>
                    </ul>
                  </InfoIcon>
                )
              }
              value={formatToDollar(financialResults.annualCostChanges.utilities, currencyAbbreviation)}
            />
            <FooterData
              title='Waste hauling'
              value={formatToDollar(financialResults.annualCostChanges.wasteHauling, currencyAbbreviation)}
            />
            <FooterData
              title='Additional expenses'
              value={formatToDollar(financialResults.annualCostChanges.otherExpenses, currencyAbbreviation)}
            />
          </Col>
        </Row>
      </Card>
    </SectionContainer>
  );
};

export default FinancialSummary;
