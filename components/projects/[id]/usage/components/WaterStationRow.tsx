import { Col, InputNumber, Row, Typography } from 'antd';
import * as S from '../../styles';
import { useEffect, useState } from 'react';
import { InfoIcon } from 'components/common/InfoIcon';

import { gallonsUsedPerBottleStation } from 'lib/calculator/calculations/foodware/getBottleStationResults';

import { FoodwareLineItem } from 'lib/projects/getProjectFoodwareLineItems';
import { useMetricSystem } from 'components/_app/MetricSystemProvider';
import { valueInGallons, LITER_TO_GALLON } from 'lib/number';

type WaterStationRowProps = {
  item: FoodwareLineItem;
  readOnly: boolean;
  updateItem: (id: string, waterUsageGallons: number) => void;
};

export function WaterStationRow({ item, readOnly, updateItem }: WaterStationRowProps) {
  const displayAsMetric = useMetricSystem();
  // State to track current values
  const [currentAmount, setCurrentAmount] = useState<number | undefined>(
    parseFloat(valueInGallons(item.waterUsageGallons || 0, { displayAsMetric }).toFixed(2))
  );

  // Update state when item changes
  useEffect(() => {
    if (typeof item.waterUsageGallons === 'number') {
      parseFloat(valueInGallons(item.waterUsageGallons, { displayAsMetric }).toFixed(2));
    }
  }, [item.waterUsageGallons]);

  const gallonsPerStation = valueInGallons(gallonsUsedPerBottleStation, { displayAsMetric });

  return (
    <>
      <Row justify='space-between' align='middle' key={item.id}>
        <Col span={12}>
          <S.CardTitle style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {item.reusableProduct.description}
            <InfoIcon>
              We estimate {gallonsPerStation.toFixed(2)} {displayAsMetric ? 'L' : 'gal'} used per water station
            </InfoIcon>
          </S.CardTitle>
        </Col>
        <Col span={12} style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
          <Typography.Text style={{ whiteSpace: 'nowrap' }}>Water Usage</Typography.Text>
          <InputNumber
            addonAfter={`${displayAsMetric ? 'L' : 'gal'}`}
            placeholder='Enter water usage'
            style={{ minWidth: '20ch' }}
            size='large'
            disabled={readOnly}
            min={0}
            value={currentAmount}
            onChange={value => {
              if (typeof value === 'number') {
                setCurrentAmount(value);
                // Convert to gallons for storage (database stores in gallons)
                const gallonsValue = displayAsMetric ? value * LITER_TO_GALLON : value;
                updateItem(item.id, gallonsValue);
              } else if (value === null || value === undefined) {
                setCurrentAmount(undefined);
              }
            }}
          />
        </Col>
      </Row>
    </>
  );
}
