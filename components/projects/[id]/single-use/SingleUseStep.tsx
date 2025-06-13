import { PlusOutlined } from '@ant-design/icons';
import type { Project } from '@prisma/client';
import { Button, Divider, Drawer, Typography, message } from 'antd';
import { useMemo, useState } from 'react';
import { useEffect } from 'react';
import ContentLoader from 'components/common/ContentLoader';
import { useGetSingleUseProducts } from 'client/inventory';
import type { DashboardUser } from 'interfaces';
import { PRODUCT_CATEGORIES } from 'lib/calculator/constants/product-categories';
import chartreuseClient from 'lib/chartreuseClient';
import type { SingleUseLineItem } from 'lib/inventory/types/projects';
import { useGetSingleUseLineItems } from 'client/projects';
import { EmptyState } from '../components/EmptyState';
import { useFooterState } from '../components/Footer';
import * as S from '../styles';

import { CATEGORY_ICONS } from './components/CategoryIcons';
import type { SingleUseItemRecord } from './components/ItemRow';
import { ItemRow } from './components/ItemRow';
import { SummaryRow } from './components/SummaryRow';
import SingleUseForm from './components/SingleUseForm';

type ServerSideProps = {
  project: Project;
  user: DashboardUser;
  readOnly: boolean;
};

export function SingleUseStep({ project, readOnly }: ServerSideProps) {
  const [formStep, setFormStep] = useState<number>(1);
  const [isDrawerVisible, setIsDrawerVisible] = useState<boolean>(false);
  const [lineItem, setLineItem] = useState<SingleUseLineItem | null>(null);
  const { data: singleUseProducts, isLoading: isLoadingSingleUseProducts } = useGetSingleUseProducts();
  const {
    data: lineItems,
    isLoading: isLoadingLineItems,
    mutate: refreshLineItems
  } = useGetSingleUseLineItems(project?.id);

  const { setFooterState } = useFooterState();
  useEffect(() => {
    setFooterState({ path: '/single-use-items', stepCompleted: true });
  }, [setFooterState]);

  function addItem() {
    setLineItem(null);
    setIsDrawerVisible(true);
  }

  function editItem({ lineItem: _lineItem }: SingleUseItemRecord) {
    setLineItem(_lineItem);
    setIsDrawerVisible(true);
  }

  function closeDrawer() {
    setIsDrawerVisible(false);
  }

  async function onSubmitNewProduct(item: SingleUseLineItem) {
    try {
      const body: SingleUseLineItem = {
        ...item,
        projectId: project.id
      };
      await chartreuseClient.addSingleUseLineItem(project.id, body);
      await refreshLineItems();
      message.success('Item saved successfully');
      closeDrawer();
    } catch (response) {
      message.error((response as any).error || 'Failed to save item');
    }
  }

  const items = useMemo(
    () =>
      (lineItems || []).reduce<{
        [categoryId: string]: SingleUseItemRecord[];
      }>((items, item) => {
        const product = singleUseProducts?.find(p => p.id === item.productId);
        if (product) {
          const record: SingleUseItemRecord = {
            lineItem: item,
            product
          };
          items[product.category] = items[product.category] || [];
          items[product.category].push(record);
        } else if (singleUseProducts?.length) {
          console.error('Could not find product by product id:', item.productId);
        }
        return items;
      }, {}),
    [lineItems, singleUseProducts]
  );

  const hasItems = lineItems && lineItems.length > 0;

  return (
    <S.Wrapper>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography.Title level={1}>Single-use purchasing</Typography.Title>
        {hasItems && !readOnly && (
          <Button
            type='primary'
            onClick={addItem}
            icon={<PlusOutlined />}
            style={{ paddingRight: '4em', paddingLeft: '4em' }}
          >
            Add a single-use item
          </Button>
        )}
      </div>
      <Typography.Title level={5}>
        Create a baseline of single-use items you purchase regularly. Forecast what you could save by reducing or
        eliminating these items.
      </Typography.Title>
      {isLoadingLineItems || isLoadingSingleUseProducts ? (
        <ContentLoader />
      ) : (
        <>
          {!hasItems && !readOnly && (
            <EmptyState
              label='Add a single-use item'
              message={`You have no single-use items yet. Click '+ Add a single-use item' above to get started.`}
              onClick={addItem}
            />
          )}
          {PRODUCT_CATEGORIES.map(
            (category, index) =>
              items[category.id] && (
                <div key={category.id}>
                  <S.TitleRow>
                    <S.CategoryIcon>{CATEGORY_ICONS[index]}</S.CategoryIcon>
                    <Typography.Title level={3}>{category.name}</Typography.Title>
                  </S.TitleRow>
                  <Divider />
                  {items[category.id].map(item => (
                    <ItemRow
                      key={item.lineItem.id}
                      item={item}
                      onEdit={editItem}
                      onDelete={refreshLineItems}
                      readOnly={readOnly}
                    />
                  ))}
                </div>
              )
          )}
          {lineItems && lineItems.length > 0 && <SummaryRow lineItems={lineItems} />}
        </>
      )}
      <Drawer
        title={formStep === 3 ? 'Add purchasing forecast' : 'Add a single-use item'}
        placement='right'
        onClose={closeDrawer}
        open={isDrawerVisible}
        contentWrapperStyle={{ width: '600px' }}
        destroyOnClose={true}
      >
        <SingleUseForm
          formStep={formStep}
          setFormStep={setFormStep}
          lineItem={lineItem}
          products={singleUseProducts || []}
          onSubmit={onSubmitNewProduct}
        />
      </Drawer>
    </S.Wrapper>
  );
}
