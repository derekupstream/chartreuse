import { ADDITIONAL_COST_FREQUENCIES } from 'internal-api/calculator/constants/additional-costs'
import { OptionSelection } from '../../../../styles'
import { Button, Form, Input } from 'antd'
import { requiredRule } from 'utils/forms'
import { useSimpleMutation } from 'hooks/useSimpleQuery'
import { LaborCost } from '@prisma/client'
import { useRouter } from 'next/router'
import React from 'react'
import { FormItem } from '../../styles'
import { LABOR_CATEGORIES } from 'internal-api/calculator/constants/labor-categories'

const categoryOptions = LABOR_CATEGORIES.map(i => ({ value: i.id, label: i.name }))
const frequencyOptions = ADDITIONAL_COST_FREQUENCIES.map(i => ({ value: i.annualOccurrence, label: i.name }))

type Props = {
  onClose(): void
}

const LaborFormDrawer: React.FC<Props> = ({ onClose }) => {
  const [form] = Form.useForm<LaborCost>()
  const createLaborCost = useSimpleMutation('/api/labor-costs', 'POST')

  const route = useRouter()
  const projectId = route.query.id as string

  const handleSubmit = () => {
    const { frequency, cost, ...formFields } = form.getFieldsValue()

    const values = {
      ...formFields,
      cost: Number(cost),
      frequency: String(frequency),
      projectId,
    }

    createLaborCost.mutate(values, {
      onSuccess: onClose,
    })
  }

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <FormItem label="Category" name="categoryId" rules={requiredRule}>
        <OptionSelection options={categoryOptions} optionType="button" />
      </FormItem>
      <FormItem label="Frequency" name="frequency" rules={requiredRule}>
        <OptionSelection name="frequecy" options={frequencyOptions} optionType="button" />
      </FormItem>
      <FormItem label="Labor cost or savings" name="cost" extra="To enter a labor savings, format your number as a negative value. Ex. “-500”">
        <Input type="number" prefix="$ " name="cost" />
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

export default LaborFormDrawer
