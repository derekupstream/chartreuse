import styled from 'styled-components'
import { useEffect } from 'react'
import { Button, Form, Input } from 'antd'
import { Dishwasher } from '.prisma/client'

export type DishwasherData = Partial<Pick<Dishwasher, 'newOperatingDays' | 'newRacksPerDay'>> & { id?: string }

type FormValues = {
  newOperatingDays: string
  newRacksPerDay: string
}

type Props = {
  input: DishwasherData | null
  onSubmit(values: DishwasherData): void
}

const DishwashingFormDrawer: React.FC<Props> = ({ input, onSubmit }) => {
  const [form] = Form.useForm<FormValues>()

  function handleSubmit() {
    const { newRacksPerDay, newOperatingDays } = form.getFieldsValue()
    onSubmit({
      id: input?.id,
      newRacksPerDay: Number(newRacksPerDay),
      newOperatingDays: Number(newOperatingDays),
    })
  }

  useEffect(() => {
    if (input) {
      form.setFieldsValue({
        newRacksPerDay: input.newRacksPerDay?.toString(),
        newOperatingDays: input.newOperatingDays?.toString(),
      })
    }
  }, [input])

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ paddingBottom: '24px' }}>
      <FormItem label="Dish machine operating days per year" name="newOperatingDays">
        <Input type="number" />
      </FormItem>
      <FormItem label="Average additional racks/day for reusables" name="newRacksPerDay">
        <Input type="number" />
      </FormItem>
      <Button htmlType="submit" size="large" type="primary" style={{ float: 'right' }}>
        {input?.id ? 'Save' : 'Add'} expense
      </Button>
    </Form>
  )
}

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

export default DishwashingFormDrawer
