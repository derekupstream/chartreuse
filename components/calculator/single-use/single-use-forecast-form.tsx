import { Button, Form, Input, Radio, Typography } from 'antd'
import { useEffect, useState } from 'react'
import * as S from '../styles'
import { SingleUseLineItem } from 'lib/calculator/types/projects'

type FormProps = Record<keyof SingleUseLineItem, string | number | undefined>

export default function SelectQuantityForecastStep({
  input,
  goBack,
  productName,
  frequency,
  onSubmit,
}: {
  input?: Partial<SingleUseLineItem>
  goBack: (form: Partial<Pick<SingleUseLineItem, 'newCaseCost' | 'newCasesPurchased'>>) => void
  productName?: string
  frequency: string
  onSubmit: (form: Pick<SingleUseLineItem, 'newCaseCost' | 'newCasesPurchased'>) => void
}) {
  const [form] = Form.useForm<FormProps>()
  const [disabledSave, setDisabledSave] = useState(true)

  const handleFormChange = () => {
    const hasErrors = !form.isFieldsTouched(true) || form.getFieldsError().some(({ errors }) => errors.length)
    setDisabledSave(hasErrors)
  }

  function _goBack() {
    goBack({
      newCasesPurchased: parseInt(form.getFieldValue('newCasesPurchased') || '0'),
      newCaseCost: parseInt((form.getFieldValue('newCaseCost') as string) || '0'),
    })
  }

  function _onSubmit(values: FormProps) {
    onSubmit({
      newCasesPurchased: parseInt((values.newCasesPurchased as string) || '0'),
      newCaseCost: parseInt((values.newCaseCost as string) || '0'),
    })
  }

  useEffect(() => {
    if (input) {
      form.setFieldsValue(input)
      handleFormChange()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input])

  return (
    <Form form={form} layout="vertical" onFieldsChange={handleFormChange} onFinish={_onSubmit}>
      <p>
        Set your project goals by forecasting estimated savings realized by reducing, or eliminating purchase of single-use item(s). Later, post reuse implementation, users go back in to report
        actuals to see how progress compares to originally set goals.
      </p>
      <Typography.Title level={4}>{productName}</Typography.Title>

      <Form.Item name="newCasesPurchased" label={`New cases purchased (${frequency})`} rules={[{ required: true }]}>
        <Input type="number" />
      </Form.Item>

      <Form.Item name="newCaseCost" label="Cost per case" rules={[{ required: true }]}>
        <Input type="number" />
      </Form.Item>

      <S.BoxEnd>
        <Button onClick={_goBack}>{'Go Back'}</Button>
        <Button disabled={disabledSave} size="large" type="primary" htmlType="submit">
          Add forecast
        </Button>
      </S.BoxEnd>
    </Form>
  )
}
