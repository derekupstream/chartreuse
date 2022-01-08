import { Button, Divider, Row, Col, Drawer, message, Typography } from 'antd'
import { useState, useEffect } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import * as S from '../styles'
import { ReusableLineItem } from 'lib/calculator/types/projects'
import ReusablePurchasingFirstStepForm from './reusable-purchasing-first-step-form'
import ReusablePurchasingSecondStepForm from './reusable-purchasing-second-step-form'
import { useRouter } from 'next/router'
import { GET, POST } from 'lib/http'
import { PRODUCT_CATEGORIES } from 'lib/calculator/constants/product-categories'
import ItemRow from './components/ItemRow'
import ContentLoader from 'components/content-loader'
import { useFooterState } from '../footer'
import { formatToDollar } from 'lib/calculator/utils'

export interface ReusableFormValues {
  annualRepurchasePercentage: string
  caseCost: string
  casesPurchased: string
  categoryId: string
  productName: string
}

export default function ReusablePurchasing() {
  const [isDrawerVisible, setIsDrawerVisible] = useState<boolean>(false)
  const [formStep, setFormStep] = useState<number>(1)
  const [formValues, setFormValues] = useState<ReusableFormValues | null>(null)
  const [lineItems, setLineItems] = useState<ReusableLineItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const route = useRouter()
  const projectId = route.query.id as string

  useEffect(() => {
    getLineItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { setFooterState } = useFooterState()
  useEffect(() => {
    setFooterState({ path: '/reusable-items', stepCompleted: true })
  }, [setFooterState])

  async function getLineItems() {
    if (!projectId) return

    try {
      const url = `/api/projects/${projectId}/reusable-items`
      const { lineItems } = await fetch(url).then(response => response.json())
      setLineItems(lineItems)
    } catch (error) {
      setLineItems([])
    } finally {
      setIsLoading(false)
    }
  }

  function addItem() {
    setFormValues(null)
    setFormStep(1)
    setIsDrawerVisible(true)
  }

  function onPressNext(values: ReusableFormValues) {
    setFormValues(values)
    setFormStep(2)
  }

  function onSubmitForecast({ casesAnnually }: { casesAnnually: number }) {
    console.log('form values', formValues, casesAnnually)
    const annualRepurchasePercentage = (casesAnnually / parseInt(formValues!.casesPurchased)).toString()
    console.log(annualRepurchasePercentage)
    const newFormValues = { ...formValues!, annualRepurchasePercentage }
    setFormValues(newFormValues)
    saveData(newFormValues)
  }

  async function saveData(values: ReusableFormValues) {
    const body: ReusableLineItem = {
      ...values,
      casesPurchased: parseInt(values.casesPurchased),
      annualRepurchasePercentage: parseFloat(values.annualRepurchasePercentage),
      caseCost: parseInt(values.caseCost),
      projectId,
    }

    try {
      await POST(`/api/projects/${projectId}/reusable-items`, body)
      message.success('Reusable-use item saved successfully')
      closeDrawer()
    } catch (err) {
      message.error((err as Error)?.message)
    }

    refreshList()
  }

  function refreshList() {
    getLineItems()
  }

  function onPressPrevious() {
    setFormStep(1)
  }

  function closeDrawer() {
    setIsDrawerVisible(false)
  }

  return (
    <S.Wrapper>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography.Title level={1}>Reusables purchasing</Typography.Title>
        <Button type="primary" onClick={addItem} icon={<PlusOutlined />} style={{ paddingRight: '4em', paddingLeft: '4em' }}>
          Add reusable item
        </Button>
      </div>
      <Typography.Title level={5}>
        Enter reusable items to replace single-use items as appropriate. It is possible to eliminate a single-use item without a purchase of a reusable ware. For example, if you have three sizes of
        single-use plastic forks, you may only move to one size/type of durable fork.
      </Typography.Title>
      {isLoading ? (
        <ContentLoader />
      ) : (
        <>
          {PRODUCT_CATEGORIES.map(category => {
            const getItemsWithSameId = (item: ReusableLineItem) => item.categoryId === category.id.toString()
            const item = lineItems.find(getItemsWithSameId)

            return (
              item && (
                <div key={category.id}>
                  <Typography.Title level={3}>{category.name}</Typography.Title>
                  <Divider />
                  {lineItems.filter(getItemsWithSameId).map(item => (
                    <ItemRow key={item.annualRepurchasePercentage} item={item} onDelete={getLineItems} />
                  ))}
                </div>
              )
            )
          })}
          {lineItems.length > 0 && <SummaryRow lineItems={lineItems} />}
          <Drawer
            title={formStep === 1 ? 'Add a reusable replacement item' : 'Estimate annual reusable re-purchasing needed'}
            placement="right"
            onClose={closeDrawer}
            visible={isDrawerVisible}
            contentWrapperStyle={{ width: '600px' }}
          >
            {formStep === 1 && <ReusablePurchasingFirstStepForm onPressNext={onPressNext} />}
            {formStep === 2 && <ReusablePurchasingSecondStepForm form={formValues!} onPressPrevious={onPressPrevious} onPressSubmit={onSubmitForecast} />}
          </Drawer>
        </>
      )}
    </S.Wrapper>
  )
}

const SummaryRow = ({ lineItems }: { lineItems: ReusableLineItem[] }) => {
  const baselineProductCount = lineItems.filter(item => item.casesPurchased > 0).length
  const baselineCost = lineItems.reduce((total, item) => {
    const itemTotal = item.caseCost * item.casesPurchased
    return total + itemTotal
  }, 0)
  const averageRepurchaseRate = Math.round(
    (lineItems.reduce((total, item) => {
      return total + item.annualRepurchasePercentage
    }, 0) /
      lineItems.length) *
      100
  )
  const forecastCost = lineItems.reduce((total, item) => {
    const itemTotal = item.caseCost * item.annualRepurchasePercentage * item.casesPurchased
    return total + itemTotal
  }, 0)
  return (
    <S.InfoCard style={{ boxShadow: 'none' }}>
      <Row>
        <Col span={8}>
          <Typography.Title level={4}>Repurchase totals</Typography.Title>
        </Col>
        <Col span={8}>
          <Row gutter={[0, 20]}>
            <Col span={24}>
              <Typography.Text css="font-size: .9rem">
                <strong>Initial costs</strong>
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
              <Typography.Text css="font-size: .9rem">Total</Typography.Text>
            </Col>
            <Col span={8}>
              <Typography.Text css="font-size: .9rem">{formatToDollar(baselineCost)}</Typography.Text>
            </Col>
          </Row>
        </Col>
        <Col span={8}>
          <Row gutter={[0, 20]}>
            <Col span={24}>
              <Typography.Text css="font-size: .9rem">
                <strong>Repurchase forecast</strong>
              </Typography.Text>
            </Col>
            {/* next row */}
            <Col span={16}>
              <Typography.Text css="font-size: .9rem">Average repurchase rate</Typography.Text>
            </Col>
            <Col span={8}>
              <Typography.Text css="font-size: .9rem">{averageRepurchaseRate}%</Typography.Text>
            </Col>
            {/* next row */}
            <Col span={16}>
              <Typography.Text css="font-size: .9rem">Annual repurchase cost</Typography.Text>
            </Col>
            <Col span={8}>
              <Typography.Text css="font-size: .9rem">{formatToDollar(forecastCost)}</Typography.Text>
            </Col>
          </Row>
        </Col>
      </Row>
    </S.InfoCard>
  )
}
