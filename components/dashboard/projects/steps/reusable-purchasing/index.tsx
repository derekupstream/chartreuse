import { Button, Drawer, message, Typography } from 'antd'
import { useState, useEffect } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import * as S from '../styles'
import { ReusableLineItem } from 'internal-api/calculator/types/projects'
import ReusablePurchasingFirstStepForm from './reusable-purchasing-first-step-form'
import ReusablePurchasingSecondStepForm from './reusable-purchasing-second-step-form'
import { useRouter } from 'next/router'
import { GET, POST } from 'lib/http'
import { PRODUCT_CATEGORIES } from 'internal-api/calculator/constants/product-categories'
import ItemRow from './components/ItemRow'
import ContentLoader from 'components/content-loader'
import { useQuery } from 'react-query'

export type ReusableSecondPartForm = Pick<ReusableFormValues, 'annualRepurchasePercentage'>

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

  function onSubmit({ annualRepurchasePercentage }: ReusableSecondPartForm) {
    const newFormValues = { ...formValues!, annualRepurchasePercentage }
    setFormValues(newFormValues)
    saveData(newFormValues)
  }

  async function saveData(values: ReusableFormValues) {
    const body: ReusableLineItem = {
      ...values,
      casesPurchased: parseInt(values.casesPurchased),
      annualRepurchasePercentage: parseInt(values.annualRepurchasePercentage),
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
      <Typography.Title level={2}>Reusables purchasing</Typography.Title>
      {isLoading ? (
        <ContentLoader />
      ) : (
        <>
          <Typography.Title level={5}>
            Next: Enter reusable items to replace your single-use items. If you have multiple items that will replace a single-use item, enter both. In the following step you&apos;ll be able to
            specify which items will replace each single-use item.
          </Typography.Title>
          <div css="margin: 2em 0;">
            <Button type="primary" onClick={addItem} icon={<PlusOutlined />}>
              Add item
            </Button>
          </div>
          {PRODUCT_CATEGORIES.map(category => {
            const getItemsWithSameId = (item: ReusableLineItem) => item.categoryId === category.id.toString()
            const item = lineItems.find(getItemsWithSameId)

            return (
              item && (
                <div key={category.id}>
                  <Typography.Title level={3}>{category.name}</Typography.Title>
                  {lineItems.filter(getItemsWithSameId).map(item => (
                    <ItemRow key={item.annualRepurchasePercentage} item={item} onDelete={getLineItems} />
                  ))}
                </div>
              )
            )
          })}
          <Drawer title={formStep === 1 ? 'Add a reusable replacement item' : 'Estimate annual reusable re-purchasing rate'} placement="right" onClose={closeDrawer} visible={isDrawerVisible} contentWrapperStyle={{ width: '600px' }}>
            {formStep === 1 && <ReusablePurchasingFirstStepForm onPressNext={onPressNext} />}
            {formStep === 2 && <ReusablePurchasingSecondStepForm form={formValues!} onPressPrevious={onPressPrevious} onPressSubmit={onSubmit} />}
          </Drawer>
        </>
      )}
    </S.Wrapper>
  )
}
