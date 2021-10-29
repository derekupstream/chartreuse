import { Button, Form, InputNumber } from 'antd'
import { useState } from 'react'
import * as S from '../styles'
import styled from 'styled-components'
import { ADDITIONAL_COSTS, ADDITIONAL_COST_FREQUENCIES } from 'internal-api/calculator/constants/additional-costs'

type AdditionalCostsItemFormProps = {
  onSubmit: (value: any) => void
}

const categoryOptions = ADDITIONAL_COSTS.map(i => ({ value: i.id, label: i.name }))
const frequencyOptions = ADDITIONAL_COST_FREQUENCIES.map(i => ({ value: i.annualOccurrence, label: i.name }))

const AdditionalCostsItemForm: React.FC<AdditionalCostsItemFormProps> = ({ onSubmit }) => {
  const [selected, setSelected] = useState({
    categoryId: null,
    frequency: null,
    cost: 0,
  })

  const handleCategorySelect = (event: any) => {
    setSelected({ ...selected, categoryId: event.target.value })
  }

  const handleFrequencySelect = (event: any) => {
    setSelected({ ...selected, frequency: event.target.value })
  }

  const handleCostChange = (cost: number) => {
    setSelected({ ...selected, cost })
  }

  const handleSubmit = () => {
    onSubmit(selected)
    return false
  }

  return (
    <Form layout="vertical" onFinish={handleSubmit}>
      <StyledFormItem label="Category">
        <S.OptionSelection value={selected.categoryId} options={categoryOptions} onChange={handleCategorySelect} optionType="button" />
      </StyledFormItem>
      {selected.categoryId !== null && (
        <StyledFormItem label="Frequency">
          <S.OptionSelection value={selected.frequency} options={frequencyOptions} onChange={handleFrequencySelect} optionType="button" />
        </StyledFormItem>
      )}
      {selected.frequency !== null && (
        <StyledFormItem label="Cost">
          <InputNumber value={selected.cost} formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} onChange={handleCostChange} />
        </StyledFormItem>
      )}
      <S.BoxEnd>
        <Button htmlType="submit" size="large" type="primary" disabled={selected.frequency === null}>
          Save
        </Button>
      </S.BoxEnd>
    </Form>
  )
}

const StyledFormItem = styled(Form.Item)`
  .ant-form-item-label label {
    font-size: 18px;
    font-weight: 500;
    height: auto;
    &:after {
      content: '';
    }
  }
`

export default AdditionalCostsItemForm
