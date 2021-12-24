import { OTHER_EXPENSES_CATEGORIES } from 'internal-api/calculator/constants/other-expenses'
import { OptionSelection } from '../../../../styles'
import { Button, Form, Input } from 'antd'
import { requiredRule } from 'utils/forms'
import { useSimpleMutation } from 'hooks/useSimpleQuery'
import { OtherExpense } from '@prisma/client'
import { useRouter } from 'next/router'
import React from 'react'
import { FormItem } from '../../styles'
import { FREQUENCIES } from 'internal-api/calculator/constants/frequency'

const categoryOptions = OTHER_EXPENSES_CATEGORIES.map(i => ({ value: i.id, label: i.name }))
const frequencyOptions = FREQUENCIES.map(i => ({ value: i.name, label: i.name }))

type Props = {
  onClose(): void
}

const OtherExpensesFormDrawer: React.FC<Props> = ({ onClose }) => {
  const [form] = Form.useForm<OtherExpense>()
  const createOtherExpense = useSimpleMutation('/api/additional-costs', 'POST')

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

    createOtherExpense.mutate(values, {
      onSuccess: onClose,
    })
  }

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit} css="padding-bottom: 24px;">
      <FormItem label="Category" name="categoryId" rules={requiredRule}>
        <OptionSelection options={categoryOptions} optionType="button" />
      </FormItem>
      <FormItem label="Frequency" name="frequency" rules={requiredRule}>
        <OptionSelection name="frequecy" options={frequencyOptions} optionType="button" />
      </FormItem>
      <FormItem label="Cost" name="cost">
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

export default OtherExpensesFormDrawer
