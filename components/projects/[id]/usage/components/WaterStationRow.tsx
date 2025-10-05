import { Col, Divider, InputNumber, Row, Typography } from 'antd';
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
  updateItem: (id: string, waterUsageGallons: number, reusableItemCount?: number) => void;
};

export function WaterStationRow({ item, readOnly, updateItem }: WaterStationRowProps) {
  const displayAsMetric = useMetricSystem();
  // State to track current values
  const [currentAmount, setCurrentAmount] = useState<number | undefined>(
    parseFloat(valueInGallons(item.waterUsageGallons || 0, { displayAsMetric }).toFixed(2))
  );
  const [currentQuantity, setCurrentQuantity] = useState<number | undefined>(item.reusableItemCount);

  // Update state when item changes
  useEffect(() => {
    if (typeof item.waterUsageGallons === 'number') {
      setCurrentAmount(parseFloat(valueInGallons(item.waterUsageGallons, { displayAsMetric }).toFixed(2)));
    }
    setCurrentQuantity(item.reusableItemCount);
  }, [item.waterUsageGallons, item.reusableItemCount, displayAsMetric]);

  const gallonsPerStation = valueInGallons(gallonsUsedPerBottleStation, { displayAsMetric });

  return (
    <>
      <Row>
        <Col span={12}>
          <Typography.Text strong></Typography.Text>
        </Col>
        <Col span={6} style={{ textAlign: 'center' }}>
          <Typography.Text strong>Quantity</Typography.Text>
        </Col>
        <Col span={6} style={{ textAlign: 'center' }}>
          <Typography.Text strong>Water usage per station</Typography.Text>
        </Col>
      </Row>
      <Divider style={{ marginTop: 5 }} />
      <Row justify='space-between' align='middle' key={item.id}>
        <Col span={12}>
          <S.CardTitle style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {item.reusableProduct.description}
            <InfoIcon>
              We estimate {gallonsPerStation.toFixed(2)} {displayAsMetric ? 'L' : 'gal'} used per water station
            </InfoIcon>
          </S.CardTitle>
        </Col>
        <Col span={6} style={{ display: 'flex', justifyContent: 'center' }}>
          <InputNumber
            placeholder='Enter quantity'
            style={{ minWidth: '15ch' }}
            size='large'
            disabled={readOnly}
            min={0}
            step={1}
            status={currentQuantity === 0 ? 'error' : undefined}
            precision={0}
            value={currentQuantity}
            onChange={value => {
              if (typeof value === 'number') {
                setCurrentQuantity(value);
                updateItem(item.id, item.waterUsageGallons || 0, value);
              } else if (value === null || value === undefined) {
                setCurrentQuantity(undefined);
                updateItem(item.id, item.waterUsageGallons || 0, undefined);
              }
            }}
          />
        </Col>
        <Col span={6} style={{ alignItems: 'center' }}>
          <InputNumber
            addonAfter={`${displayAsMetric ? 'L' : 'gal'}`}
            style={{ minWidth: '20ch' }}
            size='large'
            disabled={readOnly}
            min={0}
            placeholder={!currentAmount ? '27.15' : 'Enter water usage'}
            value={currentAmount === 0 ? '' : currentAmount}
            onChange={value => {
              if (typeof value === 'number') {
                setCurrentAmount(value);
                // Convert to gallons for storage (database stores in gallons)
                const gallonsValue = displayAsMetric ? value * LITER_TO_GALLON : value;
                updateItem(item.id, gallonsValue, item.reusableItemCount);
              } else if (value === null || value === undefined) {
                setCurrentAmount(undefined);
                updateItem(item.id, 0, item.reusableItemCount);
              }
            }}
          />
        </Col>
      </Row>
    </>
  );
}
