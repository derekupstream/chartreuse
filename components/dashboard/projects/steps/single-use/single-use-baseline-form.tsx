import { Button, Form, Input, Radio, Typography } from 'antd'
import * as S from '../styles'
import { SingleUseLineItem } from 'api/calculator/types/projects'
import { useState, useEffect } from 'react'

type FormProps = Record<keyof SingleUseLineItem, string | number | undefined>

export default function SelectQuantityStep({
  input,
  productName,
  goBack,
  onSubmit,
}: {
  input?: Partial<SingleUseLineItem>
  productName?: string
  goBack: (form: Partial<SingleUseLineItem>) => void
  onSubmit: (form: Partial<SingleUseLineItem>) => void
}) {
  const [form] = Form.useForm<FormProps>()
  const [disabledSave, setDisabledSave] = useState(true)

  const handleFormChange = () => {
    const hasErrors = !form.isFieldsTouched(true) || form.getFieldsError().some(({ errors }) => errors.length)
    setDisabledSave(hasErrors)
  }

  function _goBack() {
    goBack({
      frequency: form.getFieldValue('frequency'),
      unitsPerCase: parseInt(form.getFieldValue('unitsPerCase') || '0'),
      casesPurchased: parseInt(form.getFieldValue('casesPurchased') || '0'),
      caseCost: parseInt(form.getFieldValue('caseCost') || '0'),
    })
  }

  function _onSubmit(values: FormProps) {
    onSubmit({
      frequency: values.frequency as SingleUseLineItem['frequency'],
      unitsPerCase: parseInt((values.unitsPerCase as string) || '0'),
      casesPurchased: parseInt((values.casesPurchased as string) || '0'),
      caseCost: parseInt((values.caseCost as string) || '0'),
    })
  }

  useEffect(() => {
    if (input) {
      form.setFieldsValue(input)
      handleFormChange()
    }
  }, [input])

  return (
    <Form form={form} layout="vertical" onFieldsChange={handleFormChange} onFinish={_onSubmit}>
      <Typography.Title level={4}>{productName}</Typography.Title>

      <Form.Item label="Purchasing Frequency" name="frequency" rules={[{ required: true, message: 'Please select a frequency' }]}>
        <Radio.Group value={input?.frequency}>
          <Radio.Button value="Daily">Daily</Radio.Button>
          <Radio.Button value="Weekly">Weekly</Radio.Button>
          <Radio.Button value="Monthly">Monthly</Radio.Button>
          <Radio.Button value="Annually">Annually</Radio.Button>
        </Radio.Group>
      </Form.Item>

      <Form.Item name="casesPurchased" label="Cases Purchased" rules={[{ required: true }]}>
        <Input type="number" />
      </Form.Item>

      <Form.Item name="unitsPerCase" label="Units per case" rules={[{ required: true }]}>
        <Input type="number" />
      </Form.Item>

      <Form.Item name="caseCost" label="Cost per case" rules={[{ required: true }]}>
        <Input type="number" />
      </Form.Item>

      <S.BoxEnd>
        <Button onClick={_goBack}>{'Go Back'}</Button>
        <Button disabled={disabledSave} size="large" type="primary" htmlType="submit">
          {'Next >'}
        </Button>
      </S.BoxEnd>
    </Form>
  )
}
