import type { ProjectContext } from 'lib/middleware/getProjectContext';
import { Col, Divider, InputNumber, Row, Typography, Switch } from 'antd';
import { InfoCard } from '../styles';
import * as S from '../styles';
import { useGetFoodwareLineItems, useAddOrUpdateFoodwareLineItem, useUpdateProjectUsage } from 'client/projects';
import ContentLoader from 'components/common/ContentLoader';
import { useFooterState } from '../components/Footer';
import { useEffect, useState, useMemo } from 'react';

import { usePreventReload } from 'hooks/usePreventUnload';
import { FoodwareLineItem } from 'lib/projects/getProjectFoodwareLineItems';

export function UsageStep({
  readOnly,
  project,
  org
}: {
  readOnly: boolean;
  project: ProjectContext['project'];
  org: { useShrinkageRate: boolean };
}) {
  const { setFooterState } = useFooterState();
  const {
    data: foodwareItems,
    isLoading: isLoadingLineItems,
    mutate: refetchFoodwareItems
  } = useGetFoodwareLineItems(project.id);
  const { trigger: addOrUpdateFoodwareLineItem, isMutating: isSavingLineItem } = useAddOrUpdateFoodwareLineItem(
    project?.id
  );
  const { trigger: updateProjectUsage, isMutating: isSavingProjectUsage } = useUpdateProjectUsage(project?.id);

  usePreventReload(isSavingLineItem || isSavingProjectUsage);

  // for now, all items have the same percentage. this is so in the future we might want to let users set a different percentage for each item.
  const allItemsHaveSamePercentage = useMemo(
    () =>
      foodwareItems?.every(item =>
        foodwareItems.every(i => i.reusableReturnPercentage === item.reusableReturnPercentage)
      ),
    [foodwareItems]
  );

  const projectReturnPercentage = allItemsHaveSamePercentage && foodwareItems?.[0]?.reusableReturnPercentage;
  const displayValue =
    typeof projectReturnPercentage === 'number'
      ? org.useShrinkageRate
        ? 100 - projectReturnPercentage
        : projectReturnPercentage
      : undefined;

  // Advanced editing state
  const [advancedEditing, setAdvancedEditing] = useState(!isLoadingLineItems && !allItemsHaveSamePercentage);
  function updateItem(id: string, reusableItemCount: number, reusableReturnPercentage?: number) {
    addOrUpdateFoodwareLineItem({
      id,
      reusableItemCount,
      reusableReturnPercentage
    });
  }

  useEffect(() => {
    setFooterState({ path: '/usage', stepCompleted: true });
  }, [setFooterState]);

  useEffect(() => {
    if (!isLoadingLineItems && !allItemsHaveSamePercentage) {
      setAdvancedEditing(true);
    }
  }, [setAdvancedEditing, isLoadingLineItems, allItemsHaveSamePercentage]);

  return (
    <S.Wrapper>
      <Typography.Title level={1}>Usage</Typography.Title>
      <br />
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <InfoCard title='Amount of Guests'>
            <InputNumber
              defaultValue={project.eventGuestCount || undefined}
              placeholder='Enter guest count'
              style={{ minWidth: '20ch' }}
              size='large'
              onChange={value => {
                if (typeof value === 'number') {
                  updateProjectUsage({ eventGuestCount: value });
                }
              }}
            />
          </InfoCard>
        </Col>
        <Col span={12}>
          <InfoCard title={org.useShrinkageRate ? 'Shrinkage Rate' : 'Return Rate'}>
            <Row gutter={[16, 0]} align='middle'>
              <Col flex='auto'>
                {isLoadingLineItems ? (
                  <InputNumber key='loading' style={{ minWidth: '20ch' }} size='large' />
                ) : (
                  <InputNumber
                    key='loaded'
                    // defaultValue={advancedEditing ? undefined : displayValue}
                    value={advancedEditing ? undefined : displayValue}
                    disabled={advancedEditing}
                    placeholder={
                      advancedEditing
                        ? calculateAverageReturnPercentage(foodwareItems, org.useShrinkageRate).toString()
                        : 'Set rate for all items'
                    }
                    suffix='%'
                    style={{ minWidth: '20ch' }}
                    size='large'
                    onChange={async value => {
                      if (typeof value === 'number') {
                        const toSave = org.useShrinkageRate ? 100 - value : value;
                        await updateProjectUsage({ reusableReturnPercentage: toSave });
                        refetchFoodwareItems();
                      }
                    }}
                  />
                )}
              </Col>
              <Col>
                <div
                  onClick={() => setAdvancedEditing(!advancedEditing)}
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    minWidth: '22ch'
                  }}
                >
                  <Switch checked={advancedEditing} onChange={setAdvancedEditing} />
                  <Typography.Text>Edit line items</Typography.Text>
                </div>
              </Col>
            </Row>
          </InfoCard>
        </Col>
      </Row>
      <InfoCard>
        <Row>
          <Col span={12}>
            <Typography.Text strong>Item</Typography.Text>
          </Col>
          <Col span={6} style={{ textAlign: 'center' }}>
            <Typography.Text strong>Quantity</Typography.Text>
          </Col>
          <Col span={6} style={{ textAlign: 'center' }}>
            <Typography.Text strong>{org.useShrinkageRate ? 'Shrinkage Amount' : 'Return Amount'}</Typography.Text>
          </Col>
          {/* {advancedEditing && (
            <>
              <Col span={6} style={{ textAlign: 'center' }}>
                <Typography.Text strong>{org.useShrinkageRate ? 'Shrinkage %' : 'Return %'}</Typography.Text>
              </Col>
            </>
          )} */}
        </Row>
        <Divider style={{ marginTop: 5 }} />
        {isLoadingLineItems ? (
          <ContentLoader />
        ) : (
          <>
            {foodwareItems?.length === 0 && <Typography.Text>No items added yet</Typography.Text>}
            {foodwareItems?.map((item, index) => (
              <ReusableItemRow
                key={item.id}
                item={item}
                useShrinkageRate={org.useShrinkageRate}
                readOnly={readOnly}
                updateItem={updateItem}
                isLast={index === foodwareItems.length - 1}
                advancedEditing={advancedEditing}
              />
            ))}
          </>
        )}
      </InfoCard>
    </S.Wrapper>
  );
}

type ReusableItemRowProps = {
  item: FoodwareLineItem;
  useShrinkageRate: boolean;
  readOnly: boolean;
  updateItem: (id: string, reusableItemCount: number, reusableReturnPercentage?: number) => void;
  isLast: boolean;
  advancedEditing: boolean;
};

function ReusableItemRow({
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

const calculateAverageReturnPercentage = (foodwareItems: FoodwareLineItem[] = [], useShrinkageRate: boolean) => {
  const totalReturnPercentage = foodwareItems.reduce((acc, item) => acc + item.reusableReturnPercentage, 0);
  const returnPercentage = totalReturnPercentage / foodwareItems.length;
  return useShrinkageRate ? 100 - returnPercentage : returnPercentage;
};
