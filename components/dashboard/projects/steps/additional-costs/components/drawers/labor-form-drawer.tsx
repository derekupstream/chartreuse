import { ADDITIONAL_COSTS, ADDITIONAL_COST_FREQUENCIES } from 'internal-api/calculator/constants/additional-costs'
import styled from 'styled-components'
import { OptionSelection } from '../../../styles'
import { Button, Form, Input } from 'antd'
import { requiredRule } from 'utils/forms'
import { useSimpleMutation } from 'hooks/useSimpleQuery'
import { useEffect } from 'react'

const categoryOptions = ADDITIONAL_COSTS.map(i => ({ value: i.id, label: i.name }))
const frequencyOptions = ADDITIONAL_COST_FREQUENCIES.map(i => ({ value: i.annualOccurrence, label: i.name }))

type FormValues = {
  category: string
  frequency: string
  cost: string
  description: string
}

const LaborFormDrawer = () => {
  const [form] = Form.useForm<FormValues>()
  const createLaborCost = useSimpleMutation('/api/labor-costs', 'POST')

  const handleSubmit = () => {
    const values = {
      ...form.getFieldsValue(),
      projectId: '3484986f-9e23-4d54-83bd-8cd6dfe4a04a',
    }
    createLaborCost.mutate(values, {
      onSuccess: data => console.log('success', data),
      onError: data => console.log('error', data),
    })
  }

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <FormItem label="Category" name="category" rules={requiredRule}>
        <OptionSelection options={categoryOptions} optionType="button" />
      </FormItem>
      <FormItem label="Frequency" name="frequecy" rules={requiredRule}>
        <OptionSelection name="frequecy" options={frequencyOptions} optionType="button" />
      </FormItem>
      <FormItem label="Labor cost or savings" name="cost">
        <Input type="number" prefix="$ " name="cost" />
        <CostHint>To enter a labor savings, format your number as a negative value. Ex. “-500”</CostHint>
      </FormItem>
      <FormItem label="Description" name="description" rules={requiredRule}>
        <Input.TextArea rows={4} />
      </FormItem>
      <Button htmlType="submit" size="large" type="primary" css="float: right;">
        Add expense
      </Button>
    </Form>
  )
}

const CostHint = styled.span`
  font-size: 14px;
  color: #0f172a;
  line-height: 24px;
`

const FormItem = styled(Form.Item)`
  .ant-form-item-label label {
    font-size: 18px;
    font-weight: 500;
    height: auto;
    &:after {
      content: '';
    }
  }
`

export default LaborFormDrawer
