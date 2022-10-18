import { Button, Divider, Drawer, Typography, Spin, Row, Col, Popconfirm, message, Card } from 'antd'
import { useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import SingleUseForm from './single-use-form'
import * as S from '../styles'
import { useEffect } from 'react'
import { SingleUseProduct } from 'lib/calculator/types/products'
import { SingleUseLineItem } from 'lib/calculator/types/projects'
import { DELETE, GET } from 'lib/http'
import { Project } from '.prisma/client'
import { DashboardUser } from 'components/dashboard'
import { PRODUCT_CATEGORIES } from 'lib/calculator/constants/product-categories'
import useLoadingState from 'hooks/useLoadingState'
import ContentLoader from 'components/content-loader'
import { getannualOccurrence } from 'lib/calculator/constants/frequency'
import { useFooterState } from '../footer'
import styled from 'styled-components'
import { CATEGORY_ICONS } from './category-icons'
import chartreuseClient from 'lib/chartreuseClient'

type ServerSideProps = {
  project: Project
  user: DashboardUser
}

interface SingleUseItemRecord {
  lineItem: SingleUseLineItem
  product: SingleUseProduct
}

const SmallText = styled(Typography.Text)`
  font-size: 0.9rem;
`

const BaselineCard = ({ item }: { item: SingleUseItemRecord }) => {
  const annualOccurrence = getannualOccurrence(item.lineItem.frequency)
  const baselineTotal = annualOccurrence * item.lineItem.caseCost * item.lineItem.casesPurchased

  const { setFooterState } = useFooterState()
  useEffect(() => {
    setFooterState({ path: '/single-use-items', stepCompleted: true })
  }, [setFooterState])

  return (
    <S.InfoCard theme="baseline">
      <Row>
        <Col span={16}>
          <Typography.Title level={5}>Baseline</Typography.Title>
        </Col>
        <Col span={8}>
          <Typography.Text>Total</Typography.Text>
        </Col>
      </Row>
      <Row>
        <Col span={16}>
          <S.SmallText>Annual cost</S.SmallText>
          <br />
          <S.SmallerText>
            (${item.lineItem.caseCost}/case x {annualOccurrence * item.lineItem.casesPurchased})
          </S.SmallerText>
        </Col>
        <Col span={8}>
          <Typography.Text>
            <strong>${baselineTotal.toLocaleString()}</strong>
          </Typography.Text>
        </Col>
      </Row>
    </S.InfoCard>
  )
}

const InfoCard = ({ item }: { item: SingleUseItemRecord }) => {
  const annualOccurrence = getannualOccurrence(item.lineItem.frequency)
  const baselineTotal = annualOccurrence * item.lineItem.caseCost * item.lineItem.casesPurchased
  const forecastTotal = annualOccurrence * item.lineItem.newCaseCost * item.lineItem.newCasesPurchased
  const change = forecastTotal - baselineTotal
  const isNegativeChange = change < 0
  return (
    <S.InfoCard theme="forecast">
      <Row>
        <Col span={10}>
          <Typography.Title level={5}>Forecast</Typography.Title>
        </Col>
        <Col span={7}>
          <S.SmallText>Total</S.SmallText>
        </Col>
        <Col span={7}>
          <S.SmallText>Change</S.SmallText>
        </Col>
      </Row>
      <Row>
        <Col span={10}>
          <S.SmallText>Annual cost</S.SmallText>
        </Col>
        <Col span={7}>
          <Typography.Text>
            <strong>${forecastTotal.toLocaleString()}</strong>
          </Typography.Text>
        </Col>
        <Col span={7}>
          <Typography.Text>
            <strong>
              {isNegativeChange ? '-' : '+'}${Math.abs(change).toLocaleString()}
            </strong>
          </Typography.Text>
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <S.SmallerText>
            (${item.lineItem.newCaseCost}/case x {annualOccurrence * item.lineItem.newCasesPurchased})
          </S.SmallerText>
        </Col>
      </Row>
    </S.InfoCard>
  )
}

const ItemRow = ({ item, onEdit, onDelete }: { item: SingleUseItemRecord; onEdit: (item: SingleUseItemRecord) => void; onDelete: () => void }) => {
  function confirm() {
    chartreuseClient
      .deleteSingleUseItem(item.lineItem.projectId, item.lineItem.id)
      .then(() => {
        message.success('Item removed')
        onDelete()
      })
      .catch(error => {
        if (error.error || error.message) {
          message.error(error.error || error.message)
        }
      })
  }

  return (
    <S.InfoRow>
      <Col span={8}>
        <Typography.Title level={5}>{item.product.description}</Typography.Title>
        <a
          href="#"
          onClick={e => {
            onEdit(item)
            e.preventDefault()
          }}
        >
          Edit
        </a>
        <Typography.Text style={{ opacity: '.25' }}> | </Typography.Text>
        <Popconfirm title="Are you sure you want to delete this item?" onConfirm={confirm} okText="Yes" cancelText="No">
          <a href="#">Delete</a>
        </Popconfirm>
      </Col>
      <Col span={8}>
        <BaselineCard item={item} />
      </Col>
      <Col span={8}>
        <InfoCard item={item} />
      </Col>
    </S.InfoRow>
  )
}

const SummaryRow = ({ lineItems }: { lineItems: SingleUseLineItem[] }) => {
  const baselineProductCount = lineItems.filter(item => item.casesPurchased > 0).length
  const forecastProductCount = lineItems.filter(item => item.newCasesPurchased > 0).length
  const baselineCost = lineItems.reduce((total, item) => {
    const annualOccurrence = getannualOccurrence(item.frequency)
    const itemTotal = annualOccurrence * item.caseCost * item.casesPurchased
    return total + itemTotal
  }, 0)
  const forecastCost = lineItems.reduce((total, item) => {
    const annualOccurrence = getannualOccurrence(item.frequency)
    const itemTotal = annualOccurrence * item.newCaseCost * item.newCasesPurchased
    return total + itemTotal
  }, 0)
  const change = forecastCost - baselineCost
  const isChangeNegative = change < 0
  return (
    <S.InfoCard style={{ boxShadow: 'none' }}>
      <Row>
        <Col span={8}>
          <Typography.Title level={4}>Total annual single-use purchasing</Typography.Title>
        </Col>
        <Col span={8}>
          <Row gutter={[0, 20]}>
            <Col span={24}>
              <SmallText>
                <strong>Baseline</strong>
              </SmallText>
            </Col>
            {/* next row */}
            <Col span={16}>
              <SmallText>Number of products</SmallText>
            </Col>
            <Col span={8}>
              <SmallText>{baselineProductCount}</SmallText>
            </Col>
            {/* next row */}
            <Col span={16}>
              <SmallText>Annual cost</SmallText>
            </Col>
            <Col span={8}>
              <SmallText>${baselineCost.toLocaleString()}</SmallText>
            </Col>
          </Row>
        </Col>
        <Col span={8}>
          <Row gutter={[0, 20]}>
            <Col span={12}>
              <SmallText>
                <strong>Forecast</strong>
              </SmallText>
            </Col>
            <Col span={12}>
              <SmallText>
                <strong>Change</strong>
              </SmallText>
            </Col>
            {/* next row */}
            <Col span={12}>
              <SmallText>{forecastProductCount}</SmallText>
            </Col>
            <Col span={12}>
              <SmallText>{forecastProductCount - baselineProductCount}</SmallText>
            </Col>
            {/* next row */}
            <Col span={12}>
              <SmallText>${forecastCost.toLocaleString()}</SmallText>
            </Col>
            <Col span={12}>
              <SmallText>
                {isChangeNegative ? '-' : '+'}${Math.abs(change).toLocaleString()}
              </SmallText>
            </Col>
          </Row>
        </Col>
      </Row>
    </S.InfoCard>
  )
}

export default function SingleUse({ project }: ServerSideProps) {
  const [formStep, setFormStep] = useState<number>(1)
  const [isDrawerVisible, setIsDrawerVisible] = useState<boolean>(false)
  const [lineItem, setLineItem] = useState<SingleUseLineItem | null>(null)
  const [lineItems, setLineItems] = useLoadingState<{
    data: SingleUseLineItem[]
  }>({ data: [] })
  const [products, setProducts] = useState<SingleUseProduct[]>([])

  useEffect(() => {
    getProducts()
    getLineItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function getProducts() {
    try {
      const products = await GET<SingleUseProduct[]>('/api/inventory/single-use-products')
      setProducts(products)
    } catch (error) {
      //
    }
  }

  async function getLineItems() {
    try {
      const { lineItems } = await GET<{ lineItems: SingleUseLineItem[] }>(`/api/projects/${project.id}/single-use-items`)
      setLineItems({ data: lineItems, isLoading: false })
    } catch (error) {
      //
    }
  }

  function addItem() {
    setLineItem(null)
    setIsDrawerVisible(true)
  }

  function editItem({ lineItem: _lineItem }: SingleUseItemRecord) {
    setLineItem(_lineItem)
    setIsDrawerVisible(true)
  }

  function closeDrawer() {
    setIsDrawerVisible(false)
  }

  function onSubmitNewProduct() {
    closeDrawer()
    getLineItems()
  }

  const items = lineItems.data.reduce<{
    [categoryId: string]: SingleUseItemRecord[]
  }>((items, item) => {
    const product = products.find(p => p.id === item.productId)
    if (product) {
      const record: SingleUseItemRecord = {
        lineItem: item,
        product,
      }
      items[product.category] = items[product.category] || []
      items[product.category].push(record)
    } else {
      console.error('Could not find product by product id:', item.productId)
    }
    return items
  }, {})

  return (
    <S.Wrapper>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography.Title level={1}>Single-use purchasing</Typography.Title>
        <Button type="primary" onClick={addItem} icon={<PlusOutlined />} style={{ paddingRight: '4em', paddingLeft: '4em' }}>
          Add a single-use item
        </Button>
      </div>
      <Typography.Title level={5}>Create an inventory of all single-use items you purchase regularly.</Typography.Title>
      {lineItems.isLoading ? (
        <ContentLoader />
      ) : (
        <>
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
                    <ItemRow key={item.lineItem.id} item={item} onEdit={editItem} onDelete={getLineItems} />
                  ))}
                </div>
              )
          )}
          {lineItems.data.length > 0 && <SummaryRow lineItems={lineItems.data} />}
        </>
      )}
      <Drawer
        title={formStep === 3 ? 'Add purchasing forecast' : 'Add a single-use item'}
        placement="right"
        onClose={closeDrawer}
        visible={isDrawerVisible}
        contentWrapperStyle={{ width: '600px' }}
        destroyOnClose={true}
      >
        <SingleUseForm formStep={formStep} setFormStep={setFormStep} lineItem={lineItem} projectId={project.id} products={products} onSubmit={onSubmitNewProduct} />
      </Drawer>
    </S.Wrapper>
  )
}
