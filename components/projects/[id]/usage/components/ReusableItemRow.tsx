import { Col, Divider, InputNumber, Row, message } from 'antd';
import * as S from '../../styles';
import { useEffect, useState } from 'react';

import { FoodwareLineItem } from 'lib/projects/getProjectFoodwareLineItems';

type ReusableItemRowProps = {
  item: FoodwareLineItem;
  useShrinkageRate: boolean;
  readOnly: boolean;
  updateItem: (id: string, reusableItemCount: number, reusableReturnCount?: number) => void;
  isLast: boolean;
  advancedEditing: boolean;
};

export function ReusableItemRow({
  item,
  useShrinkageRate,
  readOnly,
  updateItem,
  isLast,
  advancedEditing
}: ReusableItemRowProps) {
  const itemCount = item.reusableItemCount;
  const itemReturnCount = item.reusableReturnCount;
  const itemReturnOrShrinkageCount = useShrinkageRate ? itemCount - itemReturnCount : itemReturnCount;
  // State to track current values
  const [currentAmount, setCurrentAmount] = useState<number | undefined>(itemReturnOrShrinkageCount);

  // Validation helper functions
  const validateQuantity = (value: number): boolean => {
    if (value < 0) {
      message.error('Quantity cannot be negative');
      return false;
    }
    if (!Number.isInteger(value)) {
      message.error('Quantity must be a whole number');
      return false;
    }
    return true;
  };

  const validateReturnOrShrinkageAmount = (value: number, totalQuantity: number): boolean => {
    if (value < 0) {
      message.error(`${useShrinkageRate ? 'Shrinkage' : 'Return'} amount cannot be negative`);
      return false;
    }
    if (value > totalQuantity) {
      message.error(`${useShrinkageRate ? 'Shrinkage' : 'Return'} amount cannot exceed total quantity`);
      return false;
    }
    if (!Number.isInteger(value)) {
      message.error(`${useShrinkageRate ? 'Shrinkage' : 'Return'} amount must be a whole number`);
      return false;
    }
    return true;
  };

  // Update state when item changes
  useEffect(() => {
    const itemReturnOrShrinkageCount = useShrinkageRate
      ? item.reusableItemCount - item.reusableReturnCount
      : item.reusableReturnCount;
    console.log('set current amount', itemReturnOrShrinkageCount, item.reusableItemCount, item.reusableReturnCount);
    setCurrentAmount(itemReturnOrShrinkageCount);
  }, [item.reusableItemCount, item.reusableReturnCount, useShrinkageRate]);

  return (
    <>
      <Row justify='space-between' align='middle' key={item.id}>
        <Col span={12}>
          <S.CardTitle>{item.foodwareTitle}</S.CardTitle>
        </Col>
        <Col span={6} style={{ textAlign: 'center' }}>
          <InputNumber
            placeholder='Enter quantity'
            style={{ minWidth: '20ch' }}
            size='large'
            disabled={readOnly}
            min={0}
            step={1}
            precision={0}
            defaultValue={item.reusableItemCount || undefined}
            onChange={value => {
              if (typeof value === 'number') {
                // // Validate quantity
                if (!validateQuantity(value)) {
                  return;
                }

                // When useShrinkageRate = true, calculate new return count by subtracting currentAmount, which is the current shrinkage rate
                const shrinkageCount = item.reusableItemCount - item.reusableReturnCount;
                const newReturnCount = useShrinkageRate
                  ? // if the new quantity is less than return, use the new quantity as return
                    value < shrinkageCount
                    ? 0
                    : value - shrinkageCount
                  : value < item.reusableReturnCount
                    ? value
                    : item.reusableReturnCount;
                // Validate the calculated return count
                if (newReturnCount !== undefined && !validateReturnOrShrinkageAmount(newReturnCount ?? 0, value)) {
                  return;
                }

                updateItem(item.id, value, newReturnCount);
              }
            }}
          />
        </Col>
        <Col span={6} style={{ textAlign: 'center' }}>
          <InputNumber
            placeholder={advancedEditing ? (useShrinkageRate ? 'Enter shrinkage amount' : 'Enter return amount') : '--'}
            style={{ minWidth: '20ch' }}
            size='large'
            disabled={readOnly || !advancedEditing || !item.reusableItemCount}
            min={0}
            max={item.reusableItemCount || undefined}
            step={1}
            precision={0}
            value={currentAmount}
            onChange={value => {
              if (typeof value === 'number' && item.reusableItemCount) {
                // Validate return/shrinkage amount
                if (!validateReturnOrShrinkageAmount(value, item.reusableItemCount)) {
                  return;
                }

                const toSave = useShrinkageRate ? item.reusableItemCount - value : value;

                // Update local state immediately
                setCurrentAmount(value);

                updateItem(item.id, item.reusableItemCount, toSave);
              } else if (value === null || value === undefined) {
                setCurrentAmount(undefined);
                updateItem(item.id, item.reusableItemCount, undefined);
              }
            }}
          />
        </Col>
        {/* {advancedEditing && (
          <>
            <Col span={6} style={{ textAlign: 'end' }}>
              <InputNumber
                min={0}
                max={100}
                placeholder={useShrinkageRate ? 'Enter shrinkage %' : 'Enter return %'}
                suffix='%'
                style={{ minWidth: '20ch' }}
                size='large'
                disabled={readOnly}
                value={currentPercentage}
                onChange={value => {
                  if (typeof value === 'number') {
                    const toSave = useShrinkageRate ? 100 - value : value;

                    // Update local state immediately
                    setCurrentPercentage(value);
                    if (item.reusableItemCount) {
                      const newAmount = Math.round((item.reusableItemCount * value) / 100);
                      setCurrentAmount(newAmount);
                    }

                    updateItem(item.id, item.reusableItemCount, toSave);
                  } else if (value === null || value === undefined) {
                    setCurrentPercentage(undefined);
                    setCurrentAmount(undefined);
                  }
                }}
              />
            </Col>
          </>
        )} */}
      </Row>
      {!isLast && <Divider />}
    </>
  );
}
