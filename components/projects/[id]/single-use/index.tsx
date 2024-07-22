import { PlusOutlined } from '@ant-design/icons';
import type { Project } from '@prisma/client';
import { Button, Divider, Drawer, Typography, message } from 'antd';
import { useMemo, useState } from 'react';
import { useEffect } from 'react';

import ContentLoader from 'components/common/ContentLoader';
import { useLoadingState } from 'hooks/useLoadingState';
import type { DashboardUser } from 'interfaces';
import { PRODUCT_CATEGORIES } from 'lib/calculator/constants/product-categories';
import chartreuseClient from 'lib/chartreuseClient';
import { GET } from 'lib/http';
import type { SingleUseProduct } from 'lib/inventory/types/products';
import type { SingleUseLineItem } from 'lib/inventory/types/projects';

import { EmptyState } from '../components/EmptyState';
import { useFooterState } from '../components/Footer';
import * as S from '../styles';

import { CATEGORY_ICONS } from './CategoryIcons';
import type { SingleUseItemRecord } from './components/ItemRow';
import { ItemRow } from './components/ItemRow';
import { SummaryRow } from './components/SummaryRow';
import SingleUseForm from './SingleUseForm';

type ServerSideProps = {
  project: Project;
  user: DashboardUser;
  readOnly: boolean;
};

export default function SingleUsePage({ project, readOnly }: ServerSideProps) {
  const [formStep, setFormStep] = useState<number>(1);
  const [isDrawerVisible, setIsDrawerVisible] = useState<boolean>(false);
  const [lineItem, setLineItem] = useState<SingleUseLineItem | null>(null);
  const [lineItems, setLineItems] = useLoadingState<{
    data: SingleUseLineItem[];
  }>({ data: [] });
  const [products, setProducts] = useLoadingState<{ data: SingleUseProduct[] }>({ data: [] });

  useEffect(() => {
    getProducts();
    getLineItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { setFooterState } = useFooterState();
  useEffect(() => {
    setFooterState({ path: '/single-use-items', stepCompleted: true });
  }, [setFooterState]);

  async function getProducts() {
    try {
      const products = await GET<SingleUseProduct[]>('/api/inventory/single-use-products');
      setProducts({ data: products, isLoading: false });
    } catch (error) {
      //
    }
  }

  async function getLineItems() {
    try {
      const { lineItems } = await GET<{ lineItems: SingleUseLineItem[] }>(
        `/api/projects/${project.id}/single-use-items`
      );
      setLineItems({ data: lineItems, isLoading: false });
    } catch (error) {
      //
    }
  }

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
      await getLineItems();
      message.success('Item saved successfully');
      closeDrawer();
    } catch (response) {
      message.error((response as any).error || 'Failed to save item');
    }
  }

  const items = useMemo(
    () =>
      lineItems.data.reduce<{
        [categoryId: string]: SingleUseItemRecord[];
      }>((items, item) => {
        const product = products.data.find(p => p.id === item.productId);
        if (product) {
          const record: SingleUseItemRecord = {
            lineItem: item,
            product
          };
          items[product.category] = items[product.category] || [];
          items[product.category].push(record);
        } else if (products.data.length) {
          console.error('Could not find product by product id:', item.productId);
        }
        return items;
      }, {}),
    [lineItems.data, products.data]
  );

  const hasItems = lineItems.data.length > 0;

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
      {lineItems.isLoading || products.isLoading ? (
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
                      onDelete={getLineItems}
                      readOnly={readOnly}
                    />
                  ))}
                </div>
              )
          )}
          {lineItems.data?.length > 0 && <SummaryRow lineItems={lineItems.data} />}
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
          products={products.data}
          onSubmit={onSubmitNewProduct}
        />
      </Drawer>
    </S.Wrapper>
  );
}
