import { Button, Form } from 'antd'
import { useState } from 'react'
import * as S from '../styles'
import styled from 'styled-components'
import { ADDITIONAL_COST_FREQUENCIES } from 'api/calculator/constants/additional-costs'

type AdditionalCostsItemFormProps = {
  onSubmit: (value: any) => void
}

const frequencyValues = ADDITIONAL_COST_FREQUENCIES.map(i => ({ value: i.annualOccurrence, label: i.name }))

const AdditionalCostsItemForm: React.FC<AdditionalCostsItemFormProps> = ({ onSubmit }) => {
  const [selected, setSelected] = useState({
    categoryId: null,
    cost: null,
    frequency: frequencyValues[0].value,
  })

  const handleFrequencySelect = (event: any) => {
    setSelected({ ...selected, frequency: event.target.value })
  }

  return (
    <Form layout="vertical">
      <StyledFormItem label="Frequency">
        <S.OptionSelection value={selected.frequency} options={frequencyValues} onChange={handleFrequencySelect} optionType="button" />
      </StyledFormItem>
      <S.BoxEnd>
        <div></div>
        <Button size="large" type="primary" disabled={false} onClick={onSubmit}>
          {'Next >'}
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
