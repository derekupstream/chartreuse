import { Button, Form, Input } from 'antd'
import { PRODUCT_CATEGORIES } from 'lib/calculator/constants/product-categories'
import { ReusableFormValues } from '.'
import styled from 'styled-components'
import * as S from '../styles'
import { requiredRule } from 'utils/forms'

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

const categories = PRODUCT_CATEGORIES.map(product => ({
  value: product.id.toString(),
  label: product.name,
}))

type Props = {
  onPressNext(values: ReusableFormValues): void
}

const ReusablePurchasingFirstStepForm: React.FC<Props> = ({ onPressNext }) => {
  return (
    <Form layout="vertical" onFinish={onPressNext}>
      <StyledFormItem label="Category">
        <Form.Item name="categoryId" rules={requiredRule}>
          <S.OptionSelection options={categories} optionType="button" />
        </Form.Item>

        <Form.Item label="Product name" name="productName" rules={requiredRule}>
          <Input />
        </Form.Item>

        <Form.Item label="Cases purchased" name="casesPurchased" rules={requiredRule}>
          <Input type="number" />
        </Form.Item>

        <Form.Item label="Cost per case" name="caseCost" rules={requiredRule}>
          <Input type="number" />
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
