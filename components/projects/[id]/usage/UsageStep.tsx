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
import { BOTTLE_STATION_PRODUCT_ID } from 'lib/calculator/constants/reusable-product-types';
import { ReusableItemRow } from './components/ReusableItemRow';
import { WaterStationRow } from './components/WaterStationRow';
import { getReturnRate } from 'lib/calculator/calculations/foodware/getReturnRate';

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

  const foodwareWithoutWaterStation = useMemo(() => {
    return foodwareItems?.filter(item => item.reusableProduct.id !== BOTTLE_STATION_PRODUCT_ID);
  }, [foodwareItems]);

  const waterStation = useMemo(() => {
    return foodwareItems?.find(item => item.reusableProduct.id === BOTTLE_STATION_PRODUCT_ID);
  }, [foodwareItems]);

  const { displayValue, returnRatelabel, allItemsHaveSamePercentage } = useMemo(() => {
    const { returnRate, allItemsHaveSamePercentage } = getReturnRate({
      foodwareLineItems: foodwareWithoutWaterStation ?? [],
      rounded: true
    });

    return {
      ...getReturnOrShrinkageRate({
        returnRate,
        useShrinkageRate: org.useShrinkageRate
      }),
      allItemsHaveSamePercentage
    };
  }, [foodwareWithoutWaterStation, org]);

  // Advanced editing state
  const [advancedEditing, setAdvancedEditing] = useState(!isLoadingLineItems && !allItemsHaveSamePercentage);
  function updateItem(id: string, reusableItemCount: number, reusableReturnCount?: number) {
    addOrUpdateFoodwareLineItem({
      id,
      reusableItemCount,
      reusableReturnCount,
      reusableReturnPercentage: 0
    });
  }

  function updateWaterStation(id: string, waterUsageGallons?: number, reusableItemCount?: number) {
    addOrUpdateFoodwareLineItem({
      id,
      waterUsageGallons,
      reusableItemCount
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
          <InfoCard title={returnRatelabel}>
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
                    placeholder={advancedEditing ? displayValue?.toString() : 'Set rate for all items'}
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
      <InfoCard style={{ marginBottom: 24 }}>
        <Row>
          <Col span={8}>
            <Typography.Text strong>Item</Typography.Text>
          </Col>
          <Col span={6} style={{ textAlign: 'center' }}>
            <Typography.Text strong>Quantity</Typography.Text>
          </Col>
          <Col span={6} style={{ textAlign: 'center' }}>
            <Typography.Text strong>{org.useShrinkageRate ? 'Shrinkage Amount' : 'Return Amount'}</Typography.Text>
          </Col>
          <Col span={4} style={{ textAlign: 'center' }}>
            <Typography.Text strong>{org.useShrinkageRate ? 'Shrinkage %' : 'Return %'}</Typography.Text>
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
            {foodwareWithoutWaterStation?.length === 0 && <Typography.Text>No items added yet</Typography.Text>}
            {foodwareWithoutWaterStation?.map((item, index) => (
              <ReusableItemRow
                key={item.id}
                item={item}
                useShrinkageRate={org.useShrinkageRate}
                readOnly={readOnly}
                updateItem={updateItem}
                isLast={index === foodwareWithoutWaterStation.length - 1}
                advancedEditing={advancedEditing}
              />
            ))}
          </>
        )}
      </InfoCard>
      {waterStation && (
        <InfoCard style={{ padding: '12px 0' }}>
          <WaterStationRow item={waterStation} readOnly={readOnly} updateItem={updateWaterStation} />
        </InfoCard>
      )}
    </S.Wrapper>
  );
}

const calculateAverageReturnPercentage = (foodwareItems: FoodwareLineItem[] = [], useShrinkageRate: boolean) => {
  const foodwareWithReusables = foodwareItems.filter(item => item.reusableItemCount && item.reusableReturnCount);
  const totalReturnPercentage = foodwareWithReusables.reduce((acc, item) => {
    const returnPercentage = Math.round((item.reusableReturnCount * 100) / item.reusableItemCount);
    return acc + returnPercentage;
  }, 0);
  const returnPercentage = Math.round((totalReturnPercentage / foodwareWithReusables.length) * 100) / 100;
  return useShrinkageRate ? 100 - returnPercentage : returnPercentage;
};

export function getReturnOrShrinkageRate({
  returnRate,
  useShrinkageRate
}: {
  returnRate?: number;
  useShrinkageRate: boolean;
}) {
  const displayValue =
    typeof returnRate === 'number'
      ? useShrinkageRate
        ? Math.round((100 - returnRate) * 100) / 100
        : returnRate
      : undefined;
  return {
    displayValue,
    returnRatelabel: useShrinkageRate ? 'Shrinkage rate' : 'Return rate'
  };
}
