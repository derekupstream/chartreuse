import { Col, InputNumber, Row, Typography } from 'antd';
import * as S from '../../styles';
import { useEffect, useState } from 'react';
import { InfoIcon } from 'components/common/InfoIcon';

import { gallonsUsedPerBottleStation } from 'lib/calculator/calculations/foodware/getBottleStationResults';

import { FoodwareLineItem } from 'lib/projects/getProjectFoodwareLineItems';
import { useMetricSystem } from 'components/_app/MetricSystemProvider';
import { valueInGallons } from 'lib/number';

type WaterStationRowProps = {
  item: FoodwareLineItem;
  readOnly: boolean;
  updateItem: (id: string, reusableItemCount: number, reusableReturnPercentage?: number) => void;
};

export function WaterStationRow({ item, readOnly, updateItem }: WaterStationRowProps) {
  const displayAsMetric = useMetricSystem();
  // State to track current values
  const [currentAmount, setCurrentAmount] = useState<number | undefined>(item.reusableItemCount);

  // Update state when item changes
  useEffect(() => {
    // const gallonsUsed = getBottleCountForBottleStation(item.reusableItemCount);
    setCurrentAmount(item.reusableItemCount);
  }, [item.reusableItemCount]);

  const gallonsPerStation = valueInGallons(gallonsUsedPerBottleStation, { displayAsMetric });
  const gallonsUsed = item.reusableItemCount * gallonsUsedPerBottleStation;

  return (
    <>
      <Row justify='space-between' align='middle' key={item.id}>
        <Col span={12}>
          <S.CardTitle style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {item.reusableProduct.description}
          </S.CardTitle>
        </Col>
        <Col span={12} style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
          <Typography.Text style={{ whiteSpace: 'nowrap' }}>Quantity</Typography.Text>
          <InputNumber
            addonAfter={`${gallonsUsed.toFixed(2)} ${displayAsMetric ? 'L' : 'gal'}`}
            placeholder='Enter quantity'
            style={{ minWidth: '20ch' }}
            size='large'
            disabled={readOnly}
            min={0}
            value={currentAmount}
            onChange={value => {
              if (typeof value === 'number') {
                // Update local state immediately
                setCurrentAmount(value);

                updateItem(item.id, value, 0);
              } else if (value === null || value === undefined) {
                setCurrentAmount(undefined);
              }
            }}
          />
          <InfoIcon>
            We estimate {gallonsPerStation.toFixed(2)} {displayAsMetric ? 'L' : 'gal'} used per water station
          </InfoIcon>
        </Col>
      </Row>
    </>
  );
}
