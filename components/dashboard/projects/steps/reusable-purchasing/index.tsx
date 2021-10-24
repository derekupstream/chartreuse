import { Button, Drawer, Typography } from 'antd'
import { useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import * as S from '../styles'
import { useEffect } from 'react'
import { SingleUseProduct } from 'api/calculator/types/products'
import { ReusableLineItem, SingleUseLineItem } from 'api/calculator/types/projects'
import ReusablePurchasingFirstStepForm from './reusable-purchasing-first-step-form'
import ReusablePurchasingLastStepForm from './reusable-purchasing-last-step-form'

export default function ReusablePurchasing() {
  const [isDrawerVisible, setIsDrawerVisible] = useState<boolean>(false)
  const [products, setProducts] = useState<SingleUseProduct[]>([])
  const [formValues, setFormValues] = useState({} as ReusableLineItem)
  const [isShowingFirstStep, setIsShowingFirstStep] = useState(true)
  const [lineItem, setLineItem] = useState({})

  useEffect(() => {
    fetch('/api/inventory/single-use-products', {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
      },
    })
      .then(res => res.json())
      .then(data => {
        setProducts(data)
      })
  }, [])

  function addItem() {
    setLineItem({})
    setIsDrawerVisible(true)
  }

  function onPressNext() {
    // setFormValues(_formValues);
    setIsShowingFirstStep(false)
  }

  function onSubmit(annualRepurchasePercentage: number) {
    // setFormValues({ ...formValues, annualRepurchasePercentage, });
  }

  function onPressPrevious() {
    setIsShowingFirstStep(true)
  }

  function closeDrawer() {
    setIsDrawerVisible(false)
  }

  return (
    <S.Wrapper>
      <Typography.Title level={2}>Reusables purchasing</Typography.Title>
      <Typography.Title level={4} css="max-width: 80%;">
        Next: Enter reusable items to replace your single-use items. If you have multiple items that will replace a single-use item, enter both. In the following step you&apos;ll be able to specify
        which items will replace each single-use item.
      </Typography.Title>
      <Button type="primary" onClick={addItem} icon={<PlusOutlined />}>
        Add item
      </Button>
      <Drawer title="Add reusable replacement item" placement="right" onClose={closeDrawer} visible={isDrawerVisible} contentWrapperStyle={{ width: '600px' }}>
        {isShowingFirstStep ? <ReusablePurchasingFirstStepForm onPressNext={onPressNext} /> : <ReusablePurchasingLastStepForm onPressPrevious={onPressPrevious} onPressSubmit={onSubmit} />}
      </Drawer>
    </S.Wrapper>
  )
}
