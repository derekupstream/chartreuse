import { PlusOutlined } from '@ant-design/icons';
import { Button, Divider, Row, Col, Drawer, message, Typography } from 'antd';
import { useRouter } from 'next/router';
import { useMemo, useState, useEffect } from 'react';
import styled from 'styled-components';

import CurrencySymbol from 'components/_app/CurrencySymbol';
import ContentLoader from 'components/common/ContentLoader';
import { useLoadingState } from 'hooks/useLoadingState';
import { PRODUCT_CATEGORIES } from 'lib/calculator/constants/product-categories';
import chartreuseClient from 'lib/chartreuseClient';
import * as http from 'lib/http';
import type { ReusableProduct } from 'lib/inventory/types/products';
import type { ReusableLineItem } from 'lib/inventory/types/projects';

import { EmptyState } from '../components/EmptyState';
import { useFooterState } from '../components/Footer';
import { CATEGORY_ICONS } from '../single-use/CategoryIcons';
import * as S from '../styles';

import type { ReusableItemRecord } from './components/ItemRow';
import { ItemRow } from './components/ItemRow';
import { ReusableItemForm } from './components/ReusableItemForm';

const SmallText = styled(Typography.Text)`
  font-size: 0.9rem;
`;

const titles = {
  1: 'Add a reusable replacement item',
  2: 'Estimate initial reusable purchasing needed',
  3: 'Estimate annual reusable re-purchasing needed'
};

export interface ReusableFormValues {
  id?: string | null;
  annualRepurchasePercentage: number;
  caseCost: number;
  casesPurchased: number;
  categoryId: string | null;
  unitsPerCase: number;
  productName: string;
  productId: string | null;
}

const MISC_CATEGORY = -1;

export default function ReusablePurchasing({ isUpstream, readOnly }: { isUpstream: boolean; readOnly: boolean }) {
  const [isDrawerVisible, setIsDrawerVisible] = useState<boolean>(false);
  const [formStep, setFormStep] = useState<number>(1);
  const [formValues, setFormValues] = useState<ReusableFormValues | null>(null);
  const [lineItems, setLineItems] = useState<ReusableLineItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useLoadingState<{ data: ReusableProduct[] }>({ data: [] });

  async function getProducts() {
    try {
      const products = await http.GET<ReusableProduct[]>('/api/inventory/reusable-products');
      setProducts({ data: products, isLoading: false });
    } catch (error) {
      //
    }
  }

  const route = useRouter();
  const projectId = route.query.id as string;

  useEffect(() => {
    getProducts();
    getLineItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { setFooterState } = useFooterState();
  useEffect(() => {
    setFooterState({ path: '/reusable-items', stepCompleted: true });
  }, [setFooterState]);

  async function getLineItems() {
    if (!projectId) return;

    try {
      const url = `/api/projects/${projectId}/reusable-items`;
      const { lineItems } = await http.GET<{ lineItems: ReusableLineItem[] }>(url);
      setLineItems(lineItems);
    } catch (error) {
      setLineItems([]);
    } finally {
      setIsLoading(false);
    }
  }

  function addItem() {
    setFormValues(null);
    setFormStep(1);
    setIsDrawerVisible(true);
  }

  function editItem({ lineItem: item }: ReusableItemRecord) {
    setFormValues({
      id: item.id,
      annualRepurchasePercentage: item.annualRepurchasePercentage,
      caseCost: item.caseCost,
      casesPurchased: item.casesPurchased,
      categoryId: item.categoryId,
      productName: '',
      productId: item.productId,
      unitsPerCase: item.unitsPerCase ?? 0
    });
    setFormStep(1);
    setIsDrawerVisible(true);
  }

  async function onSubmitItem(values: ReusableFormValues) {
    console.log(values.annualRepurchasePercentage);
    const body: ReusableLineItem = {
      ...values,
      casesPurchased: values.casesPurchased,
      annualRepurchasePercentage: values.annualRepurchasePercentage,
      caseCost: values.caseCost,
      unitsPerCase: values.unitsPerCase,
      projectId
    };

    try {
      await chartreuseClient.addOrUpdateReusableLineItem(projectId, body);
      message.success('Item saved successfully');
      closeDrawer();
    } catch (err) {
      message.error((err as Error)?.message || 'Failed to save item');
    }

    refreshList();
  }

  function refreshList() {
    getLineItems();
  }

  function closeDrawer() {
    setIsDrawerVisible(false);
  }

  const hasItems = lineItems.length > 0;
  const items = useMemo(
    () =>
      lineItems.reduce<{
        [categoryId: string]: ReusableItemRecord[];
      }>((items, item) => {
        const product = products.data.find(p => p.id === item.productId);
        if (product) {
          const record: ReusableItemRecord = {
            lineItem: item,
            product
          };
          items[product.category] = items[product.category] || [];
          items[product.category].push(record);
        } else if (products.data.length) {
          console.error('Could not find product by product id:', item.productId);
          items[MISC_CATEGORY] = items[MISC_CATEGORY] || [];
          items[MISC_CATEGORY].push({ lineItem: item });
        }
        return items;
      }, {}),
    [lineItems, products.data]
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
      <Typography.Title level={5}>
        Enter reusable items to replace single-use items as appropriate. It is possible to eliminate a single-use item
        without a purchase of a reusable ware. For example, if you have three sizes of single-use plastic forks, you may
        only move to one size/type of durable fork.
        <br />
        <br />
        If you are replacing single-use condiments, there are two things to consider:
        <br />
        <br />
        <ol>
          <li>The replacement will likely be purchased in bulk, which will be a new recurring purchase.</li>
          <li>Any new dispensing equipment will be included in Step 3, “Other Costs.”</li>
        </ol>
        <br />
      </Typography.Title>
      {isLoading || products.isLoading ? (
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
          {items[MISC_CATEGORY] && (
            <>
              <S.TitleRow>
                <Typography.Title level={3}>Uncategorized</Typography.Title>
              </S.TitleRow>
              <Divider />
              {items[MISC_CATEGORY].map(item => (
                <ItemRow
                  key={item.lineItem.id}
                  item={item}
                  readOnly={readOnly}
                  onEdit={editItem}
                  onDelete={getLineItems}
                />
              ))}
            </>
          )}
          {lineItems.length > 0 && <SummaryRow lineItems={lineItems} />}
          <Drawer
            title={titles[formStep as keyof typeof titles]}
            placement='right'
            onClose={closeDrawer}
            open={isDrawerVisible}
            contentWrapperStyle={{ width: '600px' }}
            destroyOnClose={true}
          >
            <ReusableItemForm
              formStep={formStep}
              setFormStep={setFormStep}
              lineItem={formValues}
              products={products.data}
              onSubmit={onSubmitItem}
              isUpstream={isUpstream}
            />
          </Drawer>
        </>
      )}
    </S.Wrapper>
  );
}

type SummaryCounts = { products: number; units: number; unitsForecast: number; cost: number; costForecast: number };

const SummaryRow = ({ lineItems }: { lineItems: ReusableLineItem[] }) => {
  const totals = lineItems.reduce<SummaryCounts>(
    (_totals, item) => {
      if (item.casesPurchased > 0) {
        _totals.products += 1;
        _totals.cost += item.casesPurchased * item.caseCost;
        _totals.units += item.casesPurchased * item.unitsPerCase;
        _totals.costForecast += item.caseCost * item.annualRepurchasePercentage * item.casesPurchased;
        _totals.unitsForecast += item.unitsPerCase * item.annualRepurchasePercentage * item.casesPurchased;
      }
      return _totals;
    },
    { products: 0, units: 0, cost: 0, costForecast: 0, unitsForecast: 0 }
  );
  const averageRepurchaseRate = Math.round(
    (lineItems.reduce((total, item) => {
      return total + item.annualRepurchasePercentage;
    }, 0) /
      lineItems.length) *
      100
  );
  return (
    <S.InfoCard style={{ boxShadow: 'none' }}>
      <Row>
        <Col span={8}>
          <Typography.Title level={4}>Repurchase totals</Typography.Title>
        </Col>
        <Col span={8}>
          <Row gutter={[0, 20]}>
            <Col span={24}>
              <SmallText>
                <strong>Initial costs</strong>
              </SmallText>
            </Col>
            {/* next row */}
            <Col span={16}>
              <SmallText>Number of products</SmallText>
            </Col>
            <Col span={8}>
              <SmallText>{totals.products}</SmallText>
            </Col>
            {/* next row */}
            <Col span={16}>
              <SmallText>Number of units</SmallText>
            </Col>
            <Col span={8}>
              <SmallText>{totals.units}</SmallText>
            </Col>
            {/* next row */}
            <Col span={16}>
              <SmallText>Total</SmallText>
            </Col>
            <Col span={8}>
              <SmallText>
                <CurrencySymbol value={totals.cost} />
              </SmallText>
            </Col>
          </Row>
        </Col>
        <Col span={8}>
          <Row gutter={[0, 20]}>
            <Col span={24}>
              <SmallText>
                <strong>Repurchase forecast</strong>
              </SmallText>
            </Col>
            {/* next row */}
            <Col span={16}>
              <SmallText>Average repurchase rate</SmallText>
            </Col>
            <Col span={8}>
              <SmallText>{averageRepurchaseRate}%</SmallText>
            </Col>
            {/* next row */}
            <Col span={16}>
              <SmallText>Number of units</SmallText>
            </Col>
            <Col span={8}>
              <SmallText>{totals.unitsForecast}</SmallText>
            </Col>
            {/* next row */}
            <Col span={16}>
              <SmallText>Annual repurchase cost</SmallText>
            </Col>
            <Col span={8}>
              <SmallText>
                <CurrencySymbol value={totals.costForecast} />
              </SmallText>
            </Col>
          </Row>
        </Col>
      </Row>
    </S.InfoCard>
  );
};
