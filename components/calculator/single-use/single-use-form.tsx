import { useEffect, useState } from 'react'
import { message } from 'antd'
import { SingleUseProduct } from 'lib/calculator/types/products'
import { SingleUseLineItem } from 'lib/calculator/types/projects'

import SingleUseProductForm from './single-use-product-form'
import SingleUseBaselineForm from './single-use-baseline-form'
import SingleUseForecastForm from './single-use-forecast-form'
import chartreuseClient from 'lib/chartreuseClient'

type SingleUseProps = {
  lineItem: SingleUseLineItem | null
  onSubmit: () => void
  formStep: number
  setFormStep: (step: number) => void
  projectId: string
  products: SingleUseProduct[]
}

export default function SingleUseForm({ lineItem, onSubmit, projectId, products, formStep, setFormStep }: SingleUseProps) {
  const [lineItemInput, setLineItemInput] = useState<Partial<SingleUseLineItem>>({
    projectId,
    ...(lineItem ? lineItem : {}),
  })

  // reset the view whenever line item changes from parent scope
  useEffect(() => {
    setLineItemInput({ ...lineItemInput })
    setFormStep(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineItem])

  function enterProduct(productId: string) {
    setLineItemInput({ ...lineItemInput, productId })
    setFormStep(2)
  }

  function enterQuantity(params: Partial<SingleUseLineItem>) {
    setLineItemInput({ ...lineItemInput, ...params })
    setFormStep(3)
  }

  function enterForecast(params: Partial<SingleUseLineItem>) {
    const finalItem = { ...lineItemInput, ...params } as SingleUseLineItem
    setLineItemInput(finalItem)
    saveLineItem(finalItem)
  }

  async function saveLineItem(item: SingleUseLineItem) {
    try {
      await chartreuseClient.addSingleUseLineItem(projectId, item)
      message.success('Single-use item saved successfully')
      onSubmit()
    } catch (response) {
      message.error((response as any).error)
    }
  }

  function goBack(params: Partial<SingleUseLineItem> = {}) {
    setLineItemInput({ ...lineItemInput, ...params })
    setFormStep(formStep - 1)
  }

  const product = products.find(p => p.id === lineItemInput?.productId)

  return (
    <>
      {formStep === 1 && <SingleUseProductForm input={lineItemInput} products={products} onSubmit={enterProduct} />}
      {formStep === 2 && <SingleUseBaselineForm input={lineItemInput} productName={product?.description} goBack={goBack} onSubmit={enterQuantity} />}
      {formStep === 3 && <SingleUseForecastForm input={lineItemInput} productName={product?.description} frequency={lineItemInput.frequency} goBack={goBack} onSubmit={enterForecast} />}
    </>
  )
}
