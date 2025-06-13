import type { ProjectContext } from 'lib/middleware/getProjectContext';

import { PlusOutlined } from '@ant-design/icons';
import { Button, Divider, Drawer, message, Typography } from 'antd';
import { useRouter } from 'next/router';
import { useMemo, useState, useEffect } from 'react';

import ContentLoader from 'components/common/ContentLoader';
import { PRODUCT_CATEGORIES } from 'lib/calculator/constants/product-categories';
import { useGetFoodwareOptions } from 'client/inventory';
import { EmptyState } from '../components/EmptyState';
import { useFooterState } from '../components/Footer';
import { CATEGORY_ICONS } from '../single-use/components/CategoryIcons';
import * as S from '../styles';
import { useAddOrUpdateFoodwareLineItem, useGetFoodwareLineItems } from 'client/projects';
import { ItemRow } from './components/ItemRow';
import type { ModifyFoodwareLineItemRequest } from 'pages/api/projects/[id]/foodware-items';
import { FoodwareLineItemForm, FoodwareLineItemFormValues } from './components/FoodwareLineItemForm';
import { FoodwareLineItem } from 'lib/projects/getProjectFoodwareLineItems';

export function FoodwareStep({ readOnly, project }: { readOnly: boolean; project: ProjectContext['project'] }) {
  const [isDrawerVisible, setIsDrawerVisible] = useState<boolean>(false);
  const [formValues, setFormValues] = useState<FoodwareLineItemFormValues | null>(null);
  const { trigger: addOrUpdateFoodwareLineItem } = useAddOrUpdateFoodwareLineItem(project?.id);
  const { data: foodwareOptions, isLoading: isLoadingFoodwareOptions } = useGetFoodwareOptions();
  const {
    data: lineItems,
    isLoading: isLoadingLineItems,
    mutate: refreshLineItems
  } = useGetFoodwareLineItems(project?.id);

  const route = useRouter();
  const projectId = route.query.id as string;

  const { setFooterState } = useFooterState();
  useEffect(() => {
    setFooterState({ path: '/foodware', stepCompleted: true });
  }, [setFooterState]);

  function addItem() {
    setFormValues(null);
    setIsDrawerVisible(true);
  }

  function editItem(lineItem: FoodwareLineItem) {
    setFormValues({
      id: lineItem.id,
      reusableProductId: lineItem.reusableProduct.id,
      singleUseProductId: lineItem.singleUseProduct.id
    });
    setIsDrawerVisible(true);
  }

  async function onSubmitItem(values: FoodwareLineItemFormValues) {
    const body: ModifyFoodwareLineItemRequest = {
      ...values,
      projectId
    };

    try {
      await addOrUpdateFoodwareLineItem(body);
      message.success('Item saved successfully');
      closeDrawer();
    } catch (err) {
      message.error((err as Error)?.message || 'Failed to save item');
    }

    refreshLineItems();
  }

  function closeDrawer() {
    setIsDrawerVisible(false);
  }

  const hasItems = lineItems && lineItems.length > 0;
  const items = useMemo(
    () =>
      (lineItems || []).reduce<{
        [categoryId: string]: FoodwareLineItem[];
      }>((items, item) => {
        const product = item.reusableProduct;
        items[product.category] = items[product.category] || [];
        items[product.category].push(item);
        return items;
      }, {}),
    [lineItems, foodwareOptions]
  );

  return (
    <S.Wrapper>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography.Title level={1}>Reusables purchasing</Typography.Title>
        {hasItems && !readOnly && (
          <Button
            type='primary'
            onClick={addItem}
            icon={<PlusOutlined />}
            style={{ paddingRight: '4em', paddingLeft: '4em' }}
          >
            Add reusable item
          </Button>
        )}
      </div>
      {isLoadingLineItems || isLoadingFoodwareOptions ? (
        <ContentLoader />
      ) : (
        <>
          {!hasItems && !readOnly && (
            <EmptyState
              label='Add a reusable item'
              message={`You have no reusable items yet. Click '+ Add a reusable item' above to get started.`}
              onClick={addItem}
            />
          )}
          {PRODUCT_CATEGORIES.map(
            category =>
              items[category.id] && (
                <div key={category.id}>
                  <S.TitleRow>
                    {/* <S.CategoryIcon>{CATEGORY_ICONS[index]}</S.CategoryIcon> */}
                    <Typography.Title level={3}>{category.name}</Typography.Title>
                  </S.TitleRow>
                  <Divider />
                  {items[category.id].map(item => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      onEdit={editItem}
                      onDelete={refreshLineItems}
                      readOnly={readOnly}
                    />
                  ))}
                </div>
              )
          )}
          <Drawer
            title={'Select a reusable item'}
            placement='right'
            onClose={closeDrawer}
            open={isDrawerVisible}
            contentWrapperStyle={{ width: '600px' }}
            destroyOnClose={true}
          >
            <FoodwareLineItemForm input={formValues} options={foodwareOptions || []} onSubmit={onSubmitItem} />
          </Drawer>
        </>
      )}
    </S.Wrapper>
  );
}
