import styled from 'styled-components'
import { OptionSelection } from '../../../../styles'
import { Button, Form, Input, RadioChangeEvent, Row } from 'antd'
import { requiredRule } from 'utils/forms'
import { useSimpleMutation } from 'hooks/useSimpleQuery'
import { useRouter } from 'next/router'
import { WasteHaulingCost } from '@prisma/client'

const categoryOptions = ['Garbage', 'Recycling', 'Organics', 'Additional Changes'].map((c, i) => ({ value: i.toString(), label: c }))
const serviceTypeOptions = ['Cart', 'Bin', 'Rolloff bin', 'Additional charges'].map(c => ({ value: c, label: c }))

type Props = {
  onClose(monthlyCost: number): void
}
type FormValues = {
  monthlyCost: number
}

const WasteHaulingSecondFormDrawer: React.FC<Props> = ({ onClose }) => {
  const [form] = Form.useForm<FormValues>()

  const handleSubmit = () => {
    const { monthlyCost } = form.getFieldsValue()
    onClose(Number(monthlyCost))
  }

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit} css="padding-bottom: 24px;">
      <FormItem label="Monthly cost" name="monthlyCost" rules={requiredRule}>
        <Input type="number" prefix="$" />
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

export default WasteHaulingSecondFormDrawer
