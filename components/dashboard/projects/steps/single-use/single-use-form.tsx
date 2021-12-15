import { useEffect, useState } from 'react'
import { message } from 'antd'
import { SingleUseProduct } from 'internal-api/calculator/types/products'
import { SingleUseLineItem } from 'internal-api/calculator/types/projects'

import SingleUseProductForm from './single-use-product-form'
import SingleUseBaselineForm from './single-use-baseline-form'
import SingleUseForecastForm from './single-use-forecast-form'
import { POST } from 'lib/http'
import { GetServerSideProps } from 'next'

type SingleUseProps = {
  lineItem: SingleUseLineItem | null
  onSubmit: () => void
  projectId: string
  products: SingleUseProduct[]
}

export default function SingleUseForm({ lineItem, onSubmit, projectId, products }: SingleUseProps) {
  const [lineItemInput, setLineItemInput] = useState<Partial<SingleUseLineItem>>({
    projectId,
  })
  const [formStep, setFormStep] = useState<number>(1)

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
      await POST(`/api/projects/${projectId}/single-use-items`, item)
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
      {formStep === 2 && <SingleUseBaselineForm input={lineItemInput} productName={product?.title} goBack={goBack} onSubmit={enterQuantity} />}
      {formStep === 3 && <SingleUseForecastForm input={lineItemInput} productName={product?.title} goBack={goBack} onSubmit={enterForecast} />}
    </>
  )
}
