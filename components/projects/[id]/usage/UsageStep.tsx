import type { ProjectContext } from 'lib/middleware/getProjectContext';
import { Col, Divider, InputNumber, Row, Typography } from 'antd';
import { InfoCard } from '../styles';
import * as S from '../styles';
import { useGetFoodwareLineItems, useAddOrUpdateFoodwareLineItem, useUpdateProjectUsage } from 'client/projects';
import ContentLoader from 'components/common/ContentLoader';
import { useFooterState } from '../components/Footer';
import { useEffect } from 'react';

import { usePreventReload } from 'hooks/usePreventUnload';

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
  const { data: foodwareItems, isLoading: isLoadingLineItems } = useGetFoodwareLineItems(project.id);
  const { trigger: addOrUpdateFoodwareLineItem, isMutating: isSavingLineItem } = useAddOrUpdateFoodwareLineItem(
    project?.id
  );
  const { trigger: updateProjectUsage, isMutating: isSavingProjectUsage } = useUpdateProjectUsage(project?.id);

  usePreventReload(isSavingLineItem || isSavingProjectUsage);

  // for now, all items have the same percentage. this is so in the future we might want to let users set a different percentage for each item.
  const projectReturnPercentage = foodwareItems?.[0]?.reusableReturnPercentage;
  const displayValue =
    typeof projectReturnPercentage === 'number'
      ? org.useShrinkageRate
        ? 100 - projectReturnPercentage
        : projectReturnPercentage
      : undefined;

  function updateItem(id: string, reusableItemCount: number) {
    addOrUpdateFoodwareLineItem({
      id,
      reusableItemCount
    });
  }

  useEffect(() => {
    setFooterState({ path: '/usage', stepCompleted: true });
  }, [setFooterState]);

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
            {isLoadingLineItems ? (
              <InputNumber key='loading' style={{ minWidth: '20ch' }} size='large' />
            ) : (
              <InputNumber
                key='loaded'
                defaultValue={displayValue}
                placeholder={org.useShrinkageRate ? 'Enter shrinkage rate' : 'Enter return rate'}
                suffix='%'
                style={{ minWidth: '20ch' }}
                size='large'
                onChange={value => {
                  if (typeof value === 'number') {
                    const toSave = org.useShrinkageRate ? 100 - value : value;
                    updateProjectUsage({ reusableReturnPercentage: toSave });
                  }
                }}
              />
            )}
          </InfoCard>
        </Col>
      </Row>
      <InfoCard title='Reusable Item Quantity'>
        {isLoadingLineItems ? (
          <ContentLoader />
        ) : (
          <>
            {foodwareItems?.length === 0 && <Typography.Text>No items added yet</Typography.Text>}
            {foodwareItems?.map((item, index) => (
              <Row justify='space-between' align='middle' key={item.id}>
                <Col>
                  <S.CardTitle>{item.reusableProduct.description}</S.CardTitle>
                </Col>
                <Col>
                  <InputNumber
                    placeholder='Enter quantity'
                    style={{ minWidth: '20ch' }}
                    size='large'
                    disabled={readOnly}
                    defaultValue={item.reusableItemCount || undefined}
                    onChange={value => {
                      if (typeof value === 'number') {
                        updateItem(item.id, value);
                      }
                    }}
                  />
                </Col>
                {index !== foodwareItems.length - 1 && <Divider />}
              </Row>
            ))}
          </>
        )}
      </InfoCard>
    </S.Wrapper>
  );
}
