import { Row, Col, Typography } from 'antd';

import { InfoIcon } from 'components/common/InfoIcon';
import type { ProjectionsResponse } from 'lib/calculator/getProjections';
import { formatToDollar } from 'lib/calculator/utils';

import Card from '../components/Card';
import { SectionContainer, SectionHeader, SectionTitle } from '../components/styles';
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
    wasteHaulingSingleUseCost: '~$114/month',
    wasteHaulingReusableCost: '~$22/month',
    additionalExpenses0: '$3,216',
    additionalExpenses1: '(2): $945',
    additionalExpenses2: '(2): $40',
    dishwashingSpecs: 'Commercial Under Counter, High Temperature, Energy star certified, Electric Fuel',
    dishwashingRacks: '42',
    dishwashingEnergyUsage: '3,047.46 kWh',
    dishwashingWaterUsage: '11,300.4 gal',
    dishwashingUtilityCost: '$475',
    dishwashingPlaceSettings: '5',
    laborHours: '~1 hour/day',
    laborRate: '$20/hour',
    reusableReturnRate: '85%'
  },
  // Medium size business
  {
    wasteHaulingSingleUseCost: '~$391/month',
    wasteHaulingReusableCost: '~$57/month',
    additionalExpenses0: '$5,006',
    additionalExpenses1: '(5): $2,362',
    additionalExpenses2: '(4): $79',
    dishwashingSpecs: 'Stationary Single Tank Door dishwasher, High Temperature, Energy star certified, Electric Fuel',
    dishwashingRacks: '112',
    dishwashingEnergyUsage: '9,811.72 kWh',
    dishwashingWaterUsage: '36,383.2 gal',
    dishwashingUtilityCost: '$1,529.57',
    dishwashingPlaceSettings: '5',
    laborHours: '~3 hours/day',
    laborRate: '$20/hour',
    reusableReturnRate: '80%'
  },
  // Large business
  {
    wasteHaulingSingleUseCost: '~$399/month',
    wasteHaulingReusableCost: '~$84/month',
    additionalExpenses0: '$12,099',
    additionalExpenses1: '(8): $3,780',
    additionalExpenses2: '(5): $99',
    dishwashingSpecs: 'Single Tank Conveyor, High Temperature, Energy star certified, Electric Fuel',
    dishwashingRacks: '168',
    dishwashingEnergyUsage: '11,575.62 kWh',
    dishwashingWaterUsage: '42,924 gal',
    dishwashingUtilityCost: '$1,804',
    dishwashingPlaceSettings: '5',
    laborHours: '~5 hours/day',
    laborRate: '$20/hour',
    reusableReturnRate: '75%'
  }
];

const FinancialSummary: React.FC<Props> = ({ data: financialResults, businessSize }) => {
  const { abbreviation: currencyAbbreviation } = useCurrency();
  const showTooltips = typeof businessSize === 'number';
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

            <Title>Annual program ROI</Title>
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
                      <li>Single-use foodware waste hauling cost: {tooltipVars.wasteHaulingSingleUseCost}</li>
                      <li>Reusable foodware waste hauling cost: {tooltipVars.wasteHaulingReusableCost}</li>
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
              icon={
                showTooltips && (
                  <InfoIcon maxWidth={400}>
                    Initial reusable item purchasing:
                    <br />
                    3:1 ratio of reusable items to daily disposable items
                  </InfoIcon>
                )
              }
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
              icon={
                showTooltips && (
                  <InfoIcon>Return rate of reusable foodware items: {tooltipVars.reusableReturnRate}</InfoIcon>
                )
              }
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
                      <li>Place settings per commercial dishwashing rack: {tooltipVars.dishwashingPlaceSettings}</li>
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
