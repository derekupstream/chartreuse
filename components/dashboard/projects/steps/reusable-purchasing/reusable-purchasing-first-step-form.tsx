import { Button, Form, Input, InputNumber, RadioChangeEvent } from 'antd'
import { ReusableLineItem } from 'api/calculator/types/projects'
import { FC } from 'hoist-non-react-statics/node_modules/@types/react'
import styled from 'styled-components'
import * as S from '../styles'

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

const items = [
  { value: 1, label: 'Beverage Cups' },
  { value: 2, label: 'Beverage Cups 2' },
  { value: 3, label: 'Beverage Cups 3' },
  { value: 4, label: 'Beverage Cups 4' },
]

type Props = {
  onPressNext(values: ReusableLineItem): void
}

const ReusablePurchasingFirstStepForm: FC<Props> = ({ onPressNext }) => {
  return (
    <Form layout="vertical" onFinish={onPressNext}>
      <StyledFormItem label="Category">
        <Form.Item name="categoryId">
          <S.OptionSelection options={items} optionType="button" />
        </Form.Item>

        <Form.Item label="Product name" name="productName">
          <Input />
        </Form.Item>

        <Form.Item label="Cases purchased" name="casesPurchased">
          <Input />
        </Form.Item>

        <Form.Item label="Units per case" name="unitCost">
          <Input />
        </Form.Item>

        <Form.Item label="Cost per case" name="caseCost">
          <InputNumber formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
        </Form.Item>
      </StyledFormItem>

      <S.BoxEnd>
        <div></div>
        <Button htmlType="submit" type="primary">
          {'Next >'}
        </Button>
      </S.BoxEnd>
    </Form>
  )
}

export default ReusablePurchasingFirstStepForm
