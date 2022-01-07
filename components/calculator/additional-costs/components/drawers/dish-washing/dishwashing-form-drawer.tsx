import styled from 'styled-components'
import { OptionSelection } from '../../../../styles'
import { Button, Form, Input, RadioChangeEvent } from 'antd'
import { requiredRule } from 'utils/forms'
import { useSimpleMutation } from 'hooks/useSimpleQuery'
import { DISHWASHER_TYPES, FUEL_TYPES, TEMPERATURES } from 'lib/calculator/constants/dishwashers'
import { useRouter } from 'next/router'
import { Dishwasher } from '.prisma/client'
import { useState } from 'react'

const typeOptions = DISHWASHER_TYPES.map(t => ({ label: t.name, value: t.name }))
const temperaturesOptions = TEMPERATURES.map((t, i) => ({ label: t.name, value: t.name }))
const fuelTypeOptions = FUEL_TYPES.map(t => ({ label: t.name, value: t.name }))
const yesOrNoOptions = [
  { label: 'No', value: 0 },
  { label: 'Yes', value: 1 },
]

type Props = {
  onClose(): void
}

const DishwashingFormDrawer: React.FC<Props> = ({ onClose }) => {
  const [form] = Form.useForm<Dishwasher>()
  const createDishwashingCost = useSimpleMutation('/api/dishwasher', 'POST')
  const [isWaterHeaterFuelVisible, setIsWaterHeaterFuelVisible] = useState(false)

  const route = useRouter()
  const projectId = route.query.id as string

  const handleSubmit = () => {
    const { additionalRacksPerDay, energyStarCertified, operatingDays, ...formFields } = form.getFieldsValue()

    const values: Dishwasher = {
      ...formFields,
      projectId,
      additionalRacksPerDay: Number(additionalRacksPerDay),
      energyStarCertified: Boolean(energyStarCertified),
      operatingDays: Number(operatingDays),
    }

    createDishwashingCost.mutate(values, {
      onSuccess: onClose,
    })
  }

  const onChangeTemperature = (event: RadioChangeEvent) => {
    const isVisible = event.target.value === 'High'
    setIsWaterHeaterFuelVisible(isVisible)
    if (!isVisible) {
      form.setFieldsValue({ boosterWaterHeaterFuelType: '' })
    }
  }

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit} css="padding-bottom: 24px;">
      <FormItem label="Dishwasher type" name="type" rules={requiredRule}>
        <OptionSelection options={typeOptions} optionType="button" />
      </FormItem>
      <FormItem label="Temperature" name="temperature" rules={requiredRule}>
        <OptionSelection options={temperaturesOptions} onChange={onChangeTemperature} optionType="button" />
      </FormItem>
      {isWaterHeaterFuelVisible && (
        <FormItem label="Booster Water Heater Fuel Type" name="boosterWaterHeaterFuelType" rules={requiredRule}>
          <OptionSelection options={fuelTypeOptions} optionType="button" />
        </FormItem>
      )}
      <FormItem label="Energy star certification" name="energyStarCertified" rules={requiredRule}>
        <OptionSelection options={yesOrNoOptions} optionType="button" />
      </FormItem>
      <FormItem label="Building water heater fuel type" name="buildingWaterHeaterFuelType" rules={requiredRule}>
        <OptionSelection options={fuelTypeOptions} optionType="button" />
      </FormItem>
      <FormItem label="Dish machine operating days per year" name="operatingDays">
        <Input type="number" />
      </FormItem>
      <FormItem label="Average additional racks/day for reusables" name="additionalRacksPerDay">
        <Input type="number" />
      </FormItem>
      <Button htmlType="submit" size="large" type="primary" css="float: right;">
        Add expense
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
