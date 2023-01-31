import { PlusOutlined } from '@ant-design/icons';
import { Button, Divider, Row, Col, Drawer, List, message, Typography } from 'antd';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import styled from 'styled-components';

import ContentLoader from 'components/common/content-loader';
import { PRODUCT_CATEGORIES } from 'lib/calculator/constants/product-categories';
import { formatToDollar } from 'lib/calculator/utils';
import chartreuseClient from 'lib/chartreuseClient';
import * as http from 'lib/http';
import type { ReusableLineItem } from 'lib/inventory/types/projects';

import { EmptyState } from '../components/empty-state';
import { useFooterState } from '../components/footer';
import { CATEGORY_ICONS } from '../single-use/category-icons';
import * as S from '../styles';

import ItemRow from './components/ItemRow';
import ReusablePurchasingFirstStepForm from './reusable-purchasing-first-step-form';
import ReusablePurchasingSecondStepForm from './reusable-purchasing-second-step-form';

const SmallText = styled(Typography.Text)`
  font-size: 0.9rem;
`;

export interface ReusableFormValues {
  id?: string | null;
  annualRepurchasePercentage: string;
  caseCost: string;
  casesPurchased: string;
  categoryId: string;
  unitsPerCase: string;
  productName: string;
}

export default function ReusablePurchasing() {
  const [isDrawerVisible, setIsDrawerVisible] = useState<boolean>(false);
  const [formStep, setFormStep] = useState<number>(1);
  const [formValues, setFormValues] = useState<ReusableFormValues | null>(null);
  const [lineItems, setLineItems] = useState<ReusableLineItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const route = useRouter();
  const projectId = route.query.id as string;

  useEffect(() => {
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

  function editItem(item: ReusableLineItem) {
    setFormValues({
      id: item.id,
      annualRepurchasePercentage: item.annualRepurchasePercentage.toString(),
      caseCost: item.caseCost.toString(),
      casesPurchased: item.casesPurchased.toString(),
      categoryId: item.categoryId,
      productName: item.productName,
      unitsPerCase: item.unitsPerCase?.toString() ?? '0'
    });
    setFormStep(1);
    setIsDrawerVisible(true);
  }

  function onSubmitFirstStep(values: ReusableFormValues) {
    setFormValues({ ...formValues, ...values });
    setFormStep(2);
  }

  function onSubmitForecast({ casesAnnually }: { casesAnnually: number }) {
    const annualRepurchasePercentage = (casesAnnually / parseInt(formValues!.casesPurchased)).toString();
    const newFormValues = { ...formValues!, annualRepurchasePercentage };
    setFormValues(newFormValues);
    saveData(newFormValues);
  }

  async function saveData(values: ReusableFormValues) {
    const body: ReusableLineItem = {
      ...values,
      casesPurchased: parseInt(values.casesPurchased),
      annualRepurchasePercentage: parseFloat(values.annualRepurchasePercentage),
      caseCost: parseInt(values.caseCost),
      unitsPerCase: parseInt(values.unitsPerCase),
      projectId
    };

    try {
      await chartreuseClient.addReusableLineItem(projectId, body);
      message.success('Reusable-use item saved successfully');
      closeDrawer();
    } catch (err) {
      message.error((err as Error)?.message);
    }

    refreshList();
  }

  function refreshList() {
    getLineItems();
  }

  function onPressPrevious() {
    setFormStep(1);
  }

  function closeDrawer() {
    setIsDrawerVisible(false);
  }

  const hasItems = lineItems.length > 0;

  return (
    <S.Wrapper>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography.Title level={1}>Reusables purchasing</Typography.Title>
        {hasItems && (
          <Button type='primary' onClick={addItem} icon={<PlusOutlined />} style={{ paddingRight: '4em', paddingLeft: '4em' }}>
            Add reusable item
          </Button>
        )}
      </div>
      <Typography.Title level={5}>
        Enter reusable items to replace single-use items as appropriate. It is possible to eliminate a single-use item without a purchase of a reusable ware. For example, if you have three sizes of
        single-use plastic forks, you may only move to one size/type of durable fork.
        <br />
        <br />
        If you are replacing single-use condiments, there are two things to consider:
        <br />
        <br />
        <ol>
          <li>The replacement will likely be purchased in bulk, which will be a new recurring purchase.</li>
          <li>Any new dispensing equipment will be included in Step 4, “Other Costs.”</li>
        </ol>
        <br />
      </Typography.Title>
      {isLoading ? (
        <ContentLoader />
      ) : (
        <>
          {!hasItems && <EmptyState label='Add a reusable item' message={`You have no reusable items yet. Click '+ Add a reusable item' above to get started.`} onClick={addItem} />}
          {PRODUCT_CATEGORIES.map((category, index) => {
            const getItemsWithSameId = (item: ReusableLineItem) => item.categoryId === category.id.toString();
            const item = lineItems.find(getItemsWithSameId);

            return (
              item && (
                <div key={category.id}>
                  <S.TitleRow>
                    <S.CategoryIcon>{CATEGORY_ICONS[index]}</S.CategoryIcon>
                    <Typography.Title level={3}>{category.name}</Typography.Title>
                  </S.TitleRow>
                  <Divider />
                  {lineItems.filter(getItemsWithSameId).map(item => (
                    <ItemRow key={item.annualRepurchasePercentage} item={item} onEdit={editItem} onDelete={getLineItems} />
                  ))}
                </div>
              )
            );
          })}
          {lineItems.length > 0 && <SummaryRow lineItems={lineItems} />}
          <Drawer
            title={formStep === 1 ? 'Add a reusable replacement item' : 'Estimate annual reusable re-purchasing needed'}
            placement='right'
            onClose={closeDrawer}
            visible={isDrawerVisible}
            contentWrapperStyle={{ width: '600px' }}
          >
            {formStep === 1 && <ReusablePurchasingFirstStepForm input={formValues} onPressNext={onSubmitFirstStep} />}
            {formStep === 2 && <ReusablePurchasingSecondStepForm input={formValues!} onPressPrevious={onPressPrevious} onPressSubmit={onSubmitForecast} />}
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
              <SmallText>{formatToDollar(totals.cost)}</SmallText>
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
              <SmallText>{formatToDollar(totals.costForecast)}</SmallText>
            </Col>
          </Row>
        </Col>
      </Row>
    </S.InfoCard>
  );
};
