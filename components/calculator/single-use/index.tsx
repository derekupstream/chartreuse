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
import { getAnnualOccurence } from 'lib/calculator/constants/frequency'
import { useFooterState } from '../footer'

type ServerSideProps = {
  project: Project
  user: DashboardUser
}

interface SingleUseItemRecord {
  lineItem: SingleUseLineItem
  product: SingleUseProduct
}

const BaselineCard = ({ item }: { item: SingleUseItemRecord }) => {
  const annualOccurence = getAnnualOccurence(item.lineItem.frequency)
  const baselineTotal = annualOccurence * item.lineItem.caseCost * item.lineItem.casesPurchased

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
          <Typography.Text css="font-size: .8rem">Annual cost</Typography.Text>
          <br />
          <Typography.Text css="font-size: .7rem">
            (${item.lineItem.caseCost}/case x {annualOccurence * item.lineItem.casesPurchased})
          </Typography.Text>
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
  const annualOccurence = getAnnualOccurence(item.lineItem.frequency)
  const baselineTotal = annualOccurence * item.lineItem.caseCost * item.lineItem.casesPurchased
  const forecastTotal = annualOccurence * item.lineItem.newCaseCost * item.lineItem.newCasesPurchased
  const change = forecastTotal - baselineTotal
  const isNegativeChange = change < 0
  return (
    <S.InfoCard theme="forecast">
      <Row>
        <Col span={10}>
          <Typography.Title level={5}>Forecast</Typography.Title>
        </Col>
        <Col span={7}>
          <Typography.Text css="font-size: .8rem">Total</Typography.Text>
        </Col>
        <Col span={7}>
          <Typography.Text css="font-size: .8rem">Change</Typography.Text>
        </Col>
      </Row>
      <Row>
        <Col span={10}>
          <Typography.Text css="font-size: .8rem">Annual cost</Typography.Text>
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
          <Typography.Text css="font-size: .7rem">
            (${item.lineItem.newCaseCost}/case x {annualOccurence * item.lineItem.newCasesPurchased})
          </Typography.Text>
        </Col>
      </Row>
    </S.InfoCard>
  )
}

const ItemRow = ({ item, onDelete }: { item: SingleUseItemRecord; onDelete: () => void }) => {
  function confirm() {
    DELETE(`/api/projects/${item.lineItem.projectId}/single-use-items`, {
      id: item.lineItem.id,
    })
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
        <Popconfirm title="Are you sure to delete this item?" onConfirm={confirm} okText="Yes" cancelText="No">
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
    const annualOccurence = getAnnualOccurence(item.frequency)
    const itemTotal = annualOccurence * item.caseCost * item.casesPurchased
    return total + itemTotal
  }, 0)
  const forecastCost = lineItems.reduce((total, item) => {
    const annualOccurence = getAnnualOccurence(item.frequency)
    const itemTotal = annualOccurence * item.newCaseCost * item.newCasesPurchased
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
              <Typography.Text css="font-size: .9rem">
                <strong>Baseline</strong>
              </Typography.Text>
            </Col>
            {/* next row */}
            <Col span={16}>
              <Typography.Text css="font-size: .9rem">Number of products</Typography.Text>
            </Col>
            <Col span={8}>
              <Typography.Text css="font-size: .9rem">{baselineProductCount}</Typography.Text>
            </Col>
            {/* next row */}
            <Col span={16}>
              <Typography.Text css="font-size: .9rem">Annual cost</Typography.Text>
            </Col>
            <Col span={8}>
              <Typography.Text css="font-size: .9rem">${baselineCost.toLocaleString()}</Typography.Text>
            </Col>
          </Row>
        </Col>
        <Col span={8}>
          <Row gutter={[0, 20]}>
            <Col span={12}>
              <Typography.Text css="font-size: .9rem">
                <strong>Forecast</strong>
              </Typography.Text>
            </Col>
            <Col span={12}>
              <Typography.Text css="font-size: .9rem">
                <strong>Change</strong>
              </Typography.Text>
            </Col>
            {/* next row */}
            <Col span={12}>
              <Typography.Text css="font-size: .9rem">{forecastProductCount}</Typography.Text>
            </Col>
            <Col span={12}>
              <Typography.Text css="font-size: .9rem">{forecastProductCount - baselineProductCount}</Typography.Text>
            </Col>
            {/* next row */}
            <Col span={12}>
              <Typography.Text css="font-size: .9rem">${forecastCost.toLocaleString()}</Typography.Text>
            </Col>
            <Col span={12}>
              <Typography.Text css="font-size: .9rem">
                {isChangeNegative ? '-' : '+'}${Math.abs(change).toLocaleString()}
              </Typography.Text>
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
            category =>
              items[category.id] && (
                <div key={category.id}>
                  <Typography.Title level={3}>{category.name}</Typography.Title>
                  <Divider />
                  {items[category.id].map(item => (
                    <ItemRow key={item.lineItem.id} item={item} onDelete={getLineItems} />
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
