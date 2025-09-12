import { Col, Divider, InputNumber, Row } from 'antd';
import * as S from '../../styles';
import { useEffect, useState } from 'react';

import { FoodwareLineItem } from 'lib/projects/getProjectFoodwareLineItems';

type ReusableItemRowProps = {
  item: FoodwareLineItem;
  useShrinkageRate: boolean;
  readOnly: boolean;
  updateItem: (id: string, reusableItemCount: number, reusableReturnPercentage?: number) => void;
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
  const itemReturnPercentage = item.reusableReturnPercentage;
  const initialDisplayPercentage =
    typeof itemReturnPercentage === 'number'
      ? useShrinkageRate
        ? 100 - itemReturnPercentage
        : itemReturnPercentage
      : undefined;

  const initialDisplayAmount =
    typeof initialDisplayPercentage === 'number' && item.reusableItemCount
      ? Math.round((item.reusableItemCount * initialDisplayPercentage) / 100)
      : undefined;

  // State to track current values
  const [currentAmount, setCurrentAmount] = useState<number | undefined>(initialDisplayAmount);
  const [currentPercentage, setCurrentPercentage] = useState<number | undefined>(initialDisplayPercentage);

  // Update state when item changes
  useEffect(() => {
    const newDisplayPercentage =
      typeof itemReturnPercentage === 'number'
        ? useShrinkageRate
          ? 100 - itemReturnPercentage
          : itemReturnPercentage
        : undefined;

    const newDisplayAmount =
      typeof newDisplayPercentage === 'number' && item.reusableItemCount
        ? Math.round((item.reusableItemCount * newDisplayPercentage) / 100)
        : undefined;

    setCurrentAmount(newDisplayAmount);
    setCurrentPercentage(newDisplayPercentage);
  }, [item.reusableReturnPercentage, item.reusableItemCount, useShrinkageRate]);

  return (
    <>
      <Row justify='space-between' align='middle' key={item.id}>
        <Col span={12}>
          <S.CardTitle>{item.reusableProduct.description}</S.CardTitle>
        </Col>
        <Col span={6} style={{ textAlign: 'center' }}>
          <InputNumber
            placeholder='Enter quantity'
            style={{ minWidth: '20ch' }}
            size='large'
            disabled={readOnly}
            min={0}
            defaultValue={item.reusableItemCount || undefined}
            onChange={value => {
              if (typeof value === 'number') {
                updateItem(item.id, value, item.reusableReturnPercentage);
              }
            }}
          />
        </Col>
        <Col span={6} style={{ textAlign: 'center' }}>
          <InputNumber
            placeholder={advancedEditing ? (useShrinkageRate ? 'Enter shrinkage amount' : 'Enter return amount') : '--'}
            style={{ minWidth: '20ch' }}
            size='large'
            disabled={readOnly || !advancedEditing}
            min={0}
            value={currentAmount}
            onChange={value => {
              if (typeof value === 'number' && item.reusableItemCount) {
                const newPercentage = Math.ceil((value * 100) / item.reusableItemCount);
                const toSave = useShrinkageRate ? 100 - newPercentage : newPercentage;

                // Update local state immediately
                setCurrentAmount(value);
                setCurrentPercentage(newPercentage);

                updateItem(item.id, item.reusableItemCount, toSave);
              } else if (value === null || value === undefined) {
                setCurrentAmount(undefined);
                setCurrentPercentage(undefined);
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
